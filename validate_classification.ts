import { classifySignal } from './services/l2-ingestion/src/classification/signal_classifier';

const testCases = [
    // 1. Professional Pathway Question
    { text: "How do I become a dietitian?", expectedCat: "Professional Pathway", expectedType: "Question" },
    // 2. Monetization Question
    { text: "What does the certification course cost?", expectedCat: "Monetization", expectedType: "Question" },
    // 3. Education Question (Fallback)
    { text: "What is intermittent fasting?", expectedCat: "Education", expectedType: "Question" },
    // 4. Strong Rule Precedence (Monetization)
    { text: "How much does it cost to enroll?", expectedCat: "Monetization", expectedType: "Question" },
    // 5. Strong Rule Precedence (Professional Pathway)
    { text: "Become a certified nutritionist today", expectedCat: "Professional Pathway", expectedType: "Content" },
    // 6. Strong Rule Precedence (Lifestyle)
    { text: "Daily wellness routine tips", expectedCat: "Lifestyle", expectedType: "Content" }
];

console.log("--- Question Category Improvement Validation ---");
let passCount = 0;
testCases.forEach(tc => {
    const res = classifySignal(tc.text);
    const catPass = res.primary_category === tc.expectedCat;
    const typePass = res.signal_type === tc.expectedType;
    const allPass = catPass && typePass;
    
    if (allPass) passCount++;
    
    console.log(`[${allPass ? 'PASS' : 'FAIL'}] "${tc.text}"`);
    console.log(`  Expected: ${tc.expectedCat} / ${tc.expectedType}`);
    console.log(`  Actual:   ${res.primary_category} / ${res.signal_type}`);
});

console.log(`\nResults: ${passCount}/${testCases.length} Passed`);

// Determinism Check
const sample = "How do I become a nutritionist?";
const res1 = classifySignal(sample);
const res2 = classifySignal(sample);
const deterministic = JSON.stringify(res1) === JSON.stringify(res2);
console.log(`Deterministic: ${deterministic ? 'YES' : 'NO'}`);
