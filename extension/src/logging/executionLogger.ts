export type ExecutionEvent = 
    | 'execution_payload_staged'
    | 'execution_session_created'
    | 'execution_tab_bound'
    | 'content_script_attached'
    | 'content_script_not_attached'
    | 'tiktok_dom_ready'
    | 'execution_injection_attempted'
    | 'execution_injection_succeeded'
    | 'execution_injection_failed'
    | 'execution_fallback_shown'
    | 'active_session_detected'
    | 'active_session_not_detected';

export function logEvent(event: ExecutionEvent, data: any) {
    const logEntry = {
        event,
        ...data,
        timestamp: new Date().toISOString()
    };
    console.log('[AIME-LOG]', JSON.stringify(logEntry));
    
    // Optionally store logs in storage for dashboard retrieval
    chrome.storage.local.get(['logs'], (result) => {
        const logs = result.logs || [];
        logs.push(logEntry);
        chrome.storage.local.set({ logs: logs.slice(-100) }); // Keep last 100
    });
}
