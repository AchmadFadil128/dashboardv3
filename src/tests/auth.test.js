const { describe, expect, it, mock } = require('bun:test');
const { prismaMock } = require('./setup');
const jwt = require('jsonwebtoken');

const authHandler = require('../routes/auth');

describe('Auth API', () => {
  it('should login successfully', async () => {
    const password = 'password123';
    const hash = await Bun.password.hash(password);

    prismaMock.adminUser.findUnique.mockResolvedValueOnce({
      id: '1',
      username: 'admin',
      passwordHash: hash
    });

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await authHandler(req, new URL(req.url));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.token).toBeDefined();
  });

  it('should fail with invalid password', async () => {
    const hash = await Bun.password.hash('password123');

    prismaMock.adminUser.findUnique.mockResolvedValueOnce({
      id: '1',
      username: 'admin',
      passwordHash: hash
    });

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await authHandler(req, new URL(req.url));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});
