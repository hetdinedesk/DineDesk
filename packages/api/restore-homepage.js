const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();

async function restoreHomepageSections() {
  try {
    console.log('🔄 Restoring HomePageSection system from HomepageLayout data...');
    
    // Get homepage layout data
    const layoutData = await prisma.homepageLayout.findUnique({
      where: { clientId: 'demo-client' }
    });
    
    if (!layoutData || !layoutData.components) {
      console.log('❌ No homepage layout data found');
      return;
    }
    
    // Clear existing HomeSections
    await prisma.homeSection.deleteMany({
      where: { clientId: 'demo-client' }
    });
    
    // Component mapping
    const componentMapping = {
      'welcome': { type: 'hero', title: 'Welcome Content', content: 'Main welcome section for homepage' },
      'promos': { type: 'promo-tile', title: 'Promo Tiles', content: 'Promotional tiles section' },
      'specials': { type: 'specials', title: 'Specials Section', content: 'Current specials and offers' },
      'reviews': { type: 'reviews', title: 'Reviews Section', content: 'Customer reviews and testimonials' }
    };
    
    // Create new HomeSections from layout components
    const homeSections = layoutData.components
      .filter(comp => ['welcome', 'promos', 'specials', 'reviews'].includes(comp.type))
      .map((comp, index) => {
        const mapping = componentMapping[comp.type];
        return {
          clientId: 'demo-client',
          type: mapping.type,
          title: mapping.title,
          content: mapping.content,
          sortOrder: index,
          isActive: comp.visible !== false,
          imageUrl: comp.type === 'welcome' ? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920' : null,
          buttonText: comp.type === 'welcome' ? 'Reserve a Table' : null,
          buttonUrl: comp.type === 'welcome' ? '/book' : null
        };
      });
    
    // Insert new sections
    await prisma.homeSection.createMany({
      data: homeSections
    });
    
    console.log('✅ Successfully restored HomePageSection system!');
    console.log('📋 Created sections:');
    homeSections.forEach((section, index) => {
      console.log(`   ${index + 1}. ${section.type} - ${section.title}`);
    });
    
  } catch (error) {
    console.error('❌ Error restoring homepage sections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreHomepageSections();
