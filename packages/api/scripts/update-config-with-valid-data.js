/**
 * Update Existing Site Config with Valid Data
 * This script populates the siteConfig with realistic, production-ready data
 * Run: node scripts/update-config-with-valid-data.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Updating existing site configs with valid data...\n')

  // Get all site configs
  const configs = await prisma.siteConfig.findMany({
    include: { client: true }
  })

  if (configs.length === 0) {
    console.log('❌ No site configs found. Please run seed first.')
    return
  }

  for (const config of configs) {
    console.log(`📝 Updating: ${config.client.name}`)
    
    const updateData = {
      version: (config.version || 0) + 1,
      settings: {
        restaurantName: config.client.name || 'Restaurant',
        displayName: `${config.client.name} - Fine Dining Experience`,
        defaultEmail: `hello@${config.client.domain || 'restaurant.com'}`.replace('www.', '').replace('.com.au', '.com'),
        siteType: 'restaurant',
        indexing: 'blocked',
        phone: '+61 3 9999 8888',
        suburb: 'Melbourne CBD',
        logoLight: config.settings?.logoLight || 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=200',
        logoDark: config.settings?.logoDark || 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=200',
        favicon: config.settings?.favicon || 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=32',
        country: 'Australia',
        timezone: 'Australia/Melbourne',
        ...(config.settings?.abn && { abn: config.settings.abn })
      },
      colours: config.colours || {
        theme: 'finedine',
        primary: '#C8823A',
        secondary: '#1C2B1A',
        headerBg: '#ffffff',
        headerText: '#1A1A1A',
        navBg: '#1C2B1A',
        navText: '#ffffff',
        bodyBg: '#ffffff',
        bodyText: '#1A1A1A',
        ctaBg: '#C8823A',
        ctaText: '#ffffff',
        accentBg: '#F7F2EA'
      },
      header: config.header || {
        type: 'standard-full',
        utilityBelt: true,
        utilityItems: {
          phone: true,
          email: true,
          social: true
        },
        headerTheme: 'light'
      },
      headerCtas: config.headerCtas || [
        {
          id: 'cta-1',
          label: 'Book a Table',
          type: 'internal',
          value: '/book',
          variant: 'primary',
          active: true,
          workingTitle: 'Main Booking CTA'
        },
        {
          id: 'cta-2',
          label: 'Order Online',
          type: 'internal',
          value: '/order',
          variant: 'secondary',
          active: true,
          workingTitle: 'Online Order CTA'
        }
      ],
      footer: config.footer || {
        tagline: 'Authentic Cuisine in the Heart of Melbourne',
        copyrightText: `© ${new Date().getFullYear()} ${config.client.name}. All rights reserved.`,
        legalLinks: [
          { label: 'Privacy Policy', href: '/privacy-policy' },
          { label: 'Terms of Service', href: '/terms-of-service' }
        ]
      },
      social: config.social || {
        facebook: 'https://www.facebook.com/YourRestaurantPage',
        instagram: 'https://www.instagram.com/yourrestaurant',
        twitter: 'https://twitter.com/yourrestaurant',
        tiktok: 'https://www.tiktok.com/@yourrestaurant',
        youtube: 'https://www.youtube.com/@YourRestaurant',
        linkedin: 'https://www.linkedin.com/company/your-restaurant',
        showInFooter: true,
        showInUtility: true
      },
      reviews: config.reviews || {
        overallScore: 4.8,
        totalReviews: 324,
        googleScore: 4.8,
        googleCount: 285,
        tripScore: 4.7,
        tripCount: 156,
        fbScore: 4.9,
        fbCount: 89,
        googlePlaceId: '',
        minStars: 3,
        enableHeader: true,
        enableFooter: true,
        carouselHeading: "What Our Guests Say",
        carouselSubHeading: "Rated 4.8 stars on Google",
        carouselContent: "We're proud to serve authentic cuisine with love and passion",
        ctas: [
          {
            id: 'review-cta-1',
            label: 'Leave a Review',
            type: 'external',
            value: 'https://goo.gl/maps/example',
            variant: 'outline',
            active: true,
            workingTitle: 'Google Review Link'
          }
        ]
      },
      booking: config.booking || {
        bookingUrl: 'https://resy.com/cities/melbourne/your-restaurant',
        bookingPhone: '+61 3 9999 8888',
        bookLabel: 'Reserve Your Table',
        orderUrl: 'https://order.yourrestaurant.com.au',
        orderLabel: 'Order Online',
        uberEatsUrl: 'https://www.ubereats.com/au/store/your-restaurant',
        doorDashUrl: 'https://www.doordash.com/store/your-restaurant',
        menulogUrl: 'https://www.menulog.com.au/restaurants-your-restaurant',
        showInHeader: true,
        showInUtility: true,
        showInHero: true,
        showOnLocations: true,
        showInFooter: true,
        showOrderBtn: true,
        useDirectForm: false,
        minParty: 2,
        maxParty: 12,
        advanceNotice: 2,
        maxDaysAhead: 60,
        slotInterval: 30,
        notifyEmail: `bookings@${config.client.domain || 'restaurant.com'}`.replace('www.', ''),
        pickupEnabled: true,
        deliveryEnabled: true,
        dineInEnabled: true,
        pickupTime: '30 minutes',
        minOrder: 25,
        deliveryFee: 5.95,
        deliveryTime: '45-60 minutes',
        freeDeliveryOver: 50
      },
      shortcodes: config.shortcodes || {
        primaryColor: '#C8823A',
        phone: '+61 3 9999 8888',
        email: `hello@${config.client.domain || 'restaurant.com'}`.replace('www.', ''),
        address: '123 Main St, Melbourne VIC 3000',
        abn: '12 345 678 901'
      },
      analytics: config.analytics || {
        gtmId: '',
        ga4MeasurementId: '',
        fbPixelId: '',
        googleVerification: '',
        fbDomainVerification: ''
      },
      homepage: config.homepage || {
        heroTitle: 'Authentic Dining Experience',
        heroSubtext: 'Handcrafted dishes, fresh ingredients, and unforgettable flavours',
        heroBgImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920',
        heroBadge: 'Now Open for Lunch & Dinner',
        stat1: '15+ Years of Excellence',
        stat2: '5000+ Happy Customers',
        stat3: '4.8★ Google Rating',
        feature1: 'Authentic Recipes',
        feature2: 'Fresh Local Ingredients',
        feature3: 'Award-Winning Wine List',
        feature4: 'Private Dining Available',
        metaTitle: `${config.client.name} | Best Restaurant Melbourne`,
        metaDescription: `Experience authentic cuisine at ${config.client.name}. Book your table today!`,
        ogImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'
      },
      netlify: config.netlify || {
        siteId: '',
        previewUrl: '',
        buildHook: '',
        template: 'theme-v1',
        primaryDomain: '',
        domainLive: false
      },
      notes: config.notes || {
        content: ''
      }
    }

    await prisma.siteConfig.update({
      where: { id: config.id },
      data: updateData
    })

    console.log(`✅ Updated successfully\n`)
  }

  console.log('✨ All configs updated with valid data!')
  console.log('\n📋 Next steps:')
  console.log('   1. Update social media URLs with actual restaurant profiles')
  console.log('   2. Add real Google Place ID for reviews')
  console.log('   3. Configure actual booking/ordering URLs')
  console.log('   4. Add analytics tracking codes if needed')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
