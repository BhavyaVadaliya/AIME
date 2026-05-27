import { refineIntent } from "./ingestion/tiktok/intent_refinement";
import { SignalScorer } from "./scoring/signal_scorer";
import { PriorityTierMapper } from "./scoring/priority_tier_mapper";
import { SignalClassification } from "./types";

interface MockSignal {
  signal_id: string;
  raw_text: string;
  primary_category?: string;
  signal_type?: string;
}

const testSignals: MockSignal[] = [
  // 1. Pure Creator Suppression (Funnel + Outbound CTA)
  {
    signal_id: "sig-pure-creator",
    raw_text: "Join my course today! Reserve your spot and book a call with me. Link in bio.",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },
  // 2. Authority Broadcasting Suppression
  {
    signal_id: "sig-authority-broadcast",
    raw_text: "I teach people how to build a business with my framework and proven system.",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },
  // 3. Pure Personal Exploration (Single intent category)
  {
    signal_id: "sig-pure-exploration",
    raw_text: "I'm looking for a new career program.",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },
  // 4. Multi-Signal Exploration Boost (Uncertainty + Transition + Recommendation)
  {
    signal_id: "sig-multi-exploration",
    raw_text: "I am burned out and need a change. Does anyone recommend a certification or course?",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },
  // 5. Mixed Intent Conflict Override (Creator indicators + Personal indicators present)
  {
    signal_id: "sig-mixed-intent-override",
    raw_text: "I want to switch careers. Any recommendations for programs? Tap the link to see my journey.",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  }
];

async function runSourceTypeTests() {
  console.log("==========================================================");
  console.log("    AIME S13-T08 SOURCE-TYPE REFINE CALIBRATION TESTS     ");
  console.log("==========================================================");

  const scorer = new SignalScorer();
  const mapper = new PriorityTierMapper();

  let failedTests = 0;

  for (const sig of testSignals) {
    console.log(`\nTesting Signal: [${sig.signal_id}]`);
    console.log(`Text: "${sig.raw_text}"`);

    // Step 1-4: Intent Refinement
    const refResult = refineIntent(sig.raw_text, sig.signal_id);
    console.log("Classification result:", JSON.stringify(refResult, null, 2));

    const classification: SignalClassification = {
      primary_category: refResult.category === 'creator_marketing_candidate' ? 'Promotion' : 'Monetization',
      signal_type: sig.signal_type || 'Comment',
      context_tags: refResult.matched_tags || []
    };

    // Step 5: Scoring
    const scoreResult = scorer.computeScore(sig.signal_id, classification);
    console.log(`Scored: ${scoreResult.score}`);

    // Step 5: Priority Mapping
    const tier = mapper.mapTier(sig.signal_id, classification, scoreResult.score);
    console.log(`Mapped Tier: ${tier}`);

    // Assertions
    if (sig.signal_id === "sig-pure-creator") {
      const isSuppressed = refResult.matched_tags?.includes("commercial_seller_suppressed");
      const isLowPriority = tier === "LOW";
      const isLowScore = scoreResult.score === 1;
      if (isSuppressed && isLowPriority && isLowScore) {
        console.log("✅ Pure Creator Suppression Test PASS");
      } else {
        console.log("❌ Pure Creator Suppression Test FAIL");
        failedTests++;
      }
    }

    if (sig.signal_id === "sig-authority-broadcast") {
      const isSuppressed = refResult.matched_tags?.includes("commercial_seller_suppressed");
      const isLowPriority = tier === "LOW";
      const isLowScore = scoreResult.score === 1;
      if (isSuppressed && isLowPriority && isLowScore) {
        console.log("✅ Authority Broadcasting Suppression Test PASS");
      } else {
        console.log("❌ Authority Broadcasting Suppression Test FAIL");
        failedTests++;
      }
    }

    if (sig.signal_id === "sig-pure-exploration") {
      const isElevated = refResult.matched_tags?.includes("personal_exploration_candidate");
      const isMedPriority = tier === "MEDIUM";
      const isScore6 = scoreResult.score === 6;
      if (isElevated && isMedPriority && isScore6) {
        console.log("✅ Pure Personal Exploration Test PASS");
      } else {
        console.log("❌ Pure Personal Exploration Test FAIL");
        failedTests++;
      }
    }

    if (sig.signal_id === "sig-multi-exploration") {
      const isElevated = refResult.matched_tags?.includes("multi_signal_exploration_boost");
      const isHighPriority = tier === "HIGH";
      const isScore8 = scoreResult.score === 8;
      if (isElevated && isHighPriority && isScore8) {
        console.log("✅ Multi-Signal Exploration Boost Test PASS");
      } else {
        console.log("❌ Multi-Signal Exploration Boost Test FAIL");
        failedTests++;
      }
    }

    if (sig.signal_id === "sig-mixed-intent-override") {
      const isPreserved = refResult.matched_tags?.includes("personal_exploration_candidate") && !refResult.matched_tags?.includes("commercial_seller_suppressed");
      const isElevated = tier === "MEDIUM" || tier === "HIGH";
      const isScoreElevated = scoreResult.score >= 6;
      if (isPreserved && isElevated && isScoreElevated) {
        console.log("✅ Mixed Intent Conflict Override Test PASS");
      } else {
        console.log("❌ Mixed Intent Conflict Override Test FAIL");
        failedTests++;
      }
    }
  }

  console.log("\n==========================================================");
  if (failedTests === 0) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  } else {
    console.log(`💥 ${failedTests} TESTS FAILED.`);
    process.exit(1);
  }
  console.log("==========================================================");
}

runSourceTypeTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
