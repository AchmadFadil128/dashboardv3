const { describe, expect, it, mock } = require('bun:test');
const request = require('supertest');
const express = require('express');
const writingsRoutes = require('../routes/writings');
const { prismaMock } = require('./setup');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/writings', writingsRoutes);

const token = jwt.sign({ userId: '1' }, process.env.JWT_SECRET);

describe('Writings API', () => {
  it('GET /api/writings should return writings', async () => {
    prismaMock.writing.findMany.mockResolvedValueOnce([{ id: '1', name: 'Test', urlFile: '' }]);

    const res = await request(app).get('/api/writings');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it('POST /api/writings should create a writing', async () => {
    const writingData = { name: 'New Writing' };
    prismaMock.writing.create.mockResolvedValueOnce({ id: '2', ...writingData });

    const res = await request(app)
      .post('/api/writings')
      .set('Authorization', `Bearer ${token}`)
      .send(writingData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('New Writing');
  });

  it('PUT /api/writings/:id should update a writing', async () => {
    prismaMock.writing.update.mockResolvedValueOnce({ id: '1', name: 'Updated' });

    const res = await request(app)
      .put('/api/writings/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated');
  });

  it('DELETE /api/writings/:id should delete a writing', async () => {
    prismaMock.writing.delete.mockResolvedValueOnce({ id: '1' });

    const res = await request(app)
      .delete('/api/writings/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
