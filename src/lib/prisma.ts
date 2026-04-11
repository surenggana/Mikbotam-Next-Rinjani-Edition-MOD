import { PrismaClient } from '../generated/client/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const initializePrisma = () => {
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/mikbotam.db'
  
  // Prisma 7 PrismaBetterSqlite3 takes an object with url
  const adapter = new PrismaBetterSqlite3({ 
    url: dbUrl 
  })
  
  return new PrismaClient({
    adapter,
    log: ['query'],
  })
}

export const prisma = globalForPrisma.prisma || initializePrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
