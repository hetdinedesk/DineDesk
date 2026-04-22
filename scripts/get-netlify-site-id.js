require('dotenv').config({ path: 'packages/api/.env' });
const { PrismaClient } = require('./packages/api/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function getNetlifySiteId() {
  try {
    // Find all clients with Netlify configuration
    const configs = await prisma.siteConfig.findMany({
      where: {
        netlify: {
          not: null
        }
      },
      select: {
        clientId: true,
        netlify: true
      }
    });

    console.log('Found Netlify configurations:');
    console.log(JSON.stringify(configs, null, 2));

    await prisma.$disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

getNetlifySiteId();
