import { L2Bundle } from '../types';

export interface ApprovalStatus {
    state: 'approved' | 'revoked' | 'pending';
    approved_at?: string;
    revoked_at?: string;
    approved_by?: string;
    revoked_by?: string;
    reversible: boolean;
}

export interface BulkApprovalResult {
    requested_count: number;
    approved_count: number;
    rejected_count: number;
    approved_ids: string[];
    rejected_ids: { id: string; reason: string }[];
}

/**
 * Bulk Approval Module (S10-T11).
 * Handles controlled, reversible approvals for low-risk signals only.
 * No external execution or automated posting.
 */
export class BulkApprover {
    /**
     * Approves a batch of signals if they are in the low_risk queue.
     */
    approveBatch(bundles: L2Bundle[], operator: string = 'system_user'): { augmented: L2Bundle[], result: BulkApprovalResult } {
        let approved_count = 0;
        let rejected_count = 0;
        const approved_ids: string[] = [];
        const rejected_ids: { id: string; reason: string }[] = [];
        
        const augmented = bundles.map(bundle => {
            const queue = bundle.governance_route?.queue;
            
            if (queue === 'low_risk') {
                approved_count++;
                approved_ids.push(bundle.signal_id);
                
                const approval_status: ApprovalStatus = {
                    state: 'approved',
                    approved_at: new Date().toISOString(),
                    approved_by: operator,
                    reversible: true
                };

                // Traceability Log
                console.log(JSON.stringify({
                    event: "signal_approved",
                    timestamp: new Date().toISOString(),
                    signal_id: bundle.signal_id,
                    queue: "low_risk",
                    approved_by: operator,
                    status: "ok"
                }));

                return { ...bundle, approval_status };
            } else {
                rejected_count++;
                rejected_ids.push({ id: bundle.signal_id, reason: 'not_low_risk_queue' });
                return bundle; // No approval status added
            }
        });

        const result: BulkApprovalResult = {
            requested_count: bundles.length,
            approved_count,
            rejected_count,
            approved_ids,
            rejected_ids
        };

        // Bulk Operation Log
        console.log(JSON.stringify({
            event: "bulk_approval_executed",
            timestamp: new Date().toISOString(),
            requested_count: result.requested_count,
            approved_count: result.approved_count,
            rejected_count: result.rejected_count,
            status: "ok"
        }));

        return { augmented, result };
    }

    /**
     * Revokes a previous approval for a specific signal.
     */
    revoke(bundle: L2Bundle, operator: string = 'system_user'): L2Bundle {
        if (!bundle.approval_status || bundle.approval_status.state !== 'approved') {
            return bundle; // Cannot revoke what isn't approved
        }

        const revokedStatus: ApprovalStatus = {
            ...bundle.approval_status,
            state: 'revoked',
            revoked_at: new Date().toISOString(),
            revoked_by: operator
        };

        // Reversal Log
        console.log(JSON.stringify({
            event: "signal_approval_revoked",
            timestamp: new Date().toISOString(),
            signal_id: bundle.signal_id,
            revoked_by: operator,
            status: "ok"
        }));

        return { ...bundle, approval_status: revokedStatus };
    }
}
