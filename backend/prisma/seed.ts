import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Development-only credentials. Never reuse these outside local development.
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

const vehicles = [
  { make: 'Toyota', model: 'Corolla', category: 'sedan', priceCents: 2_200_000, quantity: 8 },
  { make: 'Toyota', model: 'Camry', category: 'sedan', priceCents: 2_800_000, quantity: 5 },
  { make: 'Honda', model: 'Civic', category: 'sedan', priceCents: 2_400_000, quantity: 6 },
  { make: 'Honda', model: 'CR-V', category: 'suv', priceCents: 3_300_000, quantity: 4 },
  { make: 'Ford', model: 'F-150', category: 'truck', priceCents: 4_500_000, quantity: 3 },
  { make: 'Ford', model: 'Mustang', category: 'coupe', priceCents: 4_100_000, quantity: 2 },
  { make: 'Tesla', model: 'Model 3', category: 'sedan', priceCents: 4_200_000, quantity: 1 },
  { make: 'BMW', model: 'X5', category: 'suv', priceCents: 6_500_000, quantity: 0 },
  { make: 'Mazda', model: 'MX-5', category: 'convertible', priceCents: 3_200_000, quantity: 3 },
  { make: 'Subaru', model: 'Outback', category: 'wagon', priceCents: 3_100_000, quantity: 7 },
];

async function main() {
  // Safe to re-run: the admin is keyed by email, inventory is only seeded into an empty table.
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: 'ADMIN',
    },
  });

  if ((await prisma.vehicle.count()) === 0) {
    await prisma.vehicle.createMany({ data: vehicles });
  }
  console.log(`Seeded admin ${ADMIN_EMAIL} and ${await prisma.vehicle.count()} vehicles.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
