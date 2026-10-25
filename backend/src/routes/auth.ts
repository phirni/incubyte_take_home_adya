import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';
import { emailInUse, unauthorized } from '../errors';
import { prisma } from '../lib/prisma';
import { hasPrismaCode } from '../lib/prismaErrors';

const email = z.string().trim().toLowerCase().pipe(z.email());

// Unknown keys (including a client-supplied `role`) are stripped by default.
const registerSchema = z.object({
  email,
  password: z.string().min(8).max(72), // bcrypt only uses the first 72 bytes
});
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});

function authResponse(user: { id: string; email: string; role: 'USER' | 'ADMIN' }) {
  const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '1h' });
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

export const authRoutes = Router();

authRoutes.post('/register', async (req, res) => {
  const { email, password } = registerSchema.parse(req.body ?? {});
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  try {
    const user = await prisma.user.create({ data: { email, passwordHash, role: 'USER' } });
    res.status(201).json(authResponse(user));
  } catch (err) {
    // The DB unique constraint is the source of truth for concurrent registrations.
    if (hasPrismaCode(err, 'P2002')) throw emailInUse();
    throw err;
  }
});

authRoutes.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body ?? {});
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
  // Same message for unknown email and wrong password.
  if (!user || !ok) throw unauthorized('Incorrect email or password');
  res.json(authResponse(user));
});
