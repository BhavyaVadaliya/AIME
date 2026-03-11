import { L2IngestRequest } from '../../types';

export interface RawTikTokItem {
    id: string;
    createTime?: number | string;
    text: string;
    author?: any;
    stats?: any;
    videoUrl?: string;
}

export function normalizeTikTokItem(rawItem: Partial<RawTikTokItem>): L2IngestRequest {
    if (!rawItem.id) {
        throw new Error("Missing required field: id");
    }
    if (!rawItem.text || rawItem.text.trim() === '') {
        throw new Error("Missing required field: text");
    }

    return {
        correlation_id: `corr-tk-${Date.now()}-${rawItem.id}`,
        signal_id: rawItem.id,
        source: 'tiktok',
        raw_text: rawItem.text,
        metadata: {
            lang: 'en',
            channel: 'tiktok',
        }
    };
}
