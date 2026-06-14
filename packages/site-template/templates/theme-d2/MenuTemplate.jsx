import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { useCart } from '../../contexts/CartContext';
import { Search, Plus, Check, Gift, Phone, Clock } from 'lucide-react';
import { replaceShortcodes } from '../../lib/shortcodes';
import ItemCustomizationModal from '../../components/ItemCustomizationModal';
import { isRestaurantOpen, formatOperatingHours } from '../../lib/operatingHours';

export default function MenuPage({ data, page, banner }) {
  const { menuCategories, menuItems, shortcodes, contentPages, ordering, locations } = useCMS();
  const { addItem, isEnabled: orderingEnabled } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItems, setAddedItems] = useState({});
  const [customizingItem, setCustomizingItem] = useState(null);

  // Check if restaurant is currently open based on operating hours
  const primaryLocation = locations?.find(loc => loc.isPrimary) || locations?.[0];
  const isRestaurantCurrentlyOpen = isRestaurantOpen(primaryLocation?.hours);
  const currentOperatingHours = formatOperatingHours(primaryLocation?.hours);

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
    const hasSizes = item.sizes && Array.isArray(item.sizes) && item.sizes.length > 0;
    const hasAddons = item.addons && Array.isArray(item.addons) && item.addons.length > 0;
    const hasVariantsFlag = item.hasVariants === true;

    if (hasVariantsFlag || hasSizes || hasAddons) {
      setCustomizingItem(item);
      return;
    }

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

  const handleCustomAdd = (cartItem) => {
    addItem({
      id: cartItem.id,
      name: cartItem.name,
      price: cartItem.totalPrice,
      image: cartItem.image,
      selectedSize: cartItem.selectedSize,
      selectedAddons: cartItem.selectedAddons,
      specialInstructions: cartItem.specialInstructions,
    });
    setAddedItems({ ...addedItems, [cartItem.id]: true });
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [cartItem.id]: false }));
    }, 2000);
    setCustomizingItem(null);
  };

  return (
    <div className="min-h-screen bg-[var(--color-accent)]">
      {/* Hero Banner */}
      <div className="bg-[var(--color-secondary)] py-32 px-6 text-center text-[var(--color-accent)] relative overflow-hidden">
        {/* Background Image from CMS Banner */}
        {pageBanner?.imageUrl && (
          <div className="absolute inset-0 z-0">
            <img 
              src={pageBanner.imageUrl} 
              alt="" 
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-secondary)]/50 to-[var(--color-secondary)]"></div>
          </div>
        )}
        
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


      {/* Filter Bar */}
      <div className="bg-[var(--color-accent)]/90 backdrop-blur-xl border-b border-[var(--color-secondary)]/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-8 py-3 rounded-full font-sans font-bold text-[10px] tracking-[0.2em] transition-all duration-700 uppercase ${
                !selectedCategory
                  ? 'bg-[var(--color-primary)] text-white shadow-lg'
                  : 'text-[var(--color-secondary)]/40 hover:text-[var(--color-secondary)] hover:bg-[var(--color-primary)]/5'
              }`}
            >
              All Items
            </button>
            {activeCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-8 py-3 rounded-full font-sans font-bold text-[10px] tracking-[0.2em] transition-all duration-700 uppercase ${
                  selectedCategory === category.id
                    ? 'bg-[var(--color-primary)] text-white shadow-lg'
                    : 'text-[var(--color-secondary)]/40 hover:text-[var(--color-secondary)] hover:bg-[var(--color-primary)]/5'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-secondary)]/20" size={16} />
            <input
              type="text"
              placeholder="FIND IN THE GARDEN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-secondary)]/5 border border-transparent rounded-full px-14 py-4 text-[10px] font-sans font-bold tracking-widest text-[var(--color-secondary)] focus:outline-none focus:bg-white focus:border-[var(--color-primary)]/20 transition-all duration-500 placeholder:text-[var(--color-secondary)]/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--color-secondary)]/10 transition-colors duration-200"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-secondary)]/60">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="max-w-7xl mx-auto py-16 px-4">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-10">
          {filteredItems.map((item) => {
            const name = replaceShortcodes(item.name || '', shortcodes);
            const description = replaceShortcodes(item.description || '', shortcodes);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex flex-col gap-3 p-3 md:p-4 rounded-2xl md:rounded-3xl hover:bg-white hover:shadow-xl transition-all duration-500"
              >
                {/* Image */}
                <div className="aspect-square rounded-xl md:rounded-2xl overflow-hidden shadow-md">
                  <img
                    src={getItemImage(item) || 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=1936&auto=format&fit=crop'}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>

                {/* Content */}
                <div className="space-y-2 md:space-y-3">
                  <h3 className="font-serif text-sm md:text-lg lg:text-2xl font-bold text-[var(--color-secondary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                    {name}
                  </h3>
                  <span className="text-[var(--color-primary)] font-bold text-sm md:text-base lg:text-xl">
                    ${item.price?.toFixed(2)}
                  </span>
                  <p className="text-[var(--color-secondary)]/60 text-xs md:text-sm leading-relaxed line-clamp-2">
                    {description}
                  </p>

                  {/* Add Button */}
                  {orderingEnabled && (
                    <button
                      onClick={() => handleAddItem(item)}
                      disabled={addedItems[item.id]}
                      className="pt-1 md:pt-2 text-[var(--color-secondary)] font-bold text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 group/btn hover:text-[var(--color-primary)] transition-colors"
                    >
                      {addedItems[item.id] ? (
                        <>
                          <Check size={14} />
                          Added
                          <div className="w-8 h-px bg-green-500"></div>
                        </>
                      ) : (
                        <>
                          Customize & Add
                          <div className="w-4 h-px bg-[var(--color-primary)] transition-all duration-300 group-hover/btn:w-8"></div>
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

      {/* Item Customization Modal */}
      <ItemCustomizationModal
        item={customizingItem}
        isOpen={!!customizingItem}
        onClose={() => setCustomizingItem(null)}
        onAddToCart={handleCustomAdd}
        shortcodes={shortcodes}
      />
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


