import http from 'node:http';

const target = process.argv[2] || 'http://127.0.0.1:4000/api/health';
const maxAttempts = 60;
const delayMs = 500;

function ping(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume();
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        reject(new Error(`status ${res.statusCode}`));
      }
    });
    req.on('error', reject);
    req.setTimeout(2000, () => {
      req.destroy(new Error('timeout'));
    });
  });
}

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    await ping(target);
    console.log('[wait-for-api] API is ready');
    process.exit(0);
  } catch {
    if (attempt === maxAttempts) {
      console.warn('[wait-for-api] API not reachable — starting frontends anyway');
      process.exit(0);
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
}
