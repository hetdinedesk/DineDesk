require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = await bcrypt.hash('password', 10)
  await prisma.user.create({
    data: { name: 'Alex Nguyen', email: 'alex@dinedesk.io', password: hash, role: 'SUPER_ADMIN' }
  })
  const group = await prisma.group.create({
    data: { name: 'Urban Eats Group', color: '#FF6B2B' }
  })
  const client = await prisma.client.create({
    data: { name: 'Urban Eats Melbourne', domain: 'urbaneatsmcl.com.au', status: 'live', groupId: group.id }
  })
  await prisma.siteConfig.create({ data: { clientId: client.id } })
  console.log('✅ Seed complete!')
}

main().finally(() => prisma.$disconnect())