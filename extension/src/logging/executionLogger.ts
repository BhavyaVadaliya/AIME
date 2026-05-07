export function logEvent(event: string, data: any) {
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
