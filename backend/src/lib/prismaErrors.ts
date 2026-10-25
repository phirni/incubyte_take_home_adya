import { Prisma } from '@prisma/client';

/** True when `err` is a Prisma known-request error with the given code (e.g. P2002, P2025). */
export function hasPrismaCode(err: unknown, code: string): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;
}
