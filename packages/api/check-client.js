const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();

async function checkClients() {
  try {
    console.log('🔍 Checking available clients...');
    
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        domain: true
      }
    });
    
    console.log('📋 Available clients:');
    clients.forEach((client, index) => {
      console.log(`   ${index + 1}. ID: ${client.id} | Name: ${client.name} | Domain: ${client.domain}`);
    });
    
    // Check if demo-client exists
    const demoClient = clients.find(c => c.id === 'demo-client');
    if (demoClient) {
      console.log('✅ Found demo-client!');
    } else {
      console.log('❌ demo-client not found! Available client IDs:');
      clients.forEach(c => console.log(`   - ${c.id}`));
    }
    
  } catch (error) {
    console.error('❌ Error checking clients:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClients();
