import { normalizeTikTokItem } from './ingestion/tiktok/normalize';
import { refineDiscussion } from './ingestion/tiktok/intent_refinement';
import { processL2Request } from './logic';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';

async function runDiscussionHarnessTests() {
  load_gime_v0_1();
  
  console.log("==========================================================");
  console.log("   AIME S14-T02 DISCUSSION-LAYER DISCOVERY INFRA HARNESS   ");
  console.log("==========================================================");

  let failedCount = 0;

  // 1. Comment & Reply Depth Limits
  console.log("\n--- TEST Group 1: Discussion Sourcing Depth Limits ---");
  
  const commentSample = {
    id: "comment-123",
    text: "Can someone help me with career options?",
    author: "user_a",
    discussion_source_type: "comment",
    discussion_depth: 1,
    parent_post_url: "https://tiktok.com/@video/1"
  };

  const replySample = {
    id: "reply-234",
    text: "Here's what worked for me in transition.",
    author: "user_b",
    discussion_source_type: "reply",
    discussion_depth: 2,
    parent_post_url: "https://tiktok.com/@video/1"
  };

  const deepReplySample = {
    id: "reply-345",
    text: "Same, I also want to know.",
    author: "user_c",
    discussion_source_type: "reply",
    discussion_depth: 3, // EXCEEDS 2 LEVEL MAXIMUM DEPTH CAP
    parent_post_url: "https://tiktok.com/@video/1"
  };

  const normComment = normalizeTikTokItem(commentSample);
  if (normComment && normComment.discussion_metadata?.discussion_depth === 1) {
    console.log("✅ Comment Depth 1 normalization: PASS");
  } else {
    console.log("❌ Comment Depth 1 normalization: FAIL");
    failedCount++;
  }

  const normReply = normalizeTikTokItem(replySample);
  if (normReply && normReply.discussion_metadata?.discussion_depth === 2) {
    console.log("✅ Reply Depth 2 normalization: PASS");
  } else {
    console.log("❌ Reply Depth 2 normalization: FAIL");
    failedCount++;
  }

  const normDeepReply = normalizeTikTokItem(deepReplySample);
  if (normDeepReply === null) {
    console.log("✅ Depth 3+ traversal rejection boundary: PASS");
  } else {
    console.log("❌ Depth 3+ traversal rejection boundary: FAIL");
    failedCount++;
  }

  // 2. Source-Type Dictionaries & Categorizations
  console.log("\n--- TEST Group 2: Source-Type Classification ---");

  const testCases = [
    {
      text: "I need help starting my dietitian career path.",
      expectedType: "help_seeker",
      expectedTags: ["help_seeker", "help_seeking"]
    },
    {
      text: "Any recommendations for which certification to take?",
      expectedType: "recommendation_seeker",
      expectedTags: ["recommendation_seeker", "recommendation_seeking"]
    },
    {
      text: "Thinking about leaving bedside nursing because I am burned out.",
      expectedType: "transition_seeker",
      expectedTags: ["transition_seeker", "transition_language", "burnout_language"]
    },
    {
      text: "Here's what worked for me when I switched last year.",
      expectedType: "experience_sharer",
      expectedTags: ["experience_sharer"]
    },
    {
      text: "DM me to join my course and boost your nurse salary.",
      expectedType: "creator_seller",
      expectedTags: ["creator_seller"]
    },
    {
      text: "Wow great post, so true!",
      expectedType: "discussion_noise",
      expectedTags: ["discussion_noise"]
    }
  ];

  testCases.forEach((tc, idx) => {
    console.log(`\nEvaluating Case ${idx + 1}: "${tc.text}"`);
    const ref = refineDiscussion(tc.text, `test-sig-${idx}`);
    console.log(`Qualified Source Type: ${ref.source_type}`);
    console.log(`Matched Phrase: "${ref.matched_phrase || ''}"`);
    console.log(`Discussion Tags: ${ref.discussion_tags.join(', ')}`);

    const hasExpectedType = ref.source_type === tc.expectedType;
    const hasTags = tc.expectedTags.every(t => ref.discussion_tags.includes(t));

    if (hasExpectedType && hasTags) {
      console.log(`✅ Case ${idx + 1} Classification: PASS`);
    } else {
      console.log(`❌ Case ${idx + 1} Classification: FAIL`);
      failedCount++;
    }
  });

  // 3. Mixed-Intent Protection
  console.log("\n--- TEST Group 3: Mixed-Intent Protection ---");
  const mixedSample = {
    id: "mixed-123",
    text: "I'm considering switching to nutrition coaching, DM me if you've done it.",
    author: "real_user_mixed",
    discussion_source_type: "comment",
    discussion_depth: 1,
    parent_post_url: "https://tiktok.com/@video/1"
  };

  console.log("Evaluating Mixed Intent: 'considering' (exploration) + 'DM me' (creator/seller)");
  const normMixed = normalizeTikTokItem(mixedSample);
  if (normMixed && normMixed.discussion_metadata) {
    const meta = normMixed.discussion_metadata;
    console.log(`Resolved Source Type: ${meta.source_type}`);
    console.log(`Conflict Resolved: ${meta.conflict_resolved}`);
    console.log(`Reason: ${meta.source_type_reason}`);

    if (meta.conflict_resolved && meta.source_type === 'transition_seeker') {
      console.log("✅ Mixed intent conflict resolution safeguard: PASS");
    } else {
      console.log("❌ Mixed intent conflict resolution safeguard: FAIL");
      failedCount++;
    }
  } else {
    console.log("❌ Mixed intent normalization: FAIL");
    failedCount++;
  }

  // 4. Elevation & Suppression Calibration
  console.log("\n--- TEST Group 4: Visibility Elevation & Suppression ---");

  // A. Elevated Seeker Comment
  console.log("\nIngesting elevated Seeker Comment...");
  const qualifiedIngest = normalizeTikTokItem({
    id: "seeker-comment-555",
    text: "I need help leaving bedside nursing, what should I do?",
    author: "struggling_nurse",
    discussion_source_type: "comment",
    discussion_depth: 1,
    parent_post_url: "https://tiktok.com/@video/1"
  });

  if (qualifiedIngest) {
    const bundle = processL2Request(qualifiedIngest);
    const score = bundle.structured_post?.signal_score?.score || 0;
    const tier = bundle.structured_post?.priority_tier;
    console.log(`Elevated Seeker - Priority Tier: ${tier}, Score: ${score}`);
    
    if (score >= 6 && (tier === 'MEDIUM' || tier === 'HIGH')) {
      console.log("✅ Qualified Seeker Elevation calibration: PASS");
    } else {
      console.log("❌ Qualified Seeker Elevation calibration: FAIL");
      failedCount++;
    }
  }

  // B. Suppressed Creator Promotion
  console.log("\nIngesting suppressed Creator Promotion...");
  const creatorIngest = normalizeTikTokItem({
    id: "creator-comment-666",
    text: "Link in bio to join my course and study my coaching program!",
    author: "course_promoter",
    discussion_source_type: "comment",
    discussion_depth: 1,
    parent_post_url: "https://tiktok.com/@video/1"
  });

  if (creatorIngest) {
    const bundle = processL2Request(creatorIngest);
    const score = bundle.structured_post?.signal_score?.score || 0;
    const tier = bundle.structured_post?.priority_tier;
    console.log(`Suppressed Creator - Priority Tier: ${tier}, Score: ${score}`);

    if (score === 1 && tier === 'LOW') {
      console.log("✅ Outbound Creator Suppression calibration: PASS");
    } else {
      console.log("❌ Outbound Creator Suppression calibration: FAIL");
      failedCount++;
    }
  }

  // C. Suppressed Noise Comment
  console.log("\nIngesting suppressed Noise Comment...");
  const noiseIngest = normalizeTikTokItem({
    id: "noise-comment-777",
    text: "Wow this post is so true, great post!",
    author: "casual_user",
    discussion_source_type: "comment",
    discussion_depth: 1,
    parent_post_url: "https://tiktok.com/@video/1"
  });

  if (noiseIngest) {
    const bundle = processL2Request(noiseIngest);
    const score = bundle.structured_post?.signal_score?.score || 0;
    const tier = bundle.structured_post?.priority_tier;
    console.log(`Suppressed Noise - Priority Tier: ${tier}, Score: ${score}`);

    if (score === 1 && tier === 'LOW') {
      console.log("✅ Discussion Noise Suppression calibration: PASS");
    } else {
      console.log("❌ Discussion Noise Suppression calibration: FAIL");
      failedCount++;
    }
  }

  console.log("\n==========================================================");
  if (failedCount === 0) {
    console.log("🎉 ALL DISCUSSION-LAYER SOURCING INFRA HARNESS TESTS PASS!");
  } else {
    console.log(`💥 ${failedCount} DISCUSSION-LAYER HARNESS TESTS FAILED.`);
    process.exit(1);
  }
  console.log("==========================================================");
}

runDiscussionHarnessTests().catch(err => {
  console.error("Test suite execution failed:", err);
  process.exit(1);
});
