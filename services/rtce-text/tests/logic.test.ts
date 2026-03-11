import { processRTCEDecision } from '../src/logic';
import { RTCEDecideRequest } from '../src/types';

describe('RTCE Logic', () => {
    const baseReq: RTCEDecideRequest = {
        correlation_id: 'test-c',
        signal_id: 'test-s',
        raw_text: 'test',
        policy_mode: 'standard',
        l2_bundle: {
            l2_version: 'v0',
            topics: [],
            subtopics: [],
            context_summary: 'test',
            entities: [],
            confidence: 1.0,
            flags: []
        }
    };

    test('rejects high policy risk', () => {
        const result = processRTCEDecision({
            ...baseReq,
            l2_bundle: { ...baseReq.l2_bundle, flags: ['policy_risk_high'] }
        });
        expect(result.route).toBe('reject_policy');
        expect(result.rationale_tags).toContain('risk_detected');
    });

    test('escalates health topics', () => {
        const result = processRTCEDecision({
            ...baseReq,
            l2_bundle: { ...baseReq.l2_bundle, topics: ['health'] }
        });
        expect(result.route).toBe('escalate_human');
    });

    test('clarifies safety topics', () => {
        const result = processRTCEDecision({
            ...baseReq,
            l2_bundle: { ...baseReq.l2_bundle, topics: ['safety'] }
        });
        expect(result.route).toBe('clarify');
    });

    test('educates on general topics', () => {
        const result = processRTCEDecision({
            ...baseReq,
            l2_bundle: { ...baseReq.l2_bundle, topics: ['general'] }
        });
        expect(result.route).toBe('educate');
    });
});
