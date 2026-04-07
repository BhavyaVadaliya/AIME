import { BulkApprover } from './governance/bulk_approval';
import { L2Bundle } from './types';

function runValidation() {
    console.log("=== GIME Bulk Approval Test (S10-T11) ===");

    const approver = new BulkApprover();

    // Mock initial state: 1 low_risk, 1 higher_risk
    const samples: L2Bundle[] = [
        {
            correlation_id: "test-low",
            signal_id: "sig-low",
            l2_version: "v0",
            topics: ["education"],
            subtopics: [],
            context_summary: "Test education",
            entities: [],
            confidence: 1.0,
            flags: [],
            classification: { primary_category: "Education", signal_type: "Content", context_tags: [] },
            governance_route: { queue: "low_risk", routing_basis: { primary_category: "Education", signal_type: "Content" } }
        },
        {
            correlation_id: "test-high",
            signal_id: "sig-high",
            l2_version: "v0",
            topics: ["monetization"],
            subtopics: [],
            context_summary: "Test promo",
            entities: [],
            confidence: 1.0,
            flags: [],
            classification: { primary_category: "Monetization", signal_type: "Offer", context_tags: [] },
            governance_route: { queue: "higher_risk", routing_basis: { primary_category: "Monetization", signal_type: "Offer" } }
        }
    ];

    // 1. EXECUTE BULK APPROVAL
    console.log("\n--- Executing Bulk Approval ---");
    const { augmented, result } = approver.approveBatch(samples, 'human_operator');

    console.log(`\nRequested Count: ${result.requested_count}`);
    console.log(`Approved Count:  ${result.approved_count}`);
    console.log(`Rejected Count:  ${result.rejected_count}`);
    
    // Check signal status
    const lowSignal = augmented.find(s => s.signal_id === 'sig-low');
    const highSignal = augmented.find(s => s.signal_id === 'sig-high');

    console.log(`\nLow-Risk Approved:  ${lowSignal?.approval_status?.state === 'approved' ? 'PASS' : 'FAIL'}`);
    console.log(`Higher-Risk Ignored: ${highSignal?.approval_status === undefined ? 'PASS' : 'FAIL'}`);
    if (result.rejected_ids[0]?.reason === 'not_low_risk_queue') {
        console.log(`Rejection Reason Correct: PASS`);
    }

    // 2. EXECUTE REVERSAL (REVOKE)
    console.log("\n--- Executing Reversal (Revoke) ---");
    if (lowSignal) {
        const revoked = approver.revoke(lowSignal, 'human_operator_revoker');
        console.log(`State after revoke: ${revoked.approval_status?.state}`);
        console.log(`Revoke confirmed:   ${revoked.approval_status?.state === 'revoked' ? 'PASS' : 'FAIL'}`);
        console.log(`Traceability kept:  ${revoked.approval_status?.approved_at ? 'PASS' : 'FAIL'}`);
    }

    // 3. NO DRIFT (Ensure classification and routing objects are unchanged)
    console.log("\n--- Integrity Check (No Drift) ---");
    const originalClass = JSON.stringify(samples[0].classification);
    const finalClass = JSON.stringify(lowSignal?.classification);
    console.log(`Classification drift check: ${originalClass === finalClass ? 'PASS' : 'FAIL'}`);
}

runValidation();
