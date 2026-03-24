import 'dotenv/config';
import { runTikTokHarvest } from './src/ingestion/tiktok/harvest';
import { processL2Request } from './src/logic';

async function test() {
    console.log("Starting harvest test...");
    try {
        const items = await runTikTokHarvest();
        console.log(`Harvested ${items.length} items.`);
        for (const item of items) {
            const bundle = processL2Request(item);
            console.log(JSON.stringify({
                SIGNAL_ID: item.signal_id,
                TOPIC: bundle.topics.join(', '),
                ACTIONABLE: bundle.topics.length > 0 && !bundle.topics.includes('general')
            }, null, 2));
        }
    } catch (e: any) {
        console.error("TEST FAILED");
        console.error(JSON.stringify(e, null, 2));
    }
}

test();
