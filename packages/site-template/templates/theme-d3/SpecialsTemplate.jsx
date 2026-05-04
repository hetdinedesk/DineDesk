import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { useCart } from '../../contexts/CartContext';
import { Clock, Star, ArrowRight, Plus, Check, Gift, Phone, Sparkles } from 'lucide-react';
import { replaceShortcodes } from '../../lib/shortcodes';

export default function SpecialsPage({ data, page, banner }) {
  const { specials, shortcodes, contentPages, ordering } = useCMS();
  const { addItem, isEnabled: orderingEnabled } = useCart();
  const [addedItems, setAddedItems] = useState({});

  // Get loyalty config from data instead of hook
  const loyaltyConfig = data?.loyaltyConfig;
  const isLoyaltyEnabled = loyaltyConfig?.enabled || false;

  const specialsPage = (contentPages || []).find(p => p.slug === 'specials' || p.pageType === 'specials');
  const pageTitle = replaceShortcodes(specialsPage?.title || 'Current Specials', shortcodes);
  const pageSubtitle = replaceShortcodes(specialsPage?.subtitle || specialsPage?.metaDesc || 'Limited time offerings crafted by our chefs', shortcodes);

  // Resolve banner from prop or page bannerId (fallback for preview mode)
  const pageBanner = banner || (specialsPage?.bannerId ? data?.banners?.find(b => b.id === specialsPage.bannerId) : null);

  const activeSpecials = specials.filter((special) => {
    if (!special.isActive) return false;
    const now = new Date();
    const validFrom = special.validFrom ? new Date(special.validFrom) : null;
    const validUntil = special.validUntil ? new Date(special.validUntil) : null;
    const afterStart = !validFrom || now >= validFrom;
    const beforeEnd = !validUntil || now <= validUntil;
    return afterStart && beforeEnd;
  });

  const handleAddItem = (special) => {
    addItem({
      id: special.id,
      name: replaceShortcodes(special.title || '', shortcodes),
      price: special.price || 0,
      image: special.image || 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=1936&auto=format&fit=crop',
      category: 'Special'
    });
    setAddedItems({ ...addedItems, [special.id]: true });
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [special.id]: false }));
    }, 2000);
  };

  const upcomingSpecials = specials.filter((special) => {
    if (!special.isActive) return false;
    if (!special.validFrom) return false;
    const now = new Date();
    const validFrom = new Date(special.validFrom);
    return now < validFrom;
  });

  // Get badge text based on special properties
  const getBadgeText = (special, index) => {
    if (special.isFeatured) return 'MOST POPULAR';
    if (special.isHighlighted) return 'NEW ARRIVAL';
    if (index === 2) return 'LIMITED EDITION';
    return 'SPECIAL';
  };

  // Get badge variant for alternating styling
  const getBadgeVariant = (index) => {
    const variants = ['MOST POPULAR', 'NEW ARRIVAL', 'LIMITED EDITION'];
    return variants[index % 3] || 'SPECIAL';
  };

  // Parse description into main text and tasting notes (if separated by | or dash)
  const parseDescription = (desc) => {
    if (!desc) return { main: '', notes: '' };
    // Try to split by common separators
    const separators = [' | ', ' - ', ' // ', '\n\n'];
    for (const sep of separators) {
      if (desc.includes(sep)) {
        const [main, ...notesParts] = desc.split(sep);
        return { main: main.trim(), notes: notesParts.join(sep).trim() };
      }
    }
    // If no separator, use first sentence as main, rest as notes (optional)
    const sentences = desc.split('. ');
    if (sentences.length > 1) {
      return { main: sentences[0] + '.', notes: sentences.slice(1).join('. ') };
    }
    return { main: desc, notes: '' };
  };

  return (
    <div className="min-h-screen bg-[var(--color-accent)] pt-48 pb-24 px-6">
      <div className="max-w-7xl mx-auto space-y-48">
        {/* Title */}
        <div className="text-center space-y-10 max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-6xl md:text-[140px] leading-[0.8] text-[var(--color-secondary)] tracking-tight"
          >
            {pageTitle}
          </motion.h1>
          {pageSubtitle && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto text-xl text-[var(--color-secondary)]/40 font-sans font-light leading-relaxed"
            >
              {pageSubtitle}
            </motion.p>
          )}
        </div>

          {/* Specials Grid - Alternating Layout */}
        <div className="grid grid-cols-1 gap-64">
          {activeSpecials.map((special, index) => {
            const title = replaceShortcodes(special.title || '', shortcodes);
            const { main: mainDesc, notes: tastingNotes } = parseDescription(replaceShortcodes(special.description || '', shortcodes));
            const badgeText = getBadgeText(special, index);
            const isReversed = index % 2 === 1; // Alternate layout
            
            return (
              <motion.div
                key={special.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-24 items-center`}
              >
                {/* Image Side */}
                <div className="w-full lg:w-3/5 relative group">
                  <div className="relative z-10 rounded-[48px] overflow-hidden shadow-xl transition-all duration-700 group-hover:-translate-y-2">
                    <img
                      src={special.image || 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=1936&auto=format&fit=crop'}
                      alt={title}
                      className="w-full aspect-video object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute top-8 left-8 bg-[var(--color-accent)]/90 backdrop-blur-md text-[var(--color-primary)] px-6 py-2 font-sans font-bold text-[10px] tracking-widest rounded-full">
                      {badgeText}
                    </div>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl -z-10"></div>
                  <div className="absolute top-20 -left-10 w-40 h-40 border border-[var(--color-primary)]/20 rounded-full -z-10"></div>
                </div>

                {/* Content Side */}
                <div className="w-full lg:w-2/5 space-y-12">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start gap-4">
                      <h2 className="font-serif text-5xl md:text-6xl text-[var(--color-secondary)] italic leading-tight">
                        {title}
                      </h2>
                      <span className="text-[var(--color-primary)] font-serif text-3xl">
                        ${special.price?.toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Badge */}
                    {badgeText && (
                      <div className="flex items-center gap-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-4 py-1.5 font-sans text-[9px] font-bold tracking-widest uppercase rounded-full">
                        <Clock width={12} height={12} strokeWidth={2} />
                        {badgeText}
                      </div>
                    )}
                  </div>

                  <p className="text-xl text-[var(--color-secondary)]/60 font-sans font-light leading-relaxed">
                    {mainDesc}
                  </p>

                  {/* Tasting Notes */}
                  {tastingNotes && (
                    <div className="pt-10 border-t border-[var(--color-secondary)]/5">
                      <p className="text-sm font-sans font-bold text-[var(--color-secondary)] uppercase tracking-widest">
                        {tastingNotes}
                      </p>
                    </div>
                  )}

                  {/* Order Button */}
                  {orderingEnabled && (
                    <div className="mt-12">
                      <button
                        onClick={() => handleAddItem(special)}
                        disabled={addedItems[special.id]}
                        className="bg-[var(--color-primary)] text-[var(--color-accent)] px-12 py-4 rounded-full font-bold text-lg hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-xl flex items-center gap-3 group w-full justify-center disabled:opacity-70"
                      >
                        {addedItems[special.id] ? (
                          <>
                            <Check width={20} height={20} />
                            Added to Basket
                          </>
                        ) : (
                          <>
                            ADD TO BASKET
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" width={20} height={20} strokeWidth={2} />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


