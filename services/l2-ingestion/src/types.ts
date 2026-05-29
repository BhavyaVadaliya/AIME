import { z } from 'zod';

export const L2IngestRequestSchema = z.object({
    correlation_id: z.string(),
    signal_id: z.string(),
    source: z.string(),
    raw_text: z.string().min(1, 'raw_text must not be empty'),
    metadata: z.record(z.any()).optional(),
    discussion_metadata: z.any().optional(),
});

export type L2IngestRequest = z.infer<typeof L2IngestRequestSchema>;

export interface SignalClassification {
    primary_category: string;
    signal_type: string;
    context_tags: string[];
}

export interface SignalSource {
    platform: string;
    username: string;
    author_id: string;
    source_url: string;
    timestamp: string;
}

export interface DiscussionMetadata {
    source_kind: 'comment' | 'reply';
    discussion_source_type: 'comment' | 'reply';
    discussion_depth: number;
    parent_post_url: string;
    comment_id: string;
    reply_id?: string;
    author_handle: string;
    discussion_author: string;
    discussion_context_excerpt: string;
    source_type: 'help_seeker' | 'recommendation_seeker' | 'transition_seeker' | 'experience_sharer' | 'creator_seller' | 'discussion_noise';
    source_type_reason: string;
    discussion_tags: string[];
    qualification_reason: string;
    matched_phrase?: string;
}

export interface L2Bundle {
    correlation_id: string;
    signal_id: string;
    l2_version: string;
    topics: string[];
    subtopics: string[];
    context_summary: string;
    entities: string[];
    confidence: number;
    flags: string[];
    source?: string;
    metadata?: any;
    classification?: SignalClassification;
    discussion_metadata?: DiscussionMetadata;
    governance_route?: {
        queue: 'low_risk' | 'higher_risk';
        routing_basis: {
            primary_category: string;
            signal_type: string;
        }
    };
    structured_post?: {
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
        priority_tier?: 'HIGH' | 'MEDIUM' | 'LOW';
        source?: SignalSource;
        discussion_metadata?: DiscussionMetadata;
    };
    approval_status?: {
        state: 'approved' | 'revoked' | 'pending';
        approved_at?: string;
        revoked_at?: string;
        approved_by?: string;
        revoked_by?: string;
        reversible: boolean;
    };
}
