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
                let rtceData = null;
                try {
                    const rtceRes = await axios.post(RTCE_URL, {
                        correlation_id: item.correlation_id,
                        signal_id: item.signal_id,
                        raw_text: item.raw_text,
                        l2_bundle: bundle,
                        policy_mode: "governance-lite"
                    });
                    rtceData = rtceRes.data;
                    console.log(`[RTCE] Decision for ${item.signal_id}: ${rtceRes.data.route}`);
                } catch (rtceErr: any) {
                    console.error(`RTCE decisioning failed for ${item.signal_id}: ${rtceErr.message}`);
                }

                // Phase 3: Push to Core API for Persistence and Dashboard (S12 FIX)
                const reportUrl = `${CORE_API_URL}/admin/signals`;
                try {
                    console.log(`[L2] Reporting signal to Core: ${reportUrl}`);
                    await axios.post(reportUrl, {
                        signal_id: item.signal_id,
                        correlation_id: item.correlation_id,
                        raw_text: item.raw_text,
                        structured_post: {
                            ...bundle,
                            data: {
                                ...bundle,
                                raw_text: item.raw_text,
                                source: item.metadata
                            }
                        },
                        rtce: rtceData
                    });
                } catch (reportErr: any) {
                    console.error(`[L2] Failed to report signal to Core API: ${reportErr.message} at ${reportUrl}`);
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
