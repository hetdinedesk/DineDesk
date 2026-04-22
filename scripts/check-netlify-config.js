const { PrismaClient } = require('c:/Users/Het Shah/dinedesk/packages/api/node_modules/@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        siteConfig: true
      }
    });
    
    console.log('Clients and their Netlify config:');
    console.log(JSON.stringify(clients, null, 2));
    
    await prisma.$disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
