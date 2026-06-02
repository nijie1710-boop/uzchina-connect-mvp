import "dotenv/config";
import { scryptSync, randomBytes } from "node:crypto";
import prismaClient from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const { PrismaClient, UserRole } = prismaClient;

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/uzchina_connect?schema=public";
const adminEmail = process.env.ADMIN_EMAIL ?? "admin@uzchina-connect.com";
const newPassword = process.env.ADMIN_PASSWORD ?? process.argv[2];

if (!newPassword) {
  console.error("ADMIN_PASSWORD is required. Example: ADMIN_PASSWORD='NewStrong123456' pnpm admin:set-password");
  process.exit(1);
}

if (newPassword.length < 12 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
  console.error("Admin password must be at least 12 characters and include letters and numbers.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl)
});

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true, email: true, role: true }
  });

  if (!user) {
    throw new Error(`Admin user not found: ${adminEmail}`);
  }

  if (user.role !== UserRole.ADMIN) {
    throw new Error(`User is not an admin: ${adminEmail}`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword) }
  });

  console.log(`Admin password updated for ${adminEmail}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
