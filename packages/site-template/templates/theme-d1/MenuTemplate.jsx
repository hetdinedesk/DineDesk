import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { useCart } from '../../contexts/CartContext';
import { Search, Plus, Check, Gift, Phone, MapPin } from 'lucide-react';
import { replaceShortcodes } from '../../lib/shortcodes';
import ItemCustomizationModal from '../../components/ItemCustomizationModal';
import { getCurrentTableInfo, formatTableDisplay } from '../../lib/tableDetection';
import { useRouter } from 'next/router';

// Image URLs
const IMAGES = {
  item1: 'https://images.unsplash.com/photo-1696919546499-0d8ea4935bcd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXJyYXRhJTIwY2hlZXNlJTIwdG9tYXRvZXN8ZW58MXx8fHwxNzc0ODQ3Nzg2fDA&ixlib=rb-4.1.0&q=80&w=1080',
  item2: 'https://images.unsplash.com/photo-1769830644804-0ede2ee32a62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0dW5hJTIwdGFydGFyZSUyMGRpc2h8ZW58MXx8fHwxNzc0ODQ3Nzg4fDA&ixlib=rb-4.1.0&q=80&w=1080',
  item3: 'https://images.unsplash.com/photo-1755811248324-3c9b7c8865fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwZm9vZCUyMHBsYXRpbmd8ZW58MXx8fHwxNzc0NzY0ODA5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  item4: 'https://images.unsplash.com/photo-1714579324629-da46dd0d7d85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWVmJTIwc3RlYWslMjBlbGVnYW50fGVufDF8fHx8MTc3NDg0Nzc4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
  item5: 'https://images.unsplash.com/photo-1763633923820-29c3dfa50946?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWxtb24lMjBkaXNoJTIwcmVzdGF1cmFudHxlbnwxfHx8fDE3NzQ4NDc3ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  item6: 'https://images.unsplash.com/photo-1755811248324-3c9b7c8865fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwZm9vZCUyMHBsYXRpbmd8ZW58MXx8fHwxNzc0NzY0ODA5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  item7: 'https://images.unsplash.com/photo-1755811248324-3c9b7c8865fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwZm9vZCUyMHBsYXRpbmd8ZW58MXx8fHwxNzc0NzY0ODA5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  item8: 'https://images.unsplash.com/photo-1737700088028-fae0666feb83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBkZXNzZXJ0JTIwZWxlZ2FudHxlbnwxfHx8fDE3NzQ4MjEwOTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
};

export default function MenuPage({ data, page, banner }) {
  const router = useRouter();
  const { menuCategories, menuItems, shortcodes, contentPages, ordering } = useCMS();
  const { addItem, isEnabled: orderingEnabled } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItems, setAddedItems] = useState({});
  const [customizingItem, setCustomizingItem] = useState(null);
  const [currentTableInfo, setCurrentTableInfo] = useState(null);

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
    // Debug: Log item data to help diagnose variant detection
    console.log('handleAddItem called for item:', item.name, {
      hasVariants: item.hasVariants,
      sizes: item.sizes,
      addons: item.addons,
      sizesLength: item.sizes?.length || 0,
      addonsLength: item.addons?.length || 0
    });

    // Check if item has sizes or addons (more robust detection)
    const hasSizes = item.sizes && Array.isArray(item.sizes) && item.sizes.length > 0;
    const hasAddons = item.addons && Array.isArray(item.addons) && item.addons.length > 0;
    const hasVariantsFlag = item.hasVariants === true;

    // If item has sizes or addons, open customization modal
    if (hasVariantsFlag || hasSizes || hasAddons) {
      console.log('Opening customization modal for:', item.name);
      setCustomizingItem(item);
      return;
    }

    // Otherwise add directly to cart
    console.log('Adding directly to cart (no variants):', item.name);
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
    <div className="min-h-screen">
      {/* Hero Banner - Full height with gradient or banner image */}
      <div 
        className="relative flex items-center justify-center text-white overflow-hidden"
        style={{ 
          minHeight: '60vh',
          marginTop: 'calc(var(--header-offset, 5rem) * -1)',
          paddingTop: 'var(--header-offset, 5rem)',
          background: pageBanner?.imageUrl ? 'transparent' : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary, #8B5A2B) 100%)'
        }}
      >
        {/* Banner Image Background */}
        {pageBanner?.imageUrl && (
          <>
            <img 
              src={pageBanner.imageUrl} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}
        
        {/* Background Pattern (only when no banner) */}
        {!pageBanner?.imageUrl && (
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
        )}
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6"
            style={{ 
              fontFamily: 'var(--font-heading, inherit)',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            {pageTitle}
          </motion.h1>
          
          {pageSubtitle && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl max-w-2xl mx-auto opacity-90"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
            >
              {pageSubtitle}
            </motion.p>
          )}
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              fill="white"
            />
          </svg>
        </div>
      </div>

      {/* Loyalty Banner - Shows when loyalty is enabled */}
      {isLoyaltyEnabled && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                !selectedCategory
                  ? 'bg-[var(--color-secondary)] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {activeCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-[var(--color-secondary)] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items by Category */}
        {categoriesWithItems.map((category) => {
          const categoryItems = filteredItems.filter((item) => item.categoryId === category.id);
          if (categoryItems.length === 0) return null;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-16"
            >
              <div className="mb-8">
                <h2
                  className="text-3xl font-bold text-[var(--color-primary)] mb-2"
                  style={{ fontFamily: 'var(--font-heading, inherit)' }}
                >
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-gray-600">{category.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryItems.map((item) => {
                  const name = replaceShortcodes(item.name || '', shortcodes);
                  const description = replaceShortcodes(item.description || '', shortcodes);
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                    >
                      {getItemImage(item) ? (
                        <div className="w-32 h-32 flex-shrink-0">
                          <img
                            src={getItemImage(item)}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 flex-shrink-0 bg-gray-100"></div>
                      )}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg text-[var(--color-primary)]">
                              {name}
                            </h3>
                            {item.isFeatured && (
                              <span className="ml-2 px-2 py-0.5 bg-[var(--color-secondary)] text-white text-xs rounded-full flex-shrink-0">
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xl font-bold text-[var(--color-secondary)]">
                            ${item.price.toFixed(2)}
                          </span>
                          <div className="flex items-center gap-2">
                            {item.dietary.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.dietary.slice(0, 2).map((diet) => (
                                  <span
                                    key={diet}
                                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                                  >
                                    {diet}
                                  </span>
                                ))}
                              </div>
                            )}
                            {orderingEnabled && (
                              <button
                                onClick={() => handleAddItem(item)}
                                className="inline-flex items-center justify-center text-sm font-medium text-white h-8 rounded-md gap-1.5 px-3 transition-colors hover:opacity-90"
                                style={{ background: addedItems[item.id] ? '#10B981' : 'var(--color-primary)' }}
                              >
                                {addedItems[item.id] ? (
                                  <>
                                    <Check className="w-4 h-4 mr-1" />
                                    Added
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No menu items found matching your criteria.</p>
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


