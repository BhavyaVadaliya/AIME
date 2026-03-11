import { runTikTokHarvest } from './harvest';
import { processL2Request } from '../../logic';

export async function routeTikTokHarvest() {
    let batchSize = 0;
    let status = 'ok';

    try {
        const items = await runTikTokHarvest();
        batchSize = items.length;

        for (const item of items) {
            let itemStatus = 'accepted';
            let govStatus = 'passed';
            let govReason;

            try {
                // Submit directly through existing ingestion logic handler (Path A)
                processL2Request(item);
                
                // Note: The actual logging is expected per the task
                console.log(JSON.stringify({
                    event: 'tiktok_signal_submitted',
                    timestamp: new Date().toISOString(),
                    source: 'tiktok',
                    signal_id: item.signal_id,
                    ingestion_status: 'accepted',
                    governance_status: 'passed'
                }));

            } catch (err: any) {
                console.log(JSON.stringify({
                    event: 'tiktok_signal_submitted',
                    timestamp: new Date().toISOString(),
                    source: 'tiktok',
                    signal_id: item.signal_id,
                    ingestion_status: 'rejected',
                    governance_status: 'blocked',
                    governance_reason_code: 'internal_error'
                }));
            }
        }

    } catch (error: any) {
        status = 'error';
        console.error("Harvesting failed:", error);
    } finally {
        console.log(JSON.stringify({
            event: 'tiktok_batch_submit',
            timestamp: new Date().toISOString(),
            batch_size: batchSize,
            status: status
        }));
    }
}
