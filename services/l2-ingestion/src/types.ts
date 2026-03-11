import { z } from 'zod';

export const L2IngestRequestSchema = z.object({
    correlation_id: z.string(),
    signal_id: z.string(),
    source: z.string(),
    raw_text: z.string().min(1, 'raw_text must not be empty'),
    metadata: z.object({
        lang: z.string(),
        channel: z.string().optional(),
        partner_id: z.string().optional(),
    }).optional(),
});

export type L2IngestRequest = z.infer<typeof L2IngestRequestSchema>;

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
}
