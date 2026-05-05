import { ExecutionPayload, ExecutionValidationResult, ExecutionPlatform, ExecutionAction } from '../types/execution';

/**
 * Sprint 12 Minimal Execution Engine
 * Adheres to S12-T01 constraints: Validation, Normalization, and Staging ONLY.
 */

const STAGING_KEY = 'aime_staged_execution';

export const validateExecutionPayload = (payload: ExecutionPayload): ExecutionValidationResult => {
    const errors: string[] = [];

    if (!payload.signal_id) errors.push('missing_signal_id');
    
    if (payload.platform !== 'tiktok') {
        return { ok: false, reason: 'unsupported_execution_target' };
    }

    if (payload.action !== 'comment_reply') {
        return { ok: false, reason: 'unsupported_execution_target' };
    }

    if (!payload.source_url || !payload.source_url.startsWith('http')) {
        errors.push('missing_source_url');
    }

    if (!payload.reply_text || payload.reply_text.trim().length === 0) {
        errors.push('empty_reply_text');
    }

    if (!payload.created_at) errors.push('missing_created_at');

    if (!payload.expires_at) {
        errors.push('missing_expires_at');
    } else if (new Date(payload.expires_at) <= new Date()) {
        errors.push('payload_expired');
    }

    if (errors.length > 0) {
        logLifecycle('execution_payload_invalid', { signal_id: payload.signal_id, errors });
        return { ok: false, reason: errors[0], errors };
    }

    logLifecycle('execution_payload_validated', { signal_id: payload.signal_id, status: 'ok' });
    return { ok: true };
};

export const createExecutionPayload = (
    signalId: string,
    platform: string,
    action: string,
    sourceUrl: string,
    replyText: string,
    sourcePostId?: string
): ExecutionPayload => {
    const now = new Date();
    const expiry = new Date(now.getTime() + 10 * 60000); // Default 10 minutes

    const payload: ExecutionPayload = {
        signal_id: signalId,
        platform: platform as ExecutionPlatform,
        action: action as ExecutionAction,
        source_url: sourceUrl,
        source_post_id: sourcePostId,
        reply_text: replyText,
        created_at: now.toISOString(),
        expires_at: expiry.toISOString()
    };

    logLifecycle('execution_payload_created', { signal_id: signalId, platform });
    return payload;
};

export const stageExecutionPayload = (payload: ExecutionPayload): void => {
    try {
        sessionStorage.setItem(STAGING_KEY, JSON.stringify(payload));
        logLifecycle('execution_payload_staged', { 
            signal_id: payload.signal_id, 
            platform: payload.platform,
            action: payload.action,
            timestamp: new Date().toISOString(),
            status: 'ok' 
        });
    } catch (error) {
        console.error('Failed to stage execution payload:', error);
    }
};

export const getStagedExecutionPayload = (): ExecutionPayload | null => {
    const data = sessionStorage.getItem(STAGING_KEY);
    return data ? JSON.parse(data) : null;
};

/**
 * Structured Lifecycle Logging
 */
const logLifecycle = (event: string, data: any) => {
    const logEntry = {
        service: 'execution_controller',
        version: 'S12-T01',
        event,
        timestamp: new Date().toISOString(),
        ...data
    };
    
    // Console-safe structured log as requested
    console.log(`[Lifecycle] ${event.toUpperCase()}:`, JSON.stringify(logEntry, null, 2));
};
