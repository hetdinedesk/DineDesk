const { PrismaClient } = require('@prisma/client')

const globalForPrisma = globalThis

// Connection pool: cap at 10 connections to avoid overwhelming DB under load.
// Prisma default is num_cpus * 2 + 1 which can be too high on shared DB plans.
const DATABASE_URL = process.env.DATABASE_URL || ''
const pooledUrl = DATABASE_URL.includes('connection_limit')
  ? DATABASE_URL
  : DATABASE_URL + (DATABASE_URL.includes('?') ? '&' : '?') + 'connection_limit=10&pool_timeout=20'

const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: { db: { url: pooledUrl } },
  log: ['error', 'warn']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

module.exports = { prisma }
