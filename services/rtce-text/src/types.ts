import { z } from 'zod';

// Replicating L2Bundle schema for input validation
export const L2BundleSchema = z.object({
    l2_version: z.string(),
    topics: z.array(z.string()),
    subtopics: z.array(z.string()),
    context_summary: z.string(),
    entities: z.array(z.string()),
    confidence: z.number(),
    flags: z.array(z.string()),
});

export const RTCEDecideRequestSchema = z.object({
    correlation_id: z.string(),
    signal_id: z.string(),
    raw_text: z.string(),
    l2_bundle: L2BundleSchema,
    policy_mode: z.string(),
});

export type RTCEDecideRequest = z.infer<typeof RTCEDecideRequestSchema>;

export interface RouteDecision {
    correlation_id: string;
    signal_id: string;
    rtce_version: string;
    route: string;
    rationale_tags: string[];
    decision_trace: {
        matched_rules: string[];
        notes: string;
    };
}
