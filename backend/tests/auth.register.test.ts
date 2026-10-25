import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { createUser, expectError } from './helpers/factory';

const app = createApp();
const register = (body: Record<string, unknown>) =>
  request(app).post('/api/auth/register').send(body);

describe('POST /api/auth/register - edge cases', () => {
  it('rejects a password shorter than 8 characters', async () => {
    const res = await register({ email: 'a@example.com', password: '1234567' });
    expectError(res, 400, 'VALIDATION_ERROR');
  });

  it('accepts a password of exactly 8 characters', async () => {
    const res = await register({ email: 'a@example.com', password: '12345678' });
    expect(res.status).toBe(201);
  });

  it.each(['not-an-email', '', 'a@', '@example.com'])('rejects invalid email %j', async (email) => {
    const res = await register({ email, password: 'password123' });
    expectError(res, 400, 'VALIDATION_ERROR');
  });

  it('rejects an empty body', async () => {
    const res = await register({});
    expectError(res, 400, 'VALIDATION_ERROR');
  });

  it('rejects malformed JSON with the standard envelope', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expectError(res, 400, 'VALIDATION_ERROR');
  });

  it('trims and lowercases the email before storing', async () => {
    const res = await register({ email: '  Mixed@Case.COM ', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('mixed@case.com');
    const stored = await prisma.user.findUnique({ where: { email: 'mixed@case.com' } });
    expect(stored).not.toBeNull();
  });

  it('returns 409 EMAIL_IN_USE for a duplicate that differs only by case/whitespace', async () => {
    await createUser({ email: 'alex@example.com' });
    const res = await register({ email: ' Alex@Example.com ', password: 'password123' });
    expectError(res, 409, 'EMAIL_IN_USE');
  });

  it('ignores a client-supplied role', async () => {
    const res = await register({ email: 'sneaky@example.com', password: 'password123', role: 'ADMIN' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('USER');
    expect((jwt.decode(res.body.token) as jwt.JwtPayload).role).toBe('USER');
    const stored = await prisma.user.findUnique({ where: { email: 'sneaky@example.com' } });
    expect(stored?.role).toBe('USER');
  });

  it('hashes the password and never returns the hash', async () => {
    const res = await register({ email: 'hash@example.com', password: 'password123' });
    expect(Object.keys(res.body.user).sort()).toEqual(['email', 'id', 'role']);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    const stored = await prisma.user.findUnique({ where: { email: 'hash@example.com' } });
    expect(stored?.passwordHash).not.toBe('password123');
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('returns a token whose subject is the new user id', async () => {
    const res = await register({ email: 'tok@example.com', password: 'password123' });
    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
    expect(payload.sub).toBe(res.body.user.id);
  });
});
