import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { expect } from 'vitest';
import type { Response } from 'supertest';
import type { Role, User, Vehicle } from '@prisma/client';
import { prisma } from '../../src/lib/prisma';

const secret = () => process.env.JWT_SECRET as string;
let counter = 0;

/** Inserts a user straight into the DB (admins can't be made through the API). */
export async function createUser(
  overrides: { email?: string; password?: string; role?: Role } = {},
) {
  const password = overrides.password ?? 'password123';
  const user = await prisma.user.create({
    data: {
      email: overrides.email ?? `user${++counter}@example.com`,
      passwordHash: await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS ?? 4)),
      role: overrides.role ?? 'USER',
    },
  });
  return { user, password };
}

export const createAdmin = (overrides: { email?: string; password?: string } = {}) =>
  createUser({ ...overrides, role: 'ADMIN' });

export const tokenFor = (user: Pick<User, 'id' | 'role'>) =>
  jwt.sign({ sub: user.id, role: user.role }, secret(), { expiresIn: '1h' });

/** A correctly signed token whose `exp` is already in the past. */
export const expiredTokenFor = (user: Pick<User, 'id' | 'role'>) =>
  jwt.sign(
    { sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) - 60 },
    secret(),
  );

/** Value for the Authorization header. */
export const authAs = (user: Pick<User, 'id' | 'role'>) => `Bearer ${tokenFor(user)}`;

export async function createVehicle(
  overrides: Partial<Pick<Vehicle, 'make' | 'model' | 'category' | 'priceCents' | 'quantity'>> = {},
) {
  return prisma.vehicle.create({
    data: {
      make: 'Toyota',
      model: 'Corolla',
      category: 'sedan',
      priceCents: 2_000_000,
      quantity: 5,
      ...overrides,
    },
  });
}

/** Asserts status, the exact { error: { code, message } } envelope, and no leaks. */
export function expectError(res: Response, status: number, code: string) {
  expect(res.status).toBe(status);
  expect(Object.keys(res.body)).toEqual(['error']);
  expect(Object.keys(res.body.error).sort()).toEqual(['code', 'message']);
  expect(res.body.error.code).toBe(code);
  expect(typeof res.body.error.message).toBe('string');
  expect(res.body.error.message.length).toBeGreaterThan(0);
  expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|stack/i);
}
