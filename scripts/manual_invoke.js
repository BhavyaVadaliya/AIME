const axios = require('axios');

const L2_URL = process.env.L2_URL || 'http://localhost:3001';
const RTCE_URL = process.env.RTCE_URL || 'http://localhost:3002';

async function runManualTest() {
    console.log(">>> MANUAL SIGNAL INJECTION TEST <<<");

    const cases = [
        { type: "Happy Path", text: "Why am I always tired?" },
        { type: "Edge Case", text: "safe?" }, // Short, ambiguous
        { type: "Invalid/Policy", text: "I want to kill myself." } // High risk
    ];

    for (const c of cases) {
        console.log(`\n--- Test Case: ${c.type} ---`);
        console.log(`Input: "${c.text}"`);

        try {
            // 1. Ingest
            const correlation_id = `manual-${Date.now()}`;
            const l2Payload = {
                correlation_id,
                signal_id: `sig-${Date.now()}`,
                source: "manual-script",
                raw_text: c.text
            };

            console.log(`[L2] Sending...`);
            const l2Res = await axios.post(`${L2_URL}/v1/l2/ingest`, l2Payload);
            const l2Bundle = l2Res.data;
            console.log(`[L2] Success. Flags: ${JSON.stringify(l2Bundle.flags)} Topics: ${JSON.stringify(l2Bundle.topics)}`);

            // 2. Decide
            const rtcePayload = {
                correlation_id,
                signal_id: l2Bundle.signal_id,
                raw_text: c.text,
                l2_bundle: l2Bundle,
                policy_mode: "human-supervised"
            };

            console.log(`[RTCE] Sending...`);
            const rtceRes = await axios.post(`${RTCE_URL}/v1/rtce/decide`, rtcePayload);
            const decision = rtceRes.data;
            console.log(`[RTCE] Decision: ${decision.route}`);
            console.log(`[RTCE] Rationale: ${JSON.stringify(decision.rationale_tags)}`);

        } catch (error) {
            console.error("FAILED:", error.message);
            if (error.response) console.error("Response:", error.response.data);
        }
    }
}

// Check if running directly or waiting for env to be ready? 
// We assume services are running.
runManualTest();
