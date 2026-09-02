const { describe, expect, it, mock } = require('bun:test');
const request = require('supertest');
const express = require('express');
const projectRoutes = require('../routes/projects');
const { prismaMock } = require('./setup');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/projects', projectRoutes);

const token = jwt.sign({ userId: '1' }, process.env.JWT_SECRET);

describe('Projects API', () => {
  it('GET /api/projects should return projects', async () => {
    prismaMock.project.findMany.mockResolvedValueOnce([{ id: '1', name: 'Test', pictureUrl: '' }]);

    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it('POST /api/projects should create a project', async () => {
    const projectData = { name: 'New Project' };
    prismaMock.project.create.mockResolvedValueOnce({ id: '2', ...projectData });

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('New Project');
  });

  it('PUT /api/projects/:id should update a project', async () => {
    prismaMock.project.update.mockResolvedValueOnce({ id: '1', name: 'Updated' });

    const res = await request(app)
      .put('/api/projects/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated');
  });

  it('DELETE /api/projects/:id should delete a project', async () => {
    prismaMock.project.delete.mockResolvedValueOnce({ id: '1' });

    const res = await request(app)
      .delete('/api/projects/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
