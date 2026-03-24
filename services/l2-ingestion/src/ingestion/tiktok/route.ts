import { runTikTokHarvest } from './harvest';
import { processL2Request } from '../../logic';

export async function routeTikTokHarvest() {
    let batchSize = 0;
    let status = 'ok';

    try {
        const items = await runTikTokHarvest();
        batchSize = items.length;

        for (const item of items) {
            try {
                // Submit directly through existing ingestion logic handler (Path A)
                const bundle = processL2Request(item);
                
                // Detailed logging to match discovery phase requirements
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
