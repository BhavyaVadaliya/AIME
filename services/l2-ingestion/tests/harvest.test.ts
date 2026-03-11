import { runTikTokHarvest } from '../src/ingestion/tiktok/harvest';
import { normalizeTikTokItem } from '../src/ingestion/tiktok/normalize';

describe('TikTok Harvester and Normalizer', () => {
    let mockConsoleLog: jest.SpyInstance;

    beforeEach(() => {
        mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(() => {
        mockConsoleLog.mockRestore();
    });

    test('normalizer should output canonical L2IngestRequest', () => {
        const raw = {
            id: '123',
            text: 'Hello tiktok',
            author: 'someone'
        };

        const result = normalizeTikTokItem(raw);
        expect(result.signal_id).toBe('123');
        expect(result.source).toBe('tiktok');
        expect(result.raw_text).toBe('Hello tiktok');
        expect(result.metadata?.lang).toBe('en');
    });

    test('normalizer should fail if text is empty', () => {
        const badRaw = {
            id: '123',
            text: '',
        };

        expect(() => normalizeTikTokItem(badRaw)).toThrow('Missing required field: text');
    });

    test('harvester enforces max 25 items cap', async () => {
        const batch = await runTikTokHarvest();
        // Since config lists max_signals_per_batch: 25, we expect 25
        expect(batch.length).toBe(25);
    });

    test('harvester records rejected logs on bad records', async () => {
        await runTikTokHarvest();

        // Find if any console log has event tiktok_harvest_item with status rejected
        const rejectedLogs = mockConsoleLog.mock.calls.filter(args => {
            const parsed = JSON.parse(args[0]);
            return parsed.event === 'tiktok_harvest_item' && parsed.ingestion_status === 'rejected';
        });

        expect(rejectedLogs.length).toBeGreaterThan(0);
        const badItemDetail = JSON.parse(rejectedLogs[0][0]);
        expect(badItemDetail.governance_status).toBe('blocked');
        expect(badItemDetail.governance_reason_code).toBe('validation_failed');
    });

    test('harvester emits batch telemetry', async () => {
        await runTikTokHarvest();

        const batchLogs = mockConsoleLog.mock.calls.filter(args => {
            const parsed = JSON.parse(args[0]);
            return parsed.event === 'tiktok_harvest_batch';
        });

        expect(batchLogs.length).toBe(1);
        const batchDetail = JSON.parse(batchLogs[0][0]);
        expect(batchDetail.batch_size).toBe(25);
        expect(batchDetail.status).toBe('ok');
    });
});
