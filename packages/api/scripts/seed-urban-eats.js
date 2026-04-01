const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Urban Eats demo client...')

  // 1. Create or Find Client
  let client = await prisma.client.findFirst({
    where: { name: 'Urban Eats' }
  })

  if (client) {
    console.log('Urban Eats client already exists. Deleting to re-seed...')
    const id = client.id
    // Correct order of deletion
    await prisma.siteConfig.deleteMany({ where: { clientId: id } })
    await prisma.location.deleteMany({ where: { clientId: id } })
    await prisma.menuItem.deleteMany({ where: { clientId: id } })
    await prisma.menuCategory.deleteMany({ where: { clientId: id } })
    await prisma.special.deleteMany({ where: { clientId: id } })
    await prisma.navigationItem.deleteMany({ where: { clientId: id } })
    await prisma.homeSection.deleteMany({ where: { clientId: id } })
    await prisma.page.deleteMany({ where: { clientId: id } })
    await prisma.client.delete({ where: { id } })
  }

  // 2. Create Client
  client = await prisma.client.create({
    data: {
      name: 'Urban Eats',
      domain: 'urbaneats.dinedesk.local',
      status: 'live'
    }
  })

  const clientId = client.id
  console.log('Created client with ID:', clientId)

  // 3. Create SiteConfig
  await prisma.siteConfig.create({
    data: {
      clientId,
      settings: {
        restaurantName: 'Urban Eats',
        displayName: 'Urban Eats',
        defaultEmail: 'hello@urbaneats.com',
        timezone: 'Australia/Melbourne',
        country: 'Australia',
        indexing: 'allowed',
        fontFamily: 'Cormorant Garamond',
        bodyFont: 'Inter'
      },
      colours: {
        theme: 'theme-d1',
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
          address: { active: true, order: 1 },
          phone: { active: true, order: 2 },
          reviews: { active: true, order: 3 },
          order: { active: true, order: 4 },
          reservations: { active: true, order: 5 }
        }
      },
      homepage: {
        heroHeadline: 'Experience Culinary Excellence',
        heroSubtext: 'Where tradition meets innovation in every bite.',
        heroImage: 'https://images.unsplash.com/photo-1761095596849-608b6a337c36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        heroCtaText: 'Book a Table',
        heroCtaLink: '/contact'
      },
      reviews: {
        isActive: true,
        title: 'What Our Guests Say',
        subtitle: 'Real stories from our beloved community',
        googleReviews: [
          { name: 'James Wilson', stars: 5, text: 'The best steak I have had in years. The atmosphere is perfect for a date night.', date: '2024-03-15' },
          { name: 'Sarah Chen', stars: 5, text: 'Absolutely incredible service and the wine list is extensive. Highly recommend the seafood platter.', date: '2024-03-10' },
          { name: 'Michael Ross', stars: 4, text: 'Great food and lovely staff. The dessert was the highlight of the evening.', date: '2024-03-05' }
        ]
      }
    }
  })

  // 4. Create Location
  await prisma.location.create({
    data: {
      clientId,
      name: 'Urban Eats CBD',
      address: '123 Collins St',
      city: 'Melbourne',
      state: 'VIC',
      postcode: '3000',
      phone: '03 9000 1234',
      formEmail: 'cbd@urbaneats.com',
      isPrimary: true,
      isActive: true,
      hours: [
        { day: 'Monday', open: '11:00', close: '22:00' },
        { day: 'Tuesday', open: '11:00', close: '22:00' },
        { day: 'Wednesday', open: '11:00', close: '22:00' },
        { day: 'Thursday', open: '11:00', close: '23:00' },
        { day: 'Friday', open: '11:00', close: '23:00' },
        { day: 'Saturday', open: '10:00', close: '23:00' },
        { day: 'Sunday', open: '10:00', close: '21:00' }
      ]
    }
  })

  // 5. Create Menu and Items
  const starters = await prisma.menuCategory.create({
    data: { clientId, name: 'Starters', sortOrder: 1 }
  })
  const mains = await prisma.menuCategory.create({
    data: { clientId, name: 'Main Course', sortOrder: 2 }
  })

  await prisma.menuItem.createMany({
    data: [
      { clientId, categoryId: starters.id, name: 'Truffle Arancini', description: 'Wild mushroom risotto balls with truffle aioli', price: 18, isFeatured: true },
      { clientId, categoryId: starters.id, name: 'Calamari Fritti', description: 'Crispy local squid with lemon and parsley', price: 22 },
      { clientId, categoryId: mains.id, name: 'Wagyu Ribeye', description: 'Marble score 7+, served with cafe de paris butter', price: 65, isFeatured: true },
      { clientId, categoryId: mains.id, name: 'Atlantic Salmon', description: 'Pan-seared with asparagus and hollandaise', price: 42 }
    ]
  })

  // 6. Create Specials
  await prisma.special.create({
    data: {
      clientId,
      title: 'Sunday Roast',
      description: 'Traditional beef roast with all the trimmings. Only available on Sundays.',
      price: 35,
      imageUrl: 'https://images.unsplash.com/photo-1759283084358-0565ea8e2885?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  })

  // 7. Create Pages
  await prisma.page.createMany({
    data: [
      { clientId, slug: 'about', title: 'Our Story', content: '<p>Urban Eats started with a simple idea: bring farm-to-table excellence to the heart of the city.</p>', status: 'live', inNavigation: true, navOrder: 2 },
      { clientId, slug: 'contact', title: 'Contact Us', content: '<p>Get in touch with us for bookings or enquiries.</p>', status: 'live', inNavigation: true, navOrder: 5 },
      { clientId, slug: 'menu', title: 'Our Menu', status: 'live', inNavigation: true, navOrder: 1 },
      { clientId, slug: 'locations', title: 'Locations', status: 'live', inNavigation: true, navOrder: 4 },
      { clientId, slug: 'specials', title: 'Specials', status: 'live', inNavigation: true, navOrder: 3 }
    ]
  })

  // 8. Create Navigation
  await prisma.navigationItem.createMany({
    data: [
      { clientId, label: 'Home', url: '/', sortOrder: 0 },
      { clientId, label: 'Menu', url: '/menu', sortOrder: 1 },
      { clientId, label: 'Specials', url: '/specials', sortOrder: 2 },
      { clientId, label: 'About', url: '/about', sortOrder: 3 },
      { clientId, label: 'Locations', url: '/locations', sortOrder: 4 },
      { clientId, label: 'Contact', url: '/contact', sortOrder: 5 }
    ]
  })

  // 9. Create HomeSections
  await prisma.homeSection.createMany({
    data: [
      { clientId, type: 'hero', title: 'Experience Culinary Excellence', sortOrder: 1, isActive: true },
      { clientId, type: 'featured-items', title: 'Chef\'s Recommendations', sortOrder: 2, isActive: true },
      { clientId, type: 'specials', title: 'Current Specials', sortOrder: 3, isActive: true },
      { clientId, type: 'about', title: 'Our Story', sortOrder: 4, isActive: true },
      { clientId, type: 'reviews', title: 'What Our Guests Say', sortOrder: 5, isActive: true }
    ]
  })

  // 10. Create Footer Sections
  const quickLinks = await prisma.footerSection.create({
    data: { clientId, title: 'Quick Links', sortOrder: 1 }
  })
  const support = await prisma.footerSection.create({
    data: { clientId, title: 'Support', sortOrder: 2 }
  })

  await prisma.footerLink.createMany({
    data: [
      { footerSectionId: quickLinks.id, label: 'Home', externalUrl: '/', sortOrder: 1 },
      { footerSectionId: quickLinks.id, label: 'Menu', externalUrl: '/menu', sortOrder: 2 },
      { footerSectionId: quickLinks.id, label: 'Specials', externalUrl: '/specials', sortOrder: 3 },
      { footerSectionId: support.id, label: 'About Us', externalUrl: '/about', sortOrder: 1 },
      { footerSectionId: support.id, label: 'Contact', externalUrl: '/contact', sortOrder: 2 },
      { footerSectionId: support.id, label: 'Privacy Policy', externalUrl: '/privacy', sortOrder: 3 }
    ]
  })

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
