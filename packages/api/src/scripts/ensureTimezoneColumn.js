const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function ensureTimezoneColumn() {
  try {
    console.log('Checking if Location.timezone column exists...')
    
    // Try to query the column - if it fails, add it
    try {
      await prisma.$queryRaw`SELECT timezone FROM "Location" LIMIT 1`
      console.log('✅ Location.timezone column already exists')
      return
    } catch (err) {
      console.log('⏳ Location.timezone column missing, adding it...')
    }
    
    // Add the column
    await prisma.$executeRaw`
      ALTER TABLE "Location" ADD COLUMN "timezone" TEXT DEFAULT 'Australia/Sydney'
    `
    console.log('✅ Location.timezone column added successfully')
    
  } catch (err) {
    console.error('❌ Error ensuring timezone column:', err.message)
    // Don't throw - let the server start anyway
  } finally {
    await prisma.$disconnect()
  }
}

ensureTimezoneColumn()
