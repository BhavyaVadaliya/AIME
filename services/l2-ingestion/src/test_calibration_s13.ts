import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';

async function runS13CalibrationTest() {
    load_gime_v0_1();
    console.log("=================================================================");
    console.log("       AIME S13-T01 SELLER & PROMOTER CALIBRATION TEST           ");
    console.log("=================================================================");

    const signals: L2IngestRequest[] = [
        {
            signal_id: "sig-seller-bio",
            correlation_id: "corr-s13-1",
            source: "tiktok",
            raw_text: "Join my coaching program now! Click the link in bio.",
            metadata: {}
        },
        {
            // Category B: Outbound Certification Promotion
            signal_id: "sig-promoter-business",
            correlation_id: "corr-s13-2",
            source: "tiktok",
            raw_text: "Become certified today and start your coaching business!",
            metadata: {}
        },
        {
            // Safeguard: Dietitian path curiosity
            signal_id: "sig-preservation-dietitian",
            correlation_id: "corr-s13-3",
            source: "tiktok",
            raw_text: "How do I become a dietitian? I want to change careers.",
            metadata: {}
        },
        {
            // Mixed-Signal Protection: Nurse looking for side income + seller link
            signal_id: "sig-mixed-safeguard",
            correlation_id: "corr-s13-4",
            source: "tiktok",
            raw_text: "I’m a nurse looking for a side income in nutrition - link in bio to join my program",
            metadata: {}
        }
    ];

    for (const req of signals) {
        console.log(`\n-----------------------------------------------------------------`);
        console.log(`INPUT SIGNAL ID: ${req.signal_id}`);
        console.log(`RAW TEXT: "${req.raw_text}"`);
        
        const bundle = processL2Request(req);
        const sp = bundle.structured_post;
        
        if (!sp) {
            console.log("❌ ERROR: structured_post not built.");
            continue;
        }

        const tags = sp.classification.context_tags || [];
        const score = sp.signal_score?.score;
        const tier = sp.priority_tier;

        console.log(`\nCALIBRATION OUTCOME:`);
        console.log(`- Mapped Category: ${sp.classification.primary_category}`);
        console.log(`- Signal Type:     ${sp.classification.signal_type}`);
        console.log(`- Context Tags:    [${tags.join(', ')}]`);
        console.log(`- Signal Score:    ${score} (Weight reduction check: ${score === 1 ? '🔴 DEPRIORITIZED/CAPPED' : '🟢 HIGH VALUE'})`);
        console.log(`- Priority Tier:   ${tier} (Visibility level: ${tier === 'LOW' ? '🔴 LOW (SUPPRESSED)' : '🟢 HIGH/MEDIUM (PRESERVED)'})`);
        
        // Assertions
        if (req.signal_id === 'sig-seller-bio') {
            if (tags.includes('seller_candidate') && score === 1 && tier === 'LOW') {
                console.log("Result: ✅ PASS (Seller contamination correctly suppressed)");
            } else {
                console.log("Result: ❌ FAIL");
            }
        } else if (req.signal_id === 'sig-promoter-business') {
            if (tags.includes('promoter_candidate') && score === 1 && tier === 'LOW') {
                console.log("Result: ✅ PASS (Outbound promoter contamination correctly suppressed)");
            } else {
                console.log("Result: ❌ FAIL");
            }
        } else if (req.signal_id === 'sig-preservation-dietitian') {
            if (tags.includes('prospect_candidate') && score !== 1 && tier !== 'LOW') {
                console.log("Result: ✅ PASS (Genuine prospect successfully preserved)");
            } else {
                console.log("Result: ❌ FAIL");
            }
        } else if (req.signal_id === 'sig-mixed-safeguard') {
            if (tags.includes('prospect_candidate') && score !== 1) {
                console.log("Result: ✅ PASS (Mixed-signal protected and preserved)");
            } else {
                console.log("Result: ❌ FAIL");
            }
        }

    }
    console.log("\n=================================================================");
}

runS13CalibrationTest().catch(e => console.error(e));
