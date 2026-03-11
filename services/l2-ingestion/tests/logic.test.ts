import { processL2Request } from '../src/logic';
import { L2IngestRequest } from '../src/types';
import { load_gime_v0_1 } from '../src/lens/gime_mapping_loader';

describe('L2 Logic', () => {
    beforeAll(() => {
        load_gime_v0_1();
    });
    const baseReq: L2IngestRequest = {
        correlation_id: 'test-c',
        signal_id: 'test-s',
        source: 'test',
        raw_text: '',
    };

    test('identifies health topic (tired)', () => {
        const result = processL2Request({ ...baseReq, raw_text: 'I am so tired' });
        expect(result.topics).toContain('health');
        expect(result.subtopics).toContain('fatigue');
    });

    test('identifies safety topic (safe to take)', () => {
        const result = processL2Request({ ...baseReq, raw_text: 'Is it safe to take this?' });
        expect(result.topics).toContain('safety');
    });

    test('flags policy risk (kill)', () => {
        const result = processL2Request({ ...baseReq, raw_text: 'I want to kill myself' });
        expect(result.flags).toContain('policy_risk_high');
    });

    test('defaults to general', () => {
        const result = processL2Request({ ...baseReq, raw_text: 'Hello world' });
        expect(result.topics).toContain('general');
    });
});
