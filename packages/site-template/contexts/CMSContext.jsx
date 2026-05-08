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
    banners = [],
    promoTiles = [],
    promoConfig = {},
    teamDepartments = [],
    welcomeContent = {},
    specialsConfig = {},
    reviews = {},
    shortcodes = {},
    header = {},
    footer = {},
    headerCtas = [],
    ordering = {},
    _homeBanner = null,
    _homePage = null,
    themeKey = 'theme-d1',
  } = data || {};

  // Normalize hours to always be an array of { day, open, close, closed }
  // Always returns all 7 days in consistent order for consistent display across clients
  const normalizeHours = (hours) => {
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    // Map abbreviated day names to full names
    const dayNameMap = {
      'Mon': 'Monday', 'Mon.': 'Monday', 'Monday': 'Monday',
      'Tue': 'Tuesday', 'Tue.': 'Tuesday', 'Tuesday': 'Tuesday',
      'Wed': 'Wednesday', 'Wed.': 'Wednesday', 'Wednesday': 'Wednesday',
      'Thu': 'Thursday', 'Thu.': 'Thursday', 'Thursday': 'Thursday',
      'Fri': 'Friday', 'Fri.': 'Friday', 'Friday': 'Friday',
      'Sat': 'Saturday', 'Sat.': 'Saturday', 'Saturday': 'Saturday',
      'Sun': 'Sunday', 'Sun.': 'Sunday', 'Sunday': 'Sunday'
    };
    // Map numeric indices to day names (0=Monday, 6=Sunday)
    const indexToDay = {
      '0': 'Monday', '1': 'Tuesday', '2': 'Wednesday', '3': 'Thursday',
      '4': 'Friday', '5': 'Saturday', '6': 'Sunday'
    };

    if (!hours) {
      // Return all days as closed if no hours data
      return allDays.map(day => ({ day, open: '', close: '', closed: true }));
    }

    // Build a map of existing hours
    const hoursMap = {};

    if (Array.isArray(hours)) {
      hours.forEach(h => {
        const hasTimes = h.open && h.close;
        const isClosed = !hasTimes && (h.closed === true || h.closed !== false);
        hoursMap[h.day] = {
          day: h.day,
          open: h.open || '',
          close: h.close || '',
          closed: isClosed
        };
      });
    } else if (typeof hours === 'object') {
      Object.entries(hours).forEach(([key, value]) => {
        const day = dayNameMap[key] || indexToDay[key] || key;
        if (typeof value === 'string') {
          // Parse "9am-5pm" format
          const match = value.match(/(\d+(?::\d+)?(?:am|pm)?)\s*-\s*(\d+(?::\d+)?(?:am|pm)?)/i);
          if (match) {
            hoursMap[day] = { day, open: match[1], close: match[2], closed: false };
          } else {
            hoursMap[day] = { day, open: '', close: '', closed: true };
          }
        } else if (typeof value === 'object' && value !== null) {
          hoursMap[day] = {
            day,
            open: value.open || '',
            close: value.close || '',
            closed: value.closed === true || (!value.open && !value.close)
          };
        }
      });
    }

    // Build final array in consistent order
    return allDays.map(day => hoursMap[day] || { day, open: '', close: '', closed: true });
  };

  // Find primary location
  const primaryLoc = client?.locations?.find(l => l.isPrimary) || client?.locations?.[0] || {};

  // Build restaurant object
  const restaurant = {
    id: client?.id || 'rest-1',
    name: settings.displayName || settings.restaurantName || client?.name || 'Restaurant',
    domain: client?.domain || '',
    email: settings.defaultEmail || client?.email || '',
    description: settings.tagline || client?.description || '',
    hours: normalizeHours(primaryLoc?.hours),
    address: primaryLoc?.address || '',
    phone: primaryLoc?.phone || settings.phone || '',
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
    content: (() => {
      if (typeof section.content !== 'string') return section.content || {}
      try { return JSON.parse(section.content) } catch { return {} }
    })(),
    // Map memberDepartments to departmentIds for team template
    departmentIds: section.memberDepartments?.map(md => md.departmentId) || []
  }));

  // Map locations
  const locations = (client?.locations || []).map(loc => {
    // Handle address field - can be string or object
    const addressStr = typeof loc.address === 'string' ? loc.address : (loc.address?.street || '');
    
    const normalizedHours = normalizeHours(loc.hours);
    
    return {
      id: loc.id,
      name: loc.name || 'Main Location',
      address: {
        street: addressStr,
        suburb: loc.suburb || loc.address?.suburb || '',
        city: loc.city || loc.address?.city || '',
        state: loc.state || loc.address?.state || '',
        zipCode: loc.postcode || loc.address?.zipCode || loc.address?.postcode || '',
        country: loc.country || loc.address?.country || '',
        postcode: loc.postcode || loc.address?.postcode || '',
      },
      coordinates: {
        latitude: loc.lat || 0,
        longitude: loc.lng || 0,
      },
      contact: {
        phone: loc.phone || '',
        email: loc.formEmail || loc.email || '',
      },
      phone: loc.phone || '',
      email: loc.formEmail || loc.email || '',
      hours: normalizedHours,
      gallery: (() => {
        // Priority: exteriorImages (new array) > exteriorImage (legacy single) > galleryImages
        const exteriorImages = loc.exteriorImages || [];
        if (Array.isArray(exteriorImages) && exteriorImages.length > 0) {
          return exteriorImages;
        }
        if (loc.exteriorImage) {
          return [loc.exteriorImage];
        }
        const galleryImages = loc.galleryImages || loc.gallery || [];
        if (typeof galleryImages === 'string') {
          try {
            return JSON.parse(galleryImages);
          } catch {
            return [];
          }
        }
        return Array.isArray(galleryImages) ? galleryImages : [];
      })(),
      deliveryOptions: loc.deliveryOptions || null,
      servicesAvailable: loc.servicesAvailable || [],
      isPrimary: loc.isPrimary,
      isActive: loc.isActive !== false,
      showInFooter: loc.showInFooter === true,
      alternateStyling: loc.alternateStyling === true,
    };
  });

  // Map menu categories and items
  const menuItems = (rawMenuItems || []).map(item => {
    const sizes = item.sizes || [];
    const addons = item.addons || [];
    // Automatically set hasVariants if sizes or addons are present
    const hasVariants = item.hasVariants === true || sizes.length > 0 || addons.length > 0;
    
    return {
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
      sizes,
      addons,
      hasVariants,
    };
  });

  const mappedCategories = (menuCategories || []).map(cat => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    isActive: cat.isActive !== false,
    sortOrder: cat.sortOrder || 0,
  }));

  // Map specials — DB uses startDate/endDate; mock data uses validFrom/validUntil
  const mappedSpecials = (specials || []).map(s => ({
    id: s.id,
    title: s.title,
    description: s.description || '',
    price: s.price || 0,
    image: s.imageUrl || s.bannerImage || s.image || '',
    isActive: s.isActive !== false,
    isHighlighted: s.isHighlighted || false,
    originalPrice: s.originalPrice || null,
    validFrom: s.startDate || s.validFrom || null,
    validUntil: s.endDate || s.validUntil || null,
  }));

  // Flatten navigation tree (export returns hierarchical tree — flatten so children are included)
  function flattenNavItems(items, forcedParentId) {
    const flat = [];
    (items || []).forEach(item => {
      flat.push({ ...item, parentId: item.parentId || forcedParentId || null });
      if (item.children && item.children.length > 0) {
        flattenNavItems(item.children, item.id).forEach(c => flat.push(c));
      }
    });
    return flat;
  }

  // Map navigation
  let navigation = flattenNavItems(navigationItems).map(nav => {
    let url = nav.url;
    if (nav.pageId && nav.page) {
      // Home pages should always link to root path
      if (nav.page.pageType === 'home') {
        url = '/';
      } else {
        url = `/${nav.page.slug.replace(/^\//, '')}`;
      }
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
    siteName: settings.displayName || settings.restaurantName || client?.name || 'Restaurant',
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
      facebook: data.facebook || data.social?.facebook || null,
      instagram: data.instagram || data.social?.instagram || null,
      twitter: data.twitter || data.social?.twitter || null,
      linkedin: data.linkedin || data.social?.linkedin || null,
      showInFooter: data.social?.showInFooter !== false,
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
      showReviewsCarousel: reviews.showReviewsCarousel === true || (reviews.reviews && reviews.reviews.length > 0),
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
    showReviewsCarousel: reviews.showReviewsCarousel === true || (reviews.reviews && reviews.reviews.length > 0),
    alternateStyles: reviews.alternateStyles === true
  };

  // Calculate final shortcodes values
  const rawShortcodes = shortcodes || {};
  const overrides = rawShortcodes._overrides || {};
  const group = client?.group || {};

  const autoShortcodes = {
    restaurantName: settings.displayName || settings.restaurantName || client?.name || 'Restaurant',
    group: group.name || '',
    address: primaryLoc.address || '',
    suburb: primaryLoc.suburb || settings.suburb || '',
    state: primaryLoc.state || '',
    phone: primaryLoc.phone || settings.phone || '',
    primaryEmail: settings.defaultEmail || '',
    custom: '',
  };

  const processedShortcodes = { ...autoShortcodes, ...overrides };
  
  // Transform headerCtas from object to array format for UtilityBelt
  // Handle both object format (legacy) and array format (CMS standard)
  let mappedHeaderCtas = [];
  if (headerCtas && Array.isArray(headerCtas)) {
    // Already in array format (CMS standard)
    mappedHeaderCtas = headerCtas;
  } else if (headerCtas && typeof headerCtas === 'object') {
    // Object format (legacy) - convert to array
    if (headerCtas.primary && headerCtas.primary.show) {
      mappedHeaderCtas.push({
        id: 'primary',
        label: headerCtas.primary.label || 'Primary',
        value: headerCtas.primary.url || '#',
        variant: 'primary',
        active: true
      });
    }
    if (headerCtas.secondary && headerCtas.secondary.show) {
      mappedHeaderCtas.push({
        id: 'secondary', 
        label: headerCtas.secondary.label || 'Secondary',
        value: headerCtas.secondary.url || '#',
        variant: 'secondary',
        active: true
      });
    }
  }

  return {
    restaurant,
    locations,
    menuCategories: mappedCategories,
    menuItems,
    specials: mappedSpecials,
    navigation,
    homepageSections,
    contentPages: pages,
    footerColumns: (footerSections || [])
      .filter(s => s.isActive !== false)
      .map(s => ({
        ...s,
        links: (s.links || []).map(l => ({
          ...l,
          url: l.pageId && l.page
            ? l.page.pageType === 'home'
              ? '/'
              : `/${(l.page.slug || '').replace(/^\//, '')}`
            : (l.externalUrl || '#')
        }))
      })),
    unassignedFooterLinks: (data?.unassignedFooterLinks || [])
      .filter(l => l.isActive !== false)
      .map(l => ({
        ...l,
        url: l.pageId && l.page
          ? l.page.pageType === 'home'
            ? '/'
            : `/${(l.page.slug || '').replace(/^\//, '')}`
          : (l.externalUrl || '#')
      })),
    siteConfig,
    reviews: mappedReviews,
    headerCtas: mappedHeaderCtas,
    booking: {
      enabled: booking.enabled === true,
      confirmationMethod: booking.confirmationMethod || 'email',
      bookingUrl: booking.bookingUrl || '',
      bookingPhone: booking.bookingPhone || '',
      url: booking.bookingUrl || '',
      label: booking.bookLabel || 'Book a Table',
      bookLabel: booking.bookLabel || 'Book a Table',
      bookConfirmMsg: booking.bookConfirmMsg || 'Booking submitted successfully!',
      showInNav: booking.showInNav !== false,
      showInHeader: booking.showInHeader !== false,
      showOnLocations: booking.showOnLocations !== false,
      orderUrl: booking.orderUrl || '',
      orderLabel: booking.orderLabel || 'Order Online',
      showOrderBtn: booking.showOrderBtn === true,
      minParty: booking.minParty || 1,
      maxParty: booking.maxParty || 20,
      advanceNotice: booking.advanceNotice || 2,
      maxDaysAhead: booking.maxDaysAhead || 60,
      slotInterval: booking.slotInterval || 30,
      notifyEmail: booking.notifyEmail || '',
      maxTables: booking.maxTables || 20,
    },
    // Add raw data for UtilityBelt
    rawSettings: settings,
    rawBooking: booking,
    rawHeader: rawHeader,
    shortcodes: processedShortcodes,
    rawShortcodes: rawShortcodes,
    rawData: data,
    _homeBanner,
    _homePage,
    // Homepage data (new unified structure)
    banners: data?.banners || [],
    homePage: _homePage || data?.homePage || null,
    promoTiles: data?.promoTiles || [],
    promoConfig: data?.promoConfig || { heading: null, subheading: null, isActive: true },
    featuredConfig: data?.featuredConfig || { heading: null, subheading: null, isActive: true },
    welcomeContent: data?.welcomeContent || { subtitle: null, heading: null, text: null, imageUrl: null, ctaText: null, ctaUrl: null, isExternal: false, isActive: true },
    specialsConfig: data?.specialsConfig || { heading: null, subheading: null, showOnHomepage: false, maxItems: 2, isActive: true },
    teamDepartments: data?.teamDepartments || [],
    homepageLayout: data?.homepageLayout || { components: [] },
    customTextBlocks: data?.customTextBlocks || [],
    ordering: ordering || { enabled: false },
    footer: footer || { columns: footerSections || [], theme: 'dark' },
    socialLinks: [
      ...(siteConfig.social?.facebook ? [{ platform: 'facebook', url: siteConfig.social.facebook }] : []),
      ...(siteConfig.social?.instagram ? [{ platform: 'instagram', url: siteConfig.social.instagram }] : []),
      ...(siteConfig.social?.twitter ? [{ platform: 'twitter', url: siteConfig.social.twitter }] : []),
      ...(siteConfig.social?.linkedin ? [{ platform: 'linkedin', url: siteConfig.social.linkedin }] : []),
    ],
    team: teamDepartments || [],
    googleReviewUrl: siteConfig.googleReviews?.placeId 
      ? `https://search.google.com/local/writereview?placeid=${siteConfig.googleReviews.placeId}` 
      : null,
    themeKey: themeKey || 'theme-d1',
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
      document.documentElement.style.setProperty('--color-utility-belt-bg', colours.utilityBeltBg || colours.primary);
      document.documentElement.style.setProperty('--color-utility-belt-text', colours.utilityBeltText || '#ffffff');
      
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
