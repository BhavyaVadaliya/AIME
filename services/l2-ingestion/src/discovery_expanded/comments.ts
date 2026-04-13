import * as fs from 'fs';
import * as path from 'path';
import { isInternalAccount } from '../ingestion/tiktok/internal_exclusion';

export interface CommentExtractionExpansion {
    extract(seedSignal: any): any[];
}

/**
 * S10-T05: Comment-Level Extraction
 * Extracts comments from discovered TikTok posts to find hidden intent/questions.
 */
export class CommentExtractor implements CommentExtractionExpansion {
    private maxComments: number;

    constructor() {
        const configPath = path.join(__dirname, '..', '..', '..', '..', 'config', 'discovery', 'expansion.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        this.maxComments = config.max_comments_per_post || 10;
    }

    /**
     * Extracts comment signals from a parent post.
     * Maps them to a signal format compatible with normal normalization.
     */
    extract(seedSignal: any): any[] {
        const comments: any[] = [];
        const parentId = seedSignal.id || seedSignal.video_id;

        // Extraction focus: 'comments' or 'comment_list' in raw TikTok scraper metadata
        const rawComments = seedSignal.comments || seedSignal.comment_list || [];
        
        // Take up to maxComments from the parent
        for (const comment of rawComments.slice(0, this.maxComments)) {
            if (isInternalAccount(comment.author || comment.user || comment.nickname || comment.author_name)) {
                let authorName = '';
                let authorId = '';
                const author = comment.author || comment.user || comment.nickname || comment.author_name;
                if (typeof author === 'string') { authorName = author; }
                else if (author && typeof author === 'object') {
                    authorName = author.uniqueId || author.username || author.nickname || author.name || author.secUid || '';
                    authorId = author.id || author.user_id || author.secUid || author.uid || '';
                }
                console.log(JSON.stringify({
                    event: "signal_excluded_internal",
                    timestamp: new Date().toISOString(),
                    source: "tiktok",
                    author_username: authorName.replace('@', ''),
                    author_id: authorId || "unknown",
                    reason: "internal_account",
                    status: "ok"
                }));
                continue;
            }

            // Normalize into a format compatible with TikTok normalization logic
            comments.push({
                ...comment,
                discovery_origin: 'comment_expansion',
                parent_id: parentId,
                // Ensure text is present for normalization
                text: comment.text || comment.content || comment.comment_text
            });
        }

        if (comments.length > 0) {
            console.log(JSON.stringify({
                event: "expanded_comment_extraction",
                parent_signal_id: parentId,
                comments_extracted: comments.length,
                timestamp: new Date().toISOString(),
                status: "ok"
            }));
        }

        return comments;
    }
}
