import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { useLoyalty } from '../../contexts/LoyaltyContext';
import { useCart } from '../../contexts/CartContext';
import { Header } from '../../components/theme-d3/Header';
import { Footer } from '../../components/theme-d3/Footer';
import { FeaturedItemsSection } from '../../components/theme-d3/sections/FeaturedItemsSection';
import { ReviewsSection } from '../../components/theme-d3/sections/ReviewsSection';
import PromoTilesSection from '../../components/theme-d3/sections/PromoTilesSection';
import { FloatingReviewWidget } from '../../components/theme-d3/FloatingReviewWidget';
import { replaceShortcodes } from '../../lib/shortcodes';
import { ChevronLeft, ChevronRight, Clock, ArrowRight, Star, Gift, Play, Heart, Plus, Check, Leaf, Sprout, Flower2, Coffee } from 'lucide-react';
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
    welcome: (index) => welcomeContent?.isActive !== false && (welcomeContent?.heading || welcomeContent?.text || welcomeContent?.imageUrl) && (
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
    promos: (index) => promoConfig?.isActive !== false && (promoConfig?.heading || activePromos.length > 0) && (
      <PromoTilesSection 
        promos={activePromos} 
        shortcodes={shortcodes}
        title={replaceShortcodes(promoConfig.heading || '', shortcodes)}
        subtitle={replaceShortcodes(promoConfig.subheading || '', shortcodes)}
      />
    ),
    specials: (index) => specialsConfig?.showOnHomepage && activeSpecials.length > 0 && (
      <HomeSpecialsSection
        specials={activeSpecials.slice(0, specialsConfig.maxItems || 2)}
        title={replaceShortcodes(specialsConfig?.heading || 'Current Specials', shortcodes)}
        subtitle={replaceShortcodes(specialsConfig?.subheading || 'Limited time offerings', shortcodes)}
      />
    ),
    loyalty: (index) => <LoyaltyBannerSection />,
    reviews: (index) => <ReviewsSection />,
    custom: (blockId) => {
      const block = customTextBlocks?.find(b => b.id === blockId);
      if (!block || block.isActive === false) return null;
      
      return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-bloom-sand/30">
          <div className="max-w-7xl mx-auto">
            {block.title && (
              <h2 className="text-4xl md:text-5xl font-bold text-bloom-sage mb-8" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
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
        {visibleComponents.map((component, index) => {
          const renderFn = componentMap[component.type];
          return renderFn ? (
            <div key={component.id}>
              {component.type === 'custom' ? renderFn(component.id) : renderFn(index)}
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
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-bloom-cream">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"></path>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"></rect>
        </svg>
      </div>

      {/* Background Image with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="absolute inset-0 z-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-full h-full max-w-7xl mx-auto px-6 relative">
            {/* Large Leaf SVG Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square max-w-none opacity-[0.03] animate-pulse-soft">
              <Leaf className="w-full h-full text-bloom-dark" />
            </div>
            {/* Floating Image on Right */}
            {banner.imageUrl && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2 w-1/3 aspect-[3/4] hidden lg:block overflow-hidden rounded-full">
                <img
                  src={banner.imageUrl}
                  alt={banner.title || 'Cafe Sanctuary'}
                  className="w-full h-full object-cover animate-fade-in"
                />
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-3xl space-y-12 animate-slide-up">
          {/* Label */}
          {banner.subtitle && (
            <div className="inline-flex items-center gap-4 text-bloom-sage font-sans text-[10px] font-bold tracking-[0.4em] uppercase">
              <span className="w-8 h-px bg-bloom-sage/30"></span>
              <span>{banner.subtitle}</span>
            </div>
          )}

          {/* Heading */}
          {banner.title && (
            <h1 className="heading-xl text-bloom-dark">
              {replaceShortcodes(banner.title, shortcodes)}
              {banner.text && (
                <span className="italic text-bloom-sage block md:inline">
                  {' '}{replaceShortcodes(banner.text, shortcodes)}
                </span>
              )}
            </h1>
          )}

          {/* Description */}
          {banner.text && !banner.title && (
            <p className="max-w-xl text-lg md:text-xl text-bloom-dark/50 leading-relaxed font-sans font-light">
              {replaceShortcodes(banner.text, shortcodes)}
            </p>
          )}

          {/* CTA Buttons */}
          {banner.buttonText && bannerUrl && (
            <div className="flex flex-wrap items-center gap-8 pt-4">
              {external ? (
                <a
                  href={bannerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-bloom btn-sage px-14 py-5 text-xs shadow-xl shadow-bloom-sage/10"
                >
                  {replaceShortcodes(banner.buttonText, shortcodes)}
                  <ArrowRight className="w-[18px] h-[18px]" />
                </a>
              ) : (
                <Link
                  href={withSiteParam(bannerUrl, siteId)}
                  className="btn-bloom btn-sage px-14 py-5 text-xs shadow-xl shadow-bloom-sage/10"
                >
                  {replaceShortcodes(banner.buttonText, shortcodes)}
                  <ArrowRight className="w-[18px] h-[18px]" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
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
    <section className="py-32 px-6 bg-bloom-cream overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          {/* Image */}
          {image && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative group"
            >
              <div className="relative aspect-[4/5] z-10 overflow-hidden rounded-[40px] bloom-shadow">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-bloom-sage/10 mix-blend-multiply"></div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-bloom-sage/5 rounded-full blur-3xl -z-10"></div>
              <div className="absolute top-40 -right-10 w-40 h-40 border border-bloom-sage/20 rounded-full -z-10"></div>
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`space-y-12 ${!image ? 'lg:col-span-2' : ''}`}
          >
            {subtitle && (
              <div className="inline-flex items-center gap-4 text-bloom-sage font-sans font-semibold uppercase tracking-[0.3em] text-[10px]">
                <Leaf width={16} height={16} />
                <span>{subtitle}</span>
              </div>
            )}
            <h2 className="font-serif text-6xl md:text-8xl text-bloom-dark leading-[0.9] tracking-tight">
              {title}
            </h2>
            {content && (
              <p className="text-xl text-bloom-dark/70 leading-relaxed font-sans font-light">
                {content}
              </p>
            )}
            {ctaText && ctaUrl && (
              <Link
                href={isExternal ? ctaUrl : withSiteParam(ctaUrl, siteId)}
                target={isExternal ? '_blank' : '_self'}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="btn-bloom btn-sage group px-14 py-5 text-xs shadow-xl shadow-bloom-sage/10"
              >
                {ctaText}
                <ArrowRight className="w-[20px] h-[20px] group-hover:translate-x-1 transition-transform" />
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
    <section id="specials" className="py-24 px-6 bg-bloom-sand/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="space-y-4">
            {subtitle && (
              <div className="inline-flex items-center gap-2 text-bloom-sage font-bold uppercase tracking-[0.2em] text-sm">
                <Star width={16} height={16} fill="currentColor" />
                <span>{subtitle}</span>
              </div>
            )}
            <h2 className="font-serif text-5xl md:text-7xl font-bold text-bloom-dark">
              {title}
            </h2>
          </div>
          <div className="flex gap-4">
            <button className="w-14 h-14 rounded-full border border-bloom-dark/10 flex items-center justify-center hover:bg-bloom-sage hover:text-bloom-cream transition-all duration-500">
              <ChevronLeft width={24} height={24} />
            </button>
            <button className="w-14 h-14 rounded-full bg-bloom-sage text-bloom-cream flex items-center justify-center hover:bg-bloom-moss transition-all duration-500 bloom-shadow">
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
              className="group bg-bloom-cream rounded-[2.5rem] overflow-hidden border border-bloom-dark/10 shadow-sm hover:shadow-2xl transition-all duration-500"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={special.image}
                  alt={special.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute top-6 left-6 px-4 py-2 bg-bloom-cream/90 backdrop-blur-md text-bloom-sage text-[10px] font-sans font-bold uppercase tracking-widest rounded-full">
                  {getBadgeText(special)}
                </div>
              </div>
              <div className="p-8 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-serif text-2xl font-bold text-bloom-dark italic">{special.title}</h3>
                  <span className="text-bloom-sage font-serif text-2xl">
                    ${special.discountedPrice || special.price}
                  </span>
                </div>
                <p className="text-bloom-dark/60 text-sm font-sans leading-relaxed">{special.description}</p>
                <button
                  onClick={() => handleAddItem(special)}
                  disabled={!orderingEnabled}
                  className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 uppercase tracking-widest text-xs flex items-center justify-center gap-2 ${
                    addedItems[special.id]
                      ? 'bg-green-500 text-white'
                      : 'border border-bloom-sage/20 text-bloom-sage font-sans font-bold text-[10px] tracking-widest rounded-full hover:bg-bloom-sage hover:text-bloom-cream transition-all duration-500 uppercase'
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


