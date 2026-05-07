export interface ExecutionPayload {
    signal_id: string;
    platform: 'tiktok';
    action: 'comment_reply';
    source_url: string;
    source_post_id: string;
    reply_text: string;
    created_at: string;
    expires_at: string;
}

export type SessionStatus = 
    | 'payload_received' 
    | 'payload_invalid' 
    | 'session_staged' 
    | 'tab_opened' 
    | 'payload_expired' 
    | 'unsupported_execution_target';

export interface ExecutionSession {
    session_id: string;
    signal_id: string;
    tab_id: number | null;
    payload: ExecutionPayload;
    status: SessionStatus;
    created_at: string;
    expires_at: string;
}
