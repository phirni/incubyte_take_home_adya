import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const MAX_INT = 2_147_483_647;

/** Query-string text filter: trimmed; empty string means "not supplied". */
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .optional();

/** Integer cents from a query string; empty means absent. Rejects negatives, decimals, text. */
const optionalCents = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .optional()
  .pipe(
    z
      .string()
      .regex(/^\d+$/, 'must be a non-negative integer (cents)')
      .transform(Number)
      .pipe(z.number().max(MAX_INT, 'is too large'))
      .optional(),
  );

const searchSchema = z
  .object({
    make: optionalText,
    model: optionalText,
    category: optionalText,
    minPrice: optionalCents,
    maxPrice: optionalCents,
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    path: ['minPrice'],
    message: 'must not exceed maxPrice',
  });

export const vehicleQueries = Router();

vehicleQueries.get('/', async (_req, res) => {
  const vehicles = await prisma.vehicle.findMany({ orderBy: [{ make: 'asc' }, { model: 'asc' }] });
  res.json({ vehicles });
});

// SQLite's LIKE is case-insensitive for ASCII, so `contains` gives the case-insensitive match.
vehicleQueries.get('/search', async (req, res) => {
  const { make, model, category, minPrice, maxPrice } = searchSchema.parse(req.query);
  const vehicles = await prisma.vehicle.findMany({
    where: {
      ...(make && { make: { contains: make } }),
      ...(model && { model: { contains: model } }),
      ...(category && { category: { contains: category } }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        priceCents: { gte: minPrice, lte: maxPrice },
      }),
    },
    orderBy: [{ make: 'asc' }, { model: 'asc' }],
  });
  res.json({ vehicles });
});
