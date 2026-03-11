import fs from 'fs';
import path from 'path';
import http from 'http';

const configPath = path.resolve('partner-config', 'adeeva.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function post(path, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: process.env.PORT || 8080,
        path,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      res => {
        let out = '';
        res.on('data', d => (out += d));
        res.on('end', () => resolve({ status: res.statusCode, out }));
      }
    );
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  const result = await post('/api/partner/config/import', config);
  console.log('ADEEVA IMPORT RESULT:', result.status, result.out);
}

run();
