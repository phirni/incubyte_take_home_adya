import { Router } from 'express';
import { z } from 'zod';
import { outOfStock, vehicleNotFound } from '../errors';
import { prisma } from '../lib/prisma';
import { hasPrismaCode } from '../lib/prismaErrors';
import { requireAdmin } from '../middleware/auth';

const restockSchema = z.object({ quantity: z.number().int().min(1).max(10_000) });

export const inventory = Router();

// One unit per request. The conditional updateMany is atomic, so two buyers of the
// last unit can never both succeed and stock can never go negative.
inventory.post('/:id/purchase', async (req, res) => {
  const id = String(req.params.id);
  const { count } = await prisma.vehicle.updateMany({
    where: { id, quantity: { gt: 0 } },
    data: { quantity: { decrement: 1 } },
  });

  if (count === 0) {
    const exists = await prisma.vehicle.findUnique({ where: { id }, select: { id: true } });
    throw exists ? outOfStock() : vehicleNotFound();
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw vehicleNotFound(); // deleted between the update and the read
  res.json({ vehicle });
});

inventory.post('/:id/restock', requireAdmin, async (req, res) => {
  const { quantity } = restockSchema.parse(req.body ?? {});
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: String(req.params.id) },
      data: { quantity: { increment: quantity } },
    });
    res.json({ vehicle });
  } catch (err) {
    if (hasPrismaCode(err, 'P2025')) throw vehicleNotFound();
    throw err;
  }
});
