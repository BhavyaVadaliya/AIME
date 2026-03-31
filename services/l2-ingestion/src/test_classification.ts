import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';

// Initialize the lens mapping for test
try {
    load_gime_v0_1();
} catch (e) {
    // ignore if already loaded or fail gracefully
}

const samples: L2IngestRequest[] = [
    {
        correlation_id: "test-1",
        signal_id: "sig-1",
        source: "tiktok",
        raw_text: "how much does the program cost?"
    },
    {
        correlation_id: "test-2",
        signal_id: "sig-2",
        source: "tiktok",
        raw_text: "how do I become a certified dietitian?"
    },
    {
        correlation_id: "test-3",
        signal_id: "sig-3",
        source: "tiktok",
        raw_text: "i want to learn about clinical nutrition training course"
    },
    {
        correlation_id: "test-4",
        signal_id: "sig-4",
        source: "tiktok",
        raw_text: "follow me for more tips on wellness!"
    },
    {
        correlation_id: "test-5",
        signal_id: "sig-5",
        source: "tiktok",
        raw_text: "limited offer! sign up for my nutrition program today"
    },
    {
        correlation_id: "test-6",
        signal_id: "sig-6",
        source: "tiktok",
        raw_text: "struggling with gut health issue"
    }
];

console.log("=== GIME Signal Classification Test ===");

samples.forEach((sample, index) => {
    const bundle1 = processL2Request(sample);
    const bundle2 = processL2Request(sample);

    const isDeterministic = JSON.stringify(bundle1.classification) === JSON.stringify(bundle2.classification);
    const hasGeneral = bundle1.classification?.primary_category === 'General';

    console.log(`\nSample ${index + 1}: "${sample.raw_text}"`);
    console.log(`-> Primary Category: ${bundle1.classification?.primary_category}`);
    console.log(`-> Signal Type:      ${bundle1.classification?.signal_type}`);
    console.log(`-> Context Tags:     ${bundle1.classification?.context_tags.join(', ')}`);
    console.log(`-> Deterministic:    ${isDeterministic ? 'PASS' : 'FAIL'}`);
    console.log(`-> No "General":     ${!hasGeneral ? 'PASS' : 'FAIL'}`);
    
    // Schema check: Ensure existing fields are present
    const schemaPass = bundle1.correlation_id && bundle1.signal_id && bundle1.topics;
    console.log(`-> Schema Intact:    ${schemaPass ? 'PASS' : 'FAIL'}`);
});
