const { describe, expect, it, mock } = require('bun:test');
const request = require('supertest');
const express = require('express');
const certificationsRoutes = require('../routes/certifications');
const { prismaMock } = require('./setup');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/certifications', certificationsRoutes);

const token = jwt.sign({ userId: '1' }, process.env.JWT_SECRET);

describe('Certifications API', () => {
  it('GET /api/certifications should return certifications', async () => {
    prismaMock.certification.findMany.mockResolvedValueOnce([{ id: '1', name: 'Test', pictureUrl: '' }]);

    const res = await request(app).get('/api/certifications');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it('POST /api/certifications should create a certification', async () => {
    const certData = { name: 'New Cert' };
    prismaMock.certification.create.mockResolvedValueOnce({ id: '2', ...certData });

    const res = await request(app)
      .post('/api/certifications')
      .set('Authorization', `Bearer ${token}`)
      .send(certData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('New Cert');
  });

  it('PUT /api/certifications/:id should update a certification', async () => {
    prismaMock.certification.update.mockResolvedValueOnce({ id: '1', name: 'Updated Cert' });

    const res = await request(app)
      .put('/api/certifications/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Cert' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Cert');
  });

  it('DELETE /api/certifications/:id should delete a certification', async () => {
    prismaMock.certification.delete.mockResolvedValueOnce({ id: '1' });

    const res = await request(app)
      .delete('/api/certifications/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
