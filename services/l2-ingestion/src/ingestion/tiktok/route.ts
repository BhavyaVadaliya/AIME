import axios from 'axios';
import { runTikTokHarvest } from './harvest';
import { processL2Request } from '../../logic';

const isRender = !!process.env.RENDER;
const CORE_API_URL = process.env.CORE_API_URL || 
                    (isRender 
                     ? 'http://aime-0vwz:4000/api'
                     : (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
                        ? 'https://aime-0vwz.onrender.com/api' 
                        : 'http://localhost:4000/api'));

const RTCE_URL = process.env.RTCE_URL || 
                (isRender 
                 ? 'http://rtce-text:3002/v1/rtce/decide' 
                 : 'http://localhost:3002/v1/rtce/decide');

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
                } catch (rtceErr: any) {
                    console.error(`RTCE decisioning failed for ${item.signal_id}: ${rtceErr.message}`);
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
