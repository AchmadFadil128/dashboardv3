const { describe, expect, it, mock } = require('bun:test');
const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const { prismaMock } = require('./setup');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API', () => {
  it('should login successfully', async () => {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);

    prismaMock.adminUser.findUnique.mockResolvedValueOnce({
      id: '1',
      username: 'admin',
      passwordHash: hash
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });

  it('should fail with invalid password', async () => {
    const hash = await bcrypt.hash('password123', 10);

    prismaMock.adminUser.findUnique.mockResolvedValueOnce({
      id: '1',
      username: 'admin',
      passwordHash: hash
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
