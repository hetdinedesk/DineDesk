import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { Search } from 'lucide-react';
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

export default function MenuPage() {
  const { menuCategories, menuItems, shortcodes } = useCMS();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Assign images to items
  const getItemImage = (itemId) => {
    const imageKeys = Object.keys(IMAGES);
    const index = parseInt(itemId.split('-')[1]) % imageKeys.length;
    return IMAGES[imageKeys[index]];
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <div className="bg-[var(--color-primary)] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-heading, inherit)' }}
          >
            Our Menu
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl"
          >
            Crafted with passion, served with excellence
          </motion.p>
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
                          src={getItemImage(item.id)}
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
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-[var(--color-secondary)]">
                            ${item.price.toFixed(2)}
                          </span>
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


