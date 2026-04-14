import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';
import * as fs from 'fs';
import * as path from 'path';

const patterns = [
    { text: "how much does the certification course cost?", cat: "Monetization", type: "Question" },
    { text: "how do I become a certified nutritionist?", cat: "Professional Pathway", type: "Question" },
    { text: "what is the price for the clinical training program?", cat: "Monetization", type: "Question" },
    { text: "are there any career opportunities in healthcare training?", cat: "Professional Pathway", type: "Question" },
    { text: "is intermittent fasting good for fat loss?", cat: "Education", type: "Question" },
    { text: "can you explain the science of glucose monitoring?", cat: "Education", type: "Question" },
    { text: "where can I buy the dietitian exam prep kit?", cat: "Monetization", type: "Question" },
    { text: "how do I enroll in your nutrition coaching program?", cat: "Monetization", type: "Question" },
    { text: "is the RD credential required for this career?", cat: "Professional Pathway", type: "Question" },
    { text: "what is the best way to improve metabolic health?", cat: "Education", type: "Question" }
];

async function runSimulator() {
    load_gime_v0_1();
    const logPath = path.resolve(path.join(__dirname, "..", "..", "..", "l2_logs.txt"));
    
    console.log("=== TikTok Shadow Stream Simulator (LIVE) ===");
    console.log("Pushing a new signal every 5 seconds...");

    let count = 0;
    while (count < 50) {
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        const id = `live-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        const sample: L2IngestRequest = {
            correlation_id: `corr-${id}`,
            signal_id: id,
            source: "tiktok",
            raw_text: pattern.text
        };

        const bundle = processL2Request(sample);
        const report = {
            event: "signal_lifecycle_report",
            timestamp: new Date().toISOString(),
            signal_id: bundle.signal_id,
            correlation_id: bundle.correlation_id,
            structured_post: {
                data: bundle.structured_post
            }
        };

        fs.appendFileSync(logPath, JSON.stringify(report) + "\n");
        console.log(`[LIVE] ${new Date().toLocaleTimeString()} - Pushed: ${id} (${bundle.structured_post?.priority_tier})`);
        
        count++;
    }
}

runSimulator().catch(e => console.error(e));
