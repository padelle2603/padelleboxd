import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`Seed: admin user "${username}" already exists, skipping.`);
    return;
  }

  if (!password) {
    console.error("Seed: ADMIN_PASSWORD is required to bootstrap the admin account.");
    process.exit(1);
  }

  const passwordHash = hashPassword(password);
  await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`Seed: admin user "${username}" created. Change the password after first login.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });