import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';
import * as fs from 'fs';
import * as path from 'path';

const patterns = [
    { text: "Need help with medical billing certification problem", cat: "Monetization", type: "Problem" },
    { text: "How do I start a career in nutrition?", cat: "Professional Pathway", type: "Question" },
    { text: "Download my free macro tracking guide", cat: "Monetization", type: "Offer" },
    { text: "My healthy meal prep for the week", cat: "Lifestyle", type: "Content" },
    { text: "Check out this limited time discount on protein", cat: "Promotion", type: "CTA" },
    { text: "Explaining the keto diet for beginners", cat: "Education", type: "Content" },
    { text: "Follow me for daily gym motivation", cat: "Engagement", type: "CTA" },
    { text: "Problem with the clinical software login", cat: "Professional Pathway", type: "Problem" },
    { text: "Why is metabolic health important?", cat: "Education", type: "Question" },
    { text: "Link in bio for my transformation program", cat: "Monetization", type: "CTA" }
];

async function runSimulator() {
    load_gime_v0_1();
    const logPath = path.resolve(path.join(__dirname, "..", "..", "..", "l2_logs.txt"));
    
    console.log("=== TikTok Shadow Stream Simulator (LIVE) ===");
    console.log("Pushing a new signal every 5 seconds...");

    let count = 0;
    while (true) {
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
        // Keep file size manageable
        if (count % 100 === 0) {
            // Optional: trim log if it gets too big
        }

        await new Promise(r => setTimeout(r, 5000));
    }
}

runSimulator().catch(e => console.error(e));
