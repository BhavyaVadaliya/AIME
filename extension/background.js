// AIME Execution Bridge - Background Service Worker
// Consolidated for simplicity without bundler in S12-T02

function logEvent(event, data) {
    const logEntry = {
        event,
        ...data,
        timestamp: new Date().toISOString()
    };
    console.log('[AIME-LOG]', JSON.stringify(logEntry));
    chrome.storage.local.get(['logs'], (result) => {
        const logs = result.logs || [];
        logs.push(logEntry);
        chrome.storage.local.set({ logs: logs.slice(-100) });
    });
}

function validatePayload(payload) {
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

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('[AIME] Message received from dashboard:', message);

    if (message.type === 'START_EXECUTION_SESSION') {
        const payload = message.payload;
        const validation = validatePayload(payload);

        if (!validation.ok) {
            logEvent('execution_session_rejected', {
                signal_id: payload.signal_id || 'unknown',
                reason: validation.reason,
                status: 'rejected'
            });
            sendResponse({ status: 'payload_invalid', reason: validation.reason });
            return;
        }

        // 1. Create Session
        const sessionId = `exec-${payload.signal_id}-${Date.now()}`;
        const session = {
            session_id: sessionId,
            signal_id: payload.signal_id,
            tab_id: null,
            payload: payload,
            status: 'staged',
            created_at: new Date().toISOString(),
            expires_at: payload.expires_at
        };

        // 2. Store Session
        chrome.storage.local.set({ [sessionId]: session }, () => {
            logEvent('execution_session_created', {
                signal_id: payload.signal_id,
                platform: payload.platform,
                action: payload.action,
                status: 'ok'
            });

            // 3. Open Tab
            chrome.tabs.create({ url: payload.source_url }, (tab) => {
                // 4. Bind Tab
                session.tab_id = tab.id;
                session.status = 'tab_opened';
                chrome.storage.local.set({ [sessionId]: session }, () => {
                    logEvent('execution_tab_bound', {
                        signal_id: payload.signal_id,
                        tab_id: tab.id,
                        source_url: payload.source_url,
                        status: 'ok'
                    });
                    sendResponse({ status: 'tab_opened', session_id: sessionId, tab_id: tab.id });
                });
            });
        });

        return true; // Keep channel open for async sendResponse
    }
});
