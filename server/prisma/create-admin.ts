/**
 * Creates (or promotes) an admin account without touching any other data.
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='StrongPass123' ADMIN_NAME='Your Name' npm run admin:create
 *
 * If a user with that email already exists they are promoted to ADMIN
 * (their password is only changed if ADMIN_PASSWORD is provided).
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Administrator';

  if (!email) throw new Error('ADMIN_EMAIL is required');

  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'ADMIN',
        status: 'ACTIVE',
        suspendedAt: null,
        suspensionReason: null,
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
    });
    console.log(`Promoted existing user ${existing.email} to ADMIN`);
    return;
  }

  if (!password || password.length < 8) throw new Error('ADMIN_PASSWORD (min 8 chars) is required for a new admin');

  await prisma.user.create({
    data: { name, email, password: await bcrypt.hash(password, 10), role: 'ADMIN' },
  });
  console.log(`Created admin ${email}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
