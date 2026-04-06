import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';

async function validateReporting() {
    load_gime_v0_1();
    
    const sample: L2IngestRequest = {
        correlation_id: "corr-trace-001",
        signal_id: "sig-trace-001",
        source: "tiktok",
        raw_text: "i want to learn about medical nutrition training for chiropractors"
    };

    console.log("=== GIME Governance Lifecycle Reporting Test (S10-T12) ===");

    console.log("\n--- Executing Signal Processing ---");
    const bundle = processL2Request(sample);

    console.log("\n--- Integrity Check ---");
    console.log(`Signal ID: ${bundle.signal_id}`);
    console.log(`Correlation ID: ${bundle.correlation_id}`);
    
    // In our test environment, logs go to stdout. 
    // We visually verify them in the next step.
    console.log(`Structured Post Generated: ${!!bundle.structured_post ? 'YES' : 'NO'}`);
}

validateReporting().catch(e => console.error(e));
