const fs = require('fs');
const crypto = require('crypto');
const raw = fs.readFileSync('assets/lenses/gime/v0.1/mapping.json', 'utf8');
const blanked = raw.replace(/"checksum": ".*"/, '"checksum": ""');
const hash = crypto.createHash('sha256').update(blanked).digest('hex');
console.log('Digest:', hash);
console.log('Match:', raw.includes(hash));
