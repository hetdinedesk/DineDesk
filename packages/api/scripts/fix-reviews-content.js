const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixReviewsContent() {
  try {
    console.log('Fixing reviews section content...');
    
    // Find the reviews section
    const reviewsSection = await prisma.homeSection.findFirst({
      where: {
        type: 'reviews',
        clientId: 'cmnd5kehd0000vogh3tzzz2ws' // Your client ID from the logs
      }
    });
    
    if (!reviewsSection) {
      console.log('No reviews section found');
      return;
    }
    
    console.log('Found reviews section:', reviewsSection.id);
    console.log('Current content:', reviewsSection.content);
    
    // Update with proper content
    const updatedContent = {
      subtitle: 'reviews at {{restaurantName}}',
      showGoogleReviews: true,
      showRegularReviews: false,
      alternateStyle: false,
      cta: {
        active: true,
        label: 'Leave a Review',
        variant: 'primary',
        url: 'https://search.google.com/local/writereview?placeid=example'
      }
    };
    
    const updated = await prisma.homeSection.update({
      where: { id: reviewsSection.id },
      data: {
        content: JSON.stringify(updatedContent)
      }
    });
    
    console.log('Updated reviews section content:');
    console.log(updated.content);
    
    // Clear the export cache
    const { exportCache } = require('../src/routes/clients.js');
    if (exportCache) {
      exportCache.delete('cmnd5kehd0000vogh3tzzz2ws');
      console.log('Cleared export cache');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixReviewsContent();
