export function validatePayload(payload: any): { ok: boolean; reason?: string } {
    if (!payload.signal_id) return { ok: false, reason: 'missing_signal_id' };
    if (payload.platform !== 'tiktok') return { ok: false, reason: 'unsupported_platform' };
    if (payload.action !== 'comment_reply') return { ok: false, reason: 'unsupported_action' };
    if (!payload.source_url) return { ok: false, reason: 'missing_source_url' };
    if (!payload.reply_text || payload.reply_text.trim().length === 0) return { ok: false, reason: 'empty_reply_text' };
    
    const expiry = new Date(payload.expires_at).getTime();
    if (isNaN(expiry) || expiry < Date.now()) {
        return { ok: false, reason: 'payload_expired' };
    }

    return { ok: true };
}
