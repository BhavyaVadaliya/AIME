// TikTok Desktop Web Selectors - Sprint 12 MVP
// Narrow selector discipline enforced.

export const TIKTOK_SELECTORS = {
    // Primary: The specific contenteditable used for comments and replies
    PRIMARY_COMMENT_INPUT: '[data-e2e="comment-input"] [contenteditable="true"]',
    
    // Fallback: A broader but still bounded contenteditable in the comment area
    FALLBACK_COMMENT_INPUT: '[contenteditable="true"][role="textbox"]'
};
