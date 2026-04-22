import 'dotenv/config';
import { runTikTokHarvest } from './ingestion/tiktok/harvest';
import { processL2Request } from './logic';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';
import * as fs from 'fs';
import * as path from 'path';

async function runLiveHarvest50() {
    console.log("=== STARTING LIVE 50-SIGNAL TIKTOK SCAN ===");
    
    // 1. INITIALIZE LENS
    load_gime_v0_1();

    // 2. RUN HARVEST (Live Apify Call)
    console.log("Fetching live signals from TikTok...");
    const requests = await runTikTokHarvest();
    console.log(`Retrieved ${requests.length} signals.`);

    // 3. PROCESS THROUGH PIPELINE
    const logsPath = path.resolve(__dirname, '..', 'l2_logs.txt');
    
    for (const req of requests) {
        try {
            const bundle = processL2Request(req);
            
            const logEntry = {
                event: "signal_lifecycle_report",
                timestamp: new Date().toISOString(),
                signal_id: bundle.signal_id,
                correlation_id: bundle.correlation_id,
                structured_post: bundle.structured_post
            };

            fs.appendFileSync(logsPath, JSON.stringify(logEntry) + "\n");
            console.log(`✅ Ingested: ${bundle.signal_id} | ${bundle.structured_post?.priority_tier} | ${bundle.structured_post?.raw_text.substring(0, 50)}...`);
        } catch (err: any) {
            console.error(`❌ Failed to process signal ${req.signal_id}: ${err.message}`);
        }
    }

    console.log("=== SCAN COMPLETE: DASHBOARD SHOULD BE UPDATED ===");
}

runLiveHarvest50().catch(e => {
    console.error("FATAL ERROR IN LIVE HARVEST:", e);
    process.exit(1);
});
