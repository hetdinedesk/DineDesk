const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentCMSData() {
  try {
    console.log('Checking current CMS data...');
    
    // Find the reviews section
    const reviewsSection = await prisma.homeSection.findFirst({
      where: {
        type: 'reviews',
        clientId: 'cmnd5kehd0000vogh3tzzz2ws'
      }
    });
    
    if (!reviewsSection) {
      console.log('No reviews section found');
      return;
    }
    
    console.log('=== CURRENT CMS DATA ===');
    console.log('Section ID:', reviewsSection.id);
    console.log('Title:', reviewsSection.title);
    console.log('Content (raw):', reviewsSection.content);
    
    if (reviewsSection.content) {
      try {
        const parsedContent = JSON.parse(reviewsSection.content);
        console.log('Content (parsed):', parsedContent);
        console.log('Subtitle:', parsedContent.subtitle);
        console.log('CTA:', parsedContent.cta);
      } catch (e) {
        console.log('Error parsing content:', e.message);
      }
    }
    
    // Also check site config for reviews settings
    const siteConfig = await prisma.siteConfig.findUnique({
      where: { clientId: 'cmnd5kehd0000vogh3tzzz2ws' }
    });
    
    if (siteConfig?.reviews) {
      console.log('=== SITE CONFIG REVIEWS ===');
      console.log('Site config reviews:', siteConfig.reviews);
      console.log('Carousel heading:', siteConfig.reviews.carouselHeading);
    }
    
    // Clear the export cache to force fresh data
    const { exportCache } = require('../src/routes/clients.js');
    if (exportCache) {
      exportCache.delete('cmnd5kehd0000vogh3tzzz2ws');
      console.log('✅ Cleared export cache');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentCMSData();
