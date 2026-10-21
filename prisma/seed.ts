import { PrismaClient, Role, Plan } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

const BCRYPT_SALT_ROUNDS = 12;

interface SeedAccount {
  email: string;
  fullName: string;
  password: string;
  role: Role;
  plan: Plan;
  codePrefix: string;
  avatarSeed: string;
}

const seedAccounts: SeedAccount[] = [
  {
    email: (process.env.ADMIN_EMAIL || 'admin@unlupa.id').trim().toLowerCase(),
    fullName: process.env.ADMIN_NAME || 'Admin Unlupa',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
    role: Role.ADMIN,
    plan: Plan.INSTITUTIONAL,
    codePrefix: 'ADM',
    avatarSeed: 'admin-unlupa',
  },
  {
    email: (process.env.SUPERADMIN_EMAIL || 'superadmin@unlupa.id').trim().toLowerCase(),
    fullName: process.env.SUPERADMIN_NAME || 'Super Admin Unlupa',
    password: process.env.SUPERADMIN_PASSWORD || 'SuperAdmin123!',
    role: Role.SUPERADMIN,
    plan: Plan.INSTITUTIONAL,
    codePrefix: 'SPR',
    avatarSeed: 'superadmin-unlupa',
  },
];

async function generateQuranSpaceCode(prefix: string): Promise<string> {
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `UNL-${prefix}-${randomHex}`;
}

async function main() {
  console.log('🌱 Menjalankan Seeder Akun Admin & Super Admin Unlupa...\n');

  for (const account of seedAccounts) {
    const passwordHash = await bcrypt.hash(account.password, BCRYPT_SALT_ROUNDS);

    const existingUser = await prisma.user.findUnique({
      where: { email: account.email },
    });

    if (existingUser) {
      const updated = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          fullName: account.fullName,
          role: account.role,
          plan: account.plan,
          passwordHash,
          avatarUrl: existingUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(account.avatarSeed)}`,
        },
      });

      console.log(`✅ [UPDATED] Akun ${account.role}:`);
      console.log(`   - Email: ${updated.email}`);
      console.log(`   - Password: ${account.password}`);
      console.log(`   - Nama: ${updated.fullName}`);
      console.log(`   - Role: ${updated.role}`);
      console.log(`   - Plan: ${updated.plan}`);
      console.log(`   - Quran Space Code: ${updated.quranSpaceCode}\n`);
    } else {
      let quranSpaceCode = await generateQuranSpaceCode(account.codePrefix);
      // Pastikan quranSpaceCode belum terpakai
      while (await prisma.user.findUnique({ where: { quranSpaceCode } })) {
        quranSpaceCode = await generateQuranSpaceCode(account.codePrefix);
      }

      const created = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: account.email,
          fullName: account.fullName,
          passwordHash,
          role: account.role,
          plan: account.plan,
          quranSpaceCode,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(account.avatarSeed)}`,
          onboardingPreferences: {
            hasCompletedOnboarding: true,
            theme: 'light',
            language: 'id',
          },
        },
      });

      console.log(`✨ [CREATED] Akun ${account.role}:`);
      console.log(`   - Email: ${created.email}`);
      console.log(`   - Password: ${account.password}`);
      console.log(`   - Nama: ${created.fullName}`);
      console.log(`   - Role: ${created.role}`);
      console.log(`   - Plan: ${created.plan}`);
      console.log(`   - Quran Space Code: ${created.quranSpaceCode}\n`);
    }
  }

  console.log('🎉 Seeder berhasil dijalankan!');
}

main()
  .catch((e) => {
    console.error('❌ Gagal menjalankan seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
