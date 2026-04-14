import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CART_STORAGE_KEY = 'dinedesk_cart';
const CART_EXPIRY_MINUTES = 10;

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children, ordering = {} }) => {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const isEnabled = ordering?.enabled === true;
  const taxRate = ordering?.taxRate || 0;
  const taxLabel = ordering?.taxLabel || 'Tax';

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const { items: savedItems, timestamp } = JSON.parse(savedCart);
        const now = Date.now();
        const expiryTime = CART_EXPIRY_MINUTES * 60 * 1000;
        
        // Only restore if cart is less than 10 minutes old
        if (now - timestamp < expiryTime) {
          setItems(savedItems);
        } else {
          // Remove expired cart
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (items.length > 0) {
      const cartData = {
        items,
        timestamp: Date.now()
      };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [items]);

  const addItem = useCallback((item) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((itemId) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.id !== itemId));
    } else {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <CartContext.Provider value={{
      items,
      isOpen,
      isEnabled,
      totalItems,
      subtotal,
      taxAmount,
      taxRate,
      taxLabel,
      total,
      ordering,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};
