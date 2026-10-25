import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import {
  createUser, createVehicle, authAs, expiredTokenFor, expectError,
} from './helpers/factory';

const app = createApp();

describe('unknown routes', () => {
  it('returns 404 NOT_FOUND in the standard envelope', async () => {
    expectError(await request(app).get('/api/does-not-exist'), 404, 'NOT_FOUND');
  });
});

describe('authentication on vehicle routes', () => {
  const paths = ['/api/vehicles', '/api/vehicles/search'];

  it.each(paths)('GET %s without a token returns 401', async (path) => {
    expectError(await request(app).get(path), 401, 'UNAUTHORIZED');
  });

  it.each(paths)('GET %s with a garbage token returns 401', async (path) => {
    const res = await request(app).get(path).set('Authorization', 'Bearer garbage');
    expectError(res, 401, 'UNAUTHORIZED');
  });

  it.each(paths)('GET %s with a non-Bearer scheme returns 401', async (path) => {
    const res = await request(app).get(path).set('Authorization', 'Basic abc123');
    expectError(res, 401, 'UNAUTHORIZED');
  });

  it.each(paths)('GET %s with an expired token returns 401', async (path) => {
    const { user } = await createUser();
    const res = await request(app).get(path).set('Authorization', `Bearer ${expiredTokenFor(user)}`);
    expectError(res, 401, 'UNAUTHORIZED');
  });

  it('rejects a token signed with the wrong secret', async () => {
    const { user } = await createUser();
    const forged = jwt.sign({ sub: user.id, role: 'ADMIN' }, 'some-other-secret', { expiresIn: '1h' });
    const res = await request(app).get('/api/vehicles').set('Authorization', `Bearer ${forged}`);
    expectError(res, 401, 'UNAUTHORIZED');
  });
});

describe('GET /api/vehicles', () => {
  it('returns an empty list when there are no vehicles', async () => {
    const { user } = await createUser();
    const res = await request(app).get('/api/vehicles').set('Authorization', authAs(user));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ vehicles: [] });
  });

  it('returns all vehicles with the documented fields, including out-of-stock ones', async () => {
    const { user } = await createUser();
    await createVehicle({ model: 'Corolla', quantity: 5 });
    await createVehicle({ model: 'Camry', quantity: 0 });
    const res = await request(app).get('/api/vehicles').set('Authorization', authAs(user));
    expect(res.status).toBe(200);
    expect(res.body.vehicles).toHaveLength(2);
    expect(Object.keys(res.body.vehicles[0]).sort()).toEqual(
      ['category', 'createdAt', 'id', 'make', 'model', 'priceCents', 'quantity', 'updatedAt'].sort(),
    );
    expect(res.body.vehicles.map((v: { quantity: number }) => v.quantity).sort()).toEqual([0, 5]);
  });
});

describe('GET /api/vehicles/search', () => {
  let auth: string;

  beforeEach(async () => {
    const { user } = await createUser();
    auth = authAs(user);
    await createVehicle({ make: 'Toyota', model: 'Corolla', category: 'sedan', priceCents: 2_000_000, quantity: 5 });
    await createVehicle({ make: 'Honda', model: 'Civic', category: 'sedan', priceCents: 2_200_000, quantity: 3 });
    await createVehicle({ make: 'Ford', model: 'F-150', category: 'truck', priceCents: 4_500_000, quantity: 0 });
    await createVehicle({ make: 'Toyota', model: 'Camry', category: 'sedan', priceCents: 2_800_000, quantity: 2 });
  });

  const search = (query: Record<string, string>) =>
    request(app).get('/api/vehicles/search').query(query).set('Authorization', auth);
  const models = (res: request.Response) =>
    res.body.vehicles.map((v: { model: string }) => v.model).sort();

  it('returns everything when no filters are given', async () => {
    expect(models(await search({}))).toEqual(['Camry', 'Civic', 'Corolla', 'F-150']);
  });

  it('filters by make, case-insensitively', async () => {
    expect(models(await search({ make: 'TOYOTA' }))).toEqual(['Camry', 'Corolla']);
  });

  it('filters by model (partial, case-insensitive)', async () => {
    expect(models(await search({ model: 'civ' }))).toEqual(['Civic']);
  });

  it('filters by category and includes out-of-stock vehicles', async () => {
    expect(models(await search({ category: 'Truck' }))).toEqual(['F-150']);
  });

  it('filters by minPrice (inclusive)', async () => {
    expect(models(await search({ minPrice: '2200000' }))).toEqual(['Camry', 'Civic', 'F-150']);
  });

  it('filters by maxPrice (inclusive)', async () => {
    expect(models(await search({ maxPrice: '2200000' }))).toEqual(['Civic', 'Corolla']);
  });

  it('accepts minPrice equal to maxPrice', async () => {
    expect(models(await search({ minPrice: '2200000', maxPrice: '2200000' }))).toEqual(['Civic']);
  });

  it('combines filters with AND semantics', async () => {
    const res = await search({ make: 'toyota', category: 'sedan', maxPrice: '2000000' });
    expect(models(res)).toEqual(['Corolla']);
  });

  it('treats empty-string filters as absent', async () => {
    const res = await search({ make: '', model: '', category: '', minPrice: '', maxPrice: '' });
    expect(res.status).toBe(200);
    expect(res.body.vehicles).toHaveLength(4);
  });

  it('returns 200 with an empty list when nothing matches', async () => {
    const res = await search({ make: 'Lada' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ vehicles: [] });
  });

  it.each([
    ['non-numeric minPrice', { minPrice: 'abc' }, 'minPrice'],
    ['negative minPrice', { minPrice: '-5' }, 'minPrice'],
    ['decimal maxPrice', { maxPrice: '10.5' }, 'maxPrice'],
    ['negative maxPrice', { maxPrice: '-1' }, 'maxPrice'],
    ['minPrice greater than maxPrice', { minPrice: '500', maxPrice: '100' }, 'minPrice'],
  ])('returns 400 for %s with a field-level message', async (_name, query, field) => {
    const res = await search(query);
    expectError(res, 400, 'VALIDATION_ERROR');
    expect(res.body.error.message).toContain(field);
  });
});
