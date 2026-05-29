const { PrismaClient } = require('@prisma/client')

const globalForPrisma = globalThis

// Connection pool settings for Railway/Railway-like environments
// connection_limit=5 prevents overwhelming the DB
// pool_timeout=10 gives quick feedback on connection issues
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'production'
    ? ['error', 'warn']
    : ['error', 'warn']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

module.exports = { prisma }
