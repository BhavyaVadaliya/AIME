import { refineIntent } from './ingestion/tiktok/intent_refinement';

async function runIntentRefinementTest() {
    console.log("=== INTENT REFINEMENT VALIDATION TEST ===");

    const testCases = [
        {
            id: "low-1",
            text: "Just a day in the life of a random person.",
            expected: "excluded_low_intent",
            description: "Pure low-intent (excluded)"
        },
        {
            id: "priority-1",
            text: "How do I become a registered dietitian?",
            expected: "priority_candidate",
            description: "Pure priority intent / Prospect preservation (retained)"
        },
        {
            id: "mixed-1",
            text: "Vlog: Spend the day with me as I study for my RD exam!",
            expected: "priority_candidate",
            description: "Mixed: Low-intent phrase + Priority phrase (retained)"
        },
        {
            id: "mixed-2",
            text: "GRWM while I talk about clinical rotations for nurses.",
            expected: "priority_candidate",
            description: "Mixed: Low-intent phrase + Target-profession phrase (retained)"
        },
        {
            id: "neutral-1",
            text: "Highly recommended clinical nutrition textbook.",
            expected: "neutral_candidate",
            description: "Neutral: No specific patterns (retained)"
        },
        {
            id: "monetization-1",
            text: "What does it cost to enroll in this nutrition certification?",
            expected: "priority_candidate",
            description: "Monetization: Retained and prioritized"
        },
        // S13-T01 Seller/Promoter Contamination Test Cases
        {
            id: "seller-1",
            text: "Join my coaching program now! Click the link in bio.",
            expected: "seller_candidate",
            description: "Category A: Pure seller/funnel indicator (deprioritized)"
        },
        {
            id: "seller-2",
            text: "DM me to book a call. Clients only!",
            expected: "seller_candidate",
            description: "Category A: Direct funnel CTA / book a call (deprioritized)"
        },
        {
            id: "promoter-1",
            text: "Become certified today and start your coaching business!",
            expected: "promoter_candidate",
            description: "Category B: Outbound certification promotion (deprioritized)"
        },
        {
            id: "promoter-2",
            text: "Launch your nutrition business now! Limited spots available.",
            expected: "seller_candidate",
            description: "Category B: Outbound sales and high-pressure business funnel (deprioritized)"
        },

        // S13-T01 Prospect Preservation Safeguards Test Cases
        {
            id: "prospect-safeguard-1",
            text: "What certification should I take?",
            expected: "prospect_candidate",
            description: "Safeguard: Certification inquiry (preserved)"
        },
        {
            id: "prospect-safeguard-2",
            text: "How do I become a dietitian?",
            expected: "prospect_candidate",
            description: "Safeguard: Dietitian path curiosity (preserved)"
        },
        {
            id: "prospect-safeguard-3",
            text: "I want a side income",
            expected: "prospect_candidate",
            description: "Safeguard: Side income desire (preserved)"
        },
        {
            id: "prospect-safeguard-4",
            text: "I’m thinking of changing careers",
            expected: "prospect_candidate",
            description: "Safeguard: Career transition interest (preserved)"
        },
        // S13-T01 Mixed-Signal Protection Test Cases
        {
            id: "mixed-protection-1",
            text: "I’m a nurse looking for a side income in nutrition - link in bio to join my program",
            expected: "prospect_candidate",
            description: "Mixed-Signal: Contains both professional curiosity and promotional link in bio (preserved)"
        }
    ];

    let passedCount = 0;

    for (const test of testCases) {
        console.log(`\n--- Test Case: ${test.id} ("${test.text}") ---`);
        console.log(`Description: ${test.description}`);
        const result = refineIntent(test.text, test.id);
        console.log(`Outcome: ${result.category}`);
        if (result.category === test.expected) {
            console.log("Result: ✅ PASS");
            passedCount++;
        } else {
            console.log(`Result: ❌ FAIL (Expected ${test.expected})`);
        }
    }

    console.log(`\n=== TEST SUMMARY: ${passedCount}/${testCases.length} PASS ===`);
    if (passedCount === testCases.length) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

runIntentRefinementTest().catch(e => console.error(e));

