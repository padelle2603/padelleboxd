import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: url,
      max: 10,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    }),
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

globalForPrisma.prisma = prisma;