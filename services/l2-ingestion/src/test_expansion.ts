import { RelatedContentExporter } from './discovery_expanded/related';
import { CommentExtractor } from './discovery_expanded/comments';

// Mock seed signal with comments and related videos
const mockSeed = {
    id: "seed_123",
    video_id: "seed_123",
    text: "Parent video about nutrition",
    author: "expert_nutritionist",
    comments: [
        { id: "c1", content: "How do I become a dietitian?", user: "user_a" },
        { id: "c2", content: "Great tips! Cost?", user: "user_b" }
    ],
    suggested_vids: [
        { id: "rel_1", text: "Related clinical course", author: "uni_health" }
    ]
};

console.log("=== GIME Expanded Discovery Test (S10-T04 + S10-T05) ===");

const relatedExporter = new RelatedContentExporter();
const commentExtractor = new CommentExtractor();

const related = relatedExporter.expand(mockSeed);
const comments = commentExtractor.extract(mockSeed);

console.log(`\nSeed Signal: ${mockSeed.id}`);
console.log(`Related items found: ${related.length}`);
console.log(`Comments extracted: ${comments.length}`);

// Diversity Check
const allSignals = [mockSeed, ...related, ...comments];
console.log("\n--- Expansion Signal Pool ---");
allSignals.forEach(s => {
    console.log(`ID: ${s.id}, Text: "${s.text || s.content}", Origin: ${s.discovery_origin || 'seed'}`);
});

// Determinism Check for Classification (using logic.ts)
import { processL2Request } from './logic';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';
import { L2IngestRequest } from './types';

load_gime_v0_1();

console.log("\n--- Classification Determinism Check ---");
const commentSignal = {
    correlation_id: "corr_1",
    signal_id: "c1",
    source: "tiktok",
    raw_text: "How do I become a dietitian?"
};

const run1 = processL2Request(commentSignal);
const run2 = processL2Request(commentSignal);

const isDeterministic = JSON.stringify(run1.classification) === JSON.stringify(run2.classification);
console.log(`Signal: "${commentSignal.raw_text}"`);
console.log(`Primary Category: ${run1.classification?.primary_category}`);
console.log(`Signal Type: ${run1.classification?.signal_type}`);
console.log(`Deterministic: ${isDeterministic ? 'PASS' : 'FAIL'}`);
