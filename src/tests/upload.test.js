const { describe, expect, it, mock } = require('bun:test');
const uploadHandler = require('../routes/upload');
const { prismaMock } = require('./setup');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const token = jwt.sign({ userId: '1' }, process.env.JWT_SECRET);

describe('Upload API', () => {
  it('POST /api/upload should process and return a file', async () => {
    const originalWriteFile = fs.promises.writeFile;
    const originalStat = fs.promises.stat;
    const originalBunWrite = Bun.write;

    fs.promises.writeFile = mock().mockResolvedValue();
    fs.promises.stat = mock().mockResolvedValue({ size: 1000 });
    Bun.write = mock().mockResolvedValue();

    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const imageBlob = new Blob([Buffer.from(pngBase64, 'base64')], { type: 'image/png' });
    const formData = new FormData();
    const imageFile = new File([imageBlob], 'test_real.png', { type: 'image/png' });
    formData.append('file', imageFile);

    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const res = await uploadHandler(req, new URL(req.url));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.url).toMatch(/\.webp$/);

    fs.promises.writeFile = originalWriteFile;
    fs.promises.stat = originalStat;
    Bun.write = originalBunWrite;
  });
});
