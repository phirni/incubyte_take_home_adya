import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import {
  createUser, createAdmin, createVehicle, authAs, expiredTokenFor, expectError,
} from './helpers/factory';

const app = createApp();
const valid = { make: 'Mazda', model: 'MX-5', category: 'convertible', priceCents: 3_200_000, quantity: 4 };

describe('POST /api/vehicles', () => {
  it('lets an admin create a vehicle', async () => {
    const { user } = await createAdmin();
    const res = await request(app).post('/api/vehicles').set('Authorization', authAs(user)).send(valid);
    expect(res.status).toBe(201);
    expect(res.body.vehicle).toMatchObject(valid);
    expect(typeof res.body.vehicle.id).toBe('string');
    expect(await prisma.vehicle.count()).toBe(1);
  });

  it('trims text fields', async () => {
    const { user } = await createAdmin();
    const res = await request(app).post('/api/vehicles').set('Authorization', authAs(user))
      .send({ ...valid, make: '  Mazda  ' });
    expect(res.body.vehicle.make).toBe('Mazda');
  });

  it('returns 403 FORBIDDEN for a regular user', async () => {
    const { user } = await createUser();
    const res = await request(app).post('/api/vehicles').set('Authorization', authAs(user)).send(valid);
    expectError(res, 403, 'FORBIDDEN');
    expect(await prisma.vehicle.count()).toBe(0);
  });

  it('returns 401 without a token', async () => {
    expectError(await request(app).post('/api/vehicles').send(valid), 401, 'UNAUTHORIZED');
  });

  it('returns 401 (not 403) for an expired admin token', async () => {
    const { user } = await createAdmin();
    const res = await request(app).post('/api/vehicles')
      .set('Authorization', `Bearer ${expiredTokenFor(user)}`).send(valid);
    expectError(res, 401, 'UNAUTHORIZED');
  });

  it.each([
    ['missing make', { ...valid, make: undefined }],
    ['blank make', { ...valid, make: '   ' }],
    ['make over 100 chars', { ...valid, make: 'x'.repeat(101) }],
    ['missing category', { ...valid, category: undefined }],
    ['decimal price', { ...valid, priceCents: 10.5 }],
    ['negative price', { ...valid, priceCents: -1 }],
    ['string price', { ...valid, priceCents: '100' }],
    ['negative quantity', { ...valid, quantity: -1 }],
    ['decimal quantity', { ...valid, quantity: 1.5 }],
    ['missing quantity', { ...valid, quantity: undefined }],
  ])('returns 400 for %s', async (_name, body) => {
    const { user } = await createAdmin();
    const res = await request(app).post('/api/vehicles').set('Authorization', authAs(user)).send(body);
    expectError(res, 400, 'VALIDATION_ERROR');
  });

  it('accepts zero price and zero quantity', async () => {
    const { user } = await createAdmin();
    const res = await request(app).post('/api/vehicles').set('Authorization', authAs(user))
      .send({ ...valid, priceCents: 0, quantity: 0 });
    expect(res.status).toBe(201);
  });
});

describe('PUT /api/vehicles/:id', () => {
  it('updates only the fields present in the body', async () => {
    const { user } = await createAdmin();
    const vehicle = await createVehicle({ make: 'Toyota', priceCents: 2_000_000, quantity: 5 });
    const res = await request(app).put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', authAs(user)).send({ priceCents: 1_900_000 });
    expect(res.status).toBe(200);
    expect(res.body.vehicle).toMatchObject({ id: vehicle.id, make: 'Toyota', priceCents: 1_900_000, quantity: 5 });
    const stored = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    expect(stored?.priceCents).toBe(1_900_000);
  });

  it('ignores unknown fields, including id', async () => {
    const { user } = await createAdmin();
    const vehicle = await createVehicle();
    const res = await request(app).put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', authAs(user)).send({ id: 'hijack', foo: 'bar', model: 'Yaris' });
    expect(res.status).toBe(200);
    expect(res.body.vehicle.id).toBe(vehicle.id);
    expect(res.body.vehicle.model).toBe('Yaris');
    expect(res.body.vehicle.foo).toBeUndefined();
  });

  it('applies the same validation as create', async () => {
    const { user } = await createAdmin();
    const vehicle = await createVehicle();
    const res = await request(app).put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', authAs(user)).send({ priceCents: -5 });
    expectError(res, 400, 'VALIDATION_ERROR');
  });

  it.each(['clxunknownid0000000000000', 'not-a-real-id'])('returns 404 VEHICLE_NOT_FOUND for id %s', async (id) => {
    const { user } = await createAdmin();
    const res = await request(app).put(`/api/vehicles/${id}`)
      .set('Authorization', authAs(user)).send({ model: 'Yaris' });
    expectError(res, 404, 'VEHICLE_NOT_FOUND');
  });

  it('returns 403 for a regular user and leaves the vehicle unchanged', async () => {
    const { user } = await createUser();
    const vehicle = await createVehicle({ model: 'Corolla' });
    const res = await request(app).put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', authAs(user)).send({ model: 'Hacked' });
    expectError(res, 403, 'FORBIDDEN');
    expect((await prisma.vehicle.findUnique({ where: { id: vehicle.id } }))?.model).toBe('Corolla');
  });

  it('returns 401 without a token', async () => {
    const vehicle = await createVehicle();
    expectError(await request(app).put(`/api/vehicles/${vehicle.id}`).send({ model: 'x' }), 401, 'UNAUTHORIZED');
  });
});

describe('DELETE /api/vehicles/:id', () => {
  it('lets an admin delete a vehicle: 204 with an empty body', async () => {
    const { user } = await createAdmin();
    const vehicle = await createVehicle();
    const res = await request(app).delete(`/api/vehicles/${vehicle.id}`).set('Authorization', authAs(user));
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(await prisma.vehicle.findUnique({ where: { id: vehicle.id } })).toBeNull();
  });

  it('returns 404 VEHICLE_NOT_FOUND for an unknown id', async () => {
    const { user } = await createAdmin();
    const res = await request(app).delete('/api/vehicles/clxunknownid0000000000000').set('Authorization', authAs(user));
    expectError(res, 404, 'VEHICLE_NOT_FOUND');
  });

  it('returns 403 for a regular user and keeps the vehicle', async () => {
    const { user } = await createUser();
    const vehicle = await createVehicle();
    const res = await request(app).delete(`/api/vehicles/${vehicle.id}`).set('Authorization', authAs(user));
    expectError(res, 403, 'FORBIDDEN');
    expect(await prisma.vehicle.count()).toBe(1);
  });

  it('returns 401 for an expired admin token', async () => {
    const { user } = await createAdmin();
    const vehicle = await createVehicle();
    const res = await request(app).delete(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${expiredTokenFor(user)}`);
    expectError(res, 401, 'UNAUTHORIZED');
  });
});
