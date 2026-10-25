import { PrismaClient } from '@prisma/client';

/**
 * The one shared Prisma client. SQLite allows a single writer, so the app and
 * the tests must not open competing connections. Import this everywhere.
 */
export const prisma = new PrismaClient();
