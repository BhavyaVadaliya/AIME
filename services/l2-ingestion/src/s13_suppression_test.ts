import { processL2Request } from './logic';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';
import { L2IngestRequest } from './types';

async function runS13SuppressionTest() {
    load_gime_v0_1();
    
    console.log("=== S13 SELLER & PROMOTER CONTAMINATION SUPPRESSION TEST ===");

    const testCases = [
        {
            id: "s13-seller-1",
            text: "Check out my new coaching program! Link in bio to book a call.",
            expectedTag: "seller_candidate",
            expectedDeprioritized: true,
            expectedTier: "LOW",
            description: "Category A: Pure seller/funnel contamination"
        },
        {
            id: "s13-promoter-1",
            text: "Start your coaching business today and enroll in our mentorship program!",
            expectedTag: "promoter_candidate",
            expectedDeprioritized: true,
            expectedTier: "LOW",
            description: "Category B: Outbound certification/coaching business promoter"
        },
        {
            id: "s13-preserve-1",
            text: "What certification should I take? How do I become a dietitian?",
            expectedTag: "prospect_candidate",
            expectedDeprioritized: false,
            expectedTier: "MEDIUM",
            description: "Critical Safeguard: Genuine career transition / educational curiosity (Preserved from LOW deprioritization)"
        },
        {
            id: "s13-mixed-1",
            text: "I'm a nurse looking for a side income in nutrition. DM me for info.",
            expectedTag: "prospect_candidate",
            expectedDeprioritized: false,
            expectedTier: "LOW",
            description: "Mixed-Signal Protection: Professional transition + Monetization indicator (Preserved from LOW deprioritization)"
        }
    ];

    let passedAll = true;

    for (const tc of testCases) {
        console.log(`\n--- Test Case ${tc.id}: "${tc.text}" ---`);
        console.log(`Description: ${tc.description}`);

        const sampleRequest: L2IngestRequest = {
            correlation_id: `corr-${tc.id}`,
            signal_id: tc.id,
            source: "tiktok",
            raw_text: tc.text
        };

        const bundle = processL2Request(sampleRequest);
        const classification = bundle.structured_post?.classification;
        const score = bundle.structured_post?.signal_score?.score;
        const tier = bundle.structured_post?.priority_tier;

        console.log(`- Result Tag: ${classification?.seller_promoter_tag} (Expected: ${tc.expectedTag})`);
        console.log(`- Is Deprioritized: ${classification?.is_deprioritized} (Expected: ${tc.expectedDeprioritized})`);
        console.log(`- Priority Tier: ${tier} (Expected: ${tc.expectedTier})`);
        console.log(`- Computed Score: ${score}`);

        const tagMatch = classification?.seller_promoter_tag === tc.expectedTag;
        const deprioritizeMatch = classification?.is_deprioritized === tc.expectedDeprioritized;
        const tierMatch = tier === tc.expectedTier;

        if (tagMatch && deprioritizeMatch && tierMatch) {
            console.log("Result: ✅ PASS");
        } else {
            console.log("Result: ❌ FAIL");
            passedAll = false;
        }
    }

    console.log(`\n==================================================`);
    if (passedAll) {
        console.log("ALL S13 SUPPRESSION & PRESERVATION TESTS: 🟢 PASS");
    } else {
        console.log("ALL S13 SUPPRESSION & PRESERVATION TESTS: 🔴 FAIL");
    }
}

runS13SuppressionTest().catch(e => console.error(e));
