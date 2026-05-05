export type ExecutionPlatform = 'tiktok';
export type ExecutionAction = 'comment_reply';

export interface ExecutionPayload {
    signal_id: string;
    platform: ExecutionPlatform;
    action: ExecutionAction;
    source_url: string;
    source_post_id?: string;
    reply_text: string;
    created_at: string;
    expires_at: string;
}

export interface ExecutionValidationResult {
    ok: boolean;
    reason?: string;
    errors?: string[];
}

export interface ExecutionState {
    status: 'idle' | 'validating' | 'ready' | 'staged' | 'error';
    payload: ExecutionPayload | null;
    error?: string;
}
