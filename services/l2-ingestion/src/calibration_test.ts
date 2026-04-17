import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';

async function runCalibrationTest() {
    load_gime_v0_1();
    
    console.log("=== GIME Calibration Test Scan ===");
    
    const testSignals = [
        { 
            id: "cal-1", 
            text: "#rd2be I'm so excited to start my internship!", 
            comment: "Hashtag-aware: Should be Professional Pathway, even if text is vague." 
        },
        { 
            id: "cal-2", 
            text: "Looking for a clinical nutrition course? #nutritioncourse", 
            comment: "Hashtag-aware: Should be Monetization." 
        },
        { 
            id: "cal-3", 
            text: "How much does the nutrition certification cost?", 
            comment: "Clinical Intent: Should score high (Cat 4 + Type 2 + possibly boost = score 6+)." 
        },
        { 
            id: "cal-4", 
            text: "Sharing my daily routine! #whatieatinaday", 
            comment: "Generic Lifestyle: Should score low (Cat 1 + Type 1 = Score 2)." 
        },
        { 
            id: "cal-5", 
            text: "I want to become a certified dietitian. How do I start?", 
            comment: "Professional Pathway + Question: Score (Cat 4 + Type 2 + Boost 1 = Score 7)." 
        }
    ];

    for (const signal of testSignals) {
        const sample: L2IngestRequest = {
            correlation_id: `corr-${signal.id}`,
            signal_id: signal.id,
            source: "tiktok",
            raw_text: signal.text
        };

        console.log(`\n--- Signal ${signal.id}: "${signal.text}" ---`);
        console.log(`Expected: ${signal.comment}`);
        const bundle = processL2Request(sample);
        
        const classification = bundle.structured_post?.classification;
        const score = bundle.structured_post?.signal_score;
        
        console.log(`Result: Category: ${classification?.primary_category}, Type: ${classification?.signal_type}, Score: ${score?.score}, Tier: ${bundle.structured_post?.priority_tier}`);
        console.log(`Breakdown: CatWeight: ${score?.category_weight}, TypeAdj: ${score?.type_adjustment}, Boost: ${score?.pattern_boost}`);
    }
}

runCalibrationTest().catch(e => console.error(e));
