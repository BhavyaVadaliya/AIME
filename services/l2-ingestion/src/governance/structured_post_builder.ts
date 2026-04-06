import { L2Bundle, SignalClassification } from '../types';
import { GovernanceRoute } from './governance_router';

export interface StructuredPost {
    raw_text: string;
    classification: SignalClassification;
    governance_route: {
        queue: string;
        routing_basis: {
            primary_category: string;
            signal_type: string;
        }
    };
}

/**
 * Structured Post Builder (S10-T10).
 * Standardizes signal representation for governance review.
 * Preserves all classification and routing metadata exactly.
 */
export class StructuredPostBuilder {
    /**
     * Constructs a structured_post object and appends it to the signal bundle.
     */
    build(bundle: L2Bundle, rawText: string): L2Bundle {
        const structured_post: StructuredPost = {
            raw_text: rawText,
            classification: bundle.classification!,
            governance_route: bundle.governance_route!
        };

        const augmentedBundle = {
            ...bundle,
            structured_post
        };

        // Consistency Logging
        console.log(JSON.stringify({
            event: "structured_post_created",
            timestamp: new Date().toISOString(),
            signal_id: bundle.signal_id,
            queue: bundle.governance_route?.queue,
            status: "ok"
        }));

        return augmentedBundle;
    }
}
