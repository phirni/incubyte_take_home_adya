import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from './lib/prisma';
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body ?? {};

    if (typeof email !== 'string' || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    try {
      const user = await prisma.user.create({
        data: { email: normalizedEmail, passwordHash, role: 'USER' },
      });

      const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

      return res.status(201).json({
        token,
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
        return res.status(409).json({
          error: { code: 'EMAIL_IN_USE', message: 'Email already in use' },
        });
      }
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      });
    }
  });

  return app;
}