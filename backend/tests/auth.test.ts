import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201 with token and user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({
      email: 'new@example.com',
      role: 'USER',
    });
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });
});