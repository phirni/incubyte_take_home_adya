import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import {
  createUser, createAdmin, createVehicle, authAs, expectError,
} from './helpers/factory';

const app = createApp();

describe('POST /api/vehicles/:id/purchase', () => {
  it('decrements quantity by exactly one and returns the current vehicle', async () => {
    const { user } = await createUser();
    const vehicle = await createVehicle({ quantity: 3 });
    const res = await request(app).post(`/api/vehicles/${vehicle.id}/purchase`).set('Authorization', authAs(user));
    expect(res.status).toBe(200);
    expect(res.body.vehicle).toMatchObject({ id: vehicle.id, quantity: 2 });
    expect((await prisma.vehicle.findUnique({ where: { id: vehicle.id } }))?.quantity).toBe(2);
  });

  it('ignores any client-supplied quantity', async () => {
    const { user } = await createUser();
    const vehicle = await createVehicle({ quantity: 10 });
    const res = await request(app).post(`/api/vehicles/${vehicle.id}/purchase`)
      .set('Authorization', authAs(user)).send({ quantity: 5 });
    expect(res.body.vehicle.quantity).toBe(9);
  });

  it('returns 409 OUT_OF_STOCK at zero and never goes negative', async () => {
    const { user } = await createUser();
    const vehicle = await createVehicle({ quantity: 0 });
    const res = await request(app).post(`/api/vehicles/${vehicle.id}/purchase`).set('Authorization', authAs(user));
    expectError(res, 409, 'OUT_OF_STOCK');
    expect((await prisma.vehicle.findUnique({ where: { id: vehicle.id } }))?.quantity).toBe(0);
  });

  it('returns 404 VEHICLE_NOT_FOUND for a deleted or unknown vehicle', async () => {
    const { user } = await createUser();
    const res = await request(app).post('/api/vehicles/clxunknownid0000000000000/purchase').set('Authorization', authAs(user));
    expectError(res, 404, 'VEHICLE_NOT_FOUND');
  });

  it('proceeds at the current database price if the price changed after the page loaded', async () => {
    const { user } = await createUser();
    const vehicle = await createVehicle({ priceCents: 2_000_000, quantity: 2 });
    await prisma.vehicle.update({ where: { id: vehicle.id }, data: { priceCents: 2_500_000 } });
    const res = await request(app).post(`/api/vehicles/${vehicle.id}/purchase`).set('Authorization', authAs(user));
    expect(res.status).toBe(200);
    expect(res.body.vehicle.priceCents).toBe(2_500_000);
  });

  it('returns 401 without a token', async () => {
    const vehicle = await createVehicle();
    expectError(await request(app).post(`/api/vehicles/${vehicle.id}/purchase`), 401, 'UNAUTHORIZED');
  });

  it.each([1, 2, 3])('concurrent attempts on the last unit: exactly one wins (run %i)', async () => {
    const { user } = await createUser();
    const vehicle = await createVehicle({ quantity: 1 });
    const responses = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app).post(`/api/vehicles/${vehicle.id}/purchase`).set('Authorization', authAs(user)),
      ),
    );
    const statuses = responses.map((r) => r.status);
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(9);
    expect((await prisma.vehicle.findUnique({ where: { id: vehicle.id } }))?.quantity).toBe(0);
  });

  it('never oversells when demand exceeds stock', async () => {
    const { user } = await createUser();
    const vehicle = await createVehicle({ quantity: 3 });
    const responses = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app).post(`/api/vehicles/${vehicle.id}/purchase`).set('Authorization', authAs(user)),
      ),
    );
    expect(responses.filter((r) => r.status === 200)).toHaveLength(3);
    expect(responses.filter((r) => r.status === 409)).toHaveLength(7);
    expect((await prisma.vehicle.findUnique({ where: { id: vehicle.id } }))?.quantity).toBe(0);
  });
});

describe('POST /api/vehicles/:id/restock', () => {
  it('adds to stock and returns the updated vehicle', async () => {
    const { user } = await createAdmin();
    const vehicle = await createVehicle({ quantity: 2 });
    const res = await request(app).post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', authAs(user)).send({ quantity: 8 });
    expect(res.status).toBe(200);
    expect(res.body.vehicle).toMatchObject({ id: vehicle.id, quantity: 10 });
    expect((await prisma.vehicle.findUnique({ where: { id: vehicle.id } }))?.quantity).toBe(10);
  });

  it('accepts exactly 10,000', async () => {
    const { user } = await createAdmin();
    const vehicle = await createVehicle({ quantity: 0 });
    const res = await request(app).post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', authAs(user)).send({ quantity: 10_000 });
    expect(res.status).toBe(200);
  });

  it.each([
    ['zero', 0], ['negative', -3], ['decimal', 1.5], ['string', '5'], ['over 10,000', 10_001], ['null', null],
  ])('returns 400 for %s quantity', async (_name, quantity) => {
    const { user } = await createAdmin();
    const vehicle = await createVehicle({ quantity: 2 });
    const res = await request(app).post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', authAs(user)).send({ quantity });
    expectError(res, 400, 'VALIDATION_ERROR');
    expect((await prisma.vehicle.findUnique({ where: { id: vehicle.id } }))?.quantity).toBe(2);
  });

  it('returns 400 when the body is missing', async () => {
    const { user } = await createAdmin();
    const vehicle = await createVehicle();
    expectError(
      await request(app).post(`/api/vehicles/${vehicle.id}/restock`).set('Authorization', authAs(user)),
      400, 'VALIDATION_ERROR',
    );
  });

  it('returns 404 VEHICLE_NOT_FOUND for an unknown id', async () => {
    const { user } = await createAdmin();
    const res = await request(app).post('/api/vehicles/clxunknownid0000000000000/restock')
      .set('Authorization', authAs(user)).send({ quantity: 5 });
    expectError(res, 404, 'VEHICLE_NOT_FOUND');
  });

  it('returns 403 for a regular user', async () => {
    const { user } = await createUser();
    const vehicle = await createVehicle({ quantity: 2 });
    const res = await request(app).post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', authAs(user)).send({ quantity: 5 });
    expectError(res, 403, 'FORBIDDEN');
    expect((await prisma.vehicle.findUnique({ where: { id: vehicle.id } }))?.quantity).toBe(2);
  });

  it('returns 401 without a token', async () => {
    const vehicle = await createVehicle();
    expectError(await request(app).post(`/api/vehicles/${vehicle.id}/restock`).send({ quantity: 5 }), 401, 'UNAUTHORIZED');
  });
});
