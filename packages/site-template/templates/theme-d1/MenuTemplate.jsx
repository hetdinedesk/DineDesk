import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { useCart } from '../../contexts/CartContext';
import { Search, Plus } from 'lucide-react';
import { replaceShortcodes } from '../../lib/shortcodes';

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
  const { menuCategories, menuItems, shortcodes, contentPages, ordering } = useCMS();
  const { addItem, isEnabled: orderingEnabled } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const menuPage = (contentPages || []).find(p => p.slug === 'menu' || p.pageType === 'menu');
  const pageTitle = replaceShortcodes(menuPage?.title || 'Our Menu', shortcodes);
  const pageSubtitle = replaceShortcodes(menuPage?.subtitle || menuPage?.metaDesc || 'Crafted with passion, served with excellence', shortcodes);

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

  const getItemImage = (item) => {
    if (item.image) return item.image;
    const imageKeys = Object.keys(IMAGES);
    const hash = (item.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return IMAGES[imageKeys[Math.abs(hash) % imageKeys.length]];
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
          background: banner?.imageUrl ? 'transparent' : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary, #8B5A2B) 100%)'
        }}
      >
        {/* Banner Image Background */}
        {banner?.imageUrl && (
          <>
            <img 
              src={banner.imageUrl} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}
        
        {/* Background Pattern (only when no banner) */}
        {!banner?.imageUrl && (
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
        {activeCategories.map((category) => {
          const categoryItems = filteredItems.filter((item) => item.categoryId === category.id);
          if (categoryItems.length === 0 && selectedCategory) return null;

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
                      <div className="w-32 h-32 flex-shrink-0">
                        <img
                          src={getItemImage(item)}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      </div>
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
                                onClick={() => addItem({
                                  id: item.id,
                                  name,
                                  price: item.price,
                                  image: getItemImage(item),
                                })}
                                className="inline-flex items-center justify-center text-sm font-medium text-white h-8 rounded-md gap-1.5 px-3 transition-colors hover:opacity-90"
                                style={{ background: 'var(--color-primary)' }}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add
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
    </div>
  );
}


