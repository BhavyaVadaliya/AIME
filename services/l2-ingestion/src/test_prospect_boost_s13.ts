import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';

async function runS13T02Verification() {
    load_gime_v0_1();
    console.log("=================================================================");
    console.log("       AIME S13-T02 PROSPECT INTENT CALIBRATION TEST SUITE        ");
    console.log("=================================================================");

    const testCases = [
        // 1. Qualified Prospect Signals Elevated (Standard and Boosted)
        {
            signal_id: "prospect-boosted-1",
            raw_text: "I’m an RN burned out at bedside and want side income in nutrition.",
            expected_category: "prospect_candidate",
            expected_tags: ["professional_identity_match", "career_transition_intent", "side_income_intent", "multi_signal_boost"],
            expected_min_score: 8,
            expected_tier: "HIGH",
            description: "High-value multi-signal prospect (RN + burnout + side income) - expected score >= 8 and HIGH priority tier"
        },
        {
            signal_id: "prospect-standard-1",
            raw_text: "How can a dietitian add nutrition coaching revenue?",
            expected_category: "prospect_candidate",
            expected_tags: ["professional_identity_match", "side_income_intent"],
            expected_min_score: 6,
            expected_tier: "MEDIUM",
            description: "Standard prospect (dietitian + coaching revenue) - expected score >= 6 and MEDIUM/HIGH priority tier"
        },
        {
            signal_id: "prospect-standard-2",
            raw_text: "I’m a massage therapist interested in nutrition certification.",
            expected_category: "prospect_candidate",
            expected_tags: ["professional_identity_match", "certification_interest"],
            expected_min_score: 6,
            expected_tier: "MEDIUM",
            description: "Standard prospect (massage therapist + certification) - expected score >= 6 and MEDIUM/HIGH priority tier"
        },
        {
            signal_id: "prospect-standard-3",
            raw_text: "What CEU should I take to expand into nutrition counseling?",
            expected_category: "prospect_candidate",
            expected_tags: ["clinical_advancement_intent"],
            expected_min_score: 6,
            expected_tier: "MEDIUM",
            description: "Standard prospect curiosity (CEU continuing ed path) - expected score >= 6 and MEDIUM/HIGH priority tier"
        },

        // 2. Seller/Promoter Contamination Signals Suppressed
        {
            signal_id: "seller-suppressed-1",
            raw_text: "Nurses, join my coaching program. Link in bio.",
            expected_category: "seller_candidate",
            expected_tags: ["professional_identity_match", "side_income_intent"], // matched keywords but suppressed
            expected_max_score: 1,
            expected_tier: "LOW",
            description: "Outbound seller contamination calling nurses - expected score = 1 and LOW priority tier"
        },
        {
            signal_id: "seller-suppressed-2",
            raw_text: "Become certified today and launch your nutrition business. DM me.",
            expected_category: "promoter_candidate",
            expected_tags: ["certification_interest", "side_income_intent"], // matched keywords but suppressed
            expected_max_score: 1,
            expected_tier: "LOW",
            description: "Outbound promoter contamination - expected score = 1 and LOW priority tier"
        },

        // 3. Mixed-Signal Conflicts Resolving Correctly
        {
            signal_id: "conflict-preserved-personal",
            raw_text: "I’m a nurse looking for side income in nutrition - join my study group, link in bio",
            expected_category: "prospect_candidate",
            expected_tags: ["professional_identity_match", "side_income_intent"],
            expected_min_score: 6,
            expected_tier: "MEDIUM",
            description: "Conflict: Personal exploration language takes precedence - expected prospect preservation"
        },
        {
            signal_id: "conflict-suppressed-outbound",
            raw_text: "Nurses, join my program and start earning today. Link in bio.",
            expected_category: "seller_candidate",
            expected_tags: ["professional_identity_match", "side_income_intent"],
            expected_max_score: 1,
            expected_tier: "LOW",
            description: "Conflict: Outbound promotion language takes precedence - expected seller suppression"
        }
    ];

    let overallPassed = true;

    for (const tc of testCases) {
        console.log(`\n-----------------------------------------------------------------`);
        console.log(`TEST CASE ID:  ${tc.signal_id}`);
        console.log(`DESCRIPTION:   ${tc.description}`);
        console.log(`RAW TEXT:      "${tc.raw_text}"`);

        const request: L2IngestRequest = {
            signal_id: tc.signal_id,
            correlation_id: `corr-${tc.signal_id}`,
            source: "tiktok",
            raw_text: tc.raw_text,
            metadata: {}
        };

        const bundle = processL2Request(request);
        const sp = bundle.structured_post;
        if (!sp) {
            console.log(`❌ FAIL: Structured post was not created.`);
            overallPassed = false;
            continue;
        }

        const tags = sp.classification.context_tags || [];
        const score = sp.signal_score?.score ?? 0;
        const tier = sp.priority_tier;

        console.log(`\nOUTPUT CALIBRATION DETAILS:`);
        console.log(`- Mapped Category: ${sp.classification.primary_category}`);
        console.log(`- Signal Type:     ${sp.classification.signal_type}`);
        console.log(`- Context Tags:    [${tags.join(', ')}]`);
        console.log(`- Score Mapped:    ${score}`);
        console.log(`- Priority Tier:   ${tier}`);

        let passed = true;

        // Verify Category Match
        let hasExpectedCategory = tags.includes(tc.expected_category);
        if (tc.expected_category === 'seller_candidate' || tc.expected_category === 'promoter_candidate') {
            hasExpectedCategory = tags.includes('seller_candidate') || tags.includes('promoter_candidate');
        }
        if (!hasExpectedCategory) {
            console.log(`❌ FAIL: Expected tag '${tc.expected_category}' (or equivalent seller/promoter tag) was not found in context tags.`);
            passed = false;
        }

        // Verify specific expected tags are matched
        for (const tag of tc.expected_tags) {
            if (!tags.includes(tag) && !tc.expected_category.includes('seller') && !tc.expected_category.includes('promoter')) {
                console.log(`❌ FAIL: Missing expected tag '${tag}' for prospect match.`);
                passed = false;
            }
        }

        // Verify score constraints
        if (tc.expected_min_score !== undefined && score < tc.expected_min_score) {
            console.log(`❌ FAIL: Mapped score ${score} is below expected min score floor of ${tc.expected_min_score}`);
            passed = false;
        }
        if (tc.expected_max_score !== undefined && score > tc.expected_max_score) {
            console.log(`❌ FAIL: Mapped score ${score} exceeds expected max score cap of ${tc.expected_max_score}`);
            passed = false;
        }

        // Verify tier constraints
        if (tc.expected_tier === "HIGH" && tier !== "HIGH") {
            console.log(`❌ FAIL: Expected tier HIGH, got '${tier}'`);
            passed = false;
        }
        if (tc.expected_tier === "LOW" && tier !== "LOW") {
            console.log(`❌ FAIL: Expected tier LOW, got '${tier}'`);
            passed = false;
        }
        if (tc.expected_tier === "MEDIUM" && tier === "LOW") {
            console.log(`❌ FAIL: Expected tier MEDIUM or HIGH, got LOW suppression`);
            passed = false;
        }

        if (passed) {
            console.log(`✅ PASS: Calibration constraints successfully verified!`);
        } else {
            overallPassed = false;
        }
    }

    console.log(`\n=================================================================`);
    if (overallPassed) {
        console.log("🟢 ALL S13-T02 CALIBRATION VERIFICATION TESTS PASSED SUCCESSFULLY!");
        process.exit(0);
    } else {
        console.log("🔴 SOME S13-T02 CALIBRATION VERIFICATION TESTS FAILED.");
        process.exit(1);
    }
}

runS13T02Verification().catch(e => {
    console.error("Fatal test runner error:", e);
    process.exit(1);
});
