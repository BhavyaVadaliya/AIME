import * as fs from 'fs';
import * as path from 'path';
import { processL2Request } from './logic';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';

async function runPresentationTest() {
    load_gime_v0_1();
    
    const logsPath = path.resolve(__dirname, '..', 'l2_logs.txt');
    fs.writeFileSync(logsPath, ''); // Fresh start

    console.log("=== S11-T01: PRESENTATION LAYER TEST ===");

    const signals = [
        // 1. HIGH PRIORITY
        { id: "p1", author: "clinical_nutr", text: "I am struggling with the cost of dietitian certification." },
        
        // 2. DUPLICATES (Should group in UI x3)
        { id: "d1", author: "user1", text: "How to become a dietitian? #rd2be" },
        { id: "d2", author: "user2", text: "How to become a dietitian? #rd2be" },
        { id: "d3", author: "user3", text: "How to become a dietitian? #rd2be" },

        // 3. LOW VALUE (LOW tier + low score (<=3))
        // Lifestyle: Routine (1) + Content (1) = 2. Should collapse.
        { id: "lv1", author: "lifestyle_vlog", text: "My morning healthy routine." },

        // 4. MISSING SOURCE
        { id: "ms1", author: "unknown", text: "What is clinical nutrition?" }
    ];

    for (const raw of signals) {
        const bundle = processL2Request({
            correlation_id: `corr-${raw.id}`,
            signal_id: raw.id,
            source: raw.author === 'unknown' ? 'unknown' : 'tiktok',
            raw_text: raw.text,
            metadata: { author: raw.author }
        });

        const logEntry = {
            event: "signal_lifecycle_report",
            timestamp: new Date().toISOString(),
            signal_id: bundle.signal_id,
            correlation_id: bundle.correlation_id,
            structured_post: bundle.structured_post
        };

        fs.appendFileSync(logsPath, JSON.stringify(logEntry) + "\n");
    }

    console.log("=== PRESENTATION TEST DATA INJECTED. CHECK DASHBOARD. ===");
}

runPresentationTest().catch(e => console.error(e));
