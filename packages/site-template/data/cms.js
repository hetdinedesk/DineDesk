// CMS Data Structure - This represents what would come from a database/CMS

// Mock CMS Data
export const mockRestaurant = {
  id: 'rest-001',
  name: 'Savoria',
  domain: 'savoria.com',
  status: 'active',
  branding: {
    primaryColor: '#1a1a1a',
    secondaryColor: '#d4af37',
    accentColor: '#8b4513',
    fontFamily: 'Cormorant Garamond',
  },
  createdAt: '2024-01-01',
  updatedAt: '2026-03-30',
};

export const mockLocations = [
  {
    id: 'loc-001',
    restaurantId: 'rest-001',
    name: 'Downtown',
    slug: 'downtown',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    coordinates: {
      latitude: 40.7506,
      longitude: -73.9936,
    },
    contact: {
      phone: '(212) 555-0123',
      email: 'downtown@savoria.com',
    },
    hours: [
      { day: 'Monday', open: '11:00', close: '22:00', closed: false },
      { day: 'Tuesday', open: '11:00', close: '22:00', closed: false },
      { day: 'Wednesday', open: '11:00', close: '22:00', closed: false },
      { day: 'Thursday', open: '11:00', close: '23:00', closed: false },
      { day: 'Friday', open: '11:00', close: '00:00', closed: false },
      { day: 'Saturday', open: '10:00', close: '00:00', closed: false },
      { day: 'Sunday', open: '10:00', close: '22:00', closed: false },
    ],
    gallery: [],
    deliveryOptions: {
      delivery: true,
      takeout: true,
      dineIn: true,
    },
    isPrimary: true,
    isActive: true,
  },
];

export const mockMenuCategories = [
  {
    id: 'cat-001',
    restaurantId: 'rest-001',
    name: 'Appetizers',
    slug: 'appetizers',
    description: 'Start your culinary journey',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'cat-002',
    restaurantId: 'rest-001',
    name: 'Main Courses',
    slug: 'main-courses',
    description: 'Our signature dishes',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'cat-003',
    restaurantId: 'rest-001',
    name: 'Desserts',
    slug: 'desserts',
    description: 'Sweet endings',
    sortOrder: 3,
    isActive: true,
  },
];

export const mockMenuItems = [
  // Appetizers
  {
    id: 'item-001',
    categoryId: 'cat-001',
    restaurantId: 'rest-001',
    name: 'Burrata & Heirloom Tomatoes',
    description: 'Fresh burrata, heirloom tomatoes, basil, aged balsamic, extra virgin olive oil',
    price: 18,
    image: 'https://images.unsplash.com/photo-1696919546499-0d8ea4935bcd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXJyYXRhJTIwY2hlZXNlJTIwdG9tYXRvZXN8ZW58MXx8fHwxNzc0ODQ3Nzg2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    isAvailable: true,
    isFeatured: true,
    dietary: ['vegetarian'],
    sortOrder: 1,
  },
  {
    id: 'item-002',
    categoryId: 'cat-001',
    restaurantId: 'rest-001',
    name: 'Tuna Tartare',
    description: 'Yellowfin tuna, avocado, cucumber, sesame, wasabi aioli, wonton crisps',
    price: 22,
    image: 'https://images.unsplash.com/photo-1769830644804-0ede2ee32a62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0dW5hJTIwdGFydGFyZSUyMGRpc2h8ZW58MXx8fHwxNzc0ODQ3Nzg4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    isAvailable: true,
    isFeatured: false,
    dietary: ['gluten-free'],
    sortOrder: 2,
  },
  // Main Courses
  {
    id: 'item-003',
    categoryId: 'cat-002',
    restaurantId: 'rest-001',
    name: 'Wagyu Beef Tenderloin',
    description: '8oz Australian wagyu, roasted garlic mash, seasonal vegetables, red wine reduction',
    price: 68,
    image: 'https://images.unsplash.com/photo-1714579324629-da46dd0d7d85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWVmJTIwc3RlYWslMjBlbGVnYW50fGVufDF8fHx8MTc3NDg0Nzc4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    isAvailable: true,
    isFeatured: true,
    dietary: ['gluten-free'],
    sortOrder: 1,
  },
  // Desserts
  {
    id: 'item-004',
    categoryId: 'cat-003',
    restaurantId: 'rest-001',
    name: 'Chocolate Soufflé',
    description: 'Dark chocolate soufflé, vanilla bean ice cream, raspberry coulis',
    price: 14,
    image: 'https://images.unsplash.com/photo-1737700088028-fae0666feb83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBkZXNzZXJ0JTIwZWxlZ2FudHxlbnwxfHx8fDE3NzQ4MjEwOTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    isAvailable: true,
    isFeatured: true,
    dietary: ['vegetarian'],
    sortOrder: 1,
  },
];

export const mockSpecials = [
  {
    id: 'special-001',
    restaurantId: 'rest-001',
    title: 'Spring Tasting Menu',
    description: 'Experience a 5-course journey featuring seasonal ingredients and chef\'s signature creations',
    image: '',
    price: 95,
    originalPrice: 120,
    validFrom: '2026-03-01',
    validUntil: '2026-05-31',
    isActive: true,
    isHighlighted: true,
  },
];

export const mockNavigation = [
  {
    id: 'nav-001',
    restaurantId: 'rest-001',
    label: 'Home',
    url: '/',
    type: 'internal',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'nav-002',
    restaurantId: 'rest-001',
    label: 'Menu',
    url: '/menu',
    type: 'internal',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'nav-003',
    restaurantId: 'rest-001',
    label: 'About',
    url: '/about',
    type: 'internal',
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'nav-004',
    restaurantId: 'rest-001',
    label: 'Contact',
    url: '/contact',
    type: 'internal',
    sortOrder: 4,
    isActive: true,
  },
];

export const mockHomepageSections = [
  {
    id: 'section-001',
    restaurantId: 'rest-001',
    type: 'hero',
    title: 'Experience Culinary Excellence',
    subtitle: 'Where tradition meets innovation',
    content: {
      image: '',
      cta: {
        text: 'View Menu',
        url: '/menu',
      },
    },
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'section-002',
    restaurantId: 'rest-001',
    type: 'featured-items',
    title: 'Chef\'s Recommendations',
    subtitle: 'Handpicked selections from our menu',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'section-003',
    restaurantId: 'rest-001',
    type: 'about',
    title: 'Our Story',
    subtitle: 'A passion for exceptional food',
    content: {
      text: 'For over a decade, Savoria has been dedicated to bringing you the finest culinary experiences. Our chefs source only the highest quality ingredients to create dishes that celebrate both tradition and innovation.',
      image: '',
    },
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'section-004',
    restaurantId: 'rest-001',
    type: 'reviews',
    title: 'What Our Guests Say',
    subtitle: 'Testimonials',
    content: {
      subtitle: 'What our customers are saying about us',
      showGoogleReviews: true,
      showRegularReviews: false,
      alternateStyle: false,
      cta: {
        active: true,
        label: 'Leave a Review',
        variant: 'primary',
        url: 'https://search.google.com/local/writereview?placeid=example'
      }
    },
    sortOrder: 4,
    isActive: true,
  },
];

export const mockFooterColumns = [
  {
    id: 'footer-001',
    restaurantId: 'rest-001',
    title: 'Quick Links',
    links: [
      { label: 'Menu', url: '/menu' },
      { label: 'About', url: '/about' },
      { label: 'Contact', url: '/contact' },
    ],
    sortOrder: 1,
  },
  {
    id: 'footer-002',
    restaurantId: 'rest-001',
    title: 'Services',
    links: [
      { label: 'Dine In', url: '/contact' },
      { label: 'Takeout', url: '/menu' },
      { label: 'Private Events', url: '/contact' },
    ],
    sortOrder: 2,
  },
];

export const mockSiteConfig = {
  id: 'config-001',
  restaurantId: 'rest-001',
  siteName: 'Savoria',
  tagline: 'Experience Culinary Excellence',
  theme: {
    headerStyle: 'transparent',
    footerStyle: 'dark',
    buttonStyle: 'rounded',
  },
  social: {
    facebook: 'https://facebook.com/savoria',
    instagram: 'https://instagram.com/savoria',
    twitter: 'https://twitter.com/savoria',
  },
  features: {
    showSpecials: true,
    showLocations: true,
    showReservations: true,
    showDelivery: true,
  },
};

export const mockBooking = {
  bookingUrl: 'https://resy.com/cities/melbourne/demo-restaurant',
  bookLabel: 'Reserve Your Table',
  showInHeader: true,
  showInUtility: true,
  showInHero: true,
  showOnLocations: true,
  showInFooter: true,
};

export const mockReviews = [
  {
    id: 'review-001',
    restaurantId: 'rest-001',
    author: 'Sarah Johnson',
    rating: 5,
    content: 'An absolutely incredible dining experience. The attention to detail in every dish was remarkable, and the service was impeccable.',
    date: '2026-03-15',
    platform: 'Google',
    isActive: true,
  },
  {
    id: 'review-002',
    restaurantId: 'rest-001',
    author: 'Michael Chen',
    rating: 5,
    content: 'Best restaurant in the city! The wagyu beef was cooked to perfection, and the wine selection complemented our meal beautifully.',
    date: '2026-03-10',
    platform: 'Yelp',
    isActive: true,
  },
];

// Helper function to simulate CMS data fetching
export const getCMSData = () => ({
  client: {
    ...mockRestaurant,
    locations: mockLocations,
  },
  settings: {
    displayName: mockRestaurant.name,
    restaurantName: mockRestaurant.name,
    tagline: mockSiteConfig.tagline,
    fontFamily: mockRestaurant.branding.fontFamily,
    logoLight: '',
    logoDark: '',
    favicon: '',
  },
  colours: {
    primary: mockRestaurant.branding.primaryColor,
    secondary: mockRestaurant.branding.secondaryColor,
    accent: mockRestaurant.branding.accentColor,
    theme: 'theme-d1',
  },
  menuCategories: mockMenuCategories,
  menuItems: mockMenuItems,
  specials: mockSpecials,
  navigationItems: mockNavigation,
  footerSections: mockFooterColumns,
  homeSections: mockHomepageSections,
  pages: [],
  reviews: {
    googleReviews: mockReviews,
  },
  shortcodes: {
    restaurantName: 'Urban Eats',
    group: 'Restaurant Group',
    address: '123 Main Street',
    suburb: 'Downtown',
    state: 'NY',
    phone: '(212) 555-0123',
    primaryEmail: 'info@urban-eats.com',
    custom: '',
  },
  header: {
    type: 'standard-full',
    utilityBelt: true,
    utilityItems: {
      'contact-info': true,
      'social-links': true,
      reviews: true,
      'header-ctas': true,
    },
  },
  footer: {
    theme: 'dark',
    tagline: mockSiteConfig.tagline,
    socialLinks: mockSiteConfig.social,
  },
  headerCtas: [],
  booking: mockBooking,
  social: mockSiteConfig.social,
  socialLinks: mockSiteConfig.social,
});
