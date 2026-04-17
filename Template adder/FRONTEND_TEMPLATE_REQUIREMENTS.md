# Frontend Template Requirements - DineDesk

This document outlines all features and requirements for creating beautiful, functional frontend templates for the DineDesk restaurant platform.

---

## Overview

DineDesk templates are React-based (Next.js) page layouts that display restaurant data from the CMS. Templates should be:
- **Responsive**: Mobile-first design
- **Accessible**: WCAG AA compliant
- **Performant**: Fast loading, optimized images
- **Customizable**: Theme-driven via CSS variables
- **Data-driven**: All content from CMS, no hardcoded data

---

## Required Features for Every Template

### 1. Core Layout Structure

Every template MUST include:
- **Header** (`components/theme-d1/Header.jsx`)
  - Navigation menu (hierarchical)
  - Logo (light/dark variants)
  - Booking CTA button
  - Order Online button (if enabled)
  - Shopping cart icon (if ordering enabled)
  - Mobile menu (sidebar/drawer)
  - Utility Belt (optional, configurable)

- **Footer** (`components/theme-d1/Footer.jsx`)
  - Footer sections with links
  - Social media links
  - Tagline
  - Copyright
  - Light/dark theme support

- **Main Content Area**
  - Template-specific sections
  - Proper spacing and layout

### 2. CMS Data Integration

Every template MUST:
- Use `CMSProvider` wrapper
- Access data via `useCMS()` hook
- Handle missing/empty data gracefully
- Use `replaceShortcodes()` for dynamic text

```jsx
import { CMSProvider, useCMS } from '../../contexts/CMSContext';
import { replaceShortcodes } from '../../lib/shortcodes';

function MyTemplateContent() {
  const { restaurant, locations, menuItems, shortcodes } = useCMS();
  
  return (
    <div>
      <h1>{replaceShortcodes(restaurant.name, shortcodes)}</h1>
    </div>
  );
}

export default function MyTemplate({ data, siteType }) {
  return (
    <CMSProvider data={data}>
      <MyTemplateContent />
    </CMSProvider>
  );
}
```

### 3. Theme System

Every template MUST:
- Use CSS variables for all colors
- Support light/dark header themes
- Use semantic color naming
- Fallback to defaults if colors not set

**Required CSS Variables:**
```css
--color-primary          /* Main brand color */
--color-secondary        /* Secondary brand color */
--color-accent          /* Accent background */
--color-header-bg       /* Header background */
--color-header-text     /* Header text color */
--color-nav-bg          /* Navigation/utility belt background */
--color-nav-text        /* Navigation/utility belt text */
--color-body-bg         /* Page background */
--color-body-text       /* Body text color */
--color-cta-bg          /* CTA button background */
--color-cta-text        /* CTA button text */
--color-utility-belt-bg /* Utility belt background */
--color-utility-belt-text /* Utility belt text */
--font-heading          /* Heading font family */
--font-body             /* Body font family */
```

**Usage:**
```jsx
<div className="bg-[var(--color-primary)] text-white">
  <h2 className="font-[var(--font-heading)]">
    Styled with theme colors
  </h2>
</div>
```

### 4. Responsive Design

Every template MUST:
- Use Tailwind CSS for styling
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly targets (min 44px)
- Readable text sizes (min 16px body)

**Example:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="p-4 sm:p-6 lg:p-8">
    <h1 className="text-2xl sm:text-3xl lg:text-4xl">
      Responsive heading
    </h1>
  </div>
</div>
```

### 5. Accessibility

Every template MUST:
- Semantic HTML (header, main, nav, footer, section)
- ARIA labels on interactive elements
- Alt text on all images
- Keyboard navigation support
- Focus indicators
- Color contrast ratio 4.5:1 minimum

**Example:**
```jsx
<button 
  aria-label="Close menu"
  className="focus:ring-2 focus:ring-blue-500"
>
  <X />
</button>

<img 
  src={imageUrl} 
  alt={altText || 'Description of image'} 
/>
```

### 6. Performance

Every template MUST:
- Lazy load images below fold
- Use Next.js Image component where possible
- Avoid blocking JavaScript
- Minimize re-renders
- Use React.memo for expensive components

---

## Template-Specific Features

### Homepage Template

**Required Sections:**
1. **Banner Carousel** (if banners exist)
   - Full-width hero
   - Auto-rotation (6s interval)
   - Navigation arrows
   - Progress dots
   - CTA buttons
   - Smooth animations (framer-motion)

2. **Welcome Section** (if configured)
   - Heading and text
   - Image (optional)
   - CTA button
   - Shortcode support

3. **Promo Tiles** (if configured and tiles exist)
   - Grid layout (2-3 columns)
   - Images and CTAs
   - Hover effects

4. **Featured Items** (if items exist)
   - Grid layout
   - Item images
   - Prices
   - Add to cart (if ordering enabled)

5. **Specials** (if configured and specials exist)
   - Grid layout
   - Pricing (original/discounted)
   - Validity dates
   - "View All" CTA

6. **Reviews Section**
   - Carousel or grid
   - Star ratings
   - Customer testimonials
   - Google review link

**Data Requirements:**
```javascript
const { 
  banners, 
  welcomeContent, 
  promoTiles, 
  promoConfig,
  featuredConfig,
  menuItems,
  specials,
  specialsConfig,
  reviews,
  shortcodes 
} = useCMS();
```

### Menu Page Template

**Required Features:**
1. **Hero Banner** (if page banner exists)
   - Page title
   - Subtitle/description
   - Background image

2. **Category Navigation**
   - Filter by category
   - Active state indicator
   - Mobile-friendly (dropdown or horizontal scroll)

3. **Search Functionality**
   - Real-time filtering
   - Search by name and description
   - Clear button

4. **Menu Items Display**
   - Group by category
   - Item image
   - Name and description
   - Price
   - Dietary tags (if any)
   - Add to cart (if ordering enabled)

5. **Empty States**
   - No results message
   - No items in category message

**Data Requirements:**
```javascript
const { 
  menuCategories, 
  menuItems, 
  contentPages,
  shortcodes,
  ordering 
} = useCMS();
```

### Locations Page Template

**Required Features:**
1. **Location Cards**
   - Location name
   - Address (full)
   - Phone number
   - Email
   - Hours of operation
   - Map integration
   - Services available
   - Primary location badge

2. **Map Integration**
   - Google Maps embed
   - Multiple location tabs (if >1)
   - "Get Directions" CTA

3. **Contact Form** (optional)
   - Name, email, message
   - Location selection
   - Form validation

**Data Requirements:**
```javascript
const { 
  locations, 
  restaurant,
  contentPages,
  shortcodes 
} = useCMS();
```

### Specials Page Template

**Required Features:**
1. **Hero Section**
   - Page title
   - Description

2. **Specials Grid**
   - Special image
   - Title and description
   - Original price (crossed out)
   - Discounted price
   - Validity date
   - Featured badge (if applicable)

3. **Filtering** (optional)
   - By category
   - By price range

4. **Empty State**
   - No active specials message

**Data Requirements:**
```javascript
const { 
  specials, 
  contentPages,
  shortcodes 
} = useCMS();
```

### Team Page Template

**Required Features:**
1. **Hero Section**
   - Page title
   - Description

2. **Department Tabs** (if departments exist)
   - Filter by department
   - Active state

3. **Team Member Cards**
   - Photo
   - Name
   - Role/position
   - Bio
   - Social links (if any)

4. **Empty State**
   - No team members message

**Data Requirements:**
```javascript
const { 
  teamDepartments, 
  contentPages,
  shortcodes 
} = useCMS();
```

### Custom Page Template

**Required Features:**
1. **Flexible Content**
   - Custom text blocks
   - Images
   - CTAs
   - Embedded content

2. **Banner** (if configured)
   - Page banner image
   - Title overlay

3. **Navigation** (if multiple custom pages)
   - Breadcrumb or sidebar nav

**Data Requirements:**
```javascript
const { 
  customTextBlocks, 
  contentPages,
  banners,
  shortcodes 
} = useCMS();
```

---

## Component Integration

### Utility Belt

**Purpose:** Top bar with quick links and info

**Features:**
- Contact info (address, phone)
- Social media links
- Review score
- Header CTAs (custom buttons)
- Order/Reservation buttons

**Configuration:**
```javascript
const { 
  rawSettings, 
  rawBooking, 
  rawHeader, 
  siteConfig,
  social 
} = useCMS();
```

**Usage:**
```jsx
import { UtilityBelt } from '../../components/theme-d1/UtilityBelt';

<UtilityBelt />
```

**CMS Controls:**
- `header.utilityBelt` - Enable/disable
- `header.utilityItems` - Control individual items
- `header.utilityItems.order` - Item order

### Banner Carousel

**Purpose:** Full-width hero banners with auto-rotation

**Features:**
- Multiple banners
- Auto-rotation (6s)
- Navigation arrows
- Progress dots
- CTA buttons
- Smooth transitions

**Usage:**
```jsx
function BannerCarousel({ banners, shortcodes }) {
  const homeBanners = (banners || [])
    .filter(b => b.isActive && b.location === 'home')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (homeBanners.length === 0) return null;

  // Render carousel...
}
```

**Banner Data Structure:**
```javascript
{
  id,
  title,
  subtitle,
  text,
  imageUrl,
  buttonText,
  buttonUrl,
  isExternal,
  isActive,
  location: 'home' | 'both',
  sortOrder
}
```

### Header

**Purpose:** Navigation and branding

**Features:**
- Logo (light/dark variants)
- Hierarchical navigation
- Booking CTA
- Order Online button
- Shopping cart
- Mobile menu
- Multiple layout types

**Layout Types:**
- `standard-full` - Logo left, nav center/right
- `split` - Nav split around centered logo
- `minimal` - Logo only, nav in drawer
- `sticky` - Transparent to solid on scroll

**Usage:**
```jsx
import { Header } from '../../components/theme-d1/Header';

<Header />
```

**CMS Controls:**
- `header.type` - Layout type
- `header.headerTheme` - Light/dark theme
- `header.utilityBelt` - Show/hide utility belt
- `booking.showInHeader` - Show booking button
- `booking.showOrderBtn` - Show order button

### Footer

**Purpose:** Site footer with links and info

**Features:**
- Footer sections with links
- Social media links
- Tagline
- Copyright
- Light/dark theme

**Usage:**
```jsx
import { Footer } from '../../components/theme-d1/Footer';

<Footer />
```

**CMS Controls:**
- `footer.theme` - Light/dark
- `footer.tagline` - Footer tagline
- `social.showInFooter` - Show social links
- `footerSections` - Footer columns

### Section Components

**Available Sections:**
- `HeroSection` - Full-width hero
- `AboutSection` - About text with image
- `FeaturedItemsSection` - Featured menu items
- `ReviewsSection` - Customer reviews
- `PromoTilesSection` - Promotional tiles
- `SpecialsSection` - Special offers

**Usage:**
```jsx
import { HeroSection } from '../../components/theme-d1/sections/HeroSection';
import { ReviewsSection } from '../../components/theme-d1/sections/ReviewsSection';

<HeroSection />
<ReviewsSection />
```

---

## Shortcodes

**Purpose:** Dynamic text replacement

**Available Shortcodes:**
- `{{restaurantName}}` - Restaurant name
- `{{address}}` - Primary location address
- `{{suburb}}` - Suburb
- `{{state}}` - State
- `{{phone}}` - Phone number
- `{{primaryEmail}}` - Default email
- `{{group}}` - Group name
- `{{custom}}` - Custom value

**Usage:**
```jsx
import { replaceShortcodes } from '../../lib/shortcodes';

const { shortcodes } = useCMS();

const text = replaceShortcodes('Welcome to {{restaurantName}}!', shortcodes);
// Result: "Welcome to Bella Vista!"
```

**When to Use:**
- All user-facing text
- Page titles and headings
- CTA button text
- Descriptions
- Any text that might vary per client

---

## Animations

**Library:** framer-motion

**Best Practices:**
- Subtle, purposeful animations
- Respect `prefers-reduced-motion`
- Smooth transitions (300-600ms)
- No jarring movements

**Example:**
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
  Content
</motion.div>
```

---

## Ordering System Integration

**If Ordering Enabled:**

**Required Features:**
- Add to cart buttons on menu items
- Cart drawer component
- Cart icon in header with item count
- Remove from cart functionality
- Quantity adjustment
- Checkout flow
- Tick-mark confirmation when adding items (green checkmark for 2 seconds)
- Loyalty program integration (if enabled)

**Data Requirements:**
```javascript
const { ordering, loyaltyConfig } = useCMS();
const { addItem, removeItem, updateQuantity, totalItems, isEnabled } = useCart();

if (isEnabled) {
  // Show ordering UI
}
```

**Usage with Tick-Mark Confirmation:**
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
    <div>
      <h3>{item.name}</h3>
      <p>${item.price}</p>
      {isEnabled && (
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
      )}
    </div>
  );
}
```

**Loyalty Integration:**
```jsx
import { LoyaltyProvider, useLoyalty } from '../../contexts/LoyaltyContext';

// Wrap your checkout page
<LoyaltyProvider clientId={clientId} loyaltyConfig={loyaltyConfig}>
  <CheckoutPage />
</LoyaltyProvider>

// Use loyalty in components
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

**Checkout Page Requirements:**
- Customer information form (name, email, phone, special instructions)
- Pickup/delivery selection (order type, pickup time, location)
- Payment method selection (Stripe or cash)
- Loyalty customer lookup (phone-based)
- Loyalty reward redemption (if enabled)
- Stripe payment integration (if Stripe is payment provider)
- Order creation with loyalty data (customerId, pointsUsed, rewardUsed)

---

## Analytics Integration

**Required:**
- Google Tag Manager (if configured)
- GA4 (if configured, no GTM)
- Facebook Pixel (if configured)
- Google Site Verification (if configured)

**Automatic in `_app.js`:**
- No template-level code needed
- Handled by app wrapper

---

## SEO Requirements

**Required Meta Tags:**
- Title (restaurant name)
- Favicon
- Robots (index/noindex based on settings)
- Canonical URL
- Open Graph tags (if needed)
- Twitter Card tags (if needed)

**Automatic in `_app.js`:**
- Most handled by app wrapper
- Templates can add page-specific meta via Next.js Head

---

## Error Handling

**Required:**
- Graceful degradation if data missing
- Empty states for no content
- Loading states (if async)
- Error boundaries for crashes

**Example:**
```jsx
function MyComponent({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500">No items available</div>;
  }

  return (
    <div>
      {data.map(item => <Item key={item.id} item={item} />)}
    </div>
  );
}
```

---

## Testing Requirements

**Required Tests:**
- Responsive design (mobile, tablet, desktop)
- Empty states (no data)
- Theme color application
- Shortcode replacement
- Navigation functionality
- Mobile menu
- Cart functionality (if ordering)
- Form validation (if forms)

---

## Performance Targets

**Required:**
- Lighthouse score: 90+ Performance
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3.5s
- Cumulative Layout Shift: <0.1

---

## Browser Support

**Required:**
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (last 2 versions)

---

## File Structure

**Template File Location:**
```
packages/site-template/templates/theme-d1/
├── HomePage.jsx
├── MenuTemplate.jsx
├── LocationsTemplate.jsx
├── SpecialsTemplate.jsx
├── TeamTemplate.jsx
├── CustomTemplate.jsx
└── YourNewTemplate.jsx  ← Add here
```

**Registration:**
Add to `pages/index.js`:
```javascript
const TEMPLATES = {
  'your-template': YourNewTemplate,
};
```

---

## Checklist for New Template

- [ ] Wrapped with CMSProvider
- [ ] Uses useCMS() hook
- [ ] Includes Header component
- [ ] Includes Footer component
- [ ] Uses CSS variables for colors
- [ ] Responsive design (mobile-first)
- [ ] Accessible (semantic HTML, ARIA labels)
- [ ] Shortcode support for text
- [ ] Empty states for no data
- [ ] Loading states if async
- [ ] Error handling
- [ ] Registered in pages/index.js
- [ ] Tested on mobile/tablet/desktop
- [ ] Performance optimized
- [ ] Lighthouse score 90+

---

## Example: Minimal Template

```jsx
import React from 'react';
import { CMSProvider, useCMS } from '../../contexts/CMSContext';
import { Header } from '../../components/theme-d1/Header';
import { Footer } from '../../components/theme-d1/Footer';
import { replaceShortcodes } from '../../lib/shortcodes';

function MinimalTemplateContent() {
  const { restaurant, shortcodes, locations } = useCMS();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 text-[var(--color-primary)]">
            {replaceShortcodes(restaurant.name, shortcodes)}
          </h1>
          
          {locations.map(loc => (
            <div key={loc.id} className="mt-8">
              <h2 className="text-2xl font-semibold">{loc.name}</h2>
              <p className="text-gray-600">{loc.address.street}</p>
              <p className="text-gray-600">{loc.phone}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function MinimalTemplate({ data, siteType }) {
  return (
    <CMSProvider data={data}>
      <MinimalTemplateContent />
    </CMSProvider>
  );
}
```

---

## Resources

**Documentation:**
- `TEMPLATE_ADDITION_GUIDE.md` - Complete template system guide
- `FRONTEND_API_INTEGRATION_GUIDE.md` - API integration details

**Key Files:**
- `contexts/CMSContext.jsx` - CMS data provider
- `lib/api.js` - API client
- `lib/theme.js` - Theme CSS builder
- `lib/shortcodes.js` - Shortcode replacement
- `components/theme-d1/` - Theme-specific components

**Support:**
- Contact backend team for CMS data structure changes
- Contact design team for UI/UX specifications
