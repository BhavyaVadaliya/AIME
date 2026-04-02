import * as fs from 'fs';
import * as path from 'path';

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
