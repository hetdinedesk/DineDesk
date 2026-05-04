import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X, ChevronDown, ShoppingCart } from 'lucide-react';
import { useCMS } from '../../contexts/CMSContext';
import { useCart } from '../../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { UtilityBelt } from './UtilityBelt';
import BookingButton from '../BookingButton';

export const Header = () => {
  const { navigation, siteConfig, restaurant, booking, rawData } = useCMS();
  const { isEnabled: orderingEnabled, totalItems, toggleCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  // Get site ID from URL or data for preserving in navigation
  const siteId = rawData?.client?.id || '';
  const siteQuery = siteId ? `?site=${siteId}` : '';

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get header type from CMS config
  const headerType = siteConfig?.theme?.headerType || 'standard-full';
  
  // Check if utility belt is enabled
  const hasUtilityBelt = siteConfig?.theme?.utilityBelt !== false;
  
  // Calculate total header height for CSS variable
  // UtilityBelt: ~40px (py-2 + content), Header: 80px (h-20)
  const headerOffset = hasUtilityBelt ? '7.5rem' : '5rem'; // 120px or 80px
  
  // Set CSS variable for page offset
  useEffect(() => {
    document.documentElement.style.setProperty('--header-offset', headerOffset);
    document.documentElement.style.setProperty('--header-height', hasUtilityBelt ? '120px' : '80px');
  }, [headerOffset, hasUtilityBelt]);

  // Helper to append site param to URLs
  const withSiteParam = (url) => {
    if (!url || url === '#') return url;
    if (!siteId) return url;
    // If URL already has query params, append with &
    if (url.includes('?')) {
      return url.includes('site=') ? url : `${url}&site=${siteId}`;
    }
    return `${url}${siteQuery}`;
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.asPath]);

  // Helper to build children map for filtering headings with pages
  const childrenMap = {};
  (navigation || []).filter(i => i.isActive && i.parentId).forEach(item => {
    if (!childrenMap[item.parentId]) childrenMap[item.parentId] = [];
    childrenMap[item.parentId].push(item);
  });
  Object.keys(childrenMap).forEach(k => { childrenMap[k].sort((a, b) => a.sortOrder - b.sortOrder); });

  // Filter headings: only show if they have at least one child page
  const activeNavItems = (navigation || [])
    .filter((item) => item.isActive && !item.parentId && childrenMap[item.id]?.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Common logic for all header types
  const isTransparent = headerType === 'sticky' && !scrolled;
  const headerTheme = siteConfig?.theme?.headerTheme || 'light'; // Default to light
  const isDark = headerTheme === 'dark';

  const logo = isDark ? restaurant?.branding?.logoDark : restaurant?.branding?.logoLight;
  const fallbackLogo = restaurant?.branding?.logo;
  const displayLogo = logo || fallbackLogo;
  
  const headerBg = isTransparent 
    ? isDark 
      ? 'bg-gray-900/70 backdrop-blur-md' // Dark semi-transparent for dark theme
      : 'bg-black/30 backdrop-blur-md' // Semi-transparent glassmorphism for light theme
    : scrolled 
      ? isDark
        ? 'bg-gray-900/95 backdrop-blur-sm shadow-md' // Dark solid when scrolled
        : 'bg-white/95 backdrop-blur-sm shadow-md' // Light solid when scrolled
      : isDark 
        ? 'bg-gray-900 shadow-md' 
        : 'bg-[var(--color-header-bg)] shadow-md';
  
  const headerTextColor = isTransparent 
    ? '#ffffff' // White text on semi-transparent overlay
    : scrolled
      ? isDark 
        ? '#ffffff' // White text when scrolled in dark theme (dark background)
        : 'var(--color-header-text)' // Normal text when scrolled in light theme
      : isDark 
        ? '#ffffff' 
        : 'var(--color-header-text)';
  const headerPositionClass = headerType === 'sticky' ? 'fixed top-0 left-0 right-0 z-50' : 'relative z-50';

  // Pass down all necessary props
  const props = { 
    navigation, siteConfig, restaurant, booking, rawData, activeNavItems, router, 
    mobileMenuOpen, setMobileMenuOpen, scrolled, 
    headerType, isTransparent, headerTheme, isDark, 
    displayLogo, headerBg, headerTextColor, headerPositionClass,
    siteId, siteQuery, withSiteParam,
    orderingEnabled, totalItems, toggleCart
  };

  // Render different header based on type
  if (headerType === 'minimal') {
    return <MinimalHeader {...props} />;
  }

  if (headerType === 'split') {
    return <SplitHeader {...props} />;
  }

  // Default to Standard Header
  return <StandardHeader {...props} />;
};

function buildChildrenMap(navigation) {
  const map = {};
  (navigation || []).filter(i => i.isActive && i.parentId).forEach(item => {
    if (!map[item.parentId]) map[item.parentId] = [];
    map[item.parentId].push(item);
  });
  Object.keys(map).forEach(k => { map[k].sort((a, b) => a.sortOrder - b.sortOrder); });
  return map;
}

// Helper to get navigation URL - redirects to first child if available
const getNavUrl = (item, children = []) => {
  if (children.length > 0) return children[0].url || '#';
  return item.url || '#';
};

const NavItem = ({ item, children = [], headerTextColor, router, withSiteParam, isDark }) => {
  const [open, setOpen] = useState(false);
  const isActive = router.asPath === item.url || children.some(c => router.asPath === c.url);
  const linkCls = `text-sm font-medium tracking-wide transition-colors relative group`;
  const underline = <span className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full ${isActive ? 'w-full' : ''}`} style={{ backgroundColor: 'var(--color-secondary)' }} />;

  // Redirect to first child page when heading is clicked
  const firstChildUrl = children.length > 0 ? (children[0].url || '#') : (item.url || '#');

  if (children.length <= 1) return (
    <Link href={withSiteParam(firstChildUrl)} className={linkCls} style={{ color: isActive ? 'var(--color-secondary)' : headerTextColor }}>
      {item.label}{underline}
    </Link>
  );

  // Dropdown colors based on theme
  const dropdownBg = isDark ? '#0e1420' : '#ffffff';
  const dropdownBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const dropdownText = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
  const dropdownHoverBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <div className="flex items-center">
        {/* Heading links to first child page */}
        <Link 
          href={withSiteParam(firstChildUrl)} 
          className={linkCls} 
          style={{ color: isActive ? 'var(--color-secondary)' : headerTextColor }}
        >
          {item.label}{underline}
        </Link>
        {/* Dropdown trigger for accessing other pages */}
        <button
          className="ml-1 p-1 transition-colors"
          style={{ color: isActive ? 'var(--color-secondary)' : headerTextColor, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          onClick={(e) => { e.preventDefault(); setOpen(!open); }}
        >
          <ChevronDown size={14} style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.13 }}
            className="absolute top-full left-0 mt-2 rounded-xl shadow-2xl overflow-hidden z-50"
            style={{ minWidth: 180, background: dropdownBg, border: `1px solid ${dropdownBorder}` }}
          >
            {children.map(child => (
              <Link
                key={child.id}
                href={withSiteParam(child.url) || '#'}
                className="block px-4 py-3 text-sm font-medium transition-colors"
                style={{ color: router.asPath === child.url ? 'var(--color-secondary)' : dropdownText }}
                onMouseEnter={e => { e.currentTarget.style.background = dropdownHoverBg; e.currentTarget.style.color = 'var(--color-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = router.asPath === child.url ? 'var(--color-secondary)' : dropdownText; }}
              >
                {child.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StandardHeader = (props) => {
  const { mobileMenuOpen, setMobileMenuOpen, displayLogo, restaurant, booking, rawData, isDark, headerBg, headerTextColor, headerPositionClass, activeNavItems, navigation, router, withSiteParam, orderingEnabled, totalItems, toggleCart } = props;
  return (
    <div className={headerPositionClass}>
      <UtilityBelt isDark={isDark} />
      <header className={`transition-all duration-300 ${headerBg}`} style={{ color: headerTextColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-20">
            {/* Logo and Name - Always links to Home */}
            <Link href={withSiteParam('/') || '/'} className="flex items-center space-x-3 group">
              {displayLogo ? (
                <img 
                  src={displayLogo} 
                  alt={restaurant?.name || 'Restaurant'} 
                  className="w-auto h-auto object-contain transition-all duration-300 group-hover:scale-105 max-h-32"
                />
              ) : (
                <div className="h-10 w-10 bg-gray-300 rounded flex items-center justify-center text-gray-600 font-bold">
                  {restaurant?.name?.charAt(0) || 'R'}
                </div>
              )}
              <span
                className="text-xl font-bold tracking-tight transition-colors"
                style={{ 
                  fontFamily: 'var(--font-heading, inherit)',
                  color: headerTextColor
                }}
              >
                {restaurant?.name || 'Restaurant'}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {activeNavItems.map((item) => (
                <NavItem key={item.id} item={item} children={buildChildrenMap(navigation)[item.id] || []} headerTextColor={headerTextColor} router={router} withSiteParam={withSiteParam} isDark={isDark} />
              ))}
            </nav>

            {/* Desktop CTAs (controlled by Booking settings) */}
            <div className="hidden md:flex items-center space-x-4">
              {booking?.showOrderBtn && booking?.orderUrl && (
                <Link
                  href={withSiteParam(booking.orderUrl) || '#'}
                  className="px-4 py-2 rounded-md text-sm font-bold transition-colors border hover:bg-white/5"
                  style={{ color: headerTextColor, borderColor: 'currentColor' }}
                >
                  {booking.orderLabel || 'Order Online'}
                </Link>
              )}
              {booking?.showInHeader && (
                <BookingButton
                  booking={{ ...booking, clientId: rawData?.client?.id }}
                  locations={rawData?.client?.locations || []}
                  className="px-4 py-2 rounded-md text-sm font-bold transition-all bg-[var(--color-secondary)] text-white hover:opacity-90"
                >
                  {booking.bookLabel || 'Book a Table'}
                </BookingButton>
              )}
              {orderingEnabled && (
                <button
                  onClick={toggleCart}
                  className="relative p-2 rounded-lg transition-colors hover:bg-white/10"
                  style={{ color: headerTextColor }}
                  aria-label="Shopping cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-secondary)] text-white text-xs font-bold flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Mobile Cart + Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              {orderingEnabled && (
                <button
                  onClick={toggleCart}
                  className="relative p-2 rounded-lg transition-colors"
                  style={{ color: headerTextColor }}
                  aria-label="Shopping cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-secondary)] text-white text-xs font-bold flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: headerTextColor }}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t"
              style={{
                backgroundColor: isDark ? '#111827' : '#ffffff',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              }}
            >
              <nav className="px-4 py-3 space-y-1">
                {activeNavItems.map((item) => {
                  const itemChildren = buildChildrenMap(navigation)[item.id] || [];
                  // Redirect to first child page when heading is clicked
                  const hrefRaw = itemChildren.length > 0 ? (itemChildren[0].url || '#') : (item.url || '#');
                  const href = withSiteParam(hrefRaw);
                  const isActive = router.asPath === hrefRaw || router.asPath === href;
                  return (
                    <React.Fragment key={item.id}>
                      <Link
                        href={href}
                        className="block px-3 py-2 text-base font-medium transition-colors rounded-md"
                        style={{ color: isActive ? 'var(--color-secondary)' : (isDark ? '#ffffff' : '#1a1a1a'), backgroundColor: isActive ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent' }}
                      >
                        {item.label}
                      </Link>
                      {itemChildren.length > 0 && itemChildren.map(child => (
                        <Link key={child.id} href={withSiteParam(child.url) || '#'}
                          className="block px-6 py-1.5 text-sm font-medium transition-colors rounded-md"
                          style={{ color: router.asPath === child.url ? 'var(--color-secondary)' : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)') }}
                        >{child.label}</Link>
                      ))}
                    </React.Fragment>
                  );
                })}

                {/* Mobile CTAs (controlled by Booking settings) */}
                {(booking?.showOrderBtn || booking?.showInHeader) && (
                  <div className="pt-3 border-t mt-3 space-y-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                    {booking?.showOrderBtn && booking?.orderUrl && (
                      <Link
                        href={withSiteParam(booking.orderUrl) || '#'}
                        className={`block w-full px-4 py-3 text-center rounded-md text-sm font-bold ${
                          isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                        }`}
                      >
                        {booking.orderLabel || 'Order Online'}
                      </Link>
                    )}
                    {booking?.showInHeader && (
                      <BookingButton
                        booking={{ ...booking, clientId: rawData?.client?.id }}
                        locations={rawData?.client?.locations || []}
                        className="block w-full px-4 py-3 text-center rounded-md text-sm font-bold bg-[var(--color-secondary)] text-white hover:opacity-90"
                      >
                        {booking.bookLabel || 'Book a Table'}
                      </BookingButton>
                    )}
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
};

const SplitHeader = ({ mobileMenuOpen, setMobileMenuOpen, displayLogo, restaurant, navigation, booking, rawData, isDark, headerBg, headerTextColor, headerPositionClass, withSiteParam, orderingEnabled, totalItems, toggleCart }) => {
  const router = useRouter();
  // Filter headings: only show if they have at least one child page
  const childrenMap = buildChildrenMap(navigation);
  const activeNavItems = (navigation || [])
    .filter((item) => item.isActive && !item.parentId && childrenMap[item.id]?.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const midIndex = Math.ceil(activeNavItems.length / 2);
  const leftNav = activeNavItems.slice(0, midIndex);
  const rightNav = activeNavItems.slice(midIndex);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className={headerPositionClass}>
      <UtilityBelt />
      <header className={`transition-all duration-300 ${headerBg}`} style={{ color: headerTextColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-20">
            {/* Desktop Left Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {leftNav.map((item) => (
                <NavItem key={item.id} item={item} children={buildChildrenMap(navigation)[item.id] || []} headerTextColor={headerTextColor} router={router} withSiteParam={withSiteParam} isDark={isDark} />
              ))}
            </nav>

            {/* Logo and Name */}
            <Link href={withSiteParam('/') || '/'} className="flex items-center space-x-3 group absolute left-1/2 -translate-x-1/2">
              {displayLogo && (
                <img
                  src={displayLogo}
                  alt={restaurant?.name || 'Restaurant'}
                  className="w-auto h-auto object-contain transition-all duration-300 group-hover:scale-105 max-h-32"
                />
              )}
              <span
                className="text-xl font-bold tracking-tight transition-colors"
                style={{
                  fontFamily: 'var(--font-heading, inherit)',
                  color: headerTextColor
                }}
              >
                {restaurant?.name || 'Restaurant'}
              </span>
            </Link>

            {/* Desktop Right Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {rightNav.map((item) => (
                <NavItem key={item.id} item={item} children={buildChildrenMap(navigation)[item.id] || []} headerTextColor={headerTextColor} router={router} withSiteParam={withSiteParam} isDark={isDark} />
              ))}
              {booking?.showOrderBtn && booking?.orderUrl && (
                <Link
                  href={withSiteParam(booking.orderUrl) || '#'}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                    isDark ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {booking.orderLabel || 'Order Online'}
                </Link>
              )}
              {booking?.showInHeader && (
                <BookingButton
                  booking={{ ...booking, clientId: rawData?.client?.id }}
                  locations={rawData?.client?.locations || []}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                    isDark ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {booking.bookLabel || 'Book a Table'}
                </BookingButton>
              )}
              {orderingEnabled && (
                <button
                  onClick={toggleCart}
                  className="relative p-2 rounded-lg transition-colors hover:bg-white/10"
                  style={{ color: headerTextColor }}
                  aria-label="Shopping cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-secondary)] text-white text-xs font-bold flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
              )}
            </nav>

            {/* Mobile Menu Button - Left */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: headerTextColor }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Cart - Right */}
            {orderingEnabled && (
              <button
                onClick={toggleCart}
                className="md:hidden relative p-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: headerTextColor }}
                aria-label="Shopping cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-secondary)] text-white text-xs font-bold flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sidebar Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-[60]"
              />
              {/* Sidebar */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed top-0 right-0 h-full w-80 max-w-full z-[70] shadow-2xl"
                style={{ backgroundColor: isDark ? '#111827' : '#ffffff' }}
              >
                {/* Close Button */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                  <span className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Menu</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'}`}
                  >
                    <X size={24} />
                  </button>
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
                  {activeNavItems.map((item) => {
                    const itemChildren = buildChildrenMap(navigation)[item.id] || [];
                    const hrefRaw = itemChildren.length > 0 ? (itemChildren[0].url || '#') : (item.url || '#');
                    const href = withSiteParam(hrefRaw);
                    const isActive = router.asPath === hrefRaw || router.asPath === href;
                    return (
                      <React.Fragment key={item.id}>
                        <Link
                          href={href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block px-3 py-3 text-base font-medium transition-colors rounded-md ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'} ${isActive ? (isDark ? 'bg-white/20 font-semibold' : 'bg-gray-100 font-semibold') : ''}`}
                        >
                          {item.label}
                        </Link>
                        {itemChildren.length > 0 && itemChildren.map(child => (
                          <Link key={child.id} href={withSiteParam(child.url) || '#'}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-6 py-2 text-sm font-medium transition-colors rounded-md ${router.asPath === child.url ? (isDark ? 'text-white bg-white/10' : 'text-gray-900 bg-gray-100') : (isDark ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')}`}
                          >{child.label}</Link>
                        ))}
                      </React.Fragment>
                    );
                  })}

                  {/* Mobile CTAs */}
                  {(booking?.showOrderBtn || booking?.showInHeader) && (
                    <div className="pt-4 border-t mt-4 space-y-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                      {booking?.showOrderBtn && booking?.orderUrl && (
                        <Link
                          href={withSiteParam(booking.orderUrl) || '#'}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full px-4 py-3 text-center rounded-md text-sm font-bold bg-white text-gray-900 hover:bg-gray-100"
                        >
                          {booking.orderLabel || 'Order Online'}
                        </Link>
                      )}
                      {booking?.showInHeader && (
                        <BookingButton
                          booking={{ ...booking, clientId: rawData?.client?.id }}
                          locations={rawData?.client?.locations || []}
                          className="block w-full px-4 py-3 text-center rounded-md text-sm font-bold bg-[var(--color-secondary)] text-white hover:opacity-90"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {booking.bookLabel || 'Book a Table'}
                        </BookingButton>
                      )}
                    </div>
                  )}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
};

const MinimalHeader = ({ mobileMenuOpen, setMobileMenuOpen, displayLogo, restaurant, navigation, booking, rawData, isDark, headerBg, headerTextColor, headerPositionClass, withSiteParam, orderingEnabled, totalItems, toggleCart }) => {
  const router = useRouter();
  // Filter headings: only show if they have at least one child page
  const childrenMap = buildChildrenMap(navigation);
  const activeNavItems = (navigation || [])
    .filter((item) => item.isActive && !item.parentId && childrenMap[item.id]?.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className={headerPositionClass}>
      <UtilityBelt />
      <header className={`transition-all duration-300 ${headerBg}`} style={{ color: headerTextColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-20">
            {/* Logo and Name */}
            <Link href={withSiteParam('/') || '/'} className="flex items-center space-x-3 group">
              {displayLogo && (
                <img
                  src={displayLogo}
                  alt={restaurant?.name || 'Restaurant'}
                  className="w-auto h-auto object-contain transition-all duration-300 group-hover:scale-105 max-h-32"
                />
              )}
              <span
                className="text-xl font-bold tracking-tight transition-colors"
                style={{
                  fontFamily: 'var(--font-heading, inherit)',
                  color: headerTextColor
                }}
              >
                {restaurant?.name || 'Restaurant'}
              </span>
            </Link>

            {/* Mobile Menu Button - Left */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: headerTextColor }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Cart - Right */}
            {orderingEnabled && (
              <button
                onClick={toggleCart}
                className="relative p-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: headerTextColor }}
                aria-label="Shopping cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-secondary)] text-white text-xs font-bold flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-[60]"
              />
              {/* Sidebar */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed top-0 right-0 h-full w-80 max-w-full z-[70] shadow-2xl"
                style={{ backgroundColor: isDark ? '#111827' : '#ffffff' }}
              >
                {/* Close Button */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                  <span className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Menu</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'}`}
                  >
                    <X size={24} />
                  </button>
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
                  {activeNavItems.map((item) => {
                    const itemChildren = buildChildrenMap(navigation)[item.id] || [];
                    // Redirect to first child page when heading is clicked
                    const hrefRaw = itemChildren.length > 0 ? (itemChildren[0].url || '#') : (item.url || '#');
                    const href = withSiteParam(hrefRaw);
                    const isActive = router.asPath === hrefRaw || router.asPath === href;
                    return (
                      <React.Fragment key={item.id}>
                        <Link
                          href={href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block px-3 py-3 text-base font-medium transition-colors rounded-md ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'} ${isActive ? (isDark ? 'bg-white/20 font-semibold' : 'bg-gray-100 font-semibold') : ''}`}
                        >
                          {item.label}
                        </Link>
                        {itemChildren.length > 0 && itemChildren.map(child => (
                          <Link key={child.id} href={withSiteParam(child.url) || '#'}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-6 py-2 text-sm font-medium transition-colors rounded-md ${router.asPath === child.url ? (isDark ? 'text-white bg-white/10' : 'text-gray-900 bg-gray-100') : (isDark ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')}`}
                          >{child.label}</Link>
                        ))}
                      </React.Fragment>
                    );
                  })}

                  {/* CTAs */}
                  {(booking?.showOrderBtn || booking?.showInHeader) && (
                    <div className="pt-4 border-t mt-4 space-y-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                      {booking?.showOrderBtn && booking?.orderUrl && (
                        <Link
                          href={withSiteParam(booking.orderUrl) || '#'}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full px-4 py-3 text-center rounded-md text-sm font-bold bg-white text-gray-900 hover:bg-gray-100"
                        >
                          {booking.orderLabel || 'Order Online'}
                        </Link>
                      )}
                      {booking?.showInHeader && (
                        <BookingButton
                          booking={{ ...booking, clientId: rawData?.client?.id }}
                          locations={rawData?.client?.locations || []}
                          className="block w-full px-4 py-3 text-center rounded-md text-sm font-bold bg-[var(--color-primary)] text-white hover:opacity-90"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {booking.bookLabel || 'Book a Table'}
                        </BookingButton>
                      )}
                    </div>
                  )}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
};

