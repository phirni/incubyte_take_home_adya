import { describe, expect, it, vi } from 'vitest';

const configKeys = ['JWT_SECRET', 'BCRYPT_ROUNDS', 'CORS_ORIGIN', 'PORT'] as const;

function snapshotConfigEnv() {
  return new Map(configKeys.map((key) => [key, process.env[key]]));
}

function restoreConfigEnv(snapshot: Map<(typeof configKeys)[number], string | undefined>) {
  for (const [key, value] of snapshot) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe('runtime configuration', () => {
  it('fails fast when JWT_SECRET is missing', async () => {
    const snapshot = snapshotConfigEnv();
    delete process.env.JWT_SECRET;
    vi.resetModules();

    try {
      await expect(import('../src/config')).rejects.toThrow(
        'Missing required environment variable: JWT_SECRET',
      );
    } finally {
      restoreConfigEnv(snapshot);
      vi.resetModules();
    }
  });

  it('uses documented defaults for optional settings', async () => {
    const snapshot = snapshotConfigEnv();
    process.env.JWT_SECRET = 'config-test-secret';
    delete process.env.BCRYPT_ROUNDS;
    delete process.env.CORS_ORIGIN;
    delete process.env.PORT;
    vi.resetModules();

    try {
      const { config } = await import('../src/config');
      expect(config).toEqual({
        jwtSecret: 'config-test-secret',
        bcryptRounds: 10,
        corsOrigin: 'http://localhost:5173',
        port: 3000,
      });
    } finally {
      restoreConfigEnv(snapshot);
      vi.resetModules();
    }
  });
});
