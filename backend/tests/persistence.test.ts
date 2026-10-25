import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { authAs, createUser, createVehicle } from './helpers/factory';

describe('SQLite persistence', () => {
  it('keeps data available to a fresh Prisma client and app instance', async () => {
    const { user } = await createUser({ email: 'persist@example.com' });
    const vehicle = await createVehicle({ make: 'Volvo', model: 'Persist' });
    const authorization = authAs(user);

    await prisma.$disconnect();
    const restartedClient = new PrismaClient();

    try {
      await expect(restartedClient.user.findUnique({ where: { email: user.email } }))
        .resolves.toMatchObject({ id: user.id, email: user.email });
      await expect(restartedClient.vehicle.findUnique({ where: { id: vehicle.id } }))
        .resolves.toMatchObject({ id: vehicle.id, model: 'Persist' });

      const response = await request(createApp())
        .get('/api/vehicles')
        .set('Authorization', authorization);
      expect(response.status).toBe(200);
      expect(response.body.vehicles).toContainEqual(expect.objectContaining({
        id: vehicle.id,
        model: 'Persist',
      }));
    } finally {
      await restartedClient.$disconnect();
    }
  });
});
