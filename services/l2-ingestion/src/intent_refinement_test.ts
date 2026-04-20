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
            description: "Pure priority intent (retained)"
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
        }
    ];

    for (const test of testCases) {
        console.log(`\n--- Test Case: ${test.id} ("${test.text}") ---`);
        console.log(`Description: ${test.description}`);
        const result = refineIntent(test.text, test.id);
        console.log(`Outcome: ${result.category}`);
        if (result.category === test.expected) {
            console.log("Result: ✅ PASS");
        } else {
            console.log(`Result: ❌ FAIL (Expected ${test.expected})`);
        }
    }
}

runIntentRefinementTest().catch(e => console.error(e));
