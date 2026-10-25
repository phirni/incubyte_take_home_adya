import { prisma } from './db';

export type CreateVehicleOpts = {
  make?: string;
  model?: string;
  category?: string;
  priceCents?: number;
  quantity?: number;
};

export async function createVehicle(opts: CreateVehicleOpts = {}) {
  return prisma.vehicle.create({
    data: {
      make: opts.make ?? 'Toyota',
      model: opts.model ?? 'Corolla',
      category: opts.category ?? 'sedan',
      priceCents: opts.priceCents ?? 2000000,
      quantity: opts.quantity ?? 5,
    },
  });
}