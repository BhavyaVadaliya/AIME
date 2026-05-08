// TikTok Target Validator
// Ensures injection only occurs on the bound post.

export function validateTikTokTarget(currentUrl, payload) {
    if (!payload) return { ok: false, reason: 'no_session_payload' };
    
    // 1. Platform check
    if (payload.platform !== 'tiktok') return { ok: false, reason: 'platform_mismatch' };

    // 2. URL/PostID check
    // Normalize URLs to compare IDs
    const extractId = (url) => {
        const match = url.match(/\/video\/(\d+)/);
        return match ? match[1] : null;
    };

    const currentId = extractId(currentUrl);
    const targetId = payload.source_post_id || extractId(payload.source_url);

    if (!currentId || currentId !== targetId) {
        return { ok: false, reason: 'post_id_mismatch' };
    }

    // 3. Expiry check
    if (new Date(payload.expires_at) < new Date()) {
        return { ok: false, reason: 'payload_expired' };
    }

    return { ok: true };
}
