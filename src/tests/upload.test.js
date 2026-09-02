const { describe, expect, it, mock } = require('bun:test');
const request = require('supertest');
const express = require('express');
const uploadRoutes = require('../routes/upload');
const { prismaMock } = require('./setup');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use('/api/upload', uploadRoutes);

const token = jwt.sign({ userId: '1' }, process.env.JWT_SECRET);

describe('Upload API', () => {
  it('POST /api/upload should process and return a file', async () => {
    const originalWriteFile = fs.promises.writeFile;
    const originalStat = fs.promises.stat;

    fs.promises.writeFile = mock().mockResolvedValue();
    fs.promises.stat = mock().mockResolvedValue({ size: 1000 });

    // Create a tiny 1x1 valid PNG image buffer to prevent Bun.Image crashing
    const imageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', imageBuffer, { filename: 'test_real.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toMatch(/\.webp$/);

    // Restore mocks
    fs.promises.writeFile = originalWriteFile;
    fs.promises.stat = originalStat;
  });
});
