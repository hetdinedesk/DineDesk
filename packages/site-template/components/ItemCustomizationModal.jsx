import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus } from 'lucide-react';

export default function ItemCustomizationModal({ item, isOpen, onClose, onAddToCart, shortcodes = {} }) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Normalize sizes data from CMS (handles both old and new structures)
  const normalizedSizes = useMemo(() => {
    if (!item?.sizes || item.sizes.length === 0) return [];
    return item.sizes.map((size, idx) => ({
      id: size.id || `size-${idx}`,
      name: size.name,
      // CMS stores priceAdjustment, old structure stores price
      priceAdjustment: size.priceAdjustment !== undefined ? parseFloat(size.priceAdjustment) || 0 : parseFloat(size.price) || 0,
      isDefault: size.isDefault || idx === 0
    }));
  }, [item?.sizes]);

  // Normalize addons data from CMS (handles flat array or grouped structure)
  const normalizedAddons = useMemo(() => {
    if (!item?.addons || item.addons.length === 0) return [];
    // Check if it's the new flat array structure from CMS [{name, price}]
    if (item.addons[0]?.name && !item.addons[0]?.items) {
      return item.addons.map((addon, idx) => ({
        id: `addon-${idx}`,
        name: addon.name,
        price: parseFloat(addon.price) || 0
      }));
    }
    // Old grouped structure - flatten it
    return item.addons.flatMap(group => 
      (group.items || []).map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price) || 0
      }))
    );
  }, [item?.addons]);

  // Initialize defaults when modal opens
  React.useEffect(() => {
    if (isOpen && item) {
      // Set default size (first one)
      if (normalizedSizes.length > 0) {
        const defaultSize = normalizedSizes.find(s => s.isDefault) || normalizedSizes[0];
        setSelectedSize(defaultSize);
      } else {
        setSelectedSize(null);
      }
      // Reset addons
      setSelectedAddons([]);
      setSpecialInstructions('');
    }
  }, [isOpen, item, normalizedSizes]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    let total = item?.price || 0;

    // Add size price adjustment
    if (selectedSize) {
      total += selectedSize.priceAdjustment || 0;
    }

    // Add addon prices
    selectedAddons.forEach(addonId => {
      const addon = normalizedAddons.find(a => a.id === addonId);
      if (addon) {
        total += addon.price || 0;
      }
    });

    return total;
  }, [item?.price, selectedSize, selectedAddons, normalizedAddons]);

  // Can always add to cart (no required selections)
  const canAddToCart = true;

  // Handle size selection
  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  // Handle addon toggle
  const handleAddonToggle = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.includes(addon.id);
      if (exists) {
        return prev.filter(id => id !== addon.id);
      }
      return [...prev, addon.id];
    });
  };

  // Handle add to cart
  const handleAddToCart = () => {
    // Build cart item with all selections
    const cartItem = {
      id: item.id,
      name: item.name,
      image: item.image,
      basePrice: item.price || 0,
      selectedSize: selectedSize ? {
        name: selectedSize.name,
        priceAdjustment: selectedSize.priceAdjustment || 0
      } : null,
      selectedAddons: selectedAddons.map(addonId => {
        const addon = normalizedAddons.find(a => a.id === addonId);
        return addon ? { name: addon.name, price: addon.price } : null;
      }).filter(Boolean),
      totalPrice,
      specialInstructions: specialInstructions.trim() || undefined,
      quantity: 1
    };

    onAddToCart(cartItem);
    onClose();
  };

  if (!item) return null;

  const hasSizes = normalizedSizes.length > 0;
  const hasAddons = normalizedAddons.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-[9999] max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
              {/* Sizes Section */}
              {hasSizes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Select Size {selectedSize && <span className="text-gray-400 font-normal">- {selectedSize.name}</span>}
                  </h3>
                  <div className="space-y-2">
                    {normalizedSizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => handleSizeSelect(size)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          selectedSize?.id === size.id
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedSize?.id === size.id
                              ? 'border-[var(--color-primary)]'
                              : 'border-gray-300'
                          }`}>
                            {selectedSize?.id === size.id && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900">{size.name}</span>
                          {size.isDefault && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">
                          +${(size.priceAdjustment || 0).toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons Section */}
              {hasAddons && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Add-ons
                  </h3>
                  <div className="space-y-2">
                    {normalizedAddons.map((addon) => {
                      const isSelected = selectedAddons.includes(addon.id);

                      return (
                        <button
                          key={addon.id}
                          onClick={() => handleAddonToggle(addon)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                                : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                              {addon.name}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            +${(addon.price || 0).toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Special Instructions (Optional)
                </h3>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests? (e.g., no onions, extra sauce)"
                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Total</span>
                <span className="text-2xl font-bold text-[var(--color-primary)]">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className="w-full py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add to Cart - ${totalPrice.toFixed(2)}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
