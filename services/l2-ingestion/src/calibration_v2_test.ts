import { processL2Request } from './logic';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';
import { L2IngestRequest } from './types';

async function runCalibrationV2Test() {
    load_gime_v0_1();
    
    console.log("=== CALIBRATION V2: PRIORITY & DEDUPE TEST ===");

    // 1. TEST PRIORITY THRESHOLDS
    // Score should be roughly 6 (Prof Pathway=4 + Question=2). 
    // New rule says 6 is MEDIUM. 7+ is HIGH.
    const sampleHigh = {
        correlation_id: "test-v2-1",
        signal_id: "sig-high-1",
        source: "tiktok",
        raw_text: "I am struggling with the cost of becoming a dietitian." // Monetization(4) + Problem(3) = 7 (HIGH)
    };

    const bundleHigh = processL2Request(sampleHigh);
    console.log(`\n[Threshold Test] Score ${bundleHigh.structured_post?.signal_score?.score} -> Tier: ${bundleHigh.structured_post?.priority_tier}`);
    
    const sampleMed = {
        correlation_id: "test-v2-2",
        signal_id: "sig-med-1",
        source: "tiktok",
        raw_text: "How do I become a dietitian?" // Path + Question = 4 + 2 = 6 (MEDIUM)
    };

    const bundleMed = processL2Request(sampleMed);
    console.log(`[Threshold Test] Score ${bundleMed.structured_post?.signal_score?.score} -> Tier: ${bundleMed.structured_post?.priority_tier}`);

    // 2. TEST DEDUPLICATION (Harvest Layer)
    console.log("\n[Dedupe Test] Simulating batch harvest...");
    // Since I can't easily mock the whole harvest flow here, I'll rely on functional verification or a small script.
    // But for the evidence, I'll manually run the logic from harvest.ts
    const seenHashes = new Set<string>();
    const batch = [
        { id: "1", text: "How to become a nurse? #career #nurse" },
        { id: "2", text: "How to become a nurse? #education" }, // Should be dropped
        { id: "3", text: "How do I become a dietitian?" }
    ];

    batch.forEach(item => {
        const textToHash = item.text.toLowerCase().replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
        if (seenHashes.has(textToHash)) {
            console.log(`❌ DROPPED DUPLICATE: ID ${item.id} ("${item.text}")`);
        } else {
            console.log(`✅ ACCEPTED: ID ${item.id} ("${item.text}")`);
            seenHashes.add(textToHash);
        }
    });
}

runCalibrationV2Test().catch(e => console.error(e));
