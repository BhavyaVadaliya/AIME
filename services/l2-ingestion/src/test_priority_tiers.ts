import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';

async function validatePriorityMapping() {
    load_gime_v0_1();
    
    const samples: L2IngestRequest[] = [
        {
            correlation_id: "test-prob",
            signal_id: "sig-1",
            source: "tiktok",
            raw_text: "urgent problem with medical billing certification" // Problem type
        },
        {
            correlation_id: "test-mon-min",
            signal_id: "sig-2",
            source: "tiktok",
            raw_text: "how can i pay for the dietitian course? monetization context" // Monetization Category
        },
        {
            correlation_id: "test-med-combo",
            signal_id: "sig-3",
            source: "tiktok",
            raw_text: "how do i join the engagement program?" // Engagement + Quest/CTA
        },
        {
            correlation_id: "test-low-cap",
            signal_id: "sig-4",
            source: "tiktok",
            raw_text: "day in my life of balanced eating" // Lifestyle + Content
        }
    ];

    console.log("=== GIME Priority Tier Mapping Validation (S10-T14) ===");

    samples.forEach((sample, index) => {
        const bundle = processL2Request(sample);
        const sp = bundle.structured_post;

        console.log(`\nSample ${index + 1}: "${sample.raw_text}"`);
        console.log(`-> Category:      ${sp?.classification.primary_category}`);
        console.log(`-> Signal Type:   ${sp?.classification.signal_type}`);
        console.log(`-> Score:         ${sp?.signal_score?.score}`);
        console.log(`-> Priority Tier: ${sp?.priority_tier}`);

        // Determinism Check
        const run2 = processL2Request(sample);
        const isDeterministic = bundle.structured_post?.priority_tier === run2.structured_post?.priority_tier;
        console.log(`-> Deterministic: ${isDeterministic ? 'PASS' : 'FAIL'}`);

        // Logic check (Visual Verification against manual overrides)
        if (index === 0) console.log(`   (Rule: Problem override -> Expected: HIGH)`);
        if (index === 1) console.log(`   (Rule: Mon minimum -> Expected: MEDIUM)`);
        if (index === 3) console.log(`   (Rule: Generic cap -> Expected: LOW)`);
    });

    // Check schema integrity: ensure existing headers remain unchanged
    const finalBundle = processL2Request(samples[0]);
    console.log(`\n--- Schema Integrity Check ---`);
    console.log(`structured_post exists: ${!!finalBundle.structured_post ? 'PASS' : 'FAIL'}`);
    console.log(`priority_tier inside sp: ${!!finalBundle.structured_post?.priority_tier ? 'PASS' : 'FAIL'}`);
    console.log(`signal_score preserved:  ${!!finalBundle.structured_post?.signal_score ? 'PASS' : 'FAIL'}`);
}

validatePriorityMapping().catch(e => console.error(e));
