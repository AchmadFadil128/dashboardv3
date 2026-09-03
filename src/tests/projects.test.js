const { describe, expect, it, mock } = require('bun:test');
const projectsHandler = require('../routes/projects');
const { prismaMock } = require('./setup');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ userId: '1' }, process.env.JWT_SECRET);

describe('Projects API', () => {
  it('GET /api/projects should return projects', async () => {
    prismaMock.project.findMany.mockResolvedValueOnce([{ id: '1', name: 'Test', pictureUrl: '' }]);

    const req = new Request('http://localhost/api/projects', { method: 'GET' });
    const res = await projectsHandler(req, new URL(req.url));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.length).toBe(1);
  });

  it('POST /api/projects should create a project', async () => {
    const projectData = { name: 'New Project' };
    prismaMock.project.create.mockResolvedValueOnce({ id: '2', ...projectData });

    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const res = await projectsHandler(req, new URL(req.url));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('New Project');
  });

  it('PUT /api/projects/:id should update a project', async () => {
    prismaMock.project.update.mockResolvedValueOnce({ id: '1', name: 'Updated' });

    const req = new Request('http://localhost/api/projects/1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const res = await projectsHandler(req, new URL(req.url));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Updated');
  });

  it('DELETE /api/projects/:id should delete a project', async () => {
    prismaMock.project.delete.mockResolvedValueOnce({ id: '1' });

    const req = new Request('http://localhost/api/projects/1', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const res = await projectsHandler(req, new URL(req.url));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
