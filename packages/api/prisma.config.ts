import { defineDbConfig } from '@prisma/infra'

export default defineDbConfig({
  url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/dinedesk?schema=public'
})
