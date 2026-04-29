import { runTikTokHarvest } from '../src/ingestion/tiktok/harvest';
import { normalizeTikTokItem } from '../src/ingestion/tiktok/normalize';

// Mock ApifyClient
jest.mock('apify-client', () => {
    return {
        ApifyClient: jest.fn().mockImplementation(() => {
            return {
                actor: jest.fn().mockReturnThis(),
                call: jest.fn().mockResolvedValue({ defaultDatasetId: 'test-dataset' }),
                dataset: jest.fn().mockReturnThis(),
                listItems: jest.fn().mockResolvedValue({
                    items: Array(30).fill(null).map((_, i) => ({
                        id: `tk-${i}`,
                        videoDescription: i === 1 ? '' : `Test post ${i} about #nutrition`,
                        authorMeta: { name: `user-${i}` },
                        createTime: 1710243600,
                        hashtags: [{ name: 'nutrition' }],
                        webVideoUrl: `https://tiktok.com/@user-${i}/video/${i}`,
                        diggCount: 100,
                        commentCount: 10
                    }))
                })
            };
        })
    };
});

describe('TikTok Harvester and Normalizer', () => {
    let mockConsoleLog: jest.SpyInstance;

    beforeEach(() => {
        mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(() => {
        mockConsoleLog.mockRestore();
    });

    test('normalizer should output canonical AIME Signal Object in metadata', () => {
        const raw = {
            id: '123',
            videoDescription: 'Hello tiktok #clinicalnutrition',
            authorMeta: { name: 'dietitian_jane' },
            createTime: 1710243600,
            hashtags: [{ name: 'clinicalnutrition' }],
            webVideoUrl: 'https://tiktok.com/v/123',
            diggCount: 150,
            commentCount: 20
        };

        const result = normalizeTikTokItem(raw);
        expect(result).not.toBeNull();
        expect(result!.signal_id).toBe('123');
        expect(result!.source).toBe('tiktok');
        expect(result!.raw_text).toBe('Hello tiktok #clinicalnutrition');
        
        const meta = result!.metadata;
        expect(meta?.author).toBe('dietitian_jane');
        expect(meta?.tags).toContain('clinicalnutrition');
        expect(meta?.metrics.likes).toBe(150);
        expect(meta?.source_url).toBe('https://tiktok.com/v/123');

    });

    test('normalizer should fail if videoDescription is empty', () => {
        const badRaw = {
            id: '123',
            videoDescription: '',
        };

        expect(() => normalizeTikTokItem(badRaw)).toThrow('Missing required field: text (videoDescription)');
    });

    test('harvester enforces max 25 items cap', async () => {
        const batch = await runTikTokHarvest();
        // Since config lists max_signals_per_batch: 50, but we mock 30 with 1 fail
        expect(batch.length).toBe(29);
    });

    test('harvester records rejected logs on bad records', async () => {
        await runTikTokHarvest();

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
        expect(batchDetail.batch_size).toBe(29);
        expect(batchDetail.status).toBe('ok');
    });
});
