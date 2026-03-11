import fs from 'fs';
import path from 'path';
import axios from 'axios';
import readline from 'readline';

const L2_URL = process.env.L2_URL || 'http://localhost:3001';
const RTCE_URL = process.env.RTCE_URL || 'http://localhost:3002';
const SAMPLES_PATH = path.join(__dirname, 'samples', 'samples.jsonl');

interface Sample {
    signal_id: string;
    source: string;
    raw_text: string;
    metadata?: any;
}

async function run() {
    console.log("Starting Acceptance Harness...");

    if (!fs.existsSync(SAMPLES_PATH)) {
        console.error(`Samples file not found at ${SAMPLES_PATH}`);
        process.exit(1);
    }

    const fileStream = fs.createReadStream(SAMPLES_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const results: any[] = [];
    let passed = true;
    let count = 0;

    for await (const line of rl) {
        if (!line.trim()) continue;
        count++;
        const sample: Sample = JSON.parse(line);
        const correlation_id = `corr-${Date.now()}-${count}`;
        const result: any = {
            sample_id: sample.signal_id,
            steps: {},
            status: 'PASS',
            errors: []
        };

        console.log(`[${sample.signal_id}] Processing...`);

        try {
            // Step 1: Call L2
            const l2Payload = { ...sample, correlation_id };
            const l2Response = await axios.post(`${L2_URL}/v1/l2/ingest`, l2Payload);

            if (l2Response.status !== 200) throw new Error(`L2 returned ${l2Response.status}`);
            const l2Bundle = l2Response.data;

            // Assertions L2
            if (!l2Bundle.context_summary) throw new Error("L2: context_summary is empty");
            if (l2Bundle.correlation_id !== correlation_id) throw new Error("L2: correlation_id mismatch");

            result.steps.l2 = "OK";

            // Step 2: Call RTCE
            const rtcePayload = {
                correlation_id,
                signal_id: sample.signal_id,
                raw_text: sample.raw_text,
                l2_bundle: l2Bundle,
                policy_mode: "human-supervised"
            };

            const rtceResponse = await axios.post(`${RTCE_URL}/v1/rtce/decide`, rtcePayload);
            if (rtceResponse.status !== 200) throw new Error(`RTCE returned ${rtceResponse.status}`);
            const routeDecision = rtceResponse.data;

            // Assertions RTCE
            if (!routeDecision.route) throw new Error("RTCE: route is empty");
            if (routeDecision.correlation_id !== correlation_id) throw new Error("RTCE: correlation_id mismatch");
            if (!routeDecision.decision_trace?.matched_rules?.length) throw new Error("RTCE: matched_rules empty");

            // Policy Check Assertion
            if (l2Bundle.flags && l2Bundle.flags.includes("policy_risk_high")) {
                if (!["escalate_human", "reject_policy"].includes(routeDecision.route)) {
                    throw new Error(`Policy Assertion Failed: High Risk flag but route is ${routeDecision.route}`);
                }
            }

            result.steps.rtce = "OK";
            result.route = routeDecision.route;

        } catch (err: any) {
            result.status = 'FAIL';
            result.errors.push(err.message || String(err));
            passed = false;
            console.error(`[${sample.signal_id}] FAILED: ${err.message}`);
        }

        results.push(result);
    }

    // Output Report
    console.log("\n--- Run Report ---");
    console.log(JSON.stringify(results, null, 2));

    if (passed) {
        console.log("\n>>> OVERALL STATUS: PASS <<<");
        process.exit(0);
    } else {
        console.log("\n>>> OVERALL STATUS: FAIL <<<");
        process.exit(1);
    }
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
