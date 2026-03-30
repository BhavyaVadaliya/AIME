import axios from 'axios';
import { runTikTokHarvest } from './harvest';
import { processL2Request } from '../../logic';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:4000/api';

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
                
                // Detailed logging
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

                // Phase 1: Push to Core API for Storage/Dashboard
                try {
                    await axios.post(`${CORE_API_URL}/admin/signals`, {
                        signal_id: item.signal_id,
                        source: 'tiktok',
                        raw_text: item.raw_text,
                        metadata: item.metadata,
                        topics: bundle.topics,
                        subtopics: bundle.subtopics,
                        context_summary: bundle.context_summary,
                        flags: bundle.flags,
                        actionable: bundle.topics.length > 0 && !bundle.topics.includes('general'),
                        status: 'accepted',
                        governance_status: 'passed'
                    });
                } catch (pushErr: any) {
                    console.error(`Failed to push signal ${item.signal_id} to Core API: ${pushErr.message}`);
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
