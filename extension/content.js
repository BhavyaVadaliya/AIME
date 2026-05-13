// AIME TikTok Adapter Content Script - S12-T03
// This script runs on tiktok.com and handles the draft injection.

const TIKTOK_SELECTORS = {
    PRIMARY_COMMENT_INPUT: '[data-e2e="comment-input"] [contenteditable="true"]',
    FALLBACK_COMMENT_INPUT: '[contenteditable="true"][role="textbox"]',
    PROFILE_LINK: '[data-e2e="nav-profile"], a[href*="/@"]'
};

function getActiveIdentity() {
    try {
        const profileEl = document.querySelector(TIKTOK_SELECTORS.PROFILE_LINK);
        if (profileEl) {
            const href = profileEl.getAttribute('href');
            if (href && href.includes('/@')) {
                const handle = href.split('/@')[1].split('?')[0];
                return handle ? `@${handle}` : null;
            }
        }
    } catch (e) {
        console.error('[AIME] Identity detection error:', e);
    }
    return null;
}


async function injectText(input, text) {
    if (!text || text.trim().length === 0) return { ok: false, stage: 'inject', reason: 'empty_reply_text' };
    if (text.length > 1000) return { ok: false, stage: 'inject', reason: 'text_too_long' };

    try {
        input.focus();
        // S12-T05: Strict use of insertText command only. No Enter/Submit simulation.
        document.execCommand('insertText', false, text);

        
        // Dispatch events to ensure TikTok's React state updates
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        return { ok: true, stage: 'inject' };
    } catch (err) {
        return { ok: false, stage: 'inject', reason: err.message };
    }
}

async function startInjectionLoop() {
    console.log('[AIME] TikTok Adapter activated.');

    // 1. Get Session from Storage
    const storage = await chrome.storage.local.get(null);
    const sessions = Object.values(storage).filter(s => s?.status === 'tab_opened');
    
    if (sessions.length === 0) {
        console.log('[AIME] No active execution session found.');
        return;
    }

    // Identify the session bound to THIS tab
    // We send a message to background to get our own tabId
    const response = await chrome.runtime.sendMessage({ type: 'GET_TAB_INFO' });
    const myTabId = response?.tabId;
    
    const session = sessions.find(s => s.tab_id === myTabId);
    if (!session) {
        console.warn('[AIME] This tab is not bound to an execution session. Safety block active.');
        return;
    }

    // 2. Target Validation (Hardened)
    const payload = session.payload;
    const currentUrl = window.location.href;
    
    const extractId = (url) => {
        if (!url) return null;
        const match = url.match(/\/video\/(\d+)/) || url.match(/\/v\/(\d+)/);
        return match ? match[1] : null;
    };

    const currentId = extractId(currentUrl);
    const targetId = payload.source_post_id || extractId(payload.source_url);

    if (currentId !== targetId) {
        handleFailure(session, 'wrong_post');
        return;
    }

    if (new Date(payload.expires_at) < new Date()) {
        handleFailure(session, 'payload_expired');
        return;
    }

    if (!payload.reply_text || payload.reply_text.trim().length === 0) {
        handleFailure(session, 'empty_reply_text');
        return;
    }


    // 3. Page Readiness & Selector Search (Bounded Retry)
    let attempts = 0;
    const maxAttempts = 20;
    const interval = 500;

    const findInput = () => {
        return document.querySelector(TIKTOK_SELECTORS.PRIMARY_COMMENT_INPUT) || 
               document.querySelector(TIKTOK_SELECTORS.FALLBACK_COMMENT_INPUT);
    };

    const loop = setInterval(async () => {
        attempts++;
        const input = findInput();

        if (input) {
            clearInterval(loop);
            
            // S12-T07: Log DOM Readiness
            chrome.runtime.sendMessage({ 
                type: 'LOG_EVENT', 
                event: 'tiktok_dom_ready',
                data: { signal_id: session.signal_id, tab_id: myTabId, status: 'ok' }
            });

            console.log('[AIME] Input found. Attempting injection...');
            
            const result = await injectText(input, payload.reply_text);

            
            if (result.ok) {
                chrome.runtime.sendMessage({ 
                    type: 'LOG_EVENT', 
                    event: 'execution_injection_succeeded',
                    data: { signal_id: session.signal_id, tab_id: myTabId, stage: 'inject' }
                });
                console.log('[AIME] Injection successful. Awaiting operator review.');
            } else {
                handleFailure(session, result.reason || 'Injection failed');
            }
        } else if (attempts >= maxAttempts) {
            clearInterval(loop);
            handleFailure(session, 'comment_input_not_found');
        }
    }, interval);
}

function handleFailure(session, reason) {
    chrome.runtime.sendMessage({ 
        type: 'LOG_EVENT', 
        event: 'execution_injection_failed',
        data: { signal_id: session.signal_id, tab_id: session.tab_id, stage: 'target_validation', reason }
    });

    chrome.runtime.sendMessage({ 
        type: 'LOG_EVENT', 
        event: 'execution_fallback_shown',
        data: { signal_id: session.signal_id, reason }
    });
    
    // Show fallback UI
    showFallbackOverlay(session.payload.reply_text, reason);
}


function showFallbackOverlay(replyText, reason) {
    const overlay = document.createElement('div');
    overlay.id = 'aime-fallback-overlay';
    overlay.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; width: 350px;
        background: #1e293b; border: 2px solid #334155; border-radius: 16px;
        padding: 20px; z-index: 999999; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        color: white; font-family: sans-serif;
    `;

    overlay.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">AIME Manual Fallback</span>
        </div>
        <div style="background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #1e293b; margin-bottom: 16px;">
            <p style="font-size: 13px; margin: 0; color: #f1f5f9;">${replyText}</p>
        </div>
        <p style="font-size: 10px; color: #ef4444; margin-bottom: 8px;">Reason: ${reason}</p>
        <button id="aime-copy-fallback" style="width: 100%; background: #4f46e5; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer;">COPY TO CLIPBOARD</button>
    `;

    document.body.appendChild(overlay);
    document.getElementById('aime-copy-fallback').onclick = () => {
        navigator.clipboard.writeText(replyText);
        document.getElementById('aime-copy-fallback').innerText = 'COPIED!';
    };
}

startInjectionLoop();

// S12-T07: Report script attachment immediately
chrome.runtime.sendMessage({ 
    type: 'LOG_EVENT', 
    event: 'content_script_attached',
    data: { platform: 'tiktok', status: 'ok' }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_ACTIVE_IDENTITY') {
        const identity = getActiveIdentity();
        if (!identity) {
            chrome.runtime.sendMessage({ 
                type: 'LOG_EVENT', 
                event: 'active_session_not_detected',
                data: { platform: 'tiktok', reason: 'profile_element_missing', status: 'not_detected' }
            });
        } else {
            chrome.runtime.sendMessage({ 
                type: 'LOG_EVENT', 
                event: 'active_session_detected',
                data: { platform: 'tiktok', username: identity, status: 'connected' }
            });
        }
        sendResponse({ identity });
        return true;
    }
});


