import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export const FloatingCartIcon = () => {
  try {
    const { totalItems, total, openCart } = useCart();
    const [isVisible, setIsVisible] = useState(false);

    // Show floating cart when items are added
    useEffect(() => {
      if (totalItems > 0) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }, [totalItems]);

    if (!isVisible) return null;

    return (
      <button
        onClick={openCart}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'var(--color-primary, #FF6B2B)',
          color: 'white',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
          zIndex: 9999,
          border: 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        }}
      >
        <ShoppingCart size={24} />
        {totalItems > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: 'white',
              color: 'var(--color-primary, #FF6B2B)',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--color-primary, #FF6B2B)',
            }}
          >
            {totalItems}
          </span>
        )}
      </button>
    );
  } catch (error) {
    return null;
  }
};

export default FloatingCartIcon;
