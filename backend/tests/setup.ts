import { beforeAll, beforeEach } from 'vitest';
import { execSync } from 'node:child_process';
import { prisma } from './helpers/db';

beforeAll(() => {
  execSync('pnpm exec prisma db push --skip-generate --force-reset', {
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'inherit',
  });
});

beforeEach(async () => {
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
});
