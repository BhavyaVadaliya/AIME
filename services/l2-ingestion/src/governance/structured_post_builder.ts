import { L2Bundle, SignalClassification } from '../types';
import { SignalScorer } from '../scoring/signal_scorer';
import { PriorityTierMapper, PriorityTier } from '../scoring/priority_tier_mapper';

const scorer = new SignalScorer();
const mapper = new PriorityTierMapper();

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
    signal_score?: {
        score: number;
        category_weight: number;
        type_adjustment: number;
        pattern_boost: number;
    };
    priority_tier?: PriorityTier;
    source?: {
        platform: string;
        username: string;
        author_id: string;
        source_url: string;
        timestamp: string;
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
        const signal_score = scorer.computeScore(bundle.signal_id, bundle.classification!);
        const priority_tier = mapper.mapTier(bundle.signal_id, bundle.classification!, signal_score?.score);

        const source = {
            platform: bundle.source || 'unknown',
            username: bundle.metadata?.author || 'unknown',
            author_id: bundle.metadata?.author_id || 'unknown',
            source_url: bundle.metadata?.source_url || '',
            timestamp: bundle.metadata?.timestamp || new Date().toISOString()
        };

        const structured_post: StructuredPost = {
            raw_text: rawText,
            classification: bundle.classification!,
            governance_route: bundle.governance_route!,
            signal_score,
            priority_tier,
            source
        };

        const augmentedBundle = {
            ...bundle,
            structured_post
        };

        // Source Visibility Verification Log
        console.log(JSON.stringify({
            event: "source_visibility_attached",
            signal_id: bundle.signal_id,
            platform: source.platform,
            username: source.username,
            has_url: !!source.source_url,
            status: "ok"
        }));

        // Consistency Logging
        console.log(JSON.stringify({
            event: "structured_post_created",
            timestamp: new Date().toISOString(),
            signal_id: bundle.signal_id,
            correlation_id: bundle.correlation_id,
            queue: bundle.governance_route?.queue,
            status: "ok"
        }));

        return augmentedBundle;
    }
}
