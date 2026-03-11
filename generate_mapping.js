const fs = require('fs');
const crypto = require('crypto');

const content = {
  "lens": "GIME",
  "version": "v0.1",
  "checksum": "",
  "topics": [
    "health_professional_education",
    "continuing_education",
    "evidence_based_nutrition",
    "lifestyle_medicine"
  ]
};

// Use 2-space indentation as canonical
const jsonString = JSON.stringify(content, null, 2) + '\n';
const hash = crypto.createHash('sha256').update(jsonString).digest('hex');

content.checksum = hash;
const finalJsonString = JSON.stringify(content, null, 2) + '\n';

fs.writeFileSync('assets/lenses/gime/v0.1/mapping.json', finalJsonString);
console.log('Final Checksum:', hash);
