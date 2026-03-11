import { routeTikTokHarvest } from './services/l2-ingestion/src/ingestion/tiktok/route';
import { load_gime_v0_1 } from './services/l2-ingestion/src/lens/gime_mapping_loader';

async function run() {
    console.log("Starting script runner...");
    load_gime_v0_1();
    await routeTikTokHarvest();
    console.log("Done.");
}

run();
