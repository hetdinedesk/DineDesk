import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { useLoyalty } from '../../contexts/LoyaltyContext';
import { Header } from '../../components/theme-d1/Header';
import { Footer } from '../../components/theme-d1/Footer';
import { FeaturedItemsSection } from '../../components/theme-d1/sections/FeaturedItemsSection';
import { ReviewsSection } from '../../components/theme-d1/sections/ReviewsSection';
import PromoTilesSection from '../../components/theme-d1/sections/PromoTilesSection';
import { FloatingReviewWidget } from '../../components/theme-d1/FloatingReviewWidget';
import { replaceShortcodes } from '../../lib/shortcodes';
import { ChevronLeft, ChevronRight, Clock, ArrowRight, Star, Gift } from 'lucide-react';
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
    customTextBlocks
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
        <BannerCarousel banners={activeBanners} shortcodes={shortcodes} />

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
function BannerCarousel({ banners, shortcodes }) {
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
    <section className="relative h-[70vh] min-h-[500px] max-h-[800px] flex items-center overflow-hidden">
      {/* Background Image with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="absolute inset-0"
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
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 md:px-8 max-w-7xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="max-w-2xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Heading */}
            {banner.title && (
              <h1 className="text-4xl md:text-6xl lg:text-7xl text-white mb-4 leading-tight font-bold drop-shadow-lg">
                {replaceShortcodes(banner.title, shortcodes)}
              </h1>
            )}
            
            {/* Subheading */}
            {(banner.subtitle || banner.text) && (
              <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 drop-shadow-md">
                {replaceShortcodes(banner.subtitle || banner.text, shortcodes)}
              </p>
            )}
            
            {/* CTA Button */}
            {banner.buttonText && bannerUrl && (
              external ? (
                <a
                  href={bannerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-[var(--color-primary)] text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-opacity-90 transition-all group shadow-lg"
                >
                  {replaceShortcodes(banner.buttonText, shortcodes)}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              ) : (
                <Link
                  href={withSiteParam(bannerUrl, siteId)}
                  className="inline-flex items-center justify-center bg-[var(--color-primary)] text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-opacity-90 transition-all group shadow-lg"
                >
                  {replaceShortcodes(banner.buttonText, shortcodes)}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )
            )}
          </motion.div>
        </AnimatePresence>
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
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          {image && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative order-2 lg:order-1"
            >
              <div className="relative h-[400px] md:h-[500px] lg:h-[600px] rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-4 border-[var(--color-primary)]/20 rounded-lg pointer-events-none" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-[var(--color-primary)]/10 rounded-full -z-10 blur-3xl" />
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`order-1 lg:order-2 ${!image ? 'lg:col-span-2' : ''}`}
          >
            {subtitle && (
              <p className="text-[var(--color-primary)] text-sm md:text-base uppercase tracking-widest mb-4 font-medium">
                {subtitle}
              </p>
            )}
            <h2 className="text-4xl md:text-5xl lg:text-6xl mb-6" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
              {title}
            </h2>
            {content && (
              <div className="prose prose-lg max-w-none mb-8">
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {content}
                </p>
              </div>
            )}
            {ctaText && ctaUrl && (
              <Link
                href={isExternal ? ctaUrl : withSiteParam(ctaUrl, siteId)}
                target={isExternal ? '_blank' : '_self'}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 group"
              >
                {ctaText}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
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

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-primary)] mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xl text-gray-600">{subtitle}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {specials.map((special, index) => (
            <motion.div
              key={special.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-lg overflow-hidden shadow-xl ${
                special.isFeatured ? 'ring-4 ring-[var(--color-secondary)]' : ''
              }`}
            >
              <div className="flex flex-col md:flex-row h-full">
                {special.image && (
                  <div className="md:w-2/5 h-48 md:h-auto relative">
                    <img
                      src={special.image}
                      alt={special.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 p-6 bg-white flex flex-col justify-between">
                  <div>
                    {special.isFeatured && (
                      <div className="inline-flex items-center space-x-1 text-[var(--color-secondary)] mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path>
                          <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle>
                        </svg>
                        <span className="text-sm font-semibold">Featured</span>
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-[var(--color-primary)] mb-3">
                      {special.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{special.description}</p>
                  </div>
                  <div>
                    <div className="flex items-baseline space-x-2 mb-3">
                      <span className="text-3xl font-bold text-[var(--color-secondary)]">
                        ${special.discountedPrice || special.price}
                      </span>
                      {special.originalPrice && (
                        <span className="text-lg text-gray-400 line-through">
                          ${special.originalPrice}
                        </span>
                      )}
                    </div>
                    {special.validUntil && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>Valid until {formatDate(special.validUntil)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href={withSiteParam('/specials', siteId)}
            className="inline-block bg-[var(--color-secondary)] text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105"
          >
            View All Specials
          </Link>
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


