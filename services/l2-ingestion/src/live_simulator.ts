import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';
import * as fs from 'fs';
import * as path from 'path';

const patterns = [
    { text: "Struggling with clinical internship placement queries", cat: "Professional Pathway", type: "Problem" },
    { text: "Join my masterclass on holistic wellness and diet", cat: "Monetization", type: "Offer" },
    { text: "New research: intermittent fasting vs circadian rhythm", cat: "Education", type: "Content" },
    { text: "What is the best way to study for the RD exam?", cat: "Professional Pathway", type: "Question" },
    { text: "5 tips for reducing inflammatory markers with food", cat: "Education", type: "Content" },
    { text: "Affiliate link for my favorite organic greens powder", cat: "Monetization", type: "CTA" },
    { text: "Unboxing my new medical nutrition therapy toolkit", cat: "Lifestyle", type: "Content" },
    { text: "Reviewing the top 3 health coaching certifications", cat: "Professional Pathway", type: "Content" },
    { text: "DM me for personalized fitness coaching plans", cat: "Monetization", type: "CTA" },
    { text: "Is apple cider vinegar actually good for digestion?", cat: "Education", type: "Question" }
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
