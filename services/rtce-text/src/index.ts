import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { RTCEDecideRequestSchema } from './types';
import { processRTCEDecision } from './logic';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Structured Logger Helper
const logEvent = (event: string, correlation_id: string, signal_id: string, status: 'ok' | 'error', extra: any = {}) => {
    console.log(JSON.stringify({
        service: 'rtce',
        timestamp: new Date().toISOString(),
        correlation_id,
        signal_id,
        event,
        status,
        rtce_version: 'v0',
        ...extra
    }));
};

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'rtce-text' });
});

app.post('/v1/rtce/decide', (req: Request, res: Response): void => {
    const start = Date.now();
    let correlation_id = 'unknown';
    let signal_id = 'unknown';

    try {
        // 1. Validate
        const parseResult = RTCEDecideRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            correlation_id = req.body?.correlation_id || 'unknown';
            signal_id = req.body?.signal_id || 'unknown';

            logEvent('decision_request_received', correlation_id, signal_id, 'error', { error: 'validation_failed', details: parseResult.error });

            res.status(400).json({
                error: "invalid_schema",
                correlation_id,
                signal_id,
                details: parseResult.error
            });
            return;
        }

        const body = parseResult.data;
        correlation_id = body.correlation_id;
        signal_id = body.signal_id;

        logEvent('decision_request_received', correlation_id, signal_id, 'ok');

        // 2. Process
        const decision = processRTCEDecision(body);

        // 3. Response
        const duration_ms = Date.now() - start;
        logEvent('decision_created', correlation_id, signal_id, 'ok', { duration_ms, route: decision.route });

        res.json(decision);

    } catch (error) {
        const duration_ms = Date.now() - start;
        logEvent('error', correlation_id, signal_id, 'error', { duration_ms, error: String(error) });
        res.status(500).json({ error: 'Internal Server Error', correlation_id });
    }
});

app.listen(PORT, () => {
    console.log(`RTCE Text Service running on port ${PORT}`);
});
