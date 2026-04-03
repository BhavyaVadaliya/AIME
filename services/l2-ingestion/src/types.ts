import { z } from 'zod';

export const L2IngestRequestSchema = z.object({
    correlation_id: z.string(),
    signal_id: z.string(),
    source: z.string(),
    raw_text: z.string().min(1, 'raw_text must not be empty'),
    metadata: z.record(z.any()).optional(),
});

export type L2IngestRequest = z.infer<typeof L2IngestRequestSchema>;

export interface SignalClassification {
    primary_category: string;
    signal_type: string;
    context_tags: string[];
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
    classification?: SignalClassification;
    governance_route?: {
        queue: 'low_risk' | 'higher_risk';
        routing_basis: {
            primary_category: string;
            signal_type: string;
        }
    }
}
