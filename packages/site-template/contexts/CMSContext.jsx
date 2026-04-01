import React, { createContext, useContext, useEffect, useMemo } from 'react';

const CMSContext = createContext(null);

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used within CMSProvider');
  }
  return context;
};

// Map real Next.js API data to what theme-d1 expects
function adaptCMSData(data) {
  const {
    client = {},
    settings = {},
    booking = {},
    colours = {},
    homepage = {},
    menuCategories = [],
    menuItems: rawMenuItems = [],
    specials = [],
    navigationItems = [],
    footerSections = [],
    homeSections = [],
    pages = [],
    reviews = {},
    shortcodes = {},
    header = {},
    footer = {},
    headerCtas = [],
  } = data || {};

  // Find primary location
  const primaryLoc = client.locations?.find(l => l.isPrimary) || client.locations?.[0] || {};

  // Build restaurant object
  const restaurant = {
    id: client.id || 'rest-1',
    name: settings.displayName || settings.restaurantName || client.name || 'Restaurant',
    domain: client.domain || '',
    branding: {
      primaryColor: colours.primary || '#1a1a1a',
      secondaryColor: colours.secondary || '#d4af37',
      accentColor: colours.accent || '#8b4513',
      fontFamily: settings.fontFamily || 'Cormorant Garamond',
      // Check multiple possible locations for logo data
      logo: settings.logoLight || settings.logoDark || data.logoLight || data.logoDark,
      logoLight: settings.logoLight || data.logoLight,
      logoDark: settings.logoDark || data.logoDark,
      favicon: settings.favicon || data.favicon,
    }
  };

  // Map homepage sections
  const homepageSections = (homeSections || []).map(section => ({
    ...section,
    // Ensure content is parsed if it's a string (from DB)
    content: typeof section.content === 'string' ? JSON.parse(section.content) : (section.content || {})
  }));

  // Map locations
  const locations = (client.locations || []).map(loc => ({
    id: loc.id,
    name: loc.name || 'Main Location',
    address: {
      street: typeof loc.address === 'string' ? loc.address : (loc.address?.street || ''),
      city: loc.city || loc.address?.city || '',
      state: loc.state || loc.address?.state || '',
      zipCode: loc.postcode || loc.address?.zipCode || loc.address?.postcode || '',
      country: loc.country || loc.address?.country || '',
    },
    coordinates: {
      latitude: loc.lat || 0,
      longitude: loc.lng || 0,
    },
    contact: {
      phone: loc.phone || '',
      email: loc.email || '',
    },
    phone: loc.phone || '', // Flat access for themes
    email: loc.email || '', // Flat access for themes
    hours: loc.hours || [],
    deliveryOptions: loc.deliveryOptions || { dineIn: true, takeout: true, delivery: true },
    isPrimary: loc.isPrimary,
    isActive: loc.isActive !== false,
  }));

  // Map menu categories and items
  const menuItems = (rawMenuItems || []).map(item => ({
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description || '',
    price: item.price || 0,
    image: item.imageUrl || item.image || '',
    isAvailable: item.isAvailable !== false,
    isFeatured: item.isFeatured === true,
    dietary: item.dietaryTags || [],
    sortOrder: item.sortOrder || 0,
  }));

  const mappedCategories = (menuCategories || []).map(cat => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    isActive: cat.isActive !== false,
    sortOrder: cat.sortOrder || 0,
  }));

  // Map specials
  const mappedSpecials = (specials || []).map(s => ({
    id: s.id,
    title: s.title,
    description: s.description || '',
    price: s.price || 0,
    image: s.image || '',
    isActive: s.isActive !== false,
  }));

  // Map navigation
  let navigation = (navigationItems || []).map(nav => {
    let url = nav.url;
    if (nav.pageId && nav.page) {
      url = `/${nav.page.slug.replace(/^\//, '')}`;
    }
    return {
      id: nav.id,
      label: nav.label,
      url: url,
      isActive: nav.isActive,
      parentId: nav.parentId,
      sortOrder: nav.sortOrder,
    };
  });

  const rawHeader = header || {};

  // Site Config
  const siteConfig = {
    siteName: settings.displayName || settings.restaurantName || client.name || 'Restaurant',
    tagline: settings.tagline || footer.tagline || '',
    theme: {
      headerType: rawHeader.type || 'standard-full',
      headerStyle: rawHeader.type === 'transparent' ? 'transparent' : 'solid',
      headerTheme: rawHeader.headerTheme || 'not-set',
      footerStyle: footer.theme === 'light' ? 'light' : 'dark',
      buttonStyle: 'rounded',
      utilityBelt: rawHeader.utilityBelt !== false,
    },
    social: {
      facebook:  data.socialLinks?.facebook || data.social?.facebook || data.footer?.socialLinks?.facebook || null,
      instagram: data.socialLinks?.instagram || data.social?.instagram || data.footer?.socialLinks?.instagram || null,
      twitter:   data.socialLinks?.twitter   || data.social?.twitter   || data.footer?.socialLinks?.twitter || null,
      showInFooter:  data.social?.showInFooter !== false,
      showInUtility: data.social?.showInUtility !== false,
    },
    features: {
      showSpecials: true,
      showLocations: true,
      showPhone: rawHeader.utilityItems?.['contact-info'] !== false,
      showSocial: rawHeader.utilityItems?.['social-links'] !== false,
      showReviews: rawHeader.utilityItems?.reviews !== false,
      showCtas: rawHeader.utilityItems?.['header-ctas'] !== false,
      showReservations: booking.showInHeader !== false,
    },
    // Reviews configuration - spread all reviews data to preserve CTAs and other fields
    reviews: {
      ...reviews,
      enableHeader: reviews.enableHeader !== false,
      enableFooter: reviews.enableFooter === true,
      enableFloating: reviews.enableFloating === true,
      carouselHeading: reviews.carouselHeading || 'Customer Reviews',
      carouselSubHeading: reviews.carouselSubHeading || 'What our customers are saying',
      carouselContent: reviews.carouselContent || '',
      showReviewsCarousel: reviews.showReviewsCarousel === true,
      alternateStyles: reviews.alternateStyles === true
    }
  };

  // Map reviews - handle both Google API reviews and manual reviews
  const googleReviews = reviews.googleReviews || [];
  const mappedReviews = (reviews.reviews || []).map((r, i) => ({
    id: r.id || `rev-${i}`,
    author: r.name || r.author || 'Guest',
    rating: r.stars || r.rating || 5,
    content: r.text || r.content || '',
    date: r.date || new Date().toISOString(),
    platform: r.platform || 'Google',
    isActive: r.isActive !== false,
  }));

  // Add Google reviews to siteConfig
  siteConfig.googleReviews = {
    placeId: reviews.placeId || null,
    averageRating: reviews.averageRating || 0,
    totalReviews: reviews.totalReviews || 0,
    showFloatingWidget: reviews.showFloatingWidget !== false,
    showReviewCta: reviews.showReviewCta !== false,
    reviews: reviews.reviews || [],
    // Carousel content options
    showReviewsCarousel: reviews.showReviewsCarousel === true,
    alternateStyles: reviews.alternateStyles === true
  };

  // Calculate final shortcodes values
  const rawShortcodes = shortcodes || {};
  const overrides = rawShortcodes._overrides || {};
  const group = client.group || {};

  const autoShortcodes = {
    restaurantName: settings.displayName || settings.restaurantName || client.name || 'Restaurant',
    group: group.name || '',
    address: primaryLoc.address || '',
    suburb: primaryLoc.suburb || settings.suburb || '',
    state: primaryLoc.state || '',
    phone: primaryLoc.phone || settings.phone || '',
    primaryEmail: settings.defaultEmail || '',
    custom: '',
  };

  const processedShortcodes = { ...autoShortcodes, ...overrides };
  
  return {
    restaurant,
    locations,
    menuCategories: mappedCategories,
    menuItems,
    specials: mappedSpecials,
    navigation,
    homepageSections,
    contentPages: pages,
    footerColumns: footerSections,
    siteConfig,
    reviews: mappedReviews,
    headerCtas: headerCtas || [],
    booking: {
      url: booking.bookingUrl || '',
      label: booking.bookLabel || 'Book Table',
      showInHeader: booking.showInHeader === true,
      orderUrl: booking.orderUrl || '',
      orderLabel: booking.orderLabel || 'Order Online',
      showOrderBtn: booking.showOrderBtn === true,
    },
    // Add raw data for UtilityBelt
    rawSettings: settings,
    rawBooking: booking,
    rawHeader: rawHeader,
    shortcodes: processedShortcodes,
    rawShortcodes: rawShortcodes,
    rawData: data,
  }
}


export const CMSProvider = ({ data, children }) => {
  const cmsData = useMemo(() => adaptCMSData(data), [data]);

  // Apply theme colors to CSS variables for Theme D1
  useEffect(() => {
    if (cmsData.rawData?.colours) {
      const colours = cmsData.rawData.colours;
      
      // Map all theme colors from CMS to CSS variables
      document.documentElement.style.setProperty('--color-primary', colours.primary || '#C8823A');
      document.documentElement.style.setProperty('--color-secondary', colours.secondary || '#1C2B1A');
      document.documentElement.style.setProperty('--color-accent', colours.accentBg || '#F7F2EA');
      document.documentElement.style.setProperty('--color-header-bg', colours.headerBg || '#ffffff');
      document.documentElement.style.setProperty('--color-header-text', colours.headerText || '#1A1A1A');
      document.documentElement.style.setProperty('--color-nav-bg', colours.navBg || '#1C2B1A');
      document.documentElement.style.setProperty('--color-nav-text', colours.navText || '#ffffff');
      document.documentElement.style.setProperty('--color-body-bg', colours.bodyBg || '#ffffff');
      document.documentElement.style.setProperty('--color-body-text', colours.bodyText || '#1A1A1A');
      document.documentElement.style.setProperty('--color-cta-bg', colours.ctaBg || '#C8823A');
      document.documentElement.style.setProperty('--color-cta-text', colours.ctaText || '#ffffff');
      document.documentElement.style.setProperty('--color-accent-bg', colours.accentBg || '#F7F2EA');
      
      // Also update the branding object for backward compatibility
      if (cmsData.restaurant?.branding) {
        const { branding } = cmsData.restaurant;
        branding.primaryColor = colours.primary || branding.primaryColor;
        branding.secondaryColor = colours.secondary || branding.secondaryColor;
        branding.accentColor = colours.accentBg || branding.accentColor;
      }
      
      if (cmsData.rawData?.settings?.fontFamily) {
        document.documentElement.style.setProperty('--font-heading', cmsData.rawData.settings.fontFamily);
      }
    }
  }, [cmsData.rawData?.colours, cmsData.rawData?.settings?.fontFamily]);

  return <CMSContext.Provider value={cmsData}>{children}</CMSContext.Provider>;
};
