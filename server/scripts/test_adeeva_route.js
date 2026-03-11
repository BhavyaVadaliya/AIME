import http from 'http';

function post(path, data) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: process.env.PORT || 8080,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, res => {
      let out = '';
      res.on('data', d => out += d);
      res.on('end', () => resolve({ status: res.statusCode, out }));
    });
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  try {
    const payload = {
      keyword: 'adeeva',
      source: 'qa',
      geo: { country: 'CA' }
    };
    const r = await post('/api/signal/simulate', payload);
    console.log('RESP', r.status, r.out);
  } catch (e) {
    console.error('ERR', e);
  }
})();
