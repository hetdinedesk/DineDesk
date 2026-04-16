import React from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { useCart } from '../../contexts/CartContext';
import { Clock, Tag, Calendar, Plus } from 'lucide-react';
import { replaceShortcodes } from '../../lib/shortcodes';

const SPECIAL_IMAGE = 'https://images.unsplash.com/photo-1759283084358-0565ea8e2885?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5lJTIwcGFpcmluZyUyMGRpbm5lcnxlbnwxfHx8fDE3NzQ4NDc3ODh8MA&ixlib=rb-4.1.0&q=80&w=1080';
const SPECIAL_IMAGE_2 = 'https://images.unsplash.com/photo-1755811248324-3c9b7c8865fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwZm9vZCUyMHBsYXRpbmd8ZW58MXx8fHwxNzc0NzY0ODA5fDA&ixlib=rb-4.1.0&q=80&w=1080';

export default function SpecialsPage({ data, page, banner }) {
  const { specials, shortcodes, contentPages, ordering } = useCMS();
  const { addItem, isEnabled: orderingEnabled } = useCart();

  const specialsPage = (contentPages || []).find(p => p.slug === 'specials' || p.pageType === 'specials');
  const pageTitle = replaceShortcodes(specialsPage?.title || 'Current Specials', shortcodes);
  const pageSubtitle = replaceShortcodes(specialsPage?.subtitle || specialsPage?.metaDesc || 'Limited time offerings crafted by our chefs', shortcodes);

  const activeSpecials = specials.filter((special) => {
    if (!special.isActive) return false;
    const now = new Date();
    const validFrom = special.validFrom ? new Date(special.validFrom) : null;
    const validUntil = special.validUntil ? new Date(special.validUntil) : null;
    const afterStart = !validFrom || now >= validFrom;
    const beforeEnd = !validUntil || now <= validUntil;
    return afterStart && beforeEnd;
  });

  const upcomingSpecials = specials.filter((special) => {
    if (!special.isActive) return false;
    if (!special.validFrom) return false;
    const now = new Date();
    const validFrom = new Date(special.validFrom);
    return now < validFrom;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
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
        {/* Active Specials */}
        {activeSpecials.length > 0 ? (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-8">
              Available Now
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {activeSpecials.map((special, index) => {
                const title = replaceShortcodes(special.title || '', shortcodes);
                const description = replaceShortcodes(special.description || '', shortcodes);
                
                return (
                  <motion.div
                    key={special.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative rounded-lg overflow-hidden shadow-xl ${
                      special.isHighlighted ? 'ring-4 ring-[var(--color-secondary)]' : ''
                    }`}
                  >
                    {/* Image */}
                    <div className="h-80 overflow-hidden">
                      <img
                        src={special.image || (index % 2 === 0 ? SPECIAL_IMAGE : SPECIAL_IMAGE_2)}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                      {special.isHighlighted && (
                        <div className="inline-flex items-center space-x-1 bg-[var(--color-secondary)] px-3 py-1 rounded-full mb-2 sm:mb-3">
                          <Tag size={14} />
                          <span className="text-xs font-semibold">Featured Special</span>
                        </div>
                      )}
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 break-words">{title}</h3>
                      <p className="text-gray-200 text-sm sm:text-base mb-4 line-clamp-2 sm:line-clamp-3">{description}</p>
                      
                      <div className="flex items-center justify-between">
                        {special.price && (
                          <div className="flex items-baseline space-x-2">
                            <span className="text-2xl sm:text-4xl font-bold text-[var(--color-secondary)]">
                              ${special.price.toFixed(2)}
                            </span>
                            {special.originalPrice && (
                              <span className="text-sm sm:text-lg text-gray-300 line-through">
                                ${special.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {orderingEnabled && special.price && (
                          <button
                            onClick={() => addItem({
                              id: special.id,
                              name: title,
                              price: special.price,
                              image: special.image || (index % 2 === 0 ? SPECIAL_IMAGE : SPECIAL_IMAGE_2),
                              description: description,
                              category: 'Special'
                            })}
                            className="bg-white text-[var(--color-primary)] px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
                          >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Add to Cart</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center text-sm text-gray-300 mt-4 space-x-4">
                        {special.validFrom && (
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            <span>{new Date(special.validFrom).toLocaleDateString()}</span>
                          </div>
                        )}
                        {special.validUntil && (
                          <div className="flex items-center">
                            <Clock size={14} className="mr-1" />
                            <span>Until {new Date(special.validUntil).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No active specials at the moment. Check back soon!
            </p>
          </div>
        )}

        {/* Upcoming Specials */}
        {upcomingSpecials.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-8">
              Coming Soon
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingSpecials.map((special, index) => {
                const title = replaceShortcodes(special.title || '', shortcodes);
                const description = replaceShortcodes(special.description || '', shortcodes);
                
                return (
                  <motion.div
                    key={special.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg overflow-hidden shadow-md border-2 border-dashed border-gray-300"
                  >
                    <div className="p-6">
                      {special.validFrom && (
                        <div className="inline-flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full mb-3">
                          <Calendar size={14} className="text-gray-600" />
                          <span className="text-xs font-semibold text-gray-600">
                            Starts {new Date(special.validFrom).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2">
                        {title}
                      </h3>
                      <p className="text-gray-600 mb-4">{description}</p>
                      {special.price && (
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-[var(--color-secondary)]">
                            ${special.price.toFixed(2)}
                          </div>
                          {orderingEnabled && (
                            <button
                              onClick={() => addItem({
                                id: special.id,
                                name: title,
                                price: special.price,
                                image: special.image || SPECIAL_IMAGE,
                                description: description,
                                category: 'Special'
                              })}
                              className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-colors flex items-center space-x-2"
                            >
                              <Plus size={16} />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


