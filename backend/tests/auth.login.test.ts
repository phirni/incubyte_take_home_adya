import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { createUser, createAdmin, expectError } from './helpers/factory';

const app = createApp();
const login = (body: Record<string, unknown>) => request(app).post('/api/auth/login').send(body);

describe('POST /api/auth/login', () => {
  it('returns 200 with a token and user for correct credentials', async () => {
    const { user, password } = await createUser({ email: 'login@example.com' });
    const res = await login({ email: 'login@example.com', password });
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: user.id, email: 'login@example.com', role: 'USER' });
    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
    expect(payload.sub).toBe(user.id);
    expect(payload.role).toBe('USER');
    expect(payload.exp! - payload.iat!).toBe(3600);
  });

  it('returns the ADMIN role for an admin', async () => {
    const { password } = await createAdmin({ email: 'boss@example.com' });
    const res = await login({ email: 'boss@example.com', password });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('ADMIN');
  });

  it('matches the email case-insensitively', async () => {
    const { password } = await createUser({ email: 'case@example.com' });
    const res = await login({ email: '  CASE@Example.com ', password });
    expect(res.status).toBe(200);
  });

  it('returns 401 for a wrong password', async () => {
    await createUser({ email: 'wrong@example.com' });
    const res = await login({ email: 'wrong@example.com', password: 'not-the-password' });
    expectError(res, 401, 'UNAUTHORIZED');
  });

  it('returns 401 for an unknown email, with the same message as a wrong password', async () => {
    await createUser({ email: 'known@example.com' });
    const wrongPassword = await login({ email: 'known@example.com', password: 'nope-nope-nope' });
    const unknownEmail = await login({ email: 'ghost@example.com', password: 'password123' });
    expectError(unknownEmail, 401, 'UNAUTHORIZED');
    expect(unknownEmail.body.error.message).toBe(wrongPassword.body.error.message);
  });

  it.each([{}, { email: 'a@example.com' }, { password: 'password123' }])(
    'returns 400 when fields are missing: %j',
    async (body) => {
      expectError(await login(body), 400, 'VALIDATION_ERROR');
    },
  );

  it('never returns the password hash', async () => {
    const { password } = await createUser({ email: 'safe@example.com' });
    const res = await login({ email: 'safe@example.com', password });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
  });
});
