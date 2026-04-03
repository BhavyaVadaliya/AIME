import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';

async function validateGovernance() {
    load_gime_v0_1();
    
    const samples: L2IngestRequest[] = [
        {
            correlation_id: "test-low",
            signal_id: "sig-low",
            source: "tiktok",
            raw_text: "i want to learn about evidence-based nutrition"
        },
        {
            correlation_id: "test-high",
            signal_id: "sig-high",
            source: "tiktok",
            raw_text: "how much is the dietitian course discount offer? buy now"
        }
    ];

    console.log("=== GIME Governance Queue Routing Test ===");

    samples.forEach((sample, index) => {
        const bundle1 = processL2Request(sample);
        const bundle2 = processL2Request(sample);

        // 1. Determinism
        const isDeterministic = JSON.stringify(bundle1.governance_route) === JSON.stringify(bundle2.governance_route);
        
        // 2. Classification unchanged
        // Compare with pure classification (should match basis in route)
        const catMatch = bundle1.classification?.primary_category === bundle1.governance_route?.routing_basis.primary_category;
        const typeMatch = bundle1.classification?.signal_type === bundle1.governance_route?.routing_basis.signal_type;

        console.log(`\nSample ${index + 1}: "${sample.raw_text}"`);
        console.log(`-> Classification:  ${bundle1.classification?.primary_category} / ${bundle1.classification?.signal_type}`);
        console.log(`-> Queue Assigned:  ${bundle1.governance_route?.queue}`);
        console.log(`-> Deterministic:    ${isDeterministic ? 'PASS' : 'FAIL'}`);
        console.log(`-> Rules Respected:  ${(catMatch && typeMatch) ? 'PASS' : 'FAIL'}`);
    });
}

validateGovernance().catch(e => console.error(e));
