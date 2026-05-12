// AIME Extension Bridge Utility
// Handles communication between the Dashboard and the Chrome Extension

const EXTENSION_ID = 'jkvputvonklwobezlxav'; // This will be updated with actual ID during local testing

export interface ExtensionResponse {
    status: 'payload_received' | 'payload_invalid' | 'session_staged' | 'tab_opened' | 'payload_expired' | 'unsupported_execution_target' | 'extension_unavailable';
    session_id?: string;
    tab_id?: number;
    reason?: string;
}

export async function startExecutionSession(payload: any): Promise<ExtensionResponse> {
    if (!window.chrome || !window.chrome.runtime) {
        return { status: 'extension_unavailable' };
    }

    try {
        const response = await new Promise<any>((resolve) => {
            // We use the configured extension ID from manifest
            chrome.runtime.sendMessage(EXTENSION_ID, {
                type: 'START_EXECUTION_SESSION',
                payload
            }, (res) => {
                if (chrome.runtime.lastError) {
                    console.warn('[ExtensionBridge] Send error:', chrome.runtime.lastError);
                    resolve({ status: 'extension_unavailable' });
                } else {
                    resolve(res);
                }
            });
        });

        return response;
    } catch (error) {
        console.error('[ExtensionBridge] Fatal error:', error);
        return { status: 'extension_unavailable' };
    }
}

export async function getSessionStatus(sessionId: string): Promise<any> {
    if (!window.chrome || !window.chrome.runtime) {
        return { status: 'extension_unavailable' };
    }

    return new Promise((resolve) => {
        chrome.runtime.sendMessage(EXTENSION_ID, {
            type: 'GET_SESSION_STATUS',
            session_id: sessionId
        }, (res) => {
            if (chrome.runtime.lastError) {
                resolve({ status: 'extension_unavailable' });
            } else {
                resolve(res);
            }
        });
    });
}

export async function getActiveSessionIdentity(sessionId: string): Promise<any> {
    if (!window.chrome || !window.chrome.runtime) {
        return { status: 'unavailable' };
    }

    return new Promise((resolve) => {
        chrome.runtime.sendMessage(EXTENSION_ID, {
            type: 'GET_ACTIVE_SESSION_IDENTITY',
            session_id: sessionId
        }, (res) => {
            if (chrome.runtime.lastError) {
                resolve({ status: 'unavailable' });
            } else {
                resolve(res);
            }
        });
    });
}


