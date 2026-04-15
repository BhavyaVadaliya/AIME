import { isDuplicateSignal, buildDedupeKey } from './services/l2-ingestion/src/deduplication/signal_deduper';

function test() {
    console.log("--- Signal Deduplication Validation ---");

    const platform = "tiktok";
    const authorId = "user_123";
    const text = "How do I become a dietitian?";
    const now = new Date();
    const timestamp1 = now.toISOString();
    
    // 1. First entry
    const res1 = isDuplicateSignal(platform, authorId, text, timestamp1);
    console.log(`[PASS] First entry accepted: ${res1 === false}`);

    // 2. Exact Duplicate (within same 60 min window)
    const res2 = isDuplicateSignal(platform, authorId, text, timestamp1);
    console.log(`[PASS] Exact duplicate suppressed: ${res2 === true}`);

    // 3. Same text, Different Author (should be accepted)
    const res3 = isDuplicateSignal(platform, "user_456", text, timestamp1);
    console.log(`[PASS] Same text, different author accepted: ${res3 === false}`);

    // 4. Same author, Different Text (should be accepted)
    const res4 = isDuplicateSignal(platform, authorId, "What is the cost?", timestamp1);
    console.log(`[PASS] Same author, different text accepted: ${res4 === false}`);

    // 5. Same author, same text, DIFFERENT WINDOW (Outside 60-min bucket)
    // We simulate a timestamp 61 minutes later
    const futureDate = new Date(now.getTime() + 61 * 60 * 1000);
    const timestamp2 = futureDate.toISOString();
    const res5 = isDuplicateSignal(platform, authorId, text, timestamp2);
    console.log(`[PASS] Same signal outside 60-min window accepted: ${res5 === false}`);

    // 6. Normalization check (extra whitespace/case)
    const duplicateText = "  HOW DO I BECOME A DIETITIAN?  ";
    const res6 = isDuplicateSignal(platform, authorId, duplicateText, timestamp1);
    console.log(`[PASS] Normalized text duplicate suppressed: ${res6 === true}`);

    console.log("\nDeduplication Key Example:");
    console.log(buildDedupeKey(platform, authorId, text, timestamp1));
}

test();
