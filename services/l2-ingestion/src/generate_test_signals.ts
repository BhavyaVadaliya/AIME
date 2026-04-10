import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';
import * as fs from 'fs';
import * as path from 'path';

async function generateTestSignals() {
    load_gime_v0_1();
    
    const samples: L2IngestRequest[] = [
        { correlation_id: "seed-1", signal_id: "sig-mon-prob", source: "tiktok", raw_text: "urgent problem with paying for my nutrition certification" },
        { correlation_id: "seed-2", signal_id: "sig-mon-cta", source: "tiktok", raw_text: "click here to buy the elite coaching package" },
        { correlation_id: "seed-3", signal_id: "sig-edu-quest", source: "tiktok", raw_text: "how do I calculate macros for weight loss?" },
        { correlation_id: "seed-4", signal_id: "sig-life-cont", source: "tiktok", raw_text: "my morning routine for better skin health" },
        { correlation_id: "seed-5", signal_id: "sig-prof-offer", source: "tiktok", raw_text: "offering free consultation for medical billing students" },
        { correlation_id: "seed-6", signal_id: "sig-eng-cta", source: "tiktok", raw_text: "follow me for more fitness tips and tricks" },
        { correlation_id: "seed-7", signal_id: "sig-pro-prob", source: "tiktok", raw_text: "having trouble with the professional clinical exam software" },
        { correlation_id: "seed-8", signal_id: "sig-promo-cta", source: "tiktok", raw_text: "limited time deal on these gym leggings" },
        { correlation_id: "seed-9", signal_id: "sig-edu-cont", source: "tiktok", raw_text: "the science behind intermittent fasting explained" },
        { correlation_id: "seed-10", signal_id: "sig-unclass", source: "tiktok", raw_text: "just a random video about my cat eating dinner" }
    ];

    console.log("Generating 10 diverse signals for Dashboard Lite...");

    const logPath = path.resolve(path.join(__dirname, "..", "..", "..", "l2_logs.txt"));
    
    samples.forEach(sample => {
        const bundle = processL2Request(sample);
        // The processL2Request calls LifecycleReporter internally in my latest logic.ts
        // But for this simulation, we'll manually append to ensure they are in l2_logs.txt
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
        console.log(`Generated: ${bundle.signal_id} (${bundle.structured_post?.priority_tier})`);
    });
}

generateTestSignals().catch(e => console.error(e));
