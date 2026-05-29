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

export function normalizeTikTokItem(rawItem: any): L2IngestRequest | null {
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
    const authorId = rawItem.author_id || (rawItem.author && typeof rawItem.author === 'object' ? rawItem.author.id || rawItem.author.secUid : '') || rawItem.authorMeta?.id || '';
    
    // Ensure source_url is always built
    let sourceUrl = rawItem.webVideoUrl || rawItem.videoUrl || rawItem.tiktokLink || '';
    if (!sourceUrl && (rawItem.id || rawItem.video_id)) {
        const id = rawItem.id || rawItem.video_id;
        // Construct from handle if available, else generic
        const handle = (rawItem.author && typeof rawItem.author === 'object' ? rawItem.author.uniqueId : '') || authorName || 'video';
        sourceUrl = `https://www.tiktok.com/@${handle.replace('@', '')}/video/${id}`;
    }

    // 1. Source Provenance Guard
    if (authorName === 'unknown' || !authorName || !sourceUrl || !sourceUrl.includes('tiktok.com') || sourceUrl.includes('@unknown/') || sourceUrl.includes('@video/')) {
        console.log(JSON.stringify({
            event: "signal_rejected_missing_source",
            timestamp: new Date().toISOString(),
            source: "tiktok",
            signal_id: rawItem.id || rawItem.video_id,
            author_username: authorName,
            source_url: sourceUrl,
            reason: "missing_source_provenance",
            status: "rejected"
        }));
        return null;
    }

    // 2. Synthetic & Fallback Identity Filter (T03.x Follow-up)
    const isSynthetic = authorName.toLowerCase().includes('synthetic') || 
                        authorName.toLowerCase().includes('unknown') || 
                        sourceUrl.toLowerCase().includes('@synthetic') || 
                        sourceUrl.toLowerCase().includes('@unknown');

    if (isSynthetic) {
        console.log(JSON.stringify({
            event: "signal_rejected_synthetic_source",
            timestamp: new Date().toISOString(),
            source: "tiktok",
            signal_id: rawItem.id || rawItem.video_id,
            author_username: authorName,
            source_url: sourceUrl,
            reason: "synthetic_source_identity",
            status: "rejected"
        }));
        return null;
    }


    let discussion_metadata: any = undefined;
    
    // S14-T02: Bounded Foundational Discussion-Layer
    if (rawItem.discussion_metadata || rawItem.discussion_source_type || rawItem.comment_id) {
        const d = rawItem.discussion_metadata || {};
        const discussion_source_type = rawItem.discussion_source_type || d.discussion_source_type || (rawItem.reply_id ? 'reply' : 'comment');
        const discussion_depth = Number(rawItem.discussion_depth || d.discussion_depth || (discussion_source_type === 'reply' ? 2 : 1));
        
        // Locked depth boundary: max 2 levels traversal check
        if (discussion_depth > 2) {
            console.log(JSON.stringify({
                event: "signal_rejected_discussion_depth_limit",
                timestamp: new Date().toISOString(),
                signal_id: rawItem.id || rawItem.video_id || rawItem.comment_id,
                discussion_depth,
                reason: "depth_limit_exceeded",
                status: "rejected"
            }));
            return null;
        }

        const parent_post_url = rawItem.parent_post_url || d.parent_post_url || sourceUrl || '';
        const comment_id = rawItem.comment_id || d.comment_id || rawItem.id || '';
        const reply_id = rawItem.reply_id || d.reply_id;
        const author_handle = rawItem.author_handle || d.author_handle || authorName || '';
        const discussion_author = rawItem.discussion_author || d.discussion_author || author_handle || '';
        const discussion_context_excerpt = rawItem.discussion_context_excerpt || d.discussion_context_excerpt || text.substring(0, 100);

        // Perform Source-Type & Intent Qualification
        const { refineDiscussion } = require('./intent_refinement');
        const refinement = refineDiscussion(text, rawItem.id || rawItem.video_id);

        discussion_metadata = {
            source_kind: discussion_source_type,
            discussion_source_type,
            discussion_depth,
            parent_post_url,
            comment_id,
            reply_id,
            author_handle,
            discussion_author,
            discussion_context_excerpt,
            source_type: refinement.source_type,
            source_type_reason: refinement.source_type_reason,
            discussion_tags: refinement.discussion_tags,
            qualification_reason: refinement.qualification_reason,
            matched_phrase: refinement.matched_phrase,
            conflict_resolved: refinement.conflict_resolved,
            conflict_resolution: refinement.conflict_resolution
        };
    }

    const canonicalSignal: any = {
        source: "tiktok",
        text: text,
        author: authorName,
        author_id: authorId,
        timestamp: rawItem.createTimeISO || (rawItem.createTime ? new Date(Number(rawItem.createTime) * 1000).toISOString() : new Date().toISOString()),
        tags: Array.isArray(rawItem.hashtags) 
            ? rawItem.hashtags.map((h: any) => typeof h === 'string' ? h : (h.name || h.title)) 
            : [],
        source_url: sourceUrl,
        metrics: {
            likes: rawItem.diggCount || rawItem.stats?.diggCount || 0,
            comments: rawItem.commentCount || rawItem.stats?.commentCount || 0
        }
    };

    if (discussion_metadata) {
        canonicalSignal.discussion_metadata = discussion_metadata;
    }

    const ingestRequest: any = {
        correlation_id: `corr-tk-${Date.now()}-${rawItem.id || rawItem.video_id}`,
        signal_id: rawItem.id || rawItem.video_id,
        source: 'tiktok',
        raw_text: text,
        metadata: canonicalSignal
    };

    if (discussion_metadata) {
        ingestRequest.discussion_metadata = discussion_metadata;
    }

    return ingestRequest;
}
