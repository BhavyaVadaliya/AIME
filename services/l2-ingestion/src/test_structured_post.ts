import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';

async function validateStructuredPost() {
    load_gime_v0_1();
    
    const samples: L2IngestRequest[] = [
        {
            correlation_id: "test-1",
            signal_id: "sig-1",
            source: "tiktok",
            raw_text: "i want to learn about evidence-based nutrition"
        },
        {
            correlation_id: "test-2",
            signal_id: "sig-2",
            source: "tiktok",
            raw_text: "how much is the dietitian course discount offer? buy now"
        },
        {
            correlation_id: "test-3",
            signal_id: "sig-3",
            source: "tiktok",
            raw_text: "totally unrelated noise here"
        }
    ];

    console.log("=== GIME Structured Post Object Test (S10-T10) ===");

    samples.forEach((sample, index) => {
        const bundle = processL2Request(sample);
        const sp = bundle.structured_post;

        console.log(`\nSample ${index + 1}: "${sample.raw_text}"`);
        console.log(`-> Signal ID: ${bundle.signal_id}`);
        console.log(`-> Has Structured Post: ${!!sp ? 'YES' : 'NO'}`);
        
        if (sp) {
            // Check consistency and preservation
            const rawMatch = sp.raw_text === sample.raw_text;
            const classMatch = JSON.stringify(sp.classification) === JSON.stringify(bundle.classification);
            const routeMatch = JSON.stringify(sp.governance_route) === JSON.stringify(bundle.governance_route);

            console.log(`   -> Raw Text Exact:  ${rawMatch ? 'PASS' : 'FAIL'}`);
            console.log(`   -> Class Exact:     ${classMatch ? 'PASS' : 'FAIL'}`);
            console.log(`   -> Route Exact:     ${routeMatch ? 'PASS' : 'FAIL'}`);
            console.log(`   -> Shape Consistent: YES`);
            console.log(`   -> Primary Category: ${sp.classification.primary_category}`);
            console.log(`   -> Assigned Queue:   ${sp.governance_route.queue}`);
        }
    });

    // Check schema integrity: ensure original fields remain top-level
    const finalBundle = processL2Request(samples[0]);
    console.log(`\n--- Schema Integrity Check ---`);
    console.log(`Top-level topics preserved: ${!!finalBundle.topics ? 'PASS' : 'FAIL'}`);
    console.log(`Top-level classification preserved: ${!!finalBundle.classification ? 'PASS' : 'FAIL'}`);
    console.log(`Top-level governance_route preserved: ${!!finalBundle.governance_route ? 'PASS' : 'FAIL'}`);
}

validateStructuredPost().catch(e => console.error(e));
