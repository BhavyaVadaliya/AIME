import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

let activeMapping: any = null;

export const load_gime_v0_1 = (): any => {
    if (activeMapping) {
        return activeMapping;
    }

    let currentPath = __dirname;
    while (!fs.existsSync(path.join(currentPath, 'assets')) && currentPath !== path.parse(currentPath).root) {
        currentPath = path.dirname(currentPath);
    }
    const filePath = path.join(currentPath, 'assets', 'lenses', 'gime', 'v0.1', 'mapping.json');
    if (!fs.existsSync(filePath)) {
        throw new Error(`Mapping file not found at ${filePath}`);
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const mapping = JSON.parse(raw);

    // Validate header fields
    if (mapping.lens !== 'GIME') {
        throw new Error('Invalid lens name: expected GIME');
    }
    if (mapping.version !== 'v0.1') {
        throw new Error('Invalid lens version: expected v0.1');
    }

    // Checksum validation reproducing S9-W1-01 exact method
    const storedChecksum = mapping.checksum;
    const blanked = raw.replace(/"checksum": ".*"/, '"checksum": ""');

    // Checksum must match
    const computedHash = crypto.createHash('sha256').update(blanked).digest('hex');
    if (computedHash !== storedChecksum) {
        throw new Error(`Checksum mismatch. Expected: ${storedChecksum}, but got: ${computedHash}`);
    }

    // Cache the mapping in memory
    activeMapping = mapping;

    // Emit structured boot telemetry
    console.log(JSON.stringify({
        event: 'lens_loaded',
        lens_name: mapping.lens,
        lens_version: mapping.version,
        lens_checksum: storedChecksum,
        timestamp: new Date().toISOString()
    }));

    return activeMapping;
};

export const getActiveMapping = (): any => {
    if (!activeMapping) {
        throw new Error("Mapping not loaded yet. Boot sequence must complete first.");
    }
    return activeMapping;
};
