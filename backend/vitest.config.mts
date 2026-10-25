import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    pool: 'forks',
    maxWorkers: 1,
    setupFiles: ['./tests/setup.ts'],
    env: {
      DATABASE_URL: 'file:./test.db',
      BCRYPT_ROUNDS: '4',
      JWT_SECRET: 'test-secret-do-not-use-in-prod',
    },
  },
});
