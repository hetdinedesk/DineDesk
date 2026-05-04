import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { useCart } from '../../contexts/CartContext';
import { Search, Plus, Check, Gift, Phone } from 'lucide-react';
import { replaceShortcodes } from '../../lib/shortcodes';

export default function MenuPage({ data, page, banner }) {
  const { menuCategories, menuItems, shortcodes, contentPages, ordering } = useCMS();
  const { addItem, isEnabled: orderingEnabled } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItems, setAddedItems] = useState({});

  // Drag-to-scroll state for categories
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const categoryContainerRef = React.useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - (categoryContainerRef.current?.offsetLeft || 0));
    setScrollLeft(categoryContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (categoryContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (categoryContainerRef.current) {
      categoryContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

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
      <div className="bg-[var(--color-secondary)] py-32 px-6 text-center text-[var(--color-accent)] relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={pageBanner?.imageUrl || 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=2070&auto=format&fit=crop'} 
            alt="" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-secondary)]/50 to-[var(--color-secondary)]"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-6xl md:text-8xl font-bold"
          >
            {pageTitle}
          </motion.h1>
          {pageSubtitle && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto text-[var(--color-accent)]/70 text-lg"
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

      {/* Enhanced Sticky Filter Bar */}
      <div className="sticky top-20 z-40 bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent)]/95 to-[var(--color-accent)]/90 backdrop-blur-xl border-b border-[var(--color-secondary)]/10 py-6 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Category Tabs - Full Width Scrollable */}
          <div className="relative w-full overflow-hidden">
            {/* Scroll indicators */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <div className="w-12 h-16 bg-gradient-to-r from-[var(--color-accent)] to-transparent"></div>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <div className="w-12 h-16 bg-gradient-to-l from-[var(--color-accent)] to-transparent"></div>
            </div>
            
            <div 
              ref={categoryContainerRef}
              className={`flex gap-3 p-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-inner border border-[var(--color-secondary)]/15 overflow-x-auto scrollbar-hide select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 group relative px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                  !selectedCategory
                    ? 'bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-secondary)]/25'
                    : 'text-[var(--color-secondary)]/70 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10'
                }`}
              >
                <span className="relative z-10">All Items</span>
                {!selectedCategory && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)] opacity-100"></div>
                )}
              </button>
              {activeCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 group relative px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-secondary)]/25'
                      : 'text-[var(--color-secondary)]/70 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {category.name}
                    {selectedCategory === category.id && (
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    )}
                  </span>
                  {selectedCategory === category.id && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)] opacity-100"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Enhanced Search - Centered Below */}
          <div className="relative w-full max-w-md mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-secondary)]/40 group-hover:text-[var(--color-primary)] transition-colors duration-300" size={20} />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative w-full bg-white/90 backdrop-blur-sm border border-[var(--color-secondary)]/20 rounded-full pl-14 pr-6 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all duration-300 placeholder:text-[var(--color-secondary)]/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-[var(--color-secondary)]/10 hover:bg-[var(--color-secondary)]/20 transition-colors duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-secondary)]/60">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="max-w-7xl mx-auto py-16 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredItems.map((item) => {
            const name = replaceShortcodes(item.name || '', shortcodes);
            const description = replaceShortcodes(item.description || '', shortcodes);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex flex-col gap-6 p-4 rounded-3xl hover:bg-white hover:shadow-xl transition-all duration-500"
              >
                {/* Image */}
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-md">
                  <img
                    src={getItemImage(item) || 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=1936&auto=format&fit=crop'}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                
                {/* Content */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-serif text-2xl font-bold text-[var(--color-secondary)] group-hover:text-[var(--color-primary)] transition-colors">
                      {name}
                    </h3>
                    <span className="text-[var(--color-primary)] font-bold text-xl">
                      ${item.price?.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[var(--color-secondary)]/60 text-sm leading-relaxed">
                    {description}
                  </p>
                  
                  {/* Add Button */}
                  {orderingEnabled && (
                    <button
                      onClick={() => handleAddItem(item)}
                      disabled={addedItems[item.id]}
                      className="pt-2 text-[var(--color-secondary)] font-bold text-xs uppercase tracking-widest flex items-center gap-2 group/btn hover:text-[var(--color-primary)] transition-colors"
                    >
                      {addedItems[item.id] ? (
                        <>
                          <Check size={16} />
                          Added
                          <div className="w-10 h-px bg-green-500"></div>
                        </>
                      ) : (
                        <>
                          Customize & Add
                          <div className="w-6 h-px bg-[var(--color-primary)] transition-all duration-300 group-hover/btn:w-10"></div>
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

// Custom CSS for enhanced menu tabs
const MenuPageStyles = () => (
  <style jsx>{`
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide::-webkit-scrollbar-track {
      background: transparent;
    }
    .scrollbar-hide::-webkit-scrollbar-thumb {
      background: transparent;
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-in {
      animation: fadeInUp 0.5s ease-out forwards;
    }
  `}</style>
);


