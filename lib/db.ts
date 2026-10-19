import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig, type WebSocketConstructor } from "@neondatabase/serverless";
import WebSocket from "ws";

// Neon uses WebSockets for pooled PostgreSQL connections in Node.js runtimes.
neonConfig.webSocketConstructor = WebSocket as unknown as WebSocketConstructor;

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize PrismaClient.");
  }
  // Prisma 7.x: pass config object directly, not a Pool instance
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient());
