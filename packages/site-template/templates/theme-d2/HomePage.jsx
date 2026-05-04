import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { useLoyalty } from '../../contexts/LoyaltyContext';
import { useCart } from '../../contexts/CartContext';
import { Header } from '../../components/theme-d2/Header';
import { Footer } from '../../components/theme-d2/Footer';
import { FeaturedItemsSection } from '../../components/theme-d2/sections/FeaturedItemsSection';
import { ReviewsSection } from '../../components/theme-d2/sections/ReviewsSection';
import PromoTilesSection from '../../components/theme-d2/sections/PromoTilesSection';
import { FloatingReviewWidget } from '../../components/theme-d2/FloatingReviewWidget';
import { replaceShortcodes } from '../../lib/shortcodes';
import { ChevronLeft, ChevronRight, Clock, ArrowRight, Star, Gift, Play, Heart, Plus, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { withSiteParam, getSiteId } from '../../lib/links';

function HomePageContent() {
  const { 
    banners, 
    homePage, 
    promoTiles, 
    promoConfig,
    featuredConfig,
    welcomeContent,
    specials,
    specialsConfig,
    menuItems,
    shortcodes,
    homepageLayout,
    customTextBlocks,
    siteConfig
  } = useCMS();

  // Get active banners for carousel
  const activeBanners = (banners || [])
    .filter(b => b.isActive && (b.location === 'home' || b.location === 'both'))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Get home page data
  const pageTitle = replaceShortcodes(homePage?.title || 'Welcome', shortcodes);
  const pageSubtitle = replaceShortcodes(homePage?.subtitle || '', shortcodes);
  const welcomeImage = homePage?.welcomeImage;

  // Get active promo tiles from CMS (new structure)
  const activePromos = (promoTiles || [])
    .filter(p => p.isActive !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .slice(0, 6);

  // Get featured menu items
  const featuredItems = (menuItems || [])
    .filter(item => item.isFeatured && item.isAvailable)
    .slice(0, 4);

  // Get active specials
  const activeSpecials = (specials || [])
    .filter(s => s.isActive && isSpecialValid(s))
    .slice(0, 2);

  // Get layout configuration or use default
  const layoutComponents = homepageLayout?.components || [
    { id: 'welcome', type: 'welcome', visible: true, order: 0 },
    { id: 'promos', type: 'promos', visible: true, order: 1 },
    { id: 'specials', type: 'specials', visible: true, order: 2 },
    { id: 'featured', type: 'featured', visible: true, order: 3 },
    { id: 'loyalty', type: 'loyalty', visible: true, order: 4 },
    { id: 'reviews', type: 'reviews', visible: true, order: 5 }
  ];

  // Map component type to render function
  const componentMap = {
    welcome: () => welcomeContent?.isActive !== false && (welcomeContent?.heading || welcomeContent?.text || welcomeContent?.imageUrl) && (
      <WelcomeSection 
        subtitle={replaceShortcodes(welcomeContent?.subtitle || '', shortcodes)}
        title={replaceShortcodes(welcomeContent?.heading || '', shortcodes)}
        content={replaceShortcodes(welcomeContent?.text || '', shortcodes)}
        image={welcomeContent?.imageUrl}
        ctaText={replaceShortcodes(welcomeContent?.ctaText || '', shortcodes)}
        ctaUrl={welcomeContent?.ctaUrl}
        isExternal={welcomeContent?.isExternal}
        shortcodes={shortcodes}
      />
    ),
    promos: () => promoConfig?.isActive !== false && (promoConfig?.heading || activePromos.length > 0) && (
      <PromoTilesSection 
        promos={activePromos} 
        shortcodes={shortcodes}
        title={replaceShortcodes(promoConfig.heading || '', shortcodes)}
        subtitle={replaceShortcodes(promoConfig.subheading || '', shortcodes)}
      />
    ),
    specials: () => specialsConfig?.showOnHomepage && activeSpecials.length > 0 && (
      <HomeSpecialsSection
        specials={activeSpecials.slice(0, specialsConfig.maxItems || 2)}
        title={replaceShortcodes(specialsConfig?.heading || 'Current Specials', shortcodes)}
        subtitle={replaceShortcodes(specialsConfig?.subheading || 'Limited time offerings', shortcodes)}
      />
    ),
    loyalty: () => <LoyaltyBannerSection />,
    reviews: () => <ReviewsSection />,
    custom: (blockId) => {
      const block = customTextBlocks?.find(b => b.id === blockId);
      if (!block || block.isActive === false) return null;
      
      return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {block.title && (
              <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-primary)] mb-8" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
                {replaceShortcodes(block.title, shortcodes)}
              </h2>
            )}
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: replaceShortcodes(block.content || '', shortcodes) }}
            />
          </div>
        </section>
      );
    }
  };

  // Sort and filter components by layout configuration
  const visibleComponents = layoutComponents
    .filter(c => c.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* 1. Banner Carousel */}
        <BannerCarousel banners={activeBanners} shortcodes={shortcodes} siteConfig={siteConfig} />

        {/* 2. Render components in configured order */}
        {visibleComponents.map((component) => {
          const renderFn = componentMap[component.type];
          return renderFn ? (
            <div key={component.id}>
              {component.type === 'custom' ? renderFn(component.id) : renderFn()}
            </div>
          ) : null;
        })}
      </main>
      <Footer />
      <FloatingReviewWidget />
    </div>
  );
}

// Banner Carousel Component - Connected to CMS Banners
function BannerCarousel({ banners, shortcodes, siteConfig }) {
  const router = useRouter();
  const siteId = getSiteId(router);
  const [current, setCurrent] = React.useState(0);
  
  // Filter only active homepage banners (location='home')
  const homeBanners = (banners || [])
    .filter(b => b.isActive && b.location === 'home')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  
  // No banners - render nothing (no default)
  if (homeBanners.length === 0) {
    return null;
  }

  const next = () => setCurrent((c) => (c + 1) % homeBanners.length);
  const prev = () => setCurrent((c) => (c - 1 + homeBanners.length) % homeBanners.length);

  // Auto-advance every 6 seconds
  React.useEffect(() => {
    if (homeBanners.length > 1) {
      const timer = setInterval(next, 6000);
      return () => clearInterval(timer);
    }
  }, [homeBanners.length]);

  const banner = homeBanners[current];

  // Determine if link is external
  const isExternalLink = (url) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
  };

  const bannerUrl = banner.buttonUrl;
  const external = banner.isExternal || isExternalLink(bannerUrl);

  return (
    <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={banner.imageUrl}
            alt={banner.title || 'Banner'}
            className="w-full h-full object-cover"
          />
          {/* Dark Overlay with backdrop blur */}
          <div className="absolute inset-0 bg-[var(--color-secondary)]/50 backdrop-blur-[2px]" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center text-[var(--color-accent)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="space-y-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Badge */}
            {banner.subtitle && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 text-[var(--color-primary)] text-xs font-bold tracking-[0.2em] uppercase">
                <span>{replaceShortcodes(banner.subtitle, shortcodes)}</span>
              </div>
            )}
            
            {/* Heading */}
            {banner.title && (
              <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl font-bold leading-tight drop-shadow-2xl">
                {replaceShortcodes(banner.title, shortcodes)}
                {banner.text && (
                  <span className="italic text-[var(--color-primary)] block md:inline">
                    {' '}{replaceShortcodes(banner.text, shortcodes)}
                  </span>
                )}
              </h1>
            )}
            
            {/* Description */}
            {banner.text && !banner.title && (
              <p className="max-w-2xl mx-auto text-lg md:text-xl text-[var(--color-accent)]/80 leading-relaxed font-light">
                {replaceShortcodes(banner.text, shortcodes)}
              </p>
            )}
            
            {/* CTA Buttons */}
            {banner.buttonText && bannerUrl && (
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
                {external ? (
                  <a
                    href={bannerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[var(--color-primary)] text-[var(--color-secondary)] px-10 py-4 rounded-full font-bold text-lg hover:bg-[var(--color-accent)] transition-all duration-300 shadow-xl hover:shadow-[var(--color-primary)]/20 transform hover:-translate-y-1 flex items-center gap-3 group"
                  >
                    {replaceShortcodes(banner.buttonText, shortcodes)}
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" width={20} height={20} />
                  </a>
                ) : (
                  <Link
                    href={withSiteParam(bannerUrl, siteId)}
                    className="bg-[var(--color-primary)] text-[var(--color-secondary)] px-10 py-4 rounded-full font-bold text-lg hover:bg-[var(--color-accent)] transition-all duration-300 shadow-xl hover:shadow-[var(--color-primary)]/20 transform hover:-translate-y-1 flex items-center gap-3 group"
                  >
                    {replaceShortcodes(banner.buttonText, shortcodes)}
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" width={20} height={20} />
                  </Link>
                )}
                {/* Secondary CTA - From CMS Booking Config */}
                {siteConfig?.booking?.showInHeader && siteConfig?.booking?.url && (
                  <Link
                    href={withSiteParam(siteConfig.booking.url, siteId)}
                    className="bg-white/10 backdrop-blur-md border border-white/20 text-[var(--color-accent)] px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all duration-300 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                      <Play className="fill-[var(--color-secondary)] text-[var(--color-secondary)] ml-0.5" width={14} height={14} />
                    </div>
                    {siteConfig.booking.label || 'Book a Table'}
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-[var(--color-accent)]/40 animate-pulse">
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Scroll Down</span>
        <div className="w-px h-12 bg-gradient-to-b from-[var(--color-primary)] to-transparent"></div>
      </div>

      {/* Navigation Arrows */}
      {homeBanners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm"
            aria-label="Next banner"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Progress Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {homeBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  i === current 
                    ? 'bg-white w-8' 
                    : 'bg-white/50 hover:bg-white/70 w-3'
                }`}
                aria-label={`Go to banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// Welcome Section Component
function WelcomeSection({ title, subtitle, content, image, ctaText, ctaUrl, isExternal, shortcodes }) {
  const router = useRouter();
  const siteId = getSiteId(router);

  // Only render if there's actual content
  if (!title && !content && !image) {
    return null;
  }

  return (
    <section className="py-24 px-6 bg-[var(--color-accent)] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          {image && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-[3rem] overflow-hidden aspect-[4/5] shadow-2xl z-10">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[var(--color-primary)] rounded-full blur-3xl opacity-20 z-0"></div>
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-[var(--color-secondary)] rounded-3xl rotate-12 z-0"></div>
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`space-y-8 ${!image ? 'lg:col-span-2' : ''}`}
          >
            {subtitle && (
              <div className="inline-flex items-center gap-2 text-[var(--color-primary)] font-bold uppercase tracking-[0.2em] text-sm">
                <Heart width={16} height={16} />
                <span>{subtitle}</span>
              </div>
            )}
            <h2 className="font-serif text-5xl md:text-7xl font-bold text-[var(--color-secondary)] leading-tight">
              {title}
              {content && (
                <span className="text-[var(--color-primary)] italic block md:inline">
                  {' '}{content.substring(0, 50)}...
                </span>
              )}
            </h2>
            {content && (
              <p className="text-xl text-[var(--color-secondary)]/70 leading-relaxed">
                {content}
              </p>
            )}
            {ctaText && ctaUrl && (
              <Link
                href={isExternal ? ctaUrl : withSiteParam(ctaUrl, siteId)}
                target={isExternal ? '_blank' : '_self'}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-3 text-[var(--color-secondary)] font-bold text-lg group"
              >
                {ctaText}
                <div className="w-12 h-12 rounded-full border-2 border-[var(--color-primary)] flex items-center justify-center group-hover:bg-[var(--color-primary)] transition-all duration-300">
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" width={20} height={20} />
                </div>
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Home Specials Section
function HomeSpecialsSection({ specials, title, subtitle }) {
  const router = useRouter();
  const siteId = getSiteId(router);
  const { addItem, isEnabled: orderingEnabled } = useCart();
  const [addedItems, setAddedItems] = React.useState({});

  const handleAddItem = (special) => {
    if (!orderingEnabled) return;
    
    addItem({
      id: special.id,
      name: special.title,
      price: special.discountedPrice || special.price,
      image: special.image
    });
    
    setAddedItems({ ...addedItems, [special.id]: true });
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [special.id]: false }));
    }, 2000);
  };

  const getBadgeText = (special) => {
    if (special.isFeatured) return 'Most Popular';
    if (special.isHighlighted) return 'New Arrival';
    return 'Limited Edition';
  };

  return (
    <section id="specials" className="py-24 px-6 bg-[var(--color-accent)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="space-y-4">
            {subtitle && (
              <div className="inline-flex items-center gap-2 text-[var(--color-primary)] font-bold uppercase tracking-[0.2em] text-sm">
                <Star width={16} height={16} fill="currentColor" />
                <span>{subtitle}</span>
              </div>
            )}
            <h2 className="font-serif text-5xl md:text-7xl font-bold text-[var(--color-secondary)]">
              {title}
            </h2>
          </div>
          <div className="flex gap-4">
            <button className="w-14 h-14 rounded-full border border-[var(--color-secondary)]/30 flex items-center justify-center hover:bg-[var(--color-secondary)] hover:text-[var(--color-accent)] transition-all duration-300">
              <ChevronLeft width={24} height={24} />
            </button>
            <button className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-secondary)] hover:text-[var(--color-accent)] transition-all duration-300 shadow-lg">
              <ChevronRight width={24} height={24} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {specials.map((special, index) => (
            <motion.div
              key={special.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-white rounded-[2.5rem] overflow-hidden border border-[var(--color-secondary)]/10 shadow-sm hover:shadow-2xl transition-all duration-500"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={special.image}
                  alt={special.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute top-6 left-6 px-4 py-1.5 rounded-full bg-[var(--color-secondary)]/80 backdrop-blur-md text-[var(--color-accent)] text-xs font-bold uppercase tracking-wider">
                  {getBadgeText(special)}
                </div>
              </div>
              <div className="p-8 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-serif text-2xl font-bold text-[var(--color-secondary)]">{special.title}</h3>
                  <span className="text-[var(--color-primary)] font-bold text-xl">
                    ${special.discountedPrice || special.price}
                  </span>
                </div>
                <p className="text-[var(--color-secondary)]/60 leading-relaxed">{special.description}</p>
                <button
                  onClick={() => handleAddItem(special)}
                  disabled={!orderingEnabled}
                  className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 uppercase tracking-widest text-xs flex items-center justify-center gap-2 ${
                    addedItems[special.id]
                      ? 'bg-green-500 text-white'
                      : 'bg-[var(--color-accent)] text-[var(--color-secondary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-secondary)]'
                  }`}
                >
                  {addedItems[special.id] ? (
                    <>
                      <Check width={16} height={16} />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus width={16} height={16} />
                      Add to Order
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Loyalty Banner Section
function LoyaltyBannerSection() {
  const { loyaltyConfig, isLoyaltyEnabled } = useLoyalty();
  const router = useRouter();
  const siteId = getSiteId(router);

  if (!isLoyaltyEnabled) {
    return null;
  }

  const hasRewards = loyaltyConfig?.rewards?.length > 0;
  const firstReward = hasRewards ? loyaltyConfig.rewards[0] : null;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-amber-50 to-emerald-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Earn Rewards with Every Order
                </h2>
              </div>
              <p className="text-gray-600 text-lg mb-6">
                Join our loyalty program and earn {loyaltyConfig.pointsPerDollar} point{loyaltyConfig.pointsPerDollar !== 1 ? 's' : ''} for every dollar spent. Redeem points for exclusive rewards!
              </p>
              {hasRewards && (
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full">
                    <Star className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-amber-900">{firstReward.pointsRequired} pts</span>
                    <span className="text-amber-700">= {firstReward.discountType === 'percentage' ? `${firstReward.discountValue}% OFF` : `$${firstReward.discountValue.toFixed(2)} OFF`}</span>
                  </div>
                </div>
              )}
            </div>
            <Link
              href={withSiteParam('/menu', siteId)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
            >
              Start Earning
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Helper functions
function isPromoVisible(promo) {
  const now = new Date();
  if (promo.startDate && new Date(promo.startDate) > now) return false;
  if (promo.endDate && new Date(promo.endDate) < now) return false;
  return true;
}

function isSpecialValid(special) {
  if (!special.validUntil) return true;
  return new Date(special.validUntil) >= new Date();
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ThemeD1HomePage({ data, siteType }) {
  return <HomePageContent />;
}


