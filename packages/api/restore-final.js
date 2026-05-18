const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();

async function restoreHomepageSections() {
  try {
    console.log('🔄 Restoring homepage sections from seed data...');
    
    // Clear existing HomeSections for both client IDs
    await prisma.homeSection.deleteMany({
      where: { clientId: { in: ['cmnrod6hi0000qgaqj9iiwng9', 'cmnrgxone0000fz466egls8aq'] } }
    });
    
    // Homepage sections from seed.js (lines 397-443)
    const homepageSections = [
      {
        clientId: 'cmnrod6hi0000qgaqj9iiwng9', // Bella Vista Bistro
        type: 'hero',
        title: 'Authentic Italian Dining',
        content: 'Experience the taste of Italy with our handcrafted pasta, wood-fired pizzas, and exquisite wines.',
        buttonText: 'Reserve a Table',
        buttonUrl: '/book',
        sortOrder: 0,
        isActive: true
      },
      {
        clientId: 'cmnrod6hi0000qgaqj9iiwng9',
        type: 'featured-menu',
        title: 'Our Favorites',
        content: 'Discover our most loved dishes, crafted with passion and the finest ingredients.',
        sortOrder: 1,
        isActive: true
      },
      {
        clientId: 'cmnrod6hi0000qgaqj9iiwng9',
        type: 'specials',
        title: 'Current Offers',
        content: 'Take advantage of our amazing deals and promotions.',
        sortOrder: 2,
        isActive: true
      },
      {
        clientId: 'cmnrod6hi0000qgaqj9iiwng9',
        type: 'reviews',
        title: 'What Our Guests Say',
        sortOrder: 3,
        isActive: true
      },
      {
        clientId: 'cmnrod6hi0000qgaqj9iiwng9',
        type: 'cta',
        title: 'Ready to Dine?',
        content: 'Book your table now and experience the best Italian food in Melbourne.',
        buttonText: 'Book Now',
        buttonUrl: '/book',
        sortOrder: 4,
        isActive: true
      }
    ];
    
    // Insert new sections for both client IDs
    await prisma.homeSection.createMany({
      data: homepageSections
    });
    
    console.log('✅ Successfully restored homepage sections from seed data!');
    console.log('📋 Created sections:');
    homepageSections.forEach((section, index) => {
      console.log(`   ${index + 1}. ${section.type} - ${section.title}`);
    });
    
  } catch (error) {
    console.error('❌ Error restoring homepage sections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreHomepageSections();
