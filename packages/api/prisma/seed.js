require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('password', 10)
  console.log(`✅ Use: admin@dinedesk.com / password`)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dinedesk.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@dinedesk.com',
      password: hash,
      role: 'SUPER_ADMIN'
    }
  })
  const client = await prisma.client.create({
    data: {
      name: 'Demo Restaurant',
      domain: 'demo.dinedesk.com.au',
      status: 'live'
    }
  })

  // Site Config with complete valid data for all sections
  await prisma.siteConfig.create({
    data: {
      clientId: client.id,
      version: 1,
      settings: {
        restaurantName: 'Demo Restaurant',
        displayName: 'Demo Restaurant - Authentic Italian Cuisine',
        defaultEmail: 'hello@demorestaurant.com.au',
        siteType: 'restaurant',
        indexing: 'blocked',
        phone: '+61 3 9999 8888',
        suburb: 'Melbourne CBD',
        logoLight: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=200',
        logoDark: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=200',
        favicon: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=32',
        country: 'Australia',
        timezone: 'Australia/Melbourne'
      },
      colours: {
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
      header: {
        type: 'standard-full',
        utilityBelt: true,
        utilityItems: {
          phone: true,
          email: true,
          social: true
        },
        headerTheme: 'light'
      },
      headerCtas: [
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
      footer: {
        tagline: 'Authentic Italian Cuisine in the Heart of Melbourne',
        copyrightText: '© 2026 Demo Restaurant. All rights reserved.',
        legalLinks: [
          { label: 'Privacy Policy', href: '/privacy-policy' },
          { label: 'Terms of Service', href: '/terms-of-service' }
        ]
      },
      social: {
        facebook: 'https://www.facebook.com/DemoRestaurantMelbourne',
        instagram: 'https://www.instagram.com/demorestaurant',
        twitter: 'https://twitter.com/demorestauant',
        tiktok: 'https://www.tiktok.com/@demorestaurant',
        youtube: 'https://www.youtube.com/@DemoRestaurant',
        linkedin: 'https://www.linkedin.com/company/demo-restaurant',
        showInFooter: true,
        showInUtility: true
      },
      reviews: {
        overallScore: 4.8,
        totalReviews: 324,
        googleScore: 4.8,
        googleCount: 285,
        tripScore: 4.7,
        tripCount: 156,
        fbScore: 4.9,
        fbCount: 89,
        googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        minStars: 3,
        enableHeader: true,
        enableFooter: true,
        carouselHeading: "What Our Guests Say",
        carouselSubHeading: "Rated 4.8 stars on Google",
        carouselContent: "We're proud to serve authentic Italian cuisine with love and passion",
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
      booking: {
        bookingUrl: 'https://resy.com/cities/melbourne/demo-restaurant',
        bookingPhone: '+61 3 9999 8888',
        bookLabel: 'Reserve Your Table',
        orderUrl: 'https://order.demorestaurant.com.au',
        orderLabel: 'Order Online',
        uberEatsUrl: 'https://www.ubereats.com/au/store/demo-restaurant',
        doorDashUrl: 'https://www.doordash.com/store/demo-restaurant',
        menulogUrl: 'https://www.menulog.com.au/restaurants-demo-restaurant',
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
        notifyEmail: 'bookings@demorestaurant.com.au',
        pickupEnabled: true,
        deliveryEnabled: true,
        dineInEnabled: true,
        pickupTime: '30 minutes',
        minOrder: 25,
        deliveryFee: 5.95,
        deliveryTime: '45-60 minutes',
        freeDeliveryOver: 50
      },
      shortcodes: {
        primaryColor: '#C8823A',
        phone: '+61 3 9999 8888',
        email: 'hello@demorestaurant.com.au',
        address: '123 Demo St, Melbourne VIC 3000',
        abn: '12 345 678 901'
      },
      analytics: {
        gtmId: 'GTM-XXXXXXX',
        ga4MeasurementId: 'G-XXXXXXXXXX',
        fbPixelId: '123456789012345',
        googleVerification: 'abc123xyz456def789',
        fbDomainVerification: 'fb123456789abcdef'
      },
      homepage: {
        heroTitle: 'Authentic Italian Dining Experience',
        heroSubtext: 'Handcrafted pasta, wood-fired pizzas, and exquisite wines in the heart of Melbourne',
        heroBgImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920',
        heroBadge: 'Now Open for Lunch & Dinner',
        stat1: '15+ Years of Excellence',
        stat2: '5000+ Happy Customers',
        stat3: '4.8★ Google Rating',
        feature1: 'Authentic Italian Recipes',
        feature2: 'Fresh Local Ingredients',
        feature3: 'Award-Winning Wine List',
        feature4: 'Private Dining Available',
        metaTitle: 'Demo Restaurant | Best Italian Restaurant Melbourne',
        metaDescription: 'Experience authentic Italian cuisine at Demo Restaurant. Handmade pasta, wood-fired pizza, and an extensive wine list. Book your table today!',
        ogImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'
      },
      netlify: {
        siteId: '',
        previewUrl: '',
        buildHook: '',
        template: 'theme-v1',
        primaryDomain: '',
        domainLive: false
      },
      notes: {
        content: ''
      }
    }
  })

  // Location with hours and gallery
  const location = await prisma.location.create({
    data: {
      clientId: client.id,
      name: 'Melbourne CBD',
      displayName: 'Melbourne CBD Location',
      address: '123 Demo St, Melbourne VIC 3000',
      city: 'Melbourne',
      state: 'VIC',
      postcode: '3000',
      country: 'Australia',
      phone: '+61 3 9999 8888',
      bookingPhone: '+61 3 9999 8888',
      formEmail: 'bookings@demorestaurant.com.au',
      isPrimary: true,
      showInFooter: true,
      hours: {
        Monday: { open: '11:30', close: '22:00' },
        Tuesday: { open: '11:30', close: '22:00' },
        Wednesday: { open: '11:30', close: '22:00' },
        Thursday: { open: '11:30', close: '23:00' },
        Friday: { open: '11:30', close: '23:30' },
        Saturday: { open: '11:00', close: '23:30' },
        Sunday: { open: '11:00', close: '21:00' }
      },
      galleryImages: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800'
      ]
    }
  })

  // Second location
  await prisma.location.create({
    data: {
      clientId: client.id,
      name: 'South Yarra',
      displayName: 'South Yarra Location',
      address: '456 Chapel St, South Yarra VIC 3141',
      city: 'South Yarra',
      state: 'VIC',
      postcode: '3141',
      country: 'Australia',
      phone: '+61 3 8888 7777',
      bookingPhone: '+61 3 8888 7777',
      formEmail: 'southyarra@demorestaurant.com.au',
      isPrimary: false,
      showInFooter: true,
      hours: {
        Monday: { open: '12:00', close: '21:00' },
        Tuesday: { open: '12:00', close: '21:00' },
        Wednesday: { open: '12:00', close: '21:00' },
        Thursday: { open: '12:00', close: '22:00' },
        Friday: { open: '12:00', close: '23:00' },
        Saturday: { open: '11:00', close: '23:00' },
        Sunday: { open: '11:00', close: '20:00' }
      },
      galleryImages: [
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
        'https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?w=800'
      ]
    }
  })

  // Menu Categories
  const categories = await prisma.$transaction([
    prisma.menuCategory.create({
      data: { clientId: client.id, name: 'Starters', sortOrder: 0 }
    }),
    prisma.menuCategory.create({
      data: { clientId: client.id, name: 'Pasta', sortOrder: 1 }
    }),
    prisma.menuCategory.create({
      data: { clientId: client.id, name: 'Mains', sortOrder: 2 }
    }),
    prisma.menuCategory.create({
      data: { clientId: client.id, name: 'Desserts', sortOrder: 3 }
    }),
    prisma.menuCategory.create({
      data: { clientId: client.id, name: 'Drinks', sortOrder: 4 }
    })
  ])

  const [starters, pasta, mains, desserts, drinks] = categories

  // Menu Items
  await prisma.menuItem.createMany({
    data: [
      // Starters
      { clientId: client.id, categoryId: starters.id, name: 'Garlic Bread', description: 'Freshly baked sourdough with garlic butter and herbs', price: 8.50, isAvailable: true, sortOrder: 0 },
      { clientId: client.id, categoryId: starters.id, name: 'Bruschetta', description: 'Grilled bread topped with tomato, basil, and balsamic glaze', price: 12.00, isAvailable: true, sortOrder: 1 },
      { clientId: client.id, categoryId: starters.id, name: 'Arancini', description: 'Crispy risotto balls with mozzarella and truffle aioli', price: 14.50, isAvailable: true, sortOrder: 2, isFeatured: true },
      { clientId: client.id, categoryId: starters.id, name: 'Calamari Fritti', description: 'Crispy fried calamari with lemon and garlic mayo', price: 16.00, isAvailable: true, sortOrder: 3 },
      
      // Pasta
      { clientId: client.id, categoryId: pasta.id, name: 'Spaghetti Carbonara', description: 'Classic Roman pasta with egg, pancetta, and pecorino', price: 22.00, isAvailable: true, sortOrder: 0, isFeatured: true },
      { clientId: client.id, categoryId: pasta.id, name: 'Fettuccine Alfredo', description: 'Creamy parmesan sauce with grilled chicken', price: 24.00, isAvailable: true, sortOrder: 1 },
      { clientId: client.id, categoryId: pasta.id, name: 'Penne Arrabbiata', description: 'Spicy tomato sauce with garlic and chili', price: 20.00, isAvailable: true, sortOrder: 2 },
      { clientId: client.id, categoryId: pasta.id, name: 'Linguine alle Vongole', description: 'Fresh clams with white wine, garlic, and parsley', price: 28.00, isAvailable: true, sortOrder: 3 },
      { clientId: client.id, categoryId: pasta.id, name: 'Ravioli di Ricotta', description: 'House-made ricotta ravioli with sage butter', price: 26.00, isAvailable: true, sortOrder: 4, isFeatured: true },
      
      // Mains
      { clientId: client.id, categoryId: mains.id, name: 'Chicken Parmigiana', description: 'Crumbed chicken breast with napoli and mozzarella, served with chips', price: 28.00, isAvailable: true, sortOrder: 0 },
      { clientId: client.id, categoryId: mains.id, name: 'Grilled Salmon', description: 'Atlantic salmon with lemon butter sauce and seasonal vegetables', price: 32.00, isAvailable: true, sortOrder: 1, isFeatured: true },
      { clientId: client.id, categoryId: mains.id, name: 'Beef Tenderloin', description: '250g grass-fed beef with red wine jus and roasted potatoes', price: 42.00, isAvailable: true, sortOrder: 2 },
      { clientId: client.id, categoryId: mains.id, name: 'Eggplant Parmigiana', description: 'Layers of eggplant, tomato, and cheese baked to perfection', price: 24.00, isAvailable: true, sortOrder: 3 },
      
      // Desserts
      { clientId: client.id, categoryId: desserts.id, name: 'Tiramisu', description: 'Classic Italian coffee-flavoured dessert', price: 12.00, isAvailable: true, sortOrder: 0, isFeatured: true },
      { clientId: client.id, categoryId: desserts.id, name: 'Panna Cotta', description: 'Vanilla bean cream with berry compote', price: 11.00, isAvailable: true, sortOrder: 1 },
      { clientId: client.id, categoryId: desserts.id, name: 'Gelato Selection', description: 'Three scoops of daily flavours', price: 9.50, isAvailable: true, sortOrder: 2 },
      { clientId: client.id, categoryId: desserts.id, name: 'Chocolate Fondant', description: 'Warm chocolate cake with vanilla ice cream', price: 14.00, isAvailable: true, sortOrder: 3 },
      
      // Drinks
      { clientId: client.id, categoryId: drinks.id, name: 'House Red Wine', description: 'Shiraz / Cabernet - Glass', price: 10.00, isAvailable: true, sortOrder: 0 },
      { clientId: client.id, categoryId: drinks.id, name: 'House White Wine', description: 'Sauvignon Blanc / Chardonnay - Glass', price: 10.00, isAvailable: true, sortOrder: 1 },
      { clientId: client.id, categoryId: drinks.id, name: 'Peroni Nastro Azzurro', description: 'Italian lager - 330ml', price: 9.00, isAvailable: true, sortOrder: 2 },
      { clientId: client.id, categoryId: drinks.id, name: 'Aperol Spritz', description: 'Aperol, prosecco, soda, orange', price: 16.00, isAvailable: true, sortOrder: 3, isFeatured: true },
      { clientId: client.id, categoryId: drinks.id, name: 'Espresso Martini', description: 'Vodka, coffee liqueur, fresh espresso', price: 18.00, isAvailable: true, sortOrder: 4 }
    ]
  })

  // Specials/Offers
  await prisma.special.createMany({
    data: [
      {
        clientId: client.id,
        title: 'Lunch Special',
        description: 'Any pasta + glass of house wine for $25. Available Monday-Friday 11:30am-3pm',
        price: 25.00,
        isActive: true,
        showInNav: true
      },
      {
        clientId: client.id,
        title: 'Happy Hour',
        description: '50% off all drinks! Monday-Friday 4pm-6pm',
        isActive: true,
        showInNav: true
      },
      {
        clientId: client.id,
        title: 'Weekend Feast',
        description: '3-course dinner for two with a bottle of wine - $120',
        price: 120.00,
        isActive: true,
        showInNav: false
      },
      {
        clientId: client.id,
        title: 'Birthday Special',
        description: 'Free dessert when you dine with 4+ guests on your birthday!',
        isActive: true,
        showInNav: false
      }
    ]
  })

  // Banners
  await prisma.banner.createMany({
    data: [
      {
        clientId: client.id,
        title: 'Welcome to Demo Restaurant',
        text: 'Experience authentic Italian cuisine in the heart of Melbourne',
        buttonText: 'View Menu',
        buttonUrl: '/menu',
        isActive: true,
        assignTo: ['hero']
      },
      {
        clientId: client.id,
        title: 'Lunch Special',
        text: 'Pasta + Wine for $25 - Weekdays 11:30am-3pm',
        buttonText: 'Book Now',
        buttonUrl: '/book',
        isActive: true,
        assignTo: ['specials']
      }
    ]
  })

  // Home Sections
  await prisma.homeSection.createMany({
    data: [
      {
        clientId: client.id,
        type: 'hero',
        title: 'Authentic Italian Dining',
        content: 'Experience the taste of Italy with our handcrafted pasta, wood-fired pizzas, and exquisite wines.',
        buttonText: 'Reserve a Table',
        buttonUrl: '/book',
        sortOrder: 0,
        isActive: true
      },
      {
        clientId: client.id,
        type: 'featured-menu',
        title: 'Our Favorites',
        content: 'Discover our most loved dishes, crafted with passion and the finest ingredients.',
        sortOrder: 1,
        isActive: true
      },
      {
        clientId: client.id,
        type: 'specials',
        title: 'Current Offers',
        content: 'Take advantage of our amazing deals and promotions.',
        sortOrder: 2,
        isActive: true
      },
      {
        clientId: client.id,
        type: 'reviews',
        title: 'What Our Guests Say',
        sortOrder: 3,
        isActive: true
      },
      {
        clientId: client.id,
        type: 'cta',
        title: 'Ready to Dine?',
        content: 'Book your table now and experience the best Italian food in Melbourne.',
        buttonText: 'Book Now',
        buttonUrl: '/book',
        sortOrder: 4,
        isActive: true
      }
    ]
  })

  // Alert Popups
  await prisma.alertPopup.create({
    data: {
      clientId: client.id,
      title: 'COVID-19 Update',
      message: 'We are open for dine-in with safety measures in place. Bookings recommended.',
      isActive: false,
      isDismissible: true,
      pages: ['/']
    }
  })

  // Legal Docs
  await prisma.legalDoc.createMany({
    data: [
      {
        clientId: client.id,
        type: 'privacy',
        title: 'Privacy Policy',
        content: 'Your privacy is important to us. This policy outlines how we collect, use, and protect your personal information.',
        urlSlug: 'privacy-policy',
        isActive: true
      },
      {
        clientId: client.id,
        type: 'terms',
        title: 'Terms of Service',
        content: 'By using our website and services, you agree to these terms and conditions.',
        urlSlug: 'terms-of-service',
        isActive: true
      }
    ]
  })

  // Pages
  await prisma.page.createMany({
    data: [
      {
        clientId: client.id,
        slug: 'about',
        title: 'About Us',
        content: '<p>Demo Restaurant has been serving authentic Italian cuisine since 2010. Our passion for quality ingredients and traditional recipes has made us a favorite among locals and visitors alike.</p><p>Our chefs bring decades of experience from Italy, ensuring every dish is prepared with love and authenticity.</p>',
        metaTitle: 'About Demo Restaurant | Italian Restaurant Melbourne',
        metaDesc: 'Learn about Demo Restaurant\'s story, our commitment to authentic Italian cuisine, and our experienced team.',
        status: 'published',
        inNavigation: false
      },
      {
        clientId: client.id,
        slug: 'contact',
        title: 'Contact Us',
        content: '<p>We\'d love to hear from you! Reach out to us for reservations, inquiries, or feedback.</p><p>Phone: +61 3 9999 8888<br>Email: hello@demorestaurant.com.au</p>',
        metaTitle: 'Contact Demo Restaurant | Get in Touch',
        metaDesc: 'Contact Demo Restaurant for reservations, inquiries, or feedback. We\'re here to help!',
        status: 'published',
        inNavigation: false
      }
    ]
  })

  console.log('✅ Seeded demo data!')
  console.log('   - Admin user: admin@dinedesk.com / password')
  console.log('   - Client: Demo Restaurant (demo.dinedesk.com.au)')
  console.log('   - 2 Locations with hours & gallery')
  console.log('   - 5 Menu Categories with 21 Menu Items')
  console.log('   - 4 Specials/Offers')
  console.log('   - 2 Banners')
  console.log('   - 5 Home Sections')
  console.log('   - Theme colors & settings')
  console.log('   - Reviews & booking config')
  console.log('   - Legal docs and more!')
  console.log('   - Navigation: EMPTY (add via CMS)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

