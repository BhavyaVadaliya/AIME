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

const mockSignals: MockSignal[] = [
  // 1. Pure Boost Category: Self-Referential
  {
    signal_id: "sig-boost-self",
    raw_text: "I am looking to start a new journey in wellness coaching.",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },
  // 2. Pure Boost Category: Frustration
  {
    signal_id: "sig-boost-frust",
    raw_text: "I am burned out at my current bedside nursing shift.",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },
  // 3. Pure Boost Category: Recommendation
  {
    signal_id: "sig-boost-reco",
    raw_text: "Any recommendations for high quality clinical certifications?",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },
  // 4. Pure Boost Category: Help-Seeking
  {
    signal_id: "sig-boost-help",
    raw_text: "Need help figuring out how to transition my career.",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },
  // 5. Pure Boost Category: Career Transition
  {
    signal_id: "sig-boost-trans",
    raw_text: "Thinking about a career transition into clinical nutrition.",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },
  // 6. Pure Boost Category: Exploratory Curiosity
  {
    signal_id: "sig-boost-curious",
    raw_text: "Wondering if it's worth it to invest in a wellness credential.",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },

  // 7. Multi-Signal Boost (Frustration + Transition + Recommendation)
  {
    signal_id: "sig-boost-multi",
    raw_text: "I'm burned out at bedside and looking into a career transition. Any advice?",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },

  // 8. Pure Suppression: Creator marketing
  {
    signal_id: "sig-supp-link",
    raw_text: "Limited spots left in my mentoring cohort! Link in bio.",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },
  // 9. Pure Suppression: Enrollment
  {
    signal_id: "sig-supp-enroll",
    raw_text: "Sign up now for my high ticket coaching program! Book a call.",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },

  // 10. Mixed Intent - Preserved (Self-referential personal exploration)
  {
    signal_id: "sig-mixed-preserve",
    raw_text: "I'm a nurse considering a nutrition certification. Any recommendations? Please don't dm me to sell stuff.",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },

  // 11. Mixed Intent - Suppressed (No personal override, outbound promotion dominant)
  {
    signal_id: "sig-mixed-suppress",
    raw_text: "Nurses, join my coaching program. Link in bio.",
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  }
];

async function runCommercialIntentTests() {
  console.log("=================================================================");
  console.log("    AIME S13-T08 COMMERCIAL-INTENT CALIBRATION TEST SUITE       ");
  console.log("=================================================================");

  const scorer = new SignalScorer();
  const mapper = new PriorityTierMapper();

  const results: any[] = [];
  const logsCollector: string[] = [];

  // Capture console.log for telemetry validation
  const originalLog = console.log;
  console.log = (message?: any, ...optionalParams: any[]) => {
    if (typeof message === "string" && message.startsWith("{")) {
      logsCollector.push(message);
    }
    originalLog(message, ...optionalParams);
  };

  for (const s of mockSignals) {
    console.log(`\n🔍 Inspecting Signal: ${s.signal_id} ("${s.raw_text}")`);
    
    // 1. Refine Intent
    const refinement = refineIntent(s.raw_text, s.signal_id);
    
    // 2. Score Signal
    const classification: SignalClassification = {
      primary_category: s.primary_category || "UNCLASSIFIED",
      signal_type: s.signal_type || "Comment",
      context_tags: refinement.matched_tags || []
    };
    const scoreObj = scorer.computeScore(s.signal_id, classification);
    
    // 3. Map Tier
    const tier = mapper.mapTier(s.signal_id, classification, scoreObj.score);

    results.push({
      signal_id: s.signal_id,
      category: refinement.category,
      tags: refinement.matched_tags || [],
      score: scoreObj.score,
      tier
    });
  }

  // Restore console.log
  console.log = originalLog;

  console.log("\n=================================================================");
  console.log("                        TEST ASSERTIONS                          ");
  console.log("=================================================================");

  // 1. Verify Pure Boosts
  console.log("1. Pure Boost Category Match Assertions:");
  const boostSelf = results.find(r => r.signal_id === "sig-boost-self");
  const boostFrust = results.find(r => r.signal_id === "sig-boost-frust");
  const boostReco = results.find(r => r.signal_id === "sig-boost-reco");
  const boostHelp = results.find(r => r.signal_id === "sig-boost-help");
  const boostTrans = results.find(r => r.signal_id === "sig-boost-trans");
  const boostCurious = results.find(r => r.signal_id === "sig-boost-curious");

  const boostList = [boostSelf, boostFrust, boostReco, boostHelp, boostTrans, boostCurious];
  for (const b of boostList) {
    console.log(`- ${b.signal_id}: tags=[${b.tags.join(", ")}], score=${b.score}, tier=${b.tier}`);
    if (!b.tags.includes("commercial_intent_candidate") || b.score < 6 || b.tier === "LOW") {
      console.error(`❌ ${b.signal_id} failed standard boost conditions!`);
      process.exit(1);
    }
  }
  console.log("✅ Pure boost categories successfully mapped and calibrated!");

  // 2. Verify Multi-Signal Boost
  console.log("\n2. Multi-Signal Boost Assertion:");
  const boostMulti = results.find(r => r.signal_id === "sig-boost-multi");
  console.log(`- sig-boost-multi: tags=[${boostMulti.tags.join(", ")}], score=${boostMulti.score}, tier=${boostMulti.tier}`);
  if (!boostMulti.tags.includes("commercial_intent_multi_signal_boost") || boostMulti.score < 8 || boostMulti.tier !== "HIGH") {
    console.error("❌ sig-boost-multi failed multi-signal boost conditions!");
    process.exit(1);
  }
  console.log("✅ Multi-Signal boost successfully triggered score floor 8 and HIGH priority!");

  // 3. Verify Pure Suppression
  console.log("\n3. Pure Creator/Seller Suppression Assertions:");
  const suppLink = results.find(r => r.signal_id === "sig-supp-link");
  const suppEnroll = results.find(r => r.signal_id === "sig-supp-enroll");

  const suppList = [suppLink, suppEnroll];
  for (const s of suppList) {
    console.log(`- ${s.signal_id}: tags=[${s.tags.join(", ")}], score=${s.score}, tier=${s.tier}`);
    if (!s.tags.includes("creator_marketing_candidate") || s.score > 2 || s.tier !== "LOW") {
      console.error(`❌ ${s.signal_id} failed suppression conditions!`);
      process.exit(1);
    }
  }
  console.log("✅ Pure promotions suppressed with score cap 1-2 and LOW priority!");

  // 4. Verify Mixed-Intent Resolution
  console.log("\n4. Mixed-Intent Resolution Assertions:");
  const mixedPreserve = results.find(r => r.signal_id === "sig-mixed-preserve");
  const mixedSuppress = results.find(r => r.signal_id === "sig-mixed-suppress");

  console.log(`- sig-mixed-preserve (Personal Dominant): tags=[${mixedPreserve.tags.join(", ")}], score=${mixedPreserve.score}, tier=${mixedPreserve.tier}`);
  console.log(`- sig-mixed-suppress (Promo Dominant): tags=[${mixedSuppress.tags.join(", ")}], score=${mixedSuppress.score}, tier=${mixedSuppress.tier}`);

  if (!mixedPreserve.tags.includes("commercial_intent_candidate") || mixedPreserve.score < 6 || mixedPreserve.tier === "LOW") {
    console.error("❌ Mixed-Intent: Personal exploration was incorrectly suppressed!");
    process.exit(1);
  }
  if (!mixedSuppress.tags.includes("creator_marketing_candidate") || mixedSuppress.score > 2 || mixedSuppress.tier !== "LOW") {
    console.error("❌ Mixed-Intent: Outbound promotion was incorrectly elevated!");
    process.exit(1);
  }
  console.log("✅ Mixed-intent conflicts resolved with high-fidelity exploration protection!");

  // 5. Verify Telemetry Logging Event formats
  console.log("\n5. Telemetry Logging Event Verification:");
  console.log("- Telemetry logs collected:");
  console.log(JSON.stringify(logsCollector.map(l => JSON.parse(l)), null, 2));

  const events = logsCollector.map(l => JSON.parse(l));
  const detectEvent = events.find(e => e.event === "commercial_intent_detected");
  const stdBoostEvent = events.find(e => e.event === "commercial_intent_boost_applied");
  const multiBoostEvent = events.find(e => e.event === "commercial_intent_multi_signal_boost_applied");
  const suppEvent = events.find(e => e.event === "creator_marketing_suppressed");
  const conflictEvent = events.find(e => e.event === "commercial_intent_conflict_resolved");

  if (!detectEvent || detectEvent.status !== "ok" || !detectEvent.matched_pattern) {
    console.error("❌ Missing or invalid commercial_intent_detected log schema");
    process.exit(1);
  }
  if (!stdBoostEvent || stdBoostEvent.status !== "ok" || stdBoostEvent.score_floor !== 6) {
    console.error("❌ Missing or invalid commercial_intent_boost_applied log schema");
    process.exit(1);
  }
  if (!multiBoostEvent || multiBoostEvent.status !== "ok" || multiBoostEvent.score_floor !== 8) {
    console.error("❌ Missing or invalid commercial_intent_multi_signal_boost_applied log schema");
    process.exit(1);
  }
  if (!suppEvent || suppEvent.status !== "ok" || !suppEvent.matched_pattern) {
    console.error("❌ Missing or invalid creator_marketing_suppressed log schema");
    process.exit(1);
  }
  if (!conflictEvent || conflictEvent.status !== "ok" || conflictEvent.resolution !== "prospect_preserved") {
    console.error("❌ Missing or invalid commercial_intent_conflict_resolved log schema");
    process.exit(1);
  }
  console.log("✅ All required telemetry log schemas are 100% compliant!");

  // 6. Zero Data Loss Verification
  console.log("\n6. Zero Data Loss Verification:");
  console.log(`- Input mock Signals: ${mockSignals.length}`);
  console.log(`- Evaluated Signals:   ${results.length}`);
  if (mockSignals.length !== results.length) {
    console.error("❌ Data loss occurred during evaluation!");
    process.exit(1);
  }
  console.log("✅ Zero data loss verified successfully!");

  console.log("\n=================================================================");
  console.log("🟢 ALL S13-T08 COMMERCIAL-INTENT CALIBRATION TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

runCommercialIntentTests().catch(e => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
