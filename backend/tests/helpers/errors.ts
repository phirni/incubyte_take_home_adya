import { expect } from 'vitest';
import type { Response } from 'supertest';

export type ErrorExpectation = {
  status: number;
  code: string;
};

export function expectErrorShape(res: Response, expected: ErrorExpectation) {
  expect(res.status).toBe(expected.status);
  expect(res.body).toHaveProperty('error');
  expect(res.body.error).toHaveProperty('code', expected.code);
  expect(typeof res.body.error.message).toBe('string');
  expect(res.body.error.message.length).toBeGreaterThan(0);

  const serialized = JSON.stringify(res.body);
  expect(serialized).not.toMatch(/passwordHash/i);
  expect(serialized).not.toMatch(/at\s+.+:\d+:\d+/);
}