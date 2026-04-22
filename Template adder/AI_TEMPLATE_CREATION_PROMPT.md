# AI Template Creation Prompt - DineDesk

You are an expert frontend developer specializing in React/Next.js templates for restaurant websites. Your task is to create new restaurant website templates for the DineDesk platform.

## System Overview

DineDesk is a CMS-driven restaurant website platform where templates consume data from a central API. All templates are data-driven - they display whatever content the CMS provides.

**Key Architecture:**
- Frontend: Next.js with React
- CMS: Express.js backend with Prisma ORM
- Data: Single API export endpoint provides all template data
- State: Context-based state management (CMSContext, CartContext, LoyaltyContext)

## File Structure

```
packages/site-template/
├── templates/
│   └── theme-d1/              # Theme folder (e.g., theme-d2, theme-d3)
│       ├── HomePage.jsx       # Homepage template
│       ├── MenuTemplate.jsx   # Menu page template
│       ├── LocationsTemplate.jsx  # Locations page template
│       ├── SpecialsTemplate.jsx    # Specials page template
│       └── TeamTemplate.jsx   # Team page template
├── components/
│   └── theme-d1/             # Theme-specific components
│       ├── Header.jsx        # Navigation header
│       ├── Footer.jsx        # Footer component
│       ├── UtilityBelt.jsx   # Top utility bar
│       ├── CartDrawer.jsx    # Shopping cart drawer
│       └── sections/        # Reusable sections
│           ├── HeroSection.jsx
│           ├── MenuSection.jsx
│           ├── SpecialsSection.jsx
│           └── LoyaltyBannerSection.jsx
├── contexts/
│   ├── CMSContext.jsx        # CMS data provider
│   ├── CartContext.jsx       # Shopping cart context
│   └── LoyaltyContext.jsx    # Loyalty system context
├── lib/
│   ├── api.js                # API client
│   ├── theme.js              # Theme CSS builder
│   └── shortcodes.js         # Shortcode replacement
└── pages/
    ├── index.js              # Template mapping
    └── checkout.js           # Checkout page
```

## Key Hooks & Contexts

### useCMS()
Access all CMS data provided by the backend.

```javascript
const {
  restaurant,      // Basic restaurant info
  locations,       // All locations
  menuCategories,  // Menu categories
  menuItems,       // Menu items
  specials,        // Special offers
  banners,         // Banners
  navigation,      // Navigation items
  siteConfig,      // Site configuration
  reviews,         // Reviews data
  booking,         // Booking config
  ordering,        // Ordering configuration
  loyaltyConfig,   // Loyalty program config
  shortcodes,      // Shortcode values
  rawData          // Raw API data
} = useCMS();
```

### useCart()
Access shopping cart functionality.

```javascript
const {
  items,           // Cart items array
  totalItems,      // Total number of items
  subtotal,        // Subtotal before tax
  taxAmount,       // Tax amount
  taxRate,         // Tax rate
  taxLabel,        // Tax label (e.g., "GST")
  total,           // Total including tax
  addItem,         // Add item to cart
  removeItem,      // Remove item from cart
  updateQuantity,  // Update item quantity
  clearCart,       // Clear entire cart
  ordering,        // Ordering configuration
  isEnabled        // Is ordering enabled
} = useCart();
```

### useLoyalty()
Access loyalty system functionality.

```javascript
const {
  customer,              // Current customer data
  loyaltyConfig,         // Loyalty configuration
  lookupCustomer,        // Lookup customer by phone
  upsertCustomer,        // Create or update customer
  redeemReward,          // Redeem a reward
  canRedeemReward,       // Check if customer can redeem reward
  getPointsToNextReward, // Get points needed for next reward
  isLoyaltyEnabled       // Is loyalty enabled
} = useLoyalty();
```

## Data Structure

### Restaurant Data
```javascript
{
  id, name, domain, status,
  description, tagline,
  logo, favicon,
  group: { id, name }
}
```

### Location Data
```javascript
{
  id, name, isPrimary, isActive, showInFooter,
  address: { street, suburb, city, state, zipCode, postcode, country },
  phone, email, formEmail,
  hours: { Mon: { open, close, closed }, Tue: ..., ... },
  lat, lng,
  exteriorImages, exteriorImage, galleryImages,
  deliveryOptions, servicesAvailable, alternateStyling
}
```

### Menu Data
```javascript
menuCategories: [{
  id, name, description, isActive, sortOrder
}]

menuItems: [{
  id, categoryId, name, description, price,
  imageUrl, image, isAvailable, isFeatured,
  dietaryTags, sortOrder
}]
```

### Specials Data
```javascript
[{
  id, title, description, price, originalPrice,
  imageUrl, bannerImage, image,
  isActive, isHighlighted, isFeatured,
  startDate, endDate, validFrom, validUntil,
  sortOrder
}]
```

### Loyalty Data
```javascript
loyaltyConfig: {
  enabled: boolean,
  pointsPerDollar: number,
  rewards: [{
    id, name, description, pointsRequired,
    discountValue, discountType: 'fixed' | 'percentage',
    isActive
  }]
}
```

### Ordering Data
```javascript
ordering: {
  enabled: boolean,
  acceptingOrders: boolean,
  requirePhone: boolean,
  requireEmail: boolean,
  estimatedPrepTime: string,
  deliveryFee: number,
  orderTypes: ['pickup', 'delivery', 'dine-in']
}
```

## Theme & Color System

Colors are provided via CSS custom properties:

```css
:root {
  --color-primary: /* Primary brand color */
  --color-secondary: /* Secondary brand color */
  --color-accent: /* Accent color */
  --color-text: /* Main text color */
  --color-text-light: /* Light text color */
  --color-background: /* Background color */
  --color-surface: /* Surface color */
  --color-border: /* Border color */
  --color-success: /* Success color (green) */
  --color-error: /* Error color (red) */
  --color-warning: /* Warning color (yellow) */
}
```

Use these variables in your templates:
```jsx
<div style={{ color: 'var(--color-primary)', background: 'var(--color-background)' }}>
```

## Shortcodes

Shortcodes are dynamic placeholders replaced with actual data:

```javascript
const { shortcodes } = useCMS();
const text = replaceShortcodes("Welcome to {restaurant_name}", shortcodes);
```

Available shortcodes:
- `{restaurant_name}` - Restaurant name
- `{restaurant_phone}` - Primary phone
- `{restaurant_email}` - Primary email
- `{primary_location_address}` - Primary location address

## Template Requirements

### All Templates Must:

1. **Use useCMS() hook** to access data
2. **Use replaceShortcodes()** for text with placeholders
3. **Use CSS variables** for colors and styling
4. **Be responsive** - work on mobile, tablet, desktop
5. **Handle empty states** - show appropriate messages when no data
6. **Use Lucide icons** for icons
7. **Follow the theme folder structure**

### Homepage Template

Required sections:
- Hero section (banner)
- Menu preview
- Specials (if available)
- About/Story section
- Location(s)
- Contact information
- Footer

### Menu Template

Required features:
- Category filtering
- Search functionality
- Item cards with name, description, price, image
- Add to cart buttons (if ordering enabled)
- Tick-mark confirmation when adding items (green checkmark for 2 seconds)
- Empty states

### Locations Template

Required features:
- Location cards with address, phone, email
- Hours of operation
- Map integration
- Services available

### Specials Template

Required features:
- Special cards with title, description, price, image
- Validity dates
- Add to cart buttons (if ordering enabled)
- Tick-mark confirmation when adding items

## Cart & Ordering Integration

### Add to Cart with Tick-Mark Confirmation

```jsx
import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { Plus, Check } from 'lucide-react';

function MenuItem({ item }) {
  const { addItem, isEnabled } = useCart();
  const [addedItems, setAddedItems] = useState({});

  const handleAddItem = (item) => {
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

  return (
    <button
      onClick={() => handleAddItem(item)}
      style={{
        background: addedItems[item.id] ? '#10B981' : 'var(--color-primary)'
      }}
    >
      {addedItems[item.id] ? (
        <>
          <Check />
          Added
        </>
      ) : (
        <>
          <Plus />
          Add
        </>
      )}
    </button>
  );
}
```

### Cart Drawer

Include the CartDrawer component in your template:
```jsx
import { CartDrawer } from '../../components/theme-d1/CartDrawer';

// In your template
<CartDrawer />
```

## Loyalty Integration

### Loyalty Banner on Homepage

```jsx
import { LoyaltyProvider, useLoyalty } from '../../contexts/LoyaltyContext';
import LoyaltyBannerSection from '../../components/theme-d1/sections/LoyaltyBannerSection';

function HomePageContent() {
  const { loyaltyConfig, isLoyaltyEnabled } = useLoyalty();

  if (!isLoyaltyEnabled || !loyaltyConfig?.rewards?.length) {
    return null;
  }

  return <LoyaltyBannerSection />;
}
```

### Loyalty in Checkout

```jsx
import { LoyaltyProvider, useLoyalty } from '../../contexts/LoyaltyContext';

function CheckoutPage() {
  const {
    customer,
    loyaltyConfig,
    lookupCustomer,
    upsertCustomer,
    redeemReward,
    canRedeemReward,
    isLoyaltyEnabled
  } = useLoyalty();

  // Lookup customer when phone changes
  useEffect(() => {
    if (customerInfo.phone && isLoyaltyEnabled) {
      lookupCustomer(customerInfo.phone);
    }
  }, [customerInfo.phone, isLoyaltyEnabled, lookupCustomer]);

  // Display customer points
  {isLoyaltyEnabled && customer && (
    <div>
      Welcome back! You have {customer.points} points
    </div>
  )}

  // Redeem rewards
  {isLoyaltyEnabled && customer && loyaltyConfig?.rewards?.length > 0 && (
    <div>
      {loyaltyConfig.rewards.map(reward => {
        const canRedeem = canRedeemReward(reward);
        return (
          <button
            onClick={async () => {
              const result = await redeemReward(reward.id);
              if (result) {
                setRedeemedReward(reward);
              }
            }}
            disabled={!canRedeem}
          >
            {reward.name} - {reward.pointsRequired} points
          </button>
        );
      })}
    </div>
  )}
}
```

## Creating a New Theme

### Step 1: Create Theme Folder

```
packages/site-template/templates/theme-d2/
```

### Step 2: Create Template Files

Create template files for each page type:
- HomePage.jsx
- MenuTemplate.jsx
- LocationsTemplate.jsx
- SpecialsTemplate.jsx
- TeamTemplate.jsx

### Step 3: Create Theme-Specific Components

```
packages/site-template/components/theme-d2/
```

Create theme-specific versions of:
- Header.jsx
- Footer.jsx
- UtilityBelt.jsx
- CartDrawer.jsx (can reuse from theme-d1 if styling matches)

### Step 4: Update Template Mapping

Edit `packages/site-template/pages/index.js` to add your new theme:

```javascript
const TEMPLATES = {
  'theme-d1': {
    HomePage: () => import('../templates/theme-d1/HomePage'),
    MenuTemplate: () => import('../templates/theme-d1/MenuTemplate'),
    // ...
  },
  'theme-d2': {
    HomePage: () => import('../templates/theme-d2/HomePage'),
    MenuTemplate: () => import('../templates/theme-d2/MenuTemplate'),
    // ...
  }
};
```

### Step 5: Design Guidelines

When creating a new theme:
- **Keep all functionality identical** - only change styling/layout
- **Use the same data structure** - all templates must work with the same API data
- **Use CSS variables** for colors to ensure theme consistency
- **Make it responsive** - mobile-first approach
- **Consider different restaurant types** - fine dining, cafe, food truck, etc.

## Example: Simple Menu Item Component

```jsx
import { useCart } from '../../contexts/CartContext';
import { useState } from 'react';
import { Plus, Check } from 'lucide-react';

function MenuItem({ item }) {
  const { addItem, isEnabled } = useCart();
  const [addedItems, setAddedItems] = useState({});

  const handleAddItem = (item) => {
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

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16
    }}>
      <h3 style={{ color: 'var(--color-text)', marginBottom: 8 }}>{item.name}</h3>
      <p style={{ color: 'var(--color-text-light)', marginBottom: 12 }}>{item.description}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>${item.price}</span>
        {isEnabled && (
          <button
            onClick={() => handleAddItem(item)}
            style={{
              background: addedItems[item.id] ? '#10B981' : 'var(--color-primary)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {addedItems[item.id] ? (
              <>
                <Check size={16} />
                Added
              </>
            ) : (
              <>
                <Plus size={16} />
                Add
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
```

## Best Practices

1. **Always check if data exists** before rendering
2. **Use optional chaining** for nested data: `item?.image`
3. **Provide fallback values** for missing data
4. **Use CSS variables** for all colors
5. **Keep components reusable** - break down into smaller components
6. **Handle loading states** - show loaders while data fetches
7. **Handle error states** - show error messages if data fails to load
8. **Make it accessible** - use semantic HTML, ARIA labels
9. **Optimize images** - use lazy loading, proper sizes
10. **Test on all screen sizes** - mobile, tablet, desktop

## Theme Variations

When creating different themes for different restaurant types:

### Fine Dining Theme
- Elegant, sophisticated design
- Serif fonts for headings
- Dark color palette
- Minimal animations
- Large hero images
- Emphasis on ambiance and experience

### Cafe/Brunch Theme
- Warm, cozy design
- Sans-serif fonts
- Light, airy colors
- Casual animations
- Food-focused imagery
- Emphasis on menu and atmosphere

### Food Truck/Quick Bite Theme
- Bold, vibrant design
- Playful fonts
- Bright colors
- Fun animations
- Mobile-first design
- Emphasis on speed and convenience

### Multi-Location/Franchise Theme
- Consistent, professional design
- Clean, modern fonts
- Brand colors
- Subtle animations
- Location finder prominence
- Emphasis on brand consistency

### Delivery-First/Cloud Kitchen Theme
- Modern, tech-forward design
- Clean sans-serif fonts
- Fresh colors
- Smooth animations
- Menu prominence
- Emphasis on ordering and delivery

### Event/Experience Theme
- Dramatic, immersive design
- Statement fonts
- Rich color palette
- Cinematic animations
- Gallery emphasis
- Emphasis on atmosphere and storytelling

## Testing Checklist

Before submitting a new template:

- [ ] All pages render without errors
- [ ] Responsive on mobile (375px)
- [ ] Responsive on tablet (768px)
- [ ] Responsive on desktop (1024px+)
- [ ] Empty states display correctly
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Add to cart works with tick-mark confirmation
- [ ] Cart drawer opens and functions
- [ ] Loyalty banner displays (if enabled)
- [ ] Checkout page loads
- [ ] All images load properly
- [ ] All links work
- [ ] Accessibility check (screen reader, keyboard navigation)
- [ ] Performance check (Lighthouse score)

## Additional Resources

- See `TEMPLATE_ADDITION_GUIDE.md` for detailed integration guide
- See `BACKEND_TEMPLATE_INTEGRATION.md` for API data structure
- See `FRONTEND_TEMPLATE_REQUIREMENTS.md` for detailed requirements
- Check existing `theme-d1` templates for reference implementations

---

**Remember:** Templates should only differ in styling and layout. All functionality must remain consistent across themes. Use the same hooks, contexts, and data structure. The goal is to provide variety in visual design while maintaining a unified, functional system.
