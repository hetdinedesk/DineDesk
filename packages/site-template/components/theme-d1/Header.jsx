import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useCMS } from '../../contexts/CMSContext';
import { motion, AnimatePresence } from 'framer-motion';
import { UtilityBelt } from './UtilityBelt';

export const Header = () => {
  const { navigation, siteConfig, restaurant, booking } = useCMS();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.asPath]);

  const activeNavItems = (navigation || [])
    .filter((item) => item.isActive && !item.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const headerType = siteConfig?.theme?.headerType || 'standard-full';

  // Common logic for all header types
  const isTransparent = headerType === 'sticky' && !scrolled;
  const headerTheme = siteConfig?.theme?.headerTheme || 'light'; // Default to light
  const isDark = headerTheme === 'dark';

  const logo = isDark ? restaurant?.branding?.logoDark : restaurant?.branding?.logoLight;
  const fallbackLogo = restaurant?.branding?.logo;
  const displayLogo = logo || fallbackLogo;
  
  const headerBg = isTransparent 
    ? 'bg-transparent' 
    : isDark 
      ? 'bg-gray-900 shadow-md' 
      : 'bg-[var(--color-header-bg)] shadow-md';
  const headerTextColor = isTransparent ? '#ffffff' : (isDark ? '#ffffff' : 'var(--color-header-text)');
  const headerPositionClass = headerType === 'sticky' ? 'fixed top-0 left-0 right-0 z-50' : 'relative z-50';

  // Pass down all necessary props
  const props = { 
    navigation, siteConfig, restaurant, booking, activeNavItems, router, 
    mobileMenuOpen, setMobileMenuOpen, scrolled, 
    headerType, isTransparent, headerTheme, isDark, 
    displayLogo, headerBg, headerTextColor, headerPositionClass
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

const StandardHeader = (props) => {
  const { mobileMenuOpen, setMobileMenuOpen, displayLogo, restaurant, booking, isDark, headerBg, headerTextColor, headerPositionClass, activeNavItems, router } = props;
  return (
    <div className={headerPositionClass}>
      <UtilityBelt isDark={isDark} />
      <header className={`transition-all duration-300 ${headerBg}`} style={{ color: headerTextColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Name */}
            <Link href="/" className="flex items-center space-x-3 group">
              {displayLogo ? (
                <img 
                  src={displayLogo} 
                  alt={restaurant?.name || 'Restaurant'} 
                  className="h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105"
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
              {activeNavItems.map((item) => {
                const isActive = router.asPath === item.url;
                return (
                  <Link
                    key={item.id}
                    href={item.url || '#'}
                    className={`text-sm font-medium tracking-wide transition-colors relative group ${
                      isActive ? 'text-[var(--color-secondary)]' : 'hover:text-[var(--color-secondary)]'
                    }`}
                    style={{ color: isActive ? 'var(--color-secondary)' : headerTextColor }}
                  >
                    {item.label}
                    <span
                      className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-secondary)] transition-all group-hover:w-full ${
                        isActive ? 'w-full' : ''
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Desktop CTAs (controlled by Booking settings) */}
            <div className="hidden md:flex items-center space-x-4">
              {booking?.showOrderBtn && booking?.orderUrl && (
                <Link
                  href={booking.orderUrl}
                  className="px-4 py-2 rounded-md text-sm font-bold transition-colors border hover:bg-white/5"
                  style={{ color: headerTextColor, borderColor: 'currentColor' }}
                >
                  {booking.orderLabel || 'Order Online'}
                </Link>
              )}
              {booking?.showInHeader && booking?.url && (
                <Link 
                  href={booking.url} 
                  className="px-4 py-2 rounded-md text-sm font-bold transition-all bg-[var(--color-secondary)] text-white hover:opacity-90"
                >
                  {booking.label || 'Book Table'}
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: headerTextColor }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
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
                backgroundColor: isDark ? '#111827' : 'var(--color-header-bg)',
                borderColor: 'rgba(255,255,255,0.1)' 
              }}
            >
              <nav className="px-4 py-4 space-y-2">
                {activeNavItems.map((item) => {
                  const isActive = router.asPath === item.url;
                  return (
                    <Link
                      key={item.id}
                      href={item.url || '#'}
                      className="block px-3 py-2 text-base font-medium transition-colors rounded-md"
                      style={{ 
                        color: isActive ? 'var(--color-secondary)' : headerTextColor,
                        backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent'
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                
                {/* Mobile CTAs (controlled by Booking settings) */}
                {(booking?.showOrderBtn || booking?.showInHeader) && (
                  <div className="pt-4 border-t mt-4 space-y-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    {booking?.showOrderBtn && booking?.orderUrl && (
                      <Link 
                        href={booking.orderUrl} 
                        className={`block w-full px-4 py-3 text-center rounded-md text-sm font-bold ${
                          isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                        }`}
                      >
                        {booking.orderLabel || 'Order Online'}
                      </Link>
                    )}
                    {booking?.showInHeader && booking?.url && (
                      <Link 
                        href={booking.url} 
                        className="block w-full px-4 py-3 text-center rounded-md text-sm font-bold bg-[var(--color-secondary)] text-white"
                      >
                        {booking.label || 'Book Table'}
                      </Link>
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

const SplitHeader = ({ displayLogo, restaurant, navigation, booking, isDark, headerBg, headerTextColor, headerPositionClass }) => {
  const router = useRouter();
  const activeNavItems = (navigation || [])
    .filter((item) => item.isActive && !item.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const midIndex = Math.ceil(activeNavItems.length / 2);
  const leftNav = activeNavItems.slice(0, midIndex);
  const rightNav = activeNavItems.slice(midIndex);

  return (
    <div className={headerPositionClass}>
      <UtilityBelt />
      <header className={`transition-all duration-300 ${headerBg}`} style={{ color: headerTextColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {leftNav.map((item) => {
                const isActive = router.asPath === item.url;
                return (
                  <Link
                    key={item.id}
                    href={item.url || '#'}
                    className={`text-sm font-medium tracking-wide transition-colors relative group ${
                      isActive ? 'text-[var(--color-secondary)]' : 'hover:text-[var(--color-secondary)]'
                    }`}
                    style={{ color: isActive ? 'var(--color-secondary)' : headerTextColor }}
                  >
                    {item.label}
                    <span
                      className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-secondary)] transition-all group-hover:w-full ${
                        isActive ? 'w-full' : ''
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Logo and Name */}
            <Link href="/" className="flex items-center space-x-3 group absolute left-1/2 -translate-x-1/2">
              {displayLogo && (
                <img 
                  src={displayLogo} 
                  alt={restaurant?.name || 'Restaurant'} 
                  className="h-12 w-auto object-contain transition-all duration-300 group-hover:scale-105"
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

            {/* Right Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {rightNav.map((item) => {
                const isActive = router.asPath === item.url;
                return (
                  <Link
                    key={item.id}
                    href={item.url || '#'}
                    className={`text-sm font-medium tracking-wide transition-colors relative group ${
                      isActive ? 'text-[var(--color-secondary)]' : 'hover:text-[var(--color-secondary)]'
                    }`}
                    style={{ color: isActive ? 'var(--color-secondary)' : headerTextColor }}
                  >
                    {item.label}
                    <span
                      className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-secondary)] transition-all group-hover:w-full ${
                        isActive ? 'w-full' : ''
                      }`}
                    />
                  </Link>
                );
              })}
              {booking?.showOrderBtn && booking?.orderUrl && (
                <Link 
                  href={booking.orderUrl} 
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                    isDark ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {booking.orderLabel || 'Order Online'}
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>
    </div>
  );
};

const MinimalHeader = ({ mobileMenuOpen, setMobileMenuOpen, displayLogo, restaurant, navigation, booking, isDark, headerBg, headerTextColor, headerPositionClass }) => {
  const router = useRouter();
  const activeNavItems = (navigation || [])
    .filter((item) => item.isActive && !item.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className={headerPositionClass}>
      <UtilityBelt />
      <header className={`transition-all duration-300 ${headerBg}`} style={{ color: headerTextColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Name */}
            <Link href="/" className="flex items-center space-x-3 group">
              {displayLogo && (
                <img 
                  src={displayLogo} 
                  alt={restaurant?.name || 'Restaurant'} 
                  className="h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105"
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: headerTextColor }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t"
              style={{ 
                backgroundColor: isDark ? '#111827' : 'var(--color-header-bg)',
                borderColor: 'rgba(255,255,255,0.1)' 
              }}
            >
              <nav className="px-4 py-4 space-y-2">
                {activeNavItems.map((item) => {
                  const isActive = router.asPath === item.url;
                  return (
                    <Link
                      key={item.id}
                      href={item.url || '#'}
                      className="block px-3 py-2 text-base font-medium transition-colors rounded-md"
                      style={{ 
                        color: isActive ? 'var(--color-secondary)' : headerTextColor,
                        backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent'
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                
                {/* Mobile CTAs (controlled by Booking settings) */}
                {(booking?.showOrderBtn || booking?.showInHeader) && (
                  <div className="pt-4 border-t mt-4 space-y-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    {booking?.showOrderBtn && booking?.orderUrl && (
                      <Link 
                        href={booking.orderUrl} 
                        className={`block w-full px-4 py-3 text-center rounded-md text-sm font-bold ${
                          isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                        }`}
                      >
                        {booking.orderLabel || 'Order Online'}
                      </Link>
                    )}
                    {booking?.showInHeader && booking?.url && (
                      <Link 
                        href={booking.url} 
                        className="block w-full px-4 py-3 text-center rounded-md text-sm font-bold bg-[var(--color-secondary)] text-white"
                      >
                        {booking.label || 'Book Table'}
                      </Link>
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

