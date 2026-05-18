import React from 'react';
import { useCart } from '../../contexts/CartContext';
import { ShoppingCart } from 'lucide-react';

export const FloatingCartIcon = () => {
  const { totalItems, openCart } = useCart();

  // Only show if there are items in cart
  if (totalItems === 0) return null;

  return (
    <button
      onClick={openCart}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: 'var(--color-primary, #FF6B2B)',
        color: 'white',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',
        zIndex: 1000,
        border: 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
      }}
    >
      <ShoppingCart size={24} />
      
      {/* Badge showing item count */}
      {totalItems > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: '#fff',
            color: 'var(--color-primary, #FF6B2B)',
            fontSize: '12px',
            fontWeight: 'bold',
            minWidth: '24px',
            height: '24px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          {totalItems}
        </span>
      )}
    </button>
  );
};
