const { describe, expect, it, mock } = require('bun:test');
const certificationsHandler = require('../routes/certifications');
const { prismaMock } = require('./setup');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ userId: '1' }, process.env.JWT_SECRET);

describe('Certifications API', () => {
  it('GET /api/certifications should return certifications', async () => {
    prismaMock.certification.findMany.mockResolvedValueOnce([{ id: '1', name: 'Test', pictureUrl: '' }]);

    const req = new Request('http://localhost/api/certifications', { method: 'GET' });
    const res = await certificationsHandler(req, new URL(req.url));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.length).toBe(1);
  });

  it('POST /api/certifications should create a certification', async () => {
    const certData = { name: 'New Cert' };
    prismaMock.certification.create.mockResolvedValueOnce({ id: '2', ...certData });

    const req = new Request('http://localhost/api/certifications', {
      method: 'POST',
      body: JSON.stringify(certData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const res = await certificationsHandler(req, new URL(req.url));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('New Cert');
  });

  it('PUT /api/certifications/:id should update a certification', async () => {
    prismaMock.certification.update.mockResolvedValueOnce({ id: '1', name: 'Updated Cert' });

    const req = new Request('http://localhost/api/certifications/1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Cert' }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const res = await certificationsHandler(req, new URL(req.url));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Updated Cert');
  });

  it('DELETE /api/certifications/:id should delete a certification', async () => {
    prismaMock.certification.delete.mockResolvedValueOnce({ id: '1' });

    const req = new Request('http://localhost/api/certifications/1', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const res = await certificationsHandler(req, new URL(req.url));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
