import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { L2IngestRequestSchema } from './types';
import { processL2Request } from './logic';
import { load_gime_v0_1, getActiveMapping } from './lens/gime_mapping_loader';
import { routeTikTokHarvest } from './ingestion/tiktok/route';

const app = express();
const PORT = process.env.PORT || 3001;

// Load static mapping at boot
load_gime_v0_1();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Structured Logger Helper
const logEvent = (event: string, correlation_id: string, signal_id: string, status: 'ok' | 'error', extra: any = {}) => {
    const active_mapping = getActiveMapping();

    // Add governance fields requested by task
    const ingestion_status = status === 'ok' ? 'accepted' : 'rejected';
    const governance_status = status === 'ok' ? 'passed' : 'blocked';
    const gov_extra: any = {};
    if (status === 'error' && extra.error === 'validation_failed') {
        gov_extra.governance_reason_code = 'validation_failed';
    } else if (status === 'error') {
        gov_extra.governance_reason_code = 'internal_error';
    }

    console.log(JSON.stringify({
        service: 'l2',
        timestamp: new Date().toISOString(),
        correlation_id,
        signal_id,
        event,
        status,
        l2_version: 'v0',
        lens_name: active_mapping.lens,
        lens_version: active_mapping.version,
        lens_checksum: active_mapping.checksum,
        ingestion_status,
        governance_status,
        ...gov_extra,
        ...extra
    }));
};

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'l2-ingestion' });
});

// Simplified Harvest Route for Sprint 11 Utility
app.post('/v1/harvest', (req: Request, res: Response) => {
    routeTikTokHarvest().catch(error => {
        console.error('Background TikTok harvest failed:', error);
    });
    res.status(202).json({ status: 'accepted', message: 'Scan started' });
});

// GET version for easy browser testing
app.get(['/v1/harvest', '/v1/ingestion/tiktok/harvest', '/harvest'], (req: Request, res: Response) => {
    routeTikTokHarvest().catch(error => {
        console.error('Background TikTok harvest failed:', error);
    });
    res.status(200).json({ status: 'accepted', message: 'Scan triggered via GET' });
});

// POST version for internal runners
app.post(['/v1/harvest', '/v1/ingestion/tiktok/harvest', '/harvest'], (req: Request, res: Response) => {
    routeTikTokHarvest().catch(error => {
        console.error('Background TikTok harvest failed:', error);
    });
    res.status(202).json({ status: 'accepted', message: 'Scan triggered via POST' });
});

app.post('/v1/l2/ingest', (req: Request, res: Response): void => {
    const start = Date.now();
    let correlation_id = 'unknown';
    let signal_id = 'unknown';

    try {
        // 1. Validate
        const parseResult = L2IngestRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            // If we can't parse, we might not have IDs. Try to extract them safely for logging.
            correlation_id = req.body?.correlation_id || 'unknown';
            signal_id = req.body?.signal_id || 'unknown';

            logEvent('ingest_received', correlation_id, signal_id, 'error', { error: 'validation_failed', details: parseResult.error });

            res.status(400).json({
                error: "raw_text_required_or_schema_mismatch",
                correlation_id,
                signal_id,
                details: parseResult.error
            });
            return;
        }

        const body = parseResult.data;
        correlation_id = body.correlation_id;
        signal_id = body.signal_id;

        logEvent('ingest_received', correlation_id, signal_id, 'ok');

        // 2. Process
        const bundle = processL2Request(body);

        // 3. Response
        const duration_ms = Date.now() - start;
        logEvent('bundle_created', correlation_id, signal_id, 'ok', { duration_ms });

        res.json(bundle);

    } catch (error) {
        const duration_ms = Date.now() - start;
        logEvent('error', correlation_id, signal_id, 'error', { duration_ms, error: String(error) });
        res.status(500).json({ error: 'Internal Server Error', correlation_id });
    }
});

// Removed old harvest route from here

app.listen(PORT, () => {
    console.log(`L2 Ingestion Service running on port ${PORT}`);
});
