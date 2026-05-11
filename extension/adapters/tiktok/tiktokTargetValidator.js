// TikTok Target Validator
// Ensures injection only occurs on the bound post.

export function validateTikTokTarget(currentUrl, payload) {
    if (!payload) return { ok: false, reason: 'no_session_payload' };
    
    // 1. Platform check
    if (payload.platform !== 'tiktok') return { ok: false, reason: 'platform_mismatch' };

    // 2. Empty/Whitespace text check
    if (!payload.reply_text || payload.reply_text.trim().length === 0) {
        return { ok: false, reason: 'empty_reply_text' };
    }

    // 3. URL/PostID check
    const extractId = (url) => {
        if (!url) return null;
        const match = url.match(/\/video\/(\d+)/) || url.match(/\/v\/(\d+)/);
        return match ? match[1] : null;
    };

    const currentId = extractId(currentUrl);
    const targetId = payload.source_post_id || extractId(payload.source_url);

    if (!currentId || currentId !== targetId) {
        return { ok: false, reason: 'wrong_post' };
    }

    // 4. Expiry check
    if (new Date(payload.expires_at) < new Date()) {
        return { ok: false, reason: 'payload_expired' };
    }

    return { ok: true };
}

