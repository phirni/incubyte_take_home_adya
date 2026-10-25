import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { errorHandler } from '../src/middleware/errorHandler';
import { prisma } from '../src/lib/prisma';
import { authAs, createAdmin, createVehicle, expectError } from './helpers/factory';

const app = createApp();

describe('unexpected database errors', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the standard 500 response when registration fails unexpectedly', async () => {
    vi.spyOn(prisma.user, 'create').mockRejectedValueOnce(new Error('database unavailable'));

    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'unexpected@example.com', password: 'password123' });

    expectError(response, 500, 'INTERNAL_ERROR');
    expect(JSON.stringify(response.body)).not.toContain('database unavailable');
  });

  it('returns the standard 500 response when restock fails unexpectedly', async () => {
    const { user } = await createAdmin();
    const vehicle = await createVehicle();
    vi.spyOn(prisma.vehicle, 'update').mockRejectedValueOnce(new Error('database unavailable'));

    const response = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', authAs(user))
      .send({ quantity: 2 });

    expectError(response, 500, 'INTERNAL_ERROR');
  });

  it('returns the standard 500 response when vehicle update fails unexpectedly', async () => {
    const { user } = await createAdmin();
    const vehicle = await createVehicle();
    vi.spyOn(prisma.vehicle, 'update').mockRejectedValueOnce(new Error('database unavailable'));

    const response = await request(app)
      .put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', authAs(user))
      .send({ model: 'Updated' });

    expectError(response, 500, 'INTERNAL_ERROR');
  });

  it('returns the standard 500 response when vehicle deletion fails unexpectedly', async () => {
    const { user } = await createAdmin();
    const vehicle = await createVehicle();
    vi.spyOn(prisma.vehicle, 'delete').mockRejectedValueOnce(new Error('database unavailable'));

    const response = await request(app)
      .delete(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', authAs(user));

    expectError(response, 500, 'INTERNAL_ERROR');
  });

  it('hides an unexpected thrown error in the generic error handler', async () => {
    const failingApp = express();
    failingApp.get('/failure', () => {
      throw new Error('private database detail');
    });
    failingApp.use(errorHandler);

    const response = await request(failingApp).get('/failure');

    expectError(response, 500, 'INTERNAL_ERROR');
    expect(JSON.stringify(response.body)).not.toContain('private database detail');
  });
});
