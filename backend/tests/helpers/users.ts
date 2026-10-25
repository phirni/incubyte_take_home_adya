import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from './db';

const ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);
const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export type CreateUserOpts = {
  email?: string;
  password?: string;
  role?: 'USER' | 'ADMIN';
};

export async function createUser(opts: CreateUserOpts = {}) {
  const email = (opts.email ?? `user-${Date.now()}-${Math.random()}@example.com`).toLowerCase();
  const password = opts.password ?? 'password123';
  const passwordHash = await bcrypt.hash(password, ROUNDS);

  return prisma.user.create({
    data: { email, passwordHash, role: opts.role ?? 'USER' },
  });
}

export type UserRecord = { id: string; email: string; role: 'USER' | 'ADMIN' };

export function loginAs(user: UserRecord): { token: string; user: UserRecord } {
  const token = jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: '1h' });
  return { token, user };
}

export function expiredToken(user: UserRecord): string {
  return jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: '-1h' });
}