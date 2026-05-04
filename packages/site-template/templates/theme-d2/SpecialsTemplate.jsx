import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { useCart } from '../../contexts/CartContext';
import { Clock, ArrowRight, Plus, Check, Gift, Phone } from 'lucide-react';
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
    <div className="min-h-screen bg-[var(--color-accent)]">
      {/* Header Section with Optional Banner */}
      <div className="relative pt-40 pb-24 px-6">
        {/* Background Image from CMS Banner */}
        {pageBanner?.imageUrl && (
          <div className="absolute inset-0 z-0">
            <img 
              src={pageBanner.imageUrl} 
              alt="" 
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent)] via-[var(--color-accent)]/80 to-[var(--color-accent)]"></div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto space-y-32 relative z-10">
          {/* Title */}
          <div className="text-center space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-serif text-[80px] md:text-[140px] leading-none text-[var(--color-secondary)] font-bold italic tracking-tight"
            >
              {pageTitle}
            </motion.h1>
            
            {pageSubtitle && (
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl mx-auto text-xl text-[var(--color-secondary)]/70 leading-relaxed font-light"
              >
                {pageSubtitle}
              </motion.p>
            )}
          </div>

          {/* Specials Grid - Alternating Layout */}
          {activeSpecials.length > 0 ? (
            <div className="grid grid-cols-1 gap-32">
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
                    className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-16 items-center`}
                  >
                    {/* Image Side */}
                    <div className="w-full lg:w-3/5 relative group">
                      <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-700">
                        <img
                          src={special.image || 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=1936&auto=format&fit=crop'}
                          alt={title}
                          className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-1000"
                        />
                        <div className={`absolute top-8 left-8 bg-[var(--color-primary)] text-[var(--color-secondary)] px-6 py-2 rounded-full font-bold text-xs tracking-wider shadow-lg`}>
                          {badgeText}
                        </div>
                      </div>
                      <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[var(--color-primary)]/10 rounded-full blur-3xl z-0"></div>
                    </div>

                    {/* Content Side */}
                    <div className="w-full lg:w-2/5 space-y-8">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <h2 className="font-serif text-5xl text-[var(--color-secondary)] font-bold leading-tight">
                            {title}
                          </h2>
                          <span className="text-[var(--color-primary)] font-serif text-3xl font-bold italic">
                            ${special.price?.toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Badges */}
                        <div className="flex gap-4 flex-wrap">
                          <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase text-[var(--color-secondary)]">
                            <Clock width={12} height={12} className="text-[var(--color-primary)]" />
                            {badgeText}
                          </div>
                          {special.validUntil && (
                            <div className="flex items-center gap-2 border border-[var(--color-secondary)]/30 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase text-[var(--color-secondary)]/60">
                              <span>Until {new Date(special.validUntil).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-lg text-[var(--color-secondary)]/70 leading-relaxed font-light">
                        {mainDesc}
                      </p>

                      {/* Tasting Notes */}
                      <div className="pt-8 border-t border-[var(--color-secondary)]/20">
                        <div className="space-y-4">
                          <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--color-primary)] uppercase">Tasting Notes</p>
                          <p className="text-lg font-serif italic text-[var(--color-secondary)]">
                            {tastingNotes || 'Premium selection, expertly crafted'}
                          </p>
                        </div>
                        
                        {/* Order Button */}
                        {orderingEnabled && (
                          <div className="mt-10">
                            <button
                              onClick={() => handleAddItem(special)}
                              disabled={addedItems[special.id]}
                              className="bg-[var(--color-secondary)] text-[var(--color-accent)] px-10 py-4 rounded-full font-bold text-lg hover:bg-[var(--color-primary)] transition-all duration-300 shadow-xl flex items-center gap-3 group w-full justify-center disabled:opacity-70"
                            >
                              {addedItems[special.id] ? (
                                <>
                                  <Check width={20} height={20} />
                                  Added to Order
                                </>
                              ) : (
                                <>
                                  Order This Special
                                  <ArrowRight className="group-hover:translate-x-1 transition-transform" width={20} height={20} />
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--color-secondary)]/60 text-lg">
                No active specials at the moment. Check back soon!
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


