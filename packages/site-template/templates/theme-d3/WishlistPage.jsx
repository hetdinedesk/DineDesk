import React from 'react';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCMS } from '../../contexts/CMSContext';
import { useCart } from '../../contexts/CartContext';
import { Heart, Trash2, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { withSiteParam, getSiteId } from '../../lib/links';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { restaurant } = useCMS();
  const { addItem, isEnabled: orderingEnabled } = useCart();
  const router = useRouter();
  const siteId = getSiteId(router);

  const [addedItems, setAddedItems] = React.useState({});

  const handleAddToCart = (item) => {
    if (!orderingEnabled) return;

    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image
    });

    setAddedItems({ ...addedItems, [item.id]: true });
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  const handleRemove = (itemId) => {
    removeFromWishlist(itemId);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear your wishlist?')) {
      clearWishlist();
    }
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-accent)] py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
            <Heart className="w-12 h-12 text-[var(--color-primary)]" />
          </div>
          <h1 className="font-serif text-5xl md:text-6xl text-[var(--color-secondary)] mb-6">
            Your Wishlist
          </h1>
          <p className="text-[var(--color-secondary)]/60 text-lg mb-12">
            Your wishlist is empty. Start adding items you love!
          </p>
          <Link
            href={withSiteParam('/menu', siteId)}
            className="inline-flex items-center gap-3 bg-[var(--color-primary)] text-[var(--color-accent)] px-8 py-4 rounded-full font-bold hover:bg-[var(--color-secondary)] transition-all duration-300"
          >
            Browse Menu
            <ArrowRight width={20} height={20} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-accent)] py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-serif text-5xl md:text-6xl text-[var(--color-secondary)] mb-4">
              Your Wishlist
            </h1>
            <p className="text-[var(--color-secondary)]/60 text-lg">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 text-[var(--color-secondary)]/60 hover:text-red-500 transition-colors font-sans text-xs font-bold uppercase tracking-widest"
          >
            <Trash2 width={16} height={16} />
            Clear All
          </button>
        </div>

        {/* Wishlist Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {wishlist.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-[2.5rem] overflow-hidden border border-[var(--color-secondary)]/10 shadow-sm hover:shadow-2xl transition-all duration-500 group"
            >
              <div className="relative aspect-square overflow-hidden">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                )}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute top-6 right-6 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg"
                  aria-label="Remove from wishlist"
                >
                  <Heart width={20} height={20} fill="currentColor" />
                </button>
              </div>
              <div className="p-8 space-y-4">
                <h3 className="font-serif text-2xl font-bold text-[var(--color-secondary)]">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-[var(--color-secondary)]/60 text-sm leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-4">
                  <span className="font-serif text-2xl text-[var(--color-primary)]">
                    ${item.price?.toFixed(2) || '0.00'}
                  </span>
                  {orderingEnabled && (
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={addedItems[item.id]}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 text-xs uppercase tracking-widest ${
                        addedItems[item.id]
                          ? 'bg-green-500 text-white'
                          : 'bg-[var(--color-secondary)] text-[var(--color-accent)] hover:bg-[var(--color-primary)]'
                      }`}
                    >
                      {addedItems[item.id] ? (
                        <>
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus width={16} height={16} />
                          Add to Order
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
