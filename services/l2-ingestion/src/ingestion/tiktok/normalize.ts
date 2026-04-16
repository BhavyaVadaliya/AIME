import { L2IngestRequest } from '../../types';

export interface RawTikTokItem {
    id: string;
    videoDescription?: string;
    authorMeta?: {
        name?: string;
    };
    createTime?: number | string;
    hashtags?: any[];
    webVideoUrl?: string;
    diggCount?: number;
    commentCount?: number;
}

export function normalizeTikTokItem(rawItem: any): L2IngestRequest {
    if (!rawItem.id && !rawItem.video_id) {
        throw new Error("Missing required field: id");
    }

    // Support multiple possible field names for the post text
    const text = rawItem.text || rawItem.videoDescription || rawItem.contents || rawItem.desc || '';
    if (text.trim() === '') {
        throw new Error("Missing required field: text (videoDescription)");
    }

    // Support multiple possible author formats
    let authorName = 'unknown';
    if (rawItem.author) {
        authorName = typeof rawItem.author === 'string' ? rawItem.author : (rawItem.author.nickname || rawItem.author.uniqueId || rawItem.author.name || 'unknown');
    } else if (rawItem.authorMeta) {
        authorName = rawItem.authorMeta.name || rawItem.authorMeta.nickName || 'unknown';
    } else if (rawItem.nickname) {
        authorName = rawItem.nickname;
    }

    // Mapping to AIME Canonical Signal Object
    const canonicalSignal = {
        source: "tiktok",
        text: text,
        author: authorName,
        timestamp: rawItem.createTimeISO || (rawItem.createTime ? new Date(Number(rawItem.createTime) * 1000).toISOString() : new Date().toISOString()),
        tags: Array.isArray(rawItem.hashtags) 
            ? rawItem.hashtags.map((h: any) => typeof h === 'string' ? h : (h.name || h.title)) 
            : [],
        source_url: rawItem.webVideoUrl || rawItem.videoUrl || rawItem.tiktokLink || '',
        metrics: {
            likes: rawItem.diggCount || rawItem.stats?.diggCount || 0,
            comments: rawItem.commentCount || rawItem.stats?.commentCount || 0
        }
    };

    return {
        correlation_id: `corr-tk-${Date.now()}-${rawItem.id || rawItem.video_id}`,
        signal_id: rawItem.id || rawItem.video_id,
        source: 'tiktok',
        raw_text: text,
        metadata: canonicalSignal
    };
}
