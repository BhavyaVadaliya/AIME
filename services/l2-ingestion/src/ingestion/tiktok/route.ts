import axios from 'axios';
import { runTikTokHarvest } from './harvest';
import { processL2Request } from '../../logic';

const isRender = !!process.env.RENDER;
const CORE_API_URL = process.env.CORE_API_URL || 'https://aime-0vwz.onrender.com/api';

const RTCE_URL = process.env.RTCE_URL || 'https://rtce-text.onrender.com/v1/rtce/decide';



export async function routeTikTokHarvest() {
    let batchSize = 0;
    let status = 'ok';

    try {
        const items = await runTikTokHarvest();
        batchSize = items.length;

        for (const item of items) {
            try {
                // Submit through ingestion logic handler
                const bundle = processL2Request(item);
                
                // Detailed logging (already includes LifecycleReporter output to l2_logs.txt)
                console.log(JSON.stringify({
                    event: 'Signal detected',
                    timestamp: new Date().toISOString(),
                    source: 'tiktok',
                    signal_id: item.signal_id,
                    text: item.metadata?.text,
                    author: item.metadata?.author,
                    tags: item.metadata?.tags,
                    lens: 'GIME v0.1',
                    topic: bundle.topics.join(', ') || 'unlabeled',
                    actionable: bundle.topics.length > 0 && !bundle.topics.includes('general'),
                    ingestion_status: 'accepted',
                    governance_status: 'passed'
                }));

                // Phase 2: RTCE Decisioning (S11-T05 Integration)

                try {
                    const rtceRes = await axios.post(RTCE_URL, {
                        correlation_id: item.correlation_id,
                        signal_id: item.signal_id,
                        raw_text: item.raw_text,
                        l2_bundle: bundle,
                        policy_mode: "governance-lite"
                    });
                    console.log(`[RTCE] Decision for ${item.signal_id}: ${rtceRes.data.route}`);

                    // SUBMIT TO CORE API FOR PERSISTENCE (S12-P0 Bridge)
                    const coreRes = await axios.post(`${CORE_API_URL}/admin/signals`, {
                        signal_id: item.signal_id,
                        correlation_id: item.correlation_id,
                        structured_post: {
                            ...bundle,
                            governance_route: { queue: rtceRes.data.route },
                            signal_score: { score: 10 } // Default for S12
                        }
                    });
                    console.log(`[Core] Persistence for ${item.signal_id}: ${coreRes.status}`);

                } catch (rtceErr: any) {
                    console.error(`Downstream processing failed for ${item.signal_id}: ${rtceErr.message}`);
                    
                    // FALLBACK ROUTING: Persist signal to Core API using standard governance route
                    try {
                        const fallbackQueue = bundle.governance_route?.queue || 'low_risk';
                        console.log(`[RTCE Fallback] Attempting persistence for ${item.signal_id} with fallback queue: ${fallbackQueue}`);
                        
                        const coreRes = await axios.post(`${CORE_API_URL}/admin/signals`, {
                            signal_id: item.signal_id,
                            correlation_id: item.correlation_id,
                            structured_post: {
                                ...bundle,
                                governance_route: { queue: fallbackQueue },
                                signal_score: { score: 10 } // Default for S12
                            }
                        });
                        console.log(`[Core Fallback] Persistence for ${item.signal_id}: ${coreRes.status}`);
                    } catch (persistErr: any) {
                        console.error(`Core Fallback persistence failed for ${item.signal_id}: ${persistErr.message}`);
                    }
                }


            } catch (err: any) {
                console.log(JSON.stringify({
                    event: 'tiktok_signal_error',
                    source: 'tiktok',
                    signal_id: item.signal_id,
                    error: err.message
                }));
            }
        }

    } catch (error: any) {
        status = 'error';
        console.log(JSON.stringify({
            event: 'tiktok_harvest_failed',
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack
        }));
    } finally {
        console.log(JSON.stringify({
            event: 'tiktok_batch_submit',
            timestamp: new Date().toISOString(),
            batch_size: batchSize,
            status: status
        }));
    }
}
