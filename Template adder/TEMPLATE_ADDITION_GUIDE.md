# Complete Guide: Adding a New Template to DineDesk

This guide explains everything you need to know to add a new template, connect it with the CMS, and integrate components like Utility Belt, Banners, and more.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Data Flow](#data-flow)
3. [CMS Data Structure](#cms-data-structure)
4. [Adding a New Template](#adding-a-new-template)
5. [Utility Belt Integration](#utility-belt-integration)
6. [Banner Integration](#banner-integration)
7. [Header Integration](#header-integration)
8. [Footer Integration](#footer-integration)
9. [Theme & Color System](#theme--color-system)
10. [Shortcodes](#shortcodes)
11. [Available Components](#available-components)
12. [Common Patterns](#common-patterns)

---

## Architecture Overview

### File Structure
```
packages/site-template/
├── templates/
│   └── theme-d1/              # All theme-d1 templates
│       ├── HomePage.jsx      # Homepage template
│       ├── MenuTemplate.jsx  # Menu page template
│       ├── LocationsTemplate.jsx
│       ├── SpecialsTemplate.jsx
│       ├── TeamTemplate.jsx
│       └── CustomTemplate.jsx
├── components/
│   ├── theme-d1/              # Theme-specific components
│   │   ├── Header.jsx        # Navigation header
│   │   ├── Footer.jsx        # Footer component
│   │   ├── UtilityBelt.jsx   # Top utility bar
│   │   ├── Layout.jsx        # Base layout wrapper
│   │   ├── CartDrawer.jsx    # Shopping cart drawer
│   │   ├── FloatingReviewWidget.jsx
│   │   └── sections/         # Reusable sections
│   │       ├── HeroSection.jsx
│   │       ├── AboutSection.jsx
│   │       ├── FeaturedItemsSection.jsx
│   │       ├── ReviewsSection.jsx
│   │       ├── PromoTilesSection.jsx
│   │       └── SpecialsSection.jsx
│   ├── BannerStrip.jsx        # Legacy banner component
│   ├── UtilityBelt.jsx        # Legacy utility belt
│   └── ...other shared components
├── contexts/
│   └── CMSContext.jsx         # CMS data provider
├── lib/
│   ├── api.js                 # API client (getSiteData)
│   ├── theme.js               # CSS variable builder
│   └── shortcodes.js          # Shortcode replacement
└── pages/
    ├── index.js               # Homepage - template mapping
    ├── _app.js                # App wrapper (providers, analytics)
    └── [slug].js              # Dynamic pages
```

### Key Concepts

**Templates**: Page layouts that define structure and content arrangement
**Components**: Reusable UI elements (Header, Footer, sections)
**CMS Context**: Provides all CMS data to components via `useCMS()` hook
**Theme System**: CSS variables for colors, fonts, spacing
**Shortcodes**: Dynamic text replacement (e.g., `{{restaurantName}}`)

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  CMS Database (Prisma)                                      │
│  - client, locations, menuItems, banners, etc.             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  API Export Endpoint                                         │
│  GET /api/clients/:id/export                                │
│  - Returns all client data as JSON                          │
│  - Cached for 60 seconds                                    │
│  Location: packages/api/src/routes/clients.js                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Site Template - lib/api.js                                  │
│  getSiteData(clientId)                                      │
│  - Fetches from CMS_API_URL/clients/:id/export              │
│  - Returns data or EMPTY_STATE_DATA if fetch fails          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Page getServerSideProps                                     │
│  pages/index.js                                              │
│  - Calls getSiteData(siteId)                                 │
│  - Determines template from colours.theme or SITE_TEMPLATE  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  CMSProvider (contexts/CMSContext.jsx)                      │
│  - Adapts raw API data to component-friendly format          │
│  - Sets CSS variables for colors                            │
│  - Provides data via useCMS() hook                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Template Component                                          │
│  - Uses useCMS() to access data                              │
│  - Renders components (Header, Footer, sections)            │
│  - Applies theme colors via CSS variables                   │
└─────────────────────────────────────────────────────────────┘
```

---

## CMS Data Structure

The API export returns the following data structure:

```javascript
{
  // Basic client info
  client: {
    id, name, domain, status,
    locations: [{ id, name, address, phone, hours, ... }]
  },
  
  // Content
  menuCategories: [],
  menuItems: [],
  specials: [],
  pages: [],
  banners: [],
  promoTiles: [],
  teamDepartments: [],
  customTextBlocks: [],
  
  // Configuration
  settings: { displayName, restaurantName, address, phone, ... },
  shortcodes: { restaurantName, address, phone, ... },
  colours: { primary, secondary, accentBg, headerBg, ... },
  analytics: { gtmId, ga4MeasurementId, fbPixelId, ... },
  
  // Layout
  navigationItems: [],  // Hierarchical nav tree
  footerSections: [],
  headerCtas: [],
  
  // Homepage-specific
  homepageLayout: { components: [] },
  promoConfig: { heading, subheading, isActive },
  featuredConfig: { heading, subheading, isActive },
  welcomeContent: { heading, text, imageUrl, ctaText, ctaUrl, ... },
  specialsConfig: { heading, subheading, showOnHomepage, maxItems },
  
  // Feature toggles
  header: { type, utilityBelt, utilityItems, headerTheme },
  footer: { theme, tagline },
  booking: { bookingUrl, bookLabel, showInHeader, ... },
  social: { facebook, instagram, twitter, showInUtility, ... },
  ordering: { enabled, acceptingOrders, ... },
  
  // Reviews
  reviews: {
    overallScore, totalReviews, googleReviews,
    enableHeader, enableFooter, enableFloating, ...
  },
  
  // Payment
  paymentGateway: { provider, isActive, testMode, ... },
  
  // Site type
  siteType: 'restaurant' | 'cafe' | 'food-truck' | ...
}
```

---

## Adding a New Template

### Step 1: Create the Template File

Create a new file in `packages/site-template/templates/theme-d1/`:

```jsx
// packages/site-template/templates/theme-d1/MyNewTemplate.jsx
import React from 'react';
import { CMSProvider, useCMS } from '../../contexts/CMSContext';
import { Header } from '../../components/theme-d1/Header';
import { Footer } from '../../components/theme-d1/Footer';
import { replaceShortcodes } from '../../lib/shortcodes';

function MyNewTemplateContent() {
  const { 
    banners, 
    menuItems, 
    specials, 
    shortcodes,
    restaurant,
    locations
  } = useCMS();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Your template content here */}
        <section className="py-20">
          <h1>{replaceShortcodes(restaurant.name, shortcodes)}</h1>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function MyNewTemplate({ data, siteType }) {
  return (
    <CMSProvider data={data}>
      <MyNewTemplateContent />
    </CMSProvider>
  );
}
```

### Step 2: Register the Template

Add your template to the `TEMPLATES` mapping in `packages/site-template/pages/index.js`:

```javascript
const TEMPLATES = {
  'theme-v1': ThemeD1Home,
  'theme-d1': ThemeD1Home,
  'food-truck': ThemeD1Home,
  'cafe': ThemeD1Home,
  'casual-family': ThemeD1Home,
  'modern-trendy': ThemeD1Home,
  'delivery': ThemeD1Home,
  'urban-bistro': ThemeD1Home,
  'noir-fine-dine': ThemeD1Home,
  'garden-fresh': ThemeD1Home,
  // ADD YOUR NEW TEMPLATE HERE
  'my-new-template': MyNewTemplate,  // ← New template
};
```

### Step 3: Configure Template Selection

Templates are selected in one of two ways:

**Option A: Via CMS Colours Setting**
- In CMS, set `colours.theme = 'my-new-template'`
- This is the preferred method for per-client customization

**Option B: Via Environment Variable**
- Set `SITE_TEMPLATE=my-new-template` in `.env.local`
- This is the default fallback when not set in CMS

The selection logic is in `pages/index.js`:
```javascript
const template = data.colours?.theme
  || process.env.SITE_TEMPLATE
  || 'theme-v1';
```

### Step 4: Test the Template

1. Set the template in CMS or environment
2. Visit the site with `?site=CLIENT_ID` for preview
3. Verify data is loading correctly
4. Check all components render properly

---

## Utility Belt Integration

### What is Utility Belt?

The Utility Belt is the top bar that appears above the header, showing:
- Contact info (address, phone)
- Social media links
- Review score
- Header CTAs (custom buttons)
- Order/Reservation buttons

### How to Enable/Disable

**In CMS:**
```json
{
  "header": {
    "utilityBelt": true,
    "utilityItems": {
      "contact-info": true,
      "social-links": true,
      "reviews": true,
      "header-ctas": true
    }
  }
}
```

**In your template:**
The Utility Belt is automatically included in the Header component. If you want to use it standalone:

```jsx
import { UtilityBelt } from '../../components/theme-d1/UtilityBelt';

// In your template
<UtilityBelt />
```

### Utility Belt Data Sources

The Utility Belt gets data from:
- `header.utilityBelt` - Enable/disable entire belt
- `header.utilityItems` - Enable/disable individual items
- `settings.address`, `settings.phone` - Contact info
- `social.facebook`, `social.instagram`, etc. - Social links
- `reviews.overallScore`, `reviews.totalReviews` - Review score
- `headerCtas` - Custom header buttons
- `booking.bookingUrl`, `booking.orderUrl` - Booking/order links

### Customizing Utility Belt Order

You can customize the order of utility belt items:

```json
{
  "header": {
    "utilityItems": {
      "order": ["contact-info", "social-links", "reviews", "header-ctas"]
    }
  }
}
```

### Utility Belt Component Location

- **Theme-specific**: `components/theme-d1/UtilityBelt.jsx`
- **Legacy**: `components/UtilityBelt.jsx` (use theme-specific version)

---

## Banner Integration

### Banner Types

There are two banner systems:

**1. Banner Carousel (Homepage)**
- Full-width hero banners with images
- Auto-rotating carousel
- CTA buttons
- Used on homepage

**2. Banner Strip (Legacy)**
- Horizontal strip with text items
- Static (no carousel)
- Used on specific pages

### Banner Carousel Integration

**Data Source:** CMS `banners` array

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
  location: 'home' | 'both',  // Where banner appears
  sortOrder
}
```

**Usage in Template:**

```jsx
function BannerCarousel({ banners, shortcodes }) {
  const homeBanners = (banners || [])
    .filter(b => b.isActive && b.location === 'home')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (homeBanners.length === 0) return null;

  // Render carousel...
}
```

**Example from HomePage.jsx:**
```jsx
const { banners, shortcodes } = useCMS();
const activeBanners = (banners || [])
  .filter(b => b.isActive && (b.location === 'home' || b.location === 'both'))
  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

<BannerCarousel banners={activeBanners} shortcodes={shortcodes} />
```

### Banner Strip Integration

**Data Source:** CMS `banners` array (same as carousel)

**Usage:**

```jsx
import BannerStrip from '../../components/BannerStrip';

<BannerStrip 
  banners={banners} 
  booking={booking} 
  data={data} 
/>
```

### Managing Banners in CMS

Banners are managed in the CMS Banners section. Each banner has:
- **Title/Subtitle**: Text displayed on banner
- **Image**: Background image URL
- **CTA Button**: Button text and URL
- **Location**: 'home' or 'both'
- **Sort Order**: Display order
- **Active**: Enable/disable

---

## Header Integration

### Header Types

The Header component supports multiple layouts:

**1. Standard Full (default)**
- Logo on left, navigation center/right, CTAs on right
- Utility belt above

**2. Split**
- Navigation split around centered logo
- Utility belt above

**3. Minimal**
- Logo only, navigation in sidebar/drawer
- Utility belt above

**4. Sticky**
- Transparent header that becomes solid on scroll
- Utility belt above

### Configuring Header Type

**In CMS:**
```json
{
  "header": {
    "type": "standard-full" | "split" | "minimal" | "sticky",
    "headerTheme": "light" | "dark" | "not-set"
  }
}
```

### Header Data Sources

- `header.type` - Header layout type
- `header.headerTheme` - Light/dark theme
- `header.utilityBelt` - Show/hide utility belt
- `navigationItems` - Navigation menu items
- `restaurant.branding.logoLight` - Light theme logo
- `restaurant.branding.logoDark` - Dark theme logo
- `booking.bookingUrl`, `booking.bookLabel` - Reservation button
- `booking.orderUrl`, `booking.orderLabel` - Order button

### Using Header in Template

```jsx
import { Header } from '../../components/theme-d1/Header';

// Header automatically includes UtilityBelt if enabled
<Header />
```

### Navigation Structure

Navigation items are hierarchical:

```javascript
{
  id,
  label,
  url,
  pageId,
  page: { slug, pageType },
  parentId,  // null for top-level, ID for child
  sortOrder,
  isActive
}
```

**Example:**
```
Menu (parent)
  ├── Lunch (child)
  ├── Dinner (child)
  └── Drinks (child)
About (parent)
  ├── Our Story (child)
  └── Team (child)
```

### Header Component Location

`components/theme-d1/Header.jsx`

---

## Footer Integration

### Footer Data Sources

```javascript
{
  footer: {
    theme: 'dark' | 'light',
    tagline: 'Our tagline'
  },
  footerSections: [
    {
      id,
      title,
      links: [
        { label, url, pageId, page }
      ],
      isActive,
      sortOrder
    }
  ],
  social: {
    facebook, instagram, twitter, tiktok,
    showInFooter
  }
}
```

### Using Footer in Template

```jsx
import { Footer } from '../../components/theme-d1/Footer';

<Footer />
```

### Customizing Footer

**In CMS:**
- Add footer sections with links
- Configure social media links
- Set theme (light/dark)

### Footer Component Location

`components/theme-d1/Footer.jsx`

---

## Theme & Color System

### Color Variables

The theme system uses CSS variables for all colors. These are set in two places:

**1. Via buildThemeCSS() (lib/theme.js)**
```javascript
export function buildThemeCSS(colours, settings) {
  return `
:root {
  --color-primary: ${colours.primary || '#C8823A'};
  --color-secondary: ${colours.secondary || '#1C2B1A'};
  --color-accent: ${colours.accentBg || '#F7F2EA'};
  --color-header-bg: ${colours.headerBg || '#ffffff'};
  --color-header-text: ${colours.headerText || '#1A1A1A'};
  --color-nav-bg: ${colours.navBg || '#1C2B1A'};
  --color-nav-text: ${colours.navText || '#ffffff'};
  --color-body-bg: ${colours.bodyBg || '#ffffff'};
  --color-body-text: ${colours.bodyText || '#1A1A1A'};
  --color-cta-bg: ${colours.ctaBg || '#C8823A'};
  --color-cta-text: ${colours.ctaText || '#ffffff'};
  --color-utility-belt-bg: ${colours.utilityBeltBg || colours.primary};
  --color-utility-belt-text: ${colours.utilityBeltText || '#ffffff'};
  --font-heading: ${settings.fontFamily || 'Cormorant Garamond, serif'};
  --font-body: ${settings.bodyFont || 'Inter, sans-serif'};
}`;
}
```

**2. Via CMSContext useEffect()**
```javascript
useEffect(() => {
  if (cmsData.rawData?.colours) {
    const colours = cmsData.rawData.colours;
    document.documentElement.style.setProperty('--color-primary', colours.primary);
    document.documentElement.style.setProperty('--color-secondary', colours.secondary);
    // ... etc
  }
}, [cmsData.rawData?.colours]);
```

### Using Theme Colors in Components

```jsx
// Use CSS variables in your components
<div style={{ color: 'var(--color-primary)' }}>
  Primary color text
</div>

<div className="bg-[var(--color-secondary)] text-white">
  Secondary background
</div>
```

### Configuring Colors in CMS

**Colours Object:**
```json
{
  "colours": {
    "primary": "#C8823A",
    "secondary": "#1C2B1A",
    "accentBg": "#F7F2EA",
    "headerBg": "#ffffff",
    "headerText": "#1A1A1A",
    "navBg": "#1C2B1A",
    "navText": "#ffffff",
    "bodyBg": "#ffffff",
    "bodyText": "#1A1A1A",
    "ctaBg": "#C8823A",
    "ctaText": "#ffffff",
    "utilityBeltBg": "#C8823A",
    "utilityBeltText": "#ffffff"
  }
}
```

---

## Shortcodes

Shortcodes are dynamic text placeholders that get replaced with actual values at render time.

### Available Shortcodes

**Auto-generated (from client data):**
- `{{restaurantName}}` - Restaurant name
- `{{address}}` - Primary location address
- `{{suburb}}` - Suburb
- `{{state}}` - State
- `{{phone}}` - Phone number
- `{{primaryEmail}}` - Default email
- `{{group}}` - Group name (if applicable)
- `{{custom}}` - Custom value

**Custom overrides:**
Set in CMS `shortcodes._overrides`:
```json
{
  "shortcodes": {
    "_overrides": {
      "restaurantName": "My Custom Name",
      "custom": "Custom value"
    }
  }
}
```

### Using Shortcodes

```jsx
import { replaceShortcodes } from '../../lib/shortcodes';

const { shortcodes } = useCMS();

const text = replaceShortcodes('Welcome to {{restaurantName}}!', shortcodes);
// Result: "Welcome to Bella Vista!"
```

### Shortcode Processing Location

- **Function:** `lib/shortcodes.js`
- **Context:** CMSContext processes and provides via `useCMS()`

---

## Available Components

### Layout Components

**Header** (`components/theme-d1/Header.jsx`)
- Navigation menu
- Logo
- Booking/order CTAs
- Utility belt integration
- Multiple layout types

**Footer** (`components/theme-d1/Footer.jsx`)
- Footer sections with links
- Social media links
- Tagline
- Light/dark theme

**Layout** (`components/theme-d1/Layout.jsx`)
- Wrapper component
- Includes Header and Footer
- Use for simple page layouts

### Utility Components

**UtilityBelt** (`components/theme-d1/UtilityBelt.jsx`)
- Contact info
- Social links
- Review score
- Header CTAs
- Configurable items

**CartDrawer** (`components/theme-d1/CartDrawer.jsx`)
- Shopping cart drawer
- Add/remove items
- Checkout flow

**FloatingReviewWidget** (`components/theme-d1/FloatingReviewWidget.jsx`)
- Floating review button
- Links to Google reviews

### Section Components

**HeroSection** (`components/theme-d1/sections/HeroSection.jsx`)
- Full-width hero
- Background image
- CTA buttons

**AboutSection** (`components/theme-d1/sections/AboutSection.jsx`)
- About text
- Image
- CTA button

**FeaturedItemsSection** (`components/theme-d1/sections/FeaturedItems.jsx`)
- Featured menu items
- Grid layout
- Add to cart buttons

**ReviewsSection** (`components/theme-d1/sections/ReviewsSection.jsx`)
- Customer reviews
- Carousel or grid
- Star ratings

**PromoTilesSection** (`components/theme-d1/sections/PromoTilesSection.jsx`)
- Promotional tiles
- Grid layout
- Images and CTAs

**SpecialsSection** (`components/theme-d1/sections/SpecialsSection.jsx`)
- Special offers
- Pricing
- Validity dates

### UI Components

Shadcn/ui components in `components/theme-d1/ui/`:
- Button, Card, Dialog, Dropdown, Form, Input, etc.
- Reusable UI primitives

---

## Common Patterns

### Pattern 1: Using CMS Data in Template

```jsx
function MyTemplate() {
  const { 
    restaurant, 
    locations, 
    menuItems, 
    specials,
    banners,
    shortcodes 
  } = useCMS();

  return (
    <div>
      <h1>{replaceShortcodes(restaurant.name, shortcodes)}</h1>
      {locations.map(loc => (
        <div key={loc.id}>
          <h2>{loc.name}</h2>
          <p>{loc.address.street}</p>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 2: Conditional Rendering Based on CMS Config

```jsx
function MyTemplate() {
  const { siteConfig, booking } = useCMS();

  return (
    <div>
      {siteConfig.features.showSpecials && <SpecialsSection />}
      {booking.showInHeader && <BookingButton />}
    </div>
  );
}
```

### Pattern 3: Using Theme Colors

```jsx
function MyComponent() {
  return (
    <div className="bg-[var(--color-primary)] text-white">
      <h2 className="text-[var(--color-secondary)]">
        Styled with theme colors
      </h2>
    </div>
  );
}
```

### Pattern 4: Filtering Data

```jsx
function MyTemplate() {
  const { menuItems, specials } = useCMS();

  const featuredItems = menuItems
    .filter(item => item.isFeatured && item.isAvailable)
    .slice(0, 4);

  const activeSpecials = specials
    .filter(s => s.isActive && new Date(s.validUntil) >= new Date())
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      {featuredItems.map(item => <MenuItem key={item.id} item={item} />)}
      {activeSpecials.map(special => <Special key={special.id} special={special} />)}
    </div>
  );
}
```

### Pattern 5: Page-Specific Data

```jsx
function MenuPage() {
  const { contentPages, menuCategories, menuItems } = useCMS();

  const menuPage = contentPages.find(p => p.slug === 'menu');
  const pageTitle = replaceShortcodes(menuPage?.title || 'Our Menu', shortcodes);

  return (
    <div>
      <h1>{pageTitle}</h1>
      {menuCategories.map(cat => (
        <CategorySection key={cat.id} category={cat} items={menuItems} />
      ))}
    </div>
  );
}
```

---

## Quick Reference

### Key Files

| File | Purpose |
|------|---------|
| `templates/theme-d1/HomePage.jsx` | Homepage template |
| `components/theme-d1/Header.jsx` | Navigation header |
| `components/theme-d1/Footer.jsx` | Footer component |
| `components/theme-d1/UtilityBelt.jsx` | Top utility bar |
| `contexts/CMSContext.jsx` | CMS data provider |
| `lib/api.js` | API client |
| `lib/theme.js` | Theme CSS builder |
| `lib/shortcodes.js` | Shortcode replacement |
| `pages/index.js` | Template mapping |

### Key Hooks

| Hook | Purpose |
|------|---------|
| `useCMS()` | Access CMS data |
| `useCart()` | Access shopping cart |

### Key Data Accessors

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
  shortcodes,      // Shortcode values
  rawData          // Raw API data
} = useCMS();
```

---

## Example: Complete New Template

Here's a complete example of a new template:

```jsx
// packages/site-template/templates/theme-d1/ModernTemplate.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { CMSProvider, useCMS } from '../../contexts/CMSContext';
import { Header } from '../../components/theme-d1/Header';
import { Footer } from '../../components/theme-d1/Footer';
import { replaceShortcodes } from '../../lib/shortcodes';
import PromoTilesSection from '../../components/theme-d1/sections/PromoTilesSection';
import { ReviewsSection } from '../../components/theme-d1/sections/ReviewsSection';

function ModernTemplateContent() {
  const { 
    banners, 
    specials, 
    menuItems, 
    shortcodes,
    restaurant,
    promoTiles,
    promoConfig
  } = useCMS();

  // Filter active banners
  const activeBanners = (banners || [])
    .filter(b => b.isActive && b.location === 'home')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Filter featured items
  const featuredItems = (menuItems || [])
    .filter(item => item.isFeatured && item.isAvailable)
    .slice(0, 6);

  // Filter active specials
  const activeSpecials = (specials || [])
    .filter(s => s.isActive && new Date(s.validUntil) >= new Date())
    .slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Banner */}
        {activeBanners.length > 0 && (
          <section className="relative h-[80vh]">
            <img 
              src={activeBanners[0].imageUrl} 
              alt={activeBanners[0].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-6xl font-bold mb-4">
                  {replaceShortcodes(activeBanners[0].title, shortcodes)}
                </h1>
                <p className="text-2xl mb-8">
                  {replaceShortcodes(activeBanners[0].subtitle, shortcodes)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Featured Items */}
        {featuredItems.length > 0 && (
          <section className="py-20 px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-[var(--color-primary)]">
              Featured Items
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {featuredItems.map(item => (
                <motion.div 
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                >
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    <p className="text-2xl font-bold text-[var(--color-secondary)]">
                      ${item.price}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Promo Tiles */}
        <PromoTilesSection 
          promos={promoTiles} 
          shortcodes={shortcodes}
          title={promoConfig?.heading}
          subtitle={promoConfig?.subheading}
        />

        {/* Specials */}
        {activeSpecials.length > 0 && (
          <section className="py-20 bg-[var(--color-accent)]">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-4xl font-bold text-center mb-12 text-[var(--color-primary)]">
                Special Offers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {activeSpecials.map(special => (
                  <div key={special.id} className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-2xl font-bold mb-2">{special.title}</h3>
                    <p className="text-gray-600 mb-4">{special.description}</p>
                    <p className="text-3xl font-bold text-[var(--color-secondary)]">
                      ${special.price}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Reviews */}
        <ReviewsSection />
      </main>

      <Footer />
    </div>
  );
}

export default function ModernTemplate({ data, siteType }) {
  return (
    <CMSProvider data={data}>
      <ModernTemplateContent />
    </CMSProvider>
  );
}
```

Register in `pages/index.js`:
```javascript
const TEMPLATES = {
  // ... existing templates
  'modern': ModernTemplate,
};
```

Set in CMS or env:
```json
{
  "colours": {
    "theme": "modern"
  }
}
```

---

## Summary

To add a new template:

1. **Create template file** in `templates/theme-d1/`
2. **Wrap with CMSProvider** to access CMS data
3. **Use useCMS() hook** to get data
4. **Include Header and Footer** for consistent layout
5. **Use replaceShortcodes()** for dynamic text
6. **Use CSS variables** for theme colors
7. **Register template** in `pages/index.js`
8. **Configure in CMS** via `colours.theme` or env var

The template system is designed to be flexible and data-driven. All content comes from the CMS, and templates simply arrange and display that content using the provided components and utilities.
