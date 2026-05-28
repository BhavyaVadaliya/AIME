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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_TAB_INFO') {
        sendResponse({ tabId: sender.tab.id });
        return;
    }

    if (message.type === 'LOG_EVENT') {
        logEvent(message.event, message.data);
        // If it's an injection update, update the session status in storage
        if (message.event === 'execution_injection_succeeded' || message.event === 'execution_injection_failed') {
            const status = message.event === 'execution_injection_succeeded' ? 'injection_succeeded' : 'injection_failed';
            chrome.storage.local.get(null, (items) => {
                const sessionId = Object.keys(items).find(key => items[key]?.signal_id === message.data.signal_id);
                if (sessionId) {
                    const session = items[sessionId];
                    session.status = status;
                    if (message.data.reason) session.reason = message.data.reason;
                    chrome.storage.local.set({ [sessionId]: session });
                }
            });
        }
        return;
    }

    if (message.type === 'GET_SESSION_STATUS') {
        chrome.storage.local.get(message.session_id, (result) => {
            sendResponse(result[message.session_id]);
        });
        return true;
    }

    if (message.type === 'GET_ACTIVE_SESSION_IDENTITY') {
        chrome.storage.local.get(message.session_id, (result) => {
            const session = result[message.session_id];
            if (session && session.tab_id) {
                chrome.tabs.sendMessage(session.tab_id, { type: 'GET_ACTIVE_IDENTITY' }, (res) => {
                    if (chrome.runtime.lastError) {
                        // The tab exists, but the content script isn't responding yet
                        sendResponse({ status: 'script_not_attached' });
                    } else {
                        sendResponse({ status: res?.identity ? 'connected' : 'not_detected', username: res?.identity });
                    }
                });
            } else {
                // No tab has been bound to this session yet
                sendResponse({ status: 'no_tab' });
            }
        });
        return true;
    }
});




chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {

    console.log('[AIME] Message received from dashboard:', message);

    if (message.type === 'PING') {
        sendResponse({ status: 'ok', version: '0.1.0' });
        return;
    }

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

        // 3. Open Source Tab
        chrome.tabs.create({ url: payload.source_url }, (tab) => {
            const sessionId = `exec-${payload.signal_id}-${Date.now()}`;
            const session = {
                session_id: sessionId,
                signal_id: payload.signal_id,
                tab_id: tab.id,
                status: 'tab_opened',
                payload: payload,
                expires_at: payload.expires_at
            };

            chrome.storage.local.set({ [sessionId]: session }, () => {
                logEvent('execution_session_created', { signal_id: payload.signal_id, session_id: sessionId });
                logEvent('execution_tab_bound', { signal_id: payload.signal_id, tab_id: tab.id });
                sendResponse({ status: 'tab_opened', session_id: sessionId });
            });
        });

        return true; // Keep channel open for async sendResponse
    }

    if (message.type === 'GET_SESSION_STATUS') {
        chrome.storage.local.get(message.session_id, (result) => {
            sendResponse(result[message.session_id] || { status: 'extension_unavailable' });
        });
        return true;
    }

    if (message.type === 'GET_ACTIVE_SESSION_IDENTITY') {
        chrome.storage.local.get(message.session_id, (result) => {
            const session = result[message.session_id];
            if (session && session.tab_id) {
                chrome.tabs.sendMessage(session.tab_id, { type: 'GET_ACTIVE_IDENTITY' }, (res) => {
                    if (chrome.runtime.lastError) {
                        sendResponse({ status: 'script_not_attached' });
                    } else {
                        sendResponse({ status: res?.identity ? 'connected' : 'not_detected', username: res?.identity });
                    }
                });
            } else {
                sendResponse({ status: 'no_tab' });
            }
        });
        return true;
    }
});
