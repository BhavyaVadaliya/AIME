import * as fs from 'fs';
import * as path from 'path';
import { processL2Request } from './logic';
import { normalizeTikTokItem } from './ingestion/tiktok/normalize';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';

async function runRealDataScan() {
    load_gime_v0_1();
    
    const logsPath = path.resolve(__dirname, '..', 'l2_logs.txt');
    // Clear existing logs to provide a "Fresh" realtime dashboard
    fs.writeFileSync(logsPath, '');

    console.log("=== STARTING REAL-DATA DYNAMIC SCAN (12 SIGNALS) ===");

    const realSignals = [
        { id: "7622814949764599042", author: "sams.wellbeing", text: "Food choices aren't just down to willpower? What are your thoughts? #rd2be" },
        { id: "7615789972284509470", author: "rubykania", text: "just for some meal ideas always 😚 #wieiad #whatieatinaday #food #rd2be" },
        { id: "7613887117097323790", author: "nicole_concannon", text: "Gonna look back and laugh at this time one day #rd2be #rdexam" },
        { id: "7612396021280230686", author: "rubykania", text: "yogurt bowl phase loading… #groceryshopping #groceryhaul #rd2be" },
        { id: "7612393331737382157", author: "nicole_concannon", text: "Replying to @Kymme Ballard I recommend Dana to everyone I know also thanks for the kind words!! #rd2be #rdexam" },
        { id: "7629923506926439711", author: "itsdestinyyall", text: "Just out here surviving. 🫠 #nursetok #laboranddelivery #nursingstudent" },
        { id: "7615353186722925854", author: "nursebrenden1", text: "Remind you this is all in one shift 😭 #nurse #nursetok #nurselife" },
        { id: "7626758754196868382", author: "nickaquaria", text: "#nursesoftiktok #nurselife #nurse #nursetok #travelnurse" },
        { id: "7629468067617148173", author: "justbee96", text: "#MemeCut #nursehumor #nurselife #nursetok #nursing #biotech" },
        { id: "7580107142972181791", author: "thebougienurse", text: "What's in My Night Nurse Work Bag? #nursetok | NurseTok" },
        { id: "7630544664168385805", author: "marissaxx315", text: "🥰 #nurse #nursetok #nursesoftiktok #nursetiktok #nurses" },
        { id: "7628610599101943054", author: "elninojroc", text: "#nursesoftiktok #nursingschool #nursingstudent #nursetok #nurse" }
    ];

    for (let i = 0; i < realSignals.length; i++) {
        const raw = realSignals[i] as any;
        
        // Pass to normalizer
        const request = normalizeTikTokItem({
            id: raw.id,
            author: raw.author,
            text: raw.text,
            createTime: Math.floor(Date.now() / 1000) - (i * 3600) // Staggered over last 12h
        });

        const bundle = processL2Request(request);

        // Standard Lifecycle Reporting (which Dashboard Lite consumes)
        const logEntry = {
            event: "signal_lifecycle_report",
            timestamp: new Date().toISOString(),
            signal_id: bundle.signal_id,
            correlation_id: bundle.correlation_id,
            structured_post: bundle.structured_post
        };

        fs.appendFileSync(logsPath, JSON.stringify(logEntry) + "\n");
        console.log(`[Real-Scan] Injected link: ${bundle.structured_post?.source?.source_url}`);
    }

    console.log("=== REAL-DATA DYNAMIC SCAN COMPLETE. 12 WORKING SIGNALS INJECTED. ===");
}

runRealDataScan().catch(e => console.error(e));
