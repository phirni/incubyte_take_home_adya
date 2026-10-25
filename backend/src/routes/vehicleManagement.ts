import { Router } from 'express';
import { z } from 'zod';
import { vehicleNotFound } from '../errors';
import { prisma } from '../lib/prisma';
import { hasPrismaCode } from '../lib/prismaErrors';
import { requireAdmin } from '../middleware/auth';

const MAX_INT = 2_147_483_647;
const text = z.string().trim().min(1).max(100);
const wholeNumber = z.number().int().min(0).max(MAX_INT);

const createSchema = z.object({
  make: text,
  model: text,
  category: text,
  priceCents: wholeNumber,
  quantity: wholeNumber,
});
const updateSchema = createSchema.partial(); // unknown keys are stripped

export const vehicleManagement = Router();

vehicleManagement.post('/', requireAdmin, async (req, res) => {
  const data = createSchema.parse(req.body ?? {});
  const vehicle = await prisma.vehicle.create({ data });
  res.status(201).json({ vehicle });
});

vehicleManagement.put('/:id', requireAdmin, async (req, res) => {
  const data = updateSchema.parse(req.body ?? {});
  try {
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data });
    res.json({ vehicle });
  } catch (err) {
    if (hasPrismaCode(err, 'P2025')) throw vehicleNotFound();
    throw err;
  }
});

vehicleManagement.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (hasPrismaCode(err, 'P2025')) throw vehicleNotFound();
    throw err;
  }
});
