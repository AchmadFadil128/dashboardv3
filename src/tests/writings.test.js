const { describe, expect, it, mock } = require('bun:test');
const writingsHandler = require('../routes/writings');
const { prismaMock } = require('./setup');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ userId: '1' }, process.env.JWT_SECRET);

describe('Writings API', () => {
  it('GET /api/writings should return writings', async () => {
    prismaMock.writing.findMany.mockResolvedValueOnce([{ id: '1', name: 'Test', urlFile: '' }]);

    const req = new Request('http://localhost/api/writings', { method: 'GET' });
    const res = await writingsHandler(req, new URL(req.url));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.length).toBe(1);
  });

  it('POST /api/writings should create a writing', async () => {
    const writingData = { name: 'New Writing' };
    prismaMock.writing.create.mockResolvedValueOnce({ id: '2', ...writingData });

    const req = new Request('http://localhost/api/writings', {
      method: 'POST',
      body: JSON.stringify(writingData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const res = await writingsHandler(req, new URL(req.url));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('New Writing');
  });

  it('PUT /api/writings/:id should update a writing', async () => {
    prismaMock.writing.update.mockResolvedValueOnce({ id: '1', name: 'Updated' });

    const req = new Request('http://localhost/api/writings/1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const res = await writingsHandler(req, new URL(req.url));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Updated');
  });

  it('DELETE /api/writings/:id should delete a writing', async () => {
    prismaMock.writing.delete.mockResolvedValueOnce({ id: '1' });

    const req = new Request('http://localhost/api/writings/1', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const res = await writingsHandler(req, new URL(req.url));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
