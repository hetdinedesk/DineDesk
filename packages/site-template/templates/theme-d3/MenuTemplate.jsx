import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { useCart } from '../../contexts/CartContext';
import { Search, Plus, Check, Gift, Phone, Sparkles, Heart, ArrowRight } from 'lucide-react';
import { replaceShortcodes } from '../../lib/shortcodes';

export default function MenuPage({ data, page, banner }) {
  const { menuCategories, menuItems, shortcodes, contentPages, ordering } = useCMS();
  const { addItem, isEnabled: orderingEnabled } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItems, setAddedItems] = useState({});

  // Get loyalty config from data instead of hook
  const loyaltyConfig = data?.loyaltyConfig;
  const isLoyaltyEnabled = loyaltyConfig?.enabled || false;

  const menuPage = (contentPages || []).find(p => p.slug === 'menu' || p.pageType === 'menu');
  const pageTitle = replaceShortcodes(menuPage?.title || 'Our Menu', shortcodes);
  const pageSubtitle = replaceShortcodes(menuPage?.subtitle || menuPage?.metaDesc || 'Crafted with passion, served with excellence', shortcodes);

  // Resolve banner from prop or page bannerId (fallback for preview mode)
  const pageBanner = banner || (menuPage?.bannerId ? data?.banners?.find(b => b.id === menuPage.bannerId) : null);

  const activeCategories = menuCategories
    .filter((cat) => cat.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const filteredItems = menuItems
    .filter((item) => {
      const name = replaceShortcodes(item.name || '', shortcodes);
      const description = replaceShortcodes(item.description || '', shortcodes);
      
      const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase());
      return item.isAvailable && matchesCategory && matchesSearch;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Filter out categories that have no available items
  const categoriesWithItems = activeCategories.filter((category) => {
    const categoryItems = filteredItems.filter((item) => item.categoryId === category.id);
    return categoryItems.length > 0;
  });

  const getItemImage = (item) => {
    if (item.image) return item.image;
    return null;
  };

  const handleAddItem = (item) => {
    addItem({
      id: item.id,
      name: replaceShortcodes(item.name || '', shortcodes),
      price: item.price,
      image: getItemImage(item),
    });
    setAddedItems({ ...addedItems, [item.id]: true });
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--color-accent)]">
      {/* Hero Banner */}
      <div className="bg-[var(--color-secondary)] py-48 px-6 text-center text-[var(--color-accent)] relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
          <img 
            src={pageBanner?.imageUrl || 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=2070&auto=format&fit=crop'} 
            alt="" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10 space-y-8 max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-6xl md:text-[120px] leading-[0.8] tracking-tight"
          >
            {pageTitle}
          </motion.h1>
          {pageSubtitle && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-xl mx-auto text-[var(--color-accent)]/60 font-sans text-sm font-light leading-relaxed"
            >
              {pageSubtitle}
            </motion.p>
          )}
        </div>
      </div>

      {/* Loyalty Banner */}
      {isLoyaltyEnabled && (
        <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-amber-50 to-emerald-50 rounded-2xl shadow-lg p-6 md:p-8 border border-amber-200"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Earn Points on Every Order!
                  </h3>
                  <p className="text-sm text-gray-600">
                    Earn {loyaltyConfig?.pointsPerDollar || 1} point{loyaltyConfig?.pointsPerDollar !== 1 ? 's' : ''} per $1 spent • Redeem for rewards
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-amber-200">
                <Phone className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">Points saved with phone number</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[var(--color-accent)]/90 backdrop-blur-xl border-b border-[var(--color-secondary)]/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-8 py-3 rounded-full font-sans font-bold text-[10px] tracking-[0.2em] transition-all duration-700 uppercase ${
                !selectedCategory
                  ? 'bg-[var(--color-primary)] text-[var(--color-accent)] shadow-xl'
                  : 'text-[var(--color-secondary)]/40 hover:text-[var(--color-secondary)] hover:bg-[var(--color-primary)]/5'
              }`}
            >
              All
            </button>
            {activeCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-8 py-3 rounded-full font-sans font-bold text-[10px] tracking-[0.2em] transition-all duration-700 uppercase ${
                  selectedCategory === category.id
                    ? 'bg-[var(--color-primary)] text-[var(--color-accent)] shadow-xl'
                    : 'text-[var(--color-secondary)]/40 hover:text-[var(--color-secondary)] hover:bg-[var(--color-primary)]/5'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-secondary)]/20" width={16} height={16} />
            <input
              type="text"
              placeholder="FIND IN THE GARDEN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-secondary)]/5 border border-transparent rounded-full px-14 py-4 text-[10px] font-sans font-bold tracking-widest text-[var(--color-secondary)] focus:outline-none focus:bg-white focus:border-[var(--color-primary)]/20 transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="max-w-7xl mx-auto py-24 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredItems.map((item) => {
            const name = replaceShortcodes(item.name || '', shortcodes);
            const description = replaceShortcodes(item.description || '', shortcodes);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex flex-col gap-8 p-10 bg-white rounded-[40px] shadow-xl hover:-translate-y-2 transition-all duration-700"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-[24px]">
                  <img
                    src={getItemImage(item) || 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=1936&auto=format&fit=crop'}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all duration-500">
                    <Heart width={16} height={16} strokeWidth={2} />
                  </button>
                </div>
                
                {/* Content */}
                <div className="space-y-6">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-serif text-3xl italic text-[var(--color-secondary)] group-hover:text-[var(--color-primary)] transition-colors duration-500">
                      {name}
                    </h3>
                    <span className="text-[var(--color-primary)] font-serif text-2xl">
                      ${item.price?.toFixed(2)}
                    </span>
                  </div>
                  <p className="font-sans text-sm text-[var(--color-secondary)]/60 leading-relaxed">
                    {description}
                  </p>
                  
                  {/* Add Button */}
                  {orderingEnabled && (
                    <button
                      onClick={() => handleAddItem(item)}
                      disabled={addedItems[item.id]}
                      className="flex items-center gap-3 font-sans font-bold text-[10px] tracking-[0.2em] text-[var(--color-primary)] group/btn hover:text-[var(--color-secondary)] transition-all duration-500 uppercase"
                    >
                      {addedItems[item.id] ? (
                        <>
                          <Check width={14} height={14} />
                          Added
                          <div className="w-10 h-px bg-green-500"></div>
                        </>
                      ) : (
                        <>
                          ADD TO BASKET
                          <ArrowRight width={14} height={14} strokeWidth={2} className="group-hover/btn:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--color-secondary)]/60 text-lg">No menu items found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}


