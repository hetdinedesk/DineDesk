# Backend Template Integration Guide - DineDesk

This document explains how the backend CMS connects to frontend templates and what data structures must be provided for templates to function correctly.

---

## Overview

The backend CMS provides all data that frontend templates consume. Templates are data-driven - they display whatever content the CMS provides. This guide explains:

1. **API Export Structure** - What data the export endpoint returns
2. **Database Schema** - How data is stored in Prisma
3. **Template Configuration** - How templates are selected and configured
4. **Feature Integration** - How each CMS feature connects to templates
5. **Cache Management** - How data is cached for performance
6. **Common Issues** - Troubleshooting template data issues

---

## API Export Endpoint

### Endpoint

```
GET /api/clients/:id/export
```

### Purpose

Returns all client data needed by frontend templates in a single JSON response. This is the primary data source for all templates.

### Cache

- **TTL**: 60 seconds
- **Cache Key**: Client ID
- **Invalidation**: Cleared on any client data update

### Location

`packages/api/src/routes/clients.js` (line 95)

---

## Complete Export Data Structure

```javascript
{
  // ═══════════════════════════════════════════════════════════════
  // CLIENT & LOCATIONS
  // ═══════════════════════════════════════════════════════════════
  client: {
    id: string,
    name: string,
    domain: string,
    status: string,
    group?: {
      id: string,
      name: string
    }
  },
  
  locations: [{
    id: string,
    name: string,
    isPrimary: boolean,
    isActive: boolean,
    showInFooter: boolean,
    address: string | {
      street: string,
      suburb: string,
      city: string,
      state: string,
      zipCode: string,
      postcode: string,
      country: string
    },
    suburb: string,
    city: string,
    state: string,
    postcode: string,
    phone: string,
    email: string,
    formEmail: string,
    hours: {
      Mon: { open: string, close: string, closed: boolean },
      Tue: { open: string, close: string, closed: boolean },
      // ... all 7 days (abbreviated: Mon, Tue, Wed, Thu, Fri, Sat, Sun)
    },
    lat: number,
    lng: number,
    exteriorImages: string[],
    exteriorImage: string,
    galleryImages: string[],
    deliveryOptions: object,
    servicesAvailable: string[],
    alternateStyling: boolean
  }],
  
  // ═══════════════════════════════════════════════════════════════
  // MENU DATA
  // ═══════════════════════════════════════════════════════════════
  menuCategories: [{
    id: string,
    name: string,
    description?: string,
    isActive: boolean,
    sortOrder: number
  }],
  
  menuItems: [{
    id: string,
    categoryId: string,
    name: string,
    description: string,
    price: number,
    imageUrl: string,
    image: string,
    isAvailable: boolean,
    isFeatured: boolean,
    dietaryTags: string[],
    sortOrder: number
  }],
  
  // ═══════════════════════════════════════════════════════════════
  // SPECIALS
  // ═══════════════════════════════════════════════════════════════
  specials: [{
    id: string,
    title: string,
    description: string,
    price: number,
    originalPrice?: number,
    discountedPrice?: number,
    imageUrl: string,
    bannerImage: string,
    image: string,
    isActive: boolean,
    isHighlighted: boolean,
    isFeatured: boolean,
    startDate: string (ISO date),
    endDate: string (ISO date),
    validFrom: string (ISO date),
    validUntil: string (ISO date),
    sortOrder: number
  }],
  
  // ═══════════════════════════════════════════════════════════════
  // PAGES & BANNERS
  // ═══════════════════════════════════════════════════════════════
  pages: [{
    id: string,
    slug: string,
    title: string,
    subtitle: string,
    metaDesc: string,
    pageType: 'home' | 'menu' | 'locations' | 'specials' | 'team' | 'custom',
    bannerId?: string,
    content?: string,
    isActive: boolean,
    sortOrder: number
  }],
  
  banners: [{
    id: string,
    title: string,
    subtitle: string,
    text: string,
    imageUrl: string,
    buttonText: string,
    buttonUrl: string,
    isExternal: boolean,
    isActive: boolean,
    location: 'home' | 'both',
    sortOrder: number
  }],
  
  // ═══════════════════════════════════════════════════════════════
  // PROMOTIONS
  // ═══════════════════════════════════════════════════════════════
  promoTiles: [{
    id: string,
    title: string,
    description: string,
    imageUrl: string,
    linkUrl: string,
    isExternal: boolean,
    isActive: boolean,
    sortOrder: number
  }],
  
  promoConfig: {
    heading: string,
    subheading: string,
    isActive: boolean
  },
  
  featuredConfig: {
    heading: string,
    subheading: string,
    isActive: boolean
  },
  
  // ═══════════════════════════════════════════════════════════════
  // HOMEPAGE CONTENT
  // ═══════════════════════════════════════════════════════════════
  welcomeContent: {
    subtitle: string,
    heading: string,
    text: string,
    imageUrl: string,
    ctaText: string,
    ctaUrl: string,
    isExternal: boolean,
    isActive: boolean
  },
  
  specialsConfig: {
    heading: string,
    subheading: string,
    showOnHomepage: boolean,
    maxItems: number,
    isActive: boolean
  },
  
  homepageLayout: {
    components: [{
      id: string,
      type: 'welcome' | 'promos' | 'specials' | 'featured' | 'reviews' | 'custom',
      visible: boolean,
      order: number
    }]
  },
  
  customTextBlocks: [{
    id: string,
    title: string,
    content: string,
    isActive: boolean,
    sortOrder: number
  }],
  
  homeSections: [{
    id: string,
    type: string,
    title: string,
    content: object | string,
    sortOrder: number,
    isActive: boolean
  }],
  
  // ═══════════════════════════════════════════════════════════════
  // TEAM
  // ═══════════════════════════════════════════════════════════════
  teamDepartments: [{
    id: string,
    name: string,
    description?: string,
    isActive: boolean,
    sortOrder: number
  }],
  
  // ═══════════════════════════════════════════════════════════════
  // NAVIGATION & FOOTER
  // ═══════════════════════════════════════════════════════════════
  navigationItems: [{
    id: string,
    label: string,
    url: string,
    pageId: string,
    page: {
      id: string,
      slug: string,
      pageType: string
    },
    parentId: string | null,
    sortOrder: number,
    isActive: boolean,
    children: [...]  // Hierarchical structure
  }],
  
  footerSections: [{
    id: string,
    title: string,
    links: [{
      id: string,
      label: string,
      url: string,
      externalUrl: string,
      pageId: string,
      page: { id, slug, pageType },
      sortOrder: number,
      isActive: boolean
    }],
    isActive: boolean,
    sortOrder: number
  }],
  
  unassignedFooterLinks: [{
    id: string,
    label: string,
    url: string,
    externalUrl: string,
    pageId: string,
    page: { id, slug, pageType },
    sortOrder: number,
    isActive: boolean
  }],
  
  // ═══════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════
  settings: {
    displayName: string,
    restaurantName: string,
    address: string,
    suburb: string,
    state: string,
    postcode: string,
    phone: string,
    defaultEmail: string,
    favicon: string,
    logoLight: string,
    logoDark: string,
    fontFamily: string,
    bodyFont: string,
    indexing: 'allowed' | 'disallowed',
    siteType: 'restaurant' | 'cafe' | 'food-truck' | 'delivery' | 'casual-family' | 'modern-trendy'
  },
  
  shortcodes: {
    restaurantName: string,
    address: string,
    suburb: string,
    state: string,
    phone: string,
    primaryEmail: string,
    group: string,
    custom: string,
    _overrides: {
      [key: string]: string
    }
  },
  
  colours: {
    theme: string,  // Template selector
    primary: string,
    secondary: string,
    accentBg: string,
    headerBg: string,
    headerText: string,
    navBg: string,
    navText: string,
    bodyBg: string,
    bodyText: string,
    ctaBg: string,
    ctaText: string,
    utilityBeltBg: string,
    utilityBeltText: string
  },
  
  analytics: {
    gtmId: string,
    ga4MeasurementId: string,
    fbPixelId: string,
    googleVerification: string,
    fbDomainVerification: string
  },
  
  // ═══════════════════════════════════════════════════════════════
  // HEADER CONFIGURATION
  // ═══════════════════════════════════════════════════════════════
  header: {
    type: 'standard-full' | 'split' | 'minimal' | 'sticky',
    headerTheme: 'light' | 'dark' | 'not-set',
    utilityBelt: boolean,
    utilityItems: {
      'contact-info': boolean,
      'social-links': boolean,
      'reviews': boolean,
      'header-ctas': boolean,
      'order': boolean,
      'reservations': boolean,
      order: string[]  // Item order array
    }
  },
  
  headerCtas: [{
    id: string,
    label: string,
    value: string,
    type: 'url' | 'phone',
    variant: 'primary' | 'secondary',
    active: boolean
  }],
  
  // ═══════════════════════════════════════════════════════════════
  // BOOKING CONFIGURATION
  // ═══════════════════════════════════════════════════════════════
  booking: {
    bookingUrl: string,
    bookingPhone: string,
    bookLabel: string,
    showInHeader: boolean,
    showInUtility: boolean,
    orderUrl: string,
    uberEatsUrl: string,
    doorDashUrl: string,
    menulogUrl: string,
    orderLabel: string,
    showOrderBtn: boolean
  },
  
  // ═══════════════════════════════════════════════════════════════
  // SOCIAL MEDIA
  // ═══════════════════════════════════════════════════════════════
  social: {
    facebook: string,
    instagram: string,
    twitter: string,
    tiktok: string,
    linkedin: string,
    showInFooter: boolean,
    showInUtility: boolean
  },
  
  // ═══════════════════════════════════════════════════════════════
  // FOOTER CONFIGURATION
  // ═══════════════════════════════════════════════════════════════
  footer: {
    theme: 'dark' | 'light',
    tagline: string
  },
  
  // ═══════════════════════════════════════════════════════════════
  // ORDERING SYSTEM
  // ═══════════════════════════════════════════════════════════════
  ordering: {
    enabled: boolean,
    acceptingOrders: boolean,
    orderTypes: string[],
    estimatedPrepTime: string
  },
  
  // ═══════════════════════════════════════════════════════════════
  // PAYMENT GATEWAY
  // ═══════════════════════════════════════════════════════════════
  paymentGateway: {
    id: string,
    provider: 'stripe' | 'square',
    isActive: boolean,
    currency: string,
    cashEnabled: boolean,
    cashLabel: string,
    testMode: boolean,
    testPublishableKey: string,
    livePublishableKey: string
  },

  // ═══════════════════════════════════════════════════════════════
  // LOYALTY PROGRAM
  // ═══════════════════════════════════════════════════════════════
  loyaltyConfig: {
    id: string,
    enabled: boolean,
    pointsPerDollar: number,
    rewards: [{
      id: string,
      name: string,
      description: string,
      pointsRequired: number,
      discountValue: number,
      discountType: 'fixed' | 'percentage',
      isActive: boolean
    }]
  },

  // ═══════════════════════════════════════════════════════════════
  // REVIEWS
  // ═══════════════════════════════════════════════════════════════
  reviews: {
    // Live Google data (fetched from API)
    overallScore: number,
    googleCount: number,
    googleScore: number,
    placeId: string,
    averageRating: number,
    totalReviews: number,
    
    // CMS configuration
    enableHeader: boolean,
    enableFooter: boolean,
    enableFloating: boolean,
    showReviewCta: boolean,
    showFloatingWidget: boolean,
    carouselHeading: string,
    carouselSubHeading: string,
    carouselContent: string,
    showReviewsCarousel: boolean,
    alternateStyles: boolean,
    
    // Manual reviews (if not using Google)
    reviews: [{
      id: string,
      name: string,
      author: string,
      stars: number,
      rating: number,
      text: string,
      content: string,
      date: string,
      platform: string,
      isActive: boolean
    }]
  },
  
  // ═══════════════════════════════════════════════════════════════
  // LEGAL DOCUMENTS
  // ═══════════════════════════════════════════════════════════════
  legalDocs: [{
    id: string,
    type: 'privacy' | 'terms' | 'refund',
    title: string,
    content: string,
    isActive: boolean
  }],
  
  // ═══════════════════════════════════════════════════════════════
  // SITE TYPE
  // ═══════════════════════════════════════════════════════════════
  siteType: string
}
```

---

## Database Schema (Prisma)

### Client Model

```prisma
model Client {
  id          String   @id @default(cuid())
  name        String
  domain      String?
  status      String   @default("active")
  groupId     String?
  group       Group?    @relation("ClientGroup")
  locations   Location[]
  config      Config?   @relation
  menuCategories MenuCategory[]
  menuItems   MenuItem[]
  specials    Special[]
  pages       Page[]
  banners     Banner[]
  footerSections FooterSection[]
  navigationItems NavigationItem[]
  homeSections HomeSection[]
  promoTiles  PromoTile[]
  teamDepartments TeamDepartment[]
  customTextBlocks CustomTextBlock[]
  paymentGateway PaymentGateway?
  legalDocs   LegalDoc[]
  customers   Customer[]
  loyaltyConfig LoyaltyConfig?
  rewards     Reward[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Location Model

```prisma
model Location {
  id          String   @id @default(cuid())
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  
  name        String
  isPrimary   Boolean  @default(false)
  isActive    Boolean  @default(true)
  showInFooter Boolean  @default(false)
  
  address     String   // Can be JSON string or plain text
  suburb      String?
  city        String?
  state       String?
  postcode    String?
  country     String?
  
  phone       String?
  email       String?
  formEmail   String?
  
  hours       Json?    // { Mon: { open, close, closed }, ... }
  
  lat         Float?
  lng         Float?
  
  exteriorImages String[] // Array of image URLs
  exteriorImage String?   // Legacy single image
  galleryImages Json?     // Array or JSON string
  
  deliveryOptions Json?
  servicesAvailable String[]
  alternateStyling Boolean @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### MenuCategory Model

```prisma
model MenuCategory {
  id          String   @id @default(cuid())
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  
  name        String
  description String?
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  
  menuItems   MenuItem[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### MenuItem Model

```prisma
model MenuItem {
  id          String   @id @default(cuid())
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  categoryId  String
  category    MenuCategory @relation(fields: [categoryId], references: [id])
  
  name        String
  description String?
  price       Decimal
  imageUrl    String?
  image       String?
  isAvailable Boolean  @default(true)
  isFeatured  Boolean  @default(false)
  dietaryTags String[]
  sortOrder   Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Config Model

```prisma
model Config {
  id          String   @id @default(cuid())
  clientId    String   @unique
  client      Client   @relation(fields: [clientId], references: [id])

  settings    Json?
  shortcodes  Json?
  colours     Json?
  analytics   Json?
  homepage    Json?
  booking     Json?
  header      Json?
  headerCtas  Json?
  footer      Json?
  social      Json?
  ordering    Json?
  reviews     Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### LoyaltyConfig Model

```prisma
model LoyaltyConfig {
  id              String   @id @default(cuid())
  clientId        String   @unique
  client          Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  enabled         Boolean  @default(false)
  pointsPerDollar Int      @default(1)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  rewards         Reward[]

  @@index([clientId])
}
```

### Reward Model

```prisma
model Reward {
  id              String       @id @default(cuid())
  clientId        String
  client          Client       @relation(fields: [clientId], references: [id], onDelete: Cascade)
  loyaltyConfig   LoyaltyConfig @relation(fields: [loyaltyConfigId], references: [id], onDelete: Cascade)
  loyaltyConfigId String
  name            String
  description     String?
  pointsRequired  Int
  discountValue   Float
  discountType    String       @default("fixed") // "fixed" or "percentage"
  isActive        Boolean      @default(true)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([clientId])
  @@index([loyaltyConfigId])
}
```

### Customer Model

```prisma
model Customer {
  id            String   @id @default(cuid())
  clientId      String
  client        Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  phone         String
  name          String?
  email         String?
  points        Int      @default(0)
  totalOrders   Int      @default(0)
  totalSpent    Float    @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  orders        Order[]

  @@unique([clientId, phone])
  @@index([clientId])
  @@index([phone])
}
```

### NavigationItem Model

```prisma
model NavigationItem {
  id          String   @id @default(cuid())
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  
  label       String
  url         String?
  pageId      String?
  page        Page?    @relation(fields: [pageId], references: [id])
  
  parentId    String?
  parent      NavigationItem? @relation("NavHierarchy", fields: [parentId], references: [id])
  children    NavigationItem[] @relation("NavHierarchy")
  
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Banner Model

```prisma
model Banner {
  id          String   @id @default(cuid())
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  
  title       String?
  subtitle    String?
  text        String?
  imageUrl    String?
  buttonText  String?
  buttonUrl   String?
  isExternal  Boolean  @default(false)
  
  isActive    Boolean  @default(true)
  location    String   @default("home") // "home" | "both"
  sortOrder   Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Template Selection & Configuration

### How Templates Are Selected

Templates are selected in this priority order:

1. **CMS Configuration** (`config.colours.theme`)
   - Set in CMS UI
   - Per-client customization
   - Recommended method

2. **Environment Variable** (`SITE_TEMPLATE`)
   - Set in `.env.local` or deployment env
   - Fallback if not set in CMS
   - Default: `theme-v1`

3. **Hardcoded Default**
   - `theme-v1` in `pages/index.js`

### Template Registration

Templates are registered in `packages/site-template/pages/index.js`:

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
};
```

### Adding a New Template

**Backend Steps:**
1. No backend changes required for new template
2. Template selection is purely frontend
3. CMS `colours.theme` can be any string
4. Frontend registers the template in `pages/index.js`

**CMS Configuration:**
```json
{
  "config": {
    "colours": {
      "theme": "my-new-template"
    }
  }
}
```

---

## Feature Integration

### 1. Utility Belt

**Backend Data Required:**
```javascript
{
  header: {
    utilityBelt: true,
    utilityItems: {
      'contact-info': true,
      'social-links': true,
      'reviews': true,
      'header-ctas': true
    }
  },
  settings: {
    address: string,
    phone: string
  },
  social: {
    facebook, instagram, twitter, tiktok,
    showInUtility: true
  },
  reviews: {
    overallScore: number,
    totalReviews: number,
    enableHeader: true
  },
  headerCtas: [...]
}
```

**Database Location:**
- `config.header` - Header configuration
- `config.settings` - Contact info
- `config.social` - Social links
- `config.reviews` - Review data

---

### 2. Banner Carousel

**Backend Data Required:**
```javascript
{
  banners: [{
    id, title, subtitle, text, imageUrl,
    buttonText, buttonUrl, isExternal,
    isActive, location: 'home', sortOrder
  }]
}
```

**Database Location:**
- `Banner` model
- Filter by `clientId`, `isActive`, `location`

**API Query:**
```javascript
await prisma.banner.findMany({
  where: { clientId: id },
  orderBy: { sortOrder: 'asc' }
})
```

---

### 3. Header Navigation

**Backend Data Required:**
```javascript
{
  header: {
    type: 'standard-full',
    headerTheme: 'light'
  },
  navigationItems: [{
    id, label, url, pageId, parentId,
    page: { slug, pageType },
    sortOrder, isActive,
    children: [...]
  }],
  booking: {
    bookingUrl, bookLabel, showInHeader,
    orderUrl, orderLabel, showOrderBtn
  },
  settings: {
    logoLight, logoDark, displayName
  }
}
```

**Database Location:**
- `config.header` - Header type/theme
- `NavigationItem` model - Navigation items
- `config.booking` - Booking/order config
- `config.settings` - Logo, name

**Navigation Structure:**
- Hierarchical (parent/child relationships)
- Flattened for export but maintains hierarchy
- Children linked to pages via `pageId`

---

### 4. Footer

**Backend Data Required:**
```javascript
{
  footer: {
    theme: 'dark',
    tagline: 'Our tagline'
  },
  footerSections: [{
    id, title, links: [...],
    isActive, sortOrder
  }],
  social: {
    facebook, instagram, twitter,
    showInFooter: true
  }
}
```

**Database Location:**
- `config.footer` - Footer theme/tagline
- `FooterSection` model - Footer columns
- `config.social` - Social links

---

### 5. Theme Colors

**Backend Data Required:**
```javascript
{
  colours: {
    theme: string,        // Template selector
    primary: string,
    secondary: string,
    accentBg: string,
    headerBg: string,
    headerText: string,
    navBg: string,
    navText: string,
    bodyBg: string,
    bodyText: string,
    ctaBg: string,
    ctaText: string,
    utilityBeltBg: string,
    utilityBeltText: string
  },
  settings: {
    fontFamily: string,
    bodyFont: string
  }
}
```

**Database Location:**
- `config.colours` - All colors
- `config.settings` - Fonts

**CSS Variable Mapping:**
- Applied in `lib/theme.js` and `CMSContext.jsx`
- Set as CSS custom properties on `:root`

---

### 6. Shortcodes

**Backend Data Required:**
```javascript
{
  shortcodes: {
    restaurantName: string,
    address: string,
    suburb: string,
    state: string,
    phone: string,
    primaryEmail: string,
    group: string,
    custom: string,
    _overrides: {
      [key: string]: string
    }
  },
  client: {
    name,
    group: { name }
  },
  locations: [{ address, phone, suburb, state }]
}
```

**Auto-Generated Values:**
- `restaurantName` → `client.name` or `settings.displayName`
- `address` → Primary location address
- `suburb` → Primary location suburb or `settings.suburb`
- `state` → Primary location state
- `phone` → Primary location phone or `settings.phone`
- `primaryEmail` → `settings.defaultEmail`
- `group` → `client.group.name`

**Database Location:**
- `config.shortcodes` - Custom overrides
- Auto-generated from client/location data

---

### 7. Menu System

**Backend Data Required:**
```javascript
{
  menuCategories: [{
    id, name, description, isActive, sortOrder
  }],
  menuItems: [{
    id, categoryId, name, description, price,
    imageUrl, isAvailable, isFeatured,
    dietaryTags, sortOrder
  }],
  ordering: {
    enabled, acceptingOrders, orderTypes, estimatedPrepTime
  }
}
```

**Database Location:**
- `MenuCategory` model
- `MenuItem` model
- `config.ordering`

**Relationships:**
- `MenuItem.categoryId` → `MenuCategory.id`
- Filter by `isAvailable` for display

---

### 8. Specials

**Backend Data Required:**
```javascript
{
  specials: [{
    id, title, description, price, originalPrice,
    imageUrl, isActive, isHighlighted,
    startDate, endDate, sortOrder
  }],
  specialsConfig: {
    heading, subheading, showOnHomepage, maxItems
  }
}
```

**Database Location:**
- `Special` model
- `config.homepage.specialsConfig`

**Date Handling:**
- `startDate` / `endDate` (DB fields)
- Mapped to `validFrom` / `validUntil` for export
- Frontend filters by current date

---

### 9. Reviews

**Backend Data Required:**
```javascript
{
  reviews: {
    // Live Google data (fetched from Google Places API)
    overallScore, googleCount, googleScore,
    placeId, averageRating, totalReviews,
    
    // CMS configuration
    enableHeader, enableFooter, enableFloating,
    showReviewCta, showFloatingWidget,
    carouselHeading, carouselSubHeading,
    showReviewsCarousel, alternateStyles,
    
    // Manual reviews (if not using Google)
    reviews: [...]
  }
}
```

**Database Location:**
- `config.reviews` - Configuration and manual reviews
- Google data fetched live from API

**Google Places API:**
- Called during export if `placeId` is set
- Returns live rating and review count
- Cached for 60 seconds

---

### 10. Ordering System

**Backend Data Required:**
```javascript
{
  ordering: {
    enabled: boolean,
    acceptingOrders: boolean,
    orderTypes: string[],
    estimatedPrepTime: string
  },
  paymentGateway: {
    provider, isActive, currency,
    cashEnabled, cashLabel,
    testMode, testPublishableKey, livePublishableKey
  }
}
```

**Database Location:**
- `config.ordering`
- `PaymentGateway` model

**Frontend Integration:**
- `useCart()` hook in templates
- Cart state managed in `CartContext`
- Orders created via `/api/clients/:id/orders` endpoint

---

### 11. Analytics

**Backend Data Required:**
```javascript
{
  analytics: {
    gtmId: string,
    ga4MeasurementId: string,
    fbPixelId: string,
    googleVerification: string,
    fbDomainVerification: string
  }
}
```

**Database Location:**
- `config.analytics`

**Frontend Integration:**
- Automatically injected in `_app.js`
- No template-level code needed

---

### 12. Locations

**Backend Data Required:**
```javascript
{
  locations: [{
    id, name, isPrimary, isActive, showInFooter,
    address, suburb, city, state, postcode,
    phone, email, formEmail,
    hours: { Mon: { open, close, closed }, ... },
    lat, lng,
    exteriorImages, exteriorImage, galleryImages,
    deliveryOptions, servicesAvailable, alternateStyling
  }]
}
```

**Database Location:**
- `Location` model

**Hours Format:**
- Abbreviated day names: `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`
- Each day: `{ open: "09:00", close: "22:00", closed: false }`
- Normalized in export to consistent format

---

### 13. Team

**Backend Data Required:**
```javascript
{
  teamDepartments: [{
    id, name, description, isActive, sortOrder
  }]
}
```

**Database Location:**
- `TeamDepartment` model

**Team Members:**
- Currently stored in `homeSections` with type `team`
- Future: Separate `TeamMember` model

---

### 14. Custom Pages

**Backend Data Required:**
```javascript
{
  pages: [{
    id, slug, title, subtitle, metaDesc,
    pageType: 'custom',
    bannerId, content, isActive, sortOrder
  }],
  customTextBlocks: [{
    id, title, content, isActive, sortOrder
  }],
  banners: [...]  // For page banners
}
```

**Database Location:**
- `Page` model
- `CustomTextBlock` model
- `Banner` model

**Page Types:**
- `home` - Homepage
- `menu` - Menu page
- `locations` - Locations page
- `specials` - Specials page
- `team` - Team page
- `custom` - Custom pages

---

## Cache Management

### Export Cache

**Location:** `packages/api/src/routes/clients.js`

**Implementation:**
```javascript
const exportCache = new Map()
const CACHE_TTL_MS = 60000 // 60 seconds

function getCachedExport(clientId) {
  const cached = exportCache.get(clientId)
  if (!cached) return null
  const now = Date.now()
  if (now - cached.timestamp > CACHE_TTL_MS) {
    exportCache.delete(clientId)
    return null
  }
  return cached.data
}

function setCachedExport(clientId, data) {
  exportCache.set(clientId, { data, timestamp: Date.now() })
}
```

**Cache Invalidation:**

Cache is cleared on any data update:

```javascript
// After creating/updating/deleting
exportCache.delete(clientId)
```

**Endpoints that clear cache:**
- Location CRUD (`/clients/:id/locations`)
- Department CRUD (`/clients/:id/departments`)
- Any config update

### Google Places API Cache

Google Places data is cached as part of the export cache (60s TTL).

---

## Complete API Endpoints Reference

### Template Data Endpoints (Public - No Auth Required)

#### Export Endpoint (Primary)

```
GET /api/clients/:id/export
```

**Purpose:** Returns all template data in single response (recommended for templates)

**Response:** Complete client data structure (see "Complete Export Data Structure" section)

**Cache:** 60 seconds TTL

**Usage:**
```javascript
const res = await fetch(`${CMS_API_URL}/clients/${id}/export`)
const data = await res.json()
```

---

#### Individual Data Endpoints

**Menu:**
```
GET /api/clients/:id/menuCategories
GET /api/clients/:id/menuItems
```

**Specials:**
```
GET /api/clients/:id/specials
```

**Locations:**
```
GET /api/clients/:id/locations
```

**Banners:**
```
GET /api/clients/:id/banners
```

**Pages:**
```
GET /api/clients/:id/pages
```

**Note:** Templates should use the export endpoint for efficiency (single request vs multiple).

---

### Ordering System Endpoints (Public - No Auth Required)

#### Create Order
```
POST /api/clients/:id/orders
```

**Purpose:** Create a new order

**Request Body:**
```json
{
  "items": [
    {
      "menuItemId": "string",
      "quantity": number,
      "price": number,
      "specialInstructions": "string"
    }
  ],
  "customer": {
    "name": "string",
    "email": "string",
    "phone": "string"
  },
  "orderType": "pickup" | "delivery",
  "scheduledFor": "string (ISO date)",
  "locationId": "string"
}
```

**Response:** Created order with ID

---

#### Get Order
```
GET /api/clients/:id/orders/:orderId
```

**Purpose:** Get order details by ID

**Response:** Order object with status, items, total

---

#### Update Order Status (Admin Only)
```
PATCH /api/clients/:id/orders/:orderId/status
```

**Auth Required:** Yes (authenticateToken)

**Purpose:** Update order status

**Request Body:**
```json
{
  "status": "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled"
}
```

---

#### List Orders (Admin Only)
```
GET /api/clients/:id/orders
```

**Auth Required:** Yes (authenticateToken)

**Purpose:** List all orders for a client

**Query Params:**
- `status` - Filter by status
- `limit` - Limit results
- `offset` - Pagination offset

---

### Payment Endpoints (Public - No Auth Required for create-intent)

#### Get Payment Config
```
GET /api/clients/:id/payments
```

**Auth Required:** Yes (authenticateToken)

**Purpose:** Get payment gateway configuration

**Response:**
```json
{
  "provider": "stripe" | "square",
  "isActive": boolean,
  "currency": string,
  "testMode": boolean,
  "publishableKey": string
}
```

---

#### Update Payment Config (Admin Only)
```
PUT /api/clients/:id/payments
```

**Auth Required:** Yes (authenticateToken)

**Purpose:** Update payment gateway settings

---

#### Create Payment Intent
```
POST /api/clients/:id/payments/create-intent
```

**Auth Required:** No (public)

**Purpose:** Create Stripe payment intent

**Request Body:**
```json
{
  "orderId": "string",
  "amount": number
}
```

**Response:**
```json
{
  "clientSecret": "string",
  "paymentIntentId": "string"
}
```

---

#### Stripe Webhook
```
POST /api/clients/:id/payments/webhook
```

**Auth Required:** No (Stripe signature verification)

**Purpose:** Handle Stripe webhook events

---

### Navigation Endpoints (Admin - Auth Required)

#### Get Navigation
```
GET /api/clients/:id/navigation
```

**Auth Required:** Yes (authenticateToken)

**Purpose:** Get navigation items (flat list)

---

#### Get Navigation Tree
```
GET /api/clients/:id/navigation/tree
```

**Auth Required:** Yes (authenticateToken)

**Purpose:** Get navigation items (hierarchical tree)

---

#### Update Navigation Tree
```
PUT /api/clients/:id/navigation
```

**Auth Required:** Yes (authenticateToken)

**Purpose:** Update entire navigation tree

**Request Body:**
```json
{
  "tree": [
    {
      "id": "string",
      "label": "string",
      "url": "string",
      "parentId": "string | null",
      "sortOrder": number,
      "isActive": boolean
    }
  ]
}
```

---

#### Create Navigation Item
```
POST /api/clients/:id/navigation
```

**Auth Required:** Yes (authenticateToken)

---

#### Update Navigation Item
```
PATCH /api/clients/:id/navigation/:id
```

**Auth Required:** Yes (authenticateToken)

---

#### Delete Navigation Item
```
DELETE /api/clients/:id/navigation/:id
```

**Auth Required:** Yes (authenticateToken)

---

#### Reorder Navigation Items
```
PUT /api/clients/:id/navigation/reorder
```

**Auth Required:** Yes (authenticateToken)

**Request Body:**
```json
{
  "items": [
    { "id": "string", "sortOrder": number }
  ]
}
```

---

### Client Management Endpoints (Admin - Auth Required)

#### Get All Clients
```
GET /api/clients
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Purpose:** List all clients

---

#### Create Client
```
POST /api/clients
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Purpose:** Create new client

**Request Body:**
```json
{
  "name": "string",
  "domain": "string",
  "groupId": "string (optional)"
}
```

---

#### Get Client by ID
```
GET /api/clients/:id
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Purpose:** Get client details

---

#### Update Client
```
PUT /api/clients/:id
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Purpose:** Update client details

---

#### Delete Client
```
DELETE /api/clients/:id
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Purpose:** Delete client (cascades to all related data)

---

#### Clone Client
```
POST /api/clients/:id/clone
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Purpose:** Clone client with all data

---

### Location Endpoints (Admin - Auth Required)

#### Get Locations
```
GET /api/clients/:id/locations
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Purpose:** Get all locations for a client

---

#### Create Location
```
POST /api/clients/:id/locations
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Request Body:**
```json
{
  "name": "string",
  "address": "string",
  "suburb": "string",
  "city": "string",
  "state": "string",
  "postcode": "string",
  "phone": "string",
  "email": "string",
  "hours": {
    "Mon": { "open": "09:00", "close": "22:00", "closed": false },
    "Tue": { "open": "09:00", "close": "22:00", "closed": false },
    // ... all 7 days (abbreviated)
  },
  "lat": number,
  "lng": number,
  "isPrimary": boolean,
  "isActive": boolean,
  "showInFooter": boolean
}
```

---

#### Update Location
```
PUT /api/clients/:id/locations/:locId
PATCH /api/clients/:id/locations/:locId
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Purpose:** Update location details

**Auto-geocode:** If address changes and lat/lng not provided, automatically geocodes

---

#### Delete Location
```
DELETE /api/clients/:id/locations/:locId
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

---

### Specials Endpoints (Admin - Auth Required)

#### Get Specials
```
GET /api/clients/:id/specials
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Purpose:** Get all specials for a client

---

#### Create Special
```
POST /api/clients/:id/specials
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "price": number,
  "originalPrice": number,
  "imageUrl": "string",
  "isActive": boolean,
  "isHighlighted": boolean,
  "startDate": "string (ISO date)",
  "endDate": "string (ISO date)",
  "sortOrder": number
}
```

---

#### Update Special
```
PUT /api/clients/:id/specials/:specId
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

---

#### Delete Special
```
DELETE /api/clients/:id/specials/:specId
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

---

### Page Endpoints (Admin - Auth Required)

#### Get Pages
```
GET /api/clients/:id/pages
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Purpose:** Get all pages for a client

---

#### Create Page
```
POST /api/clients/:id/pages
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Request Body:**
```json
{
  "slug": "string",
  "title": "string",
  "subtitle": "string",
  "metaDesc": "string",
  "pageType": "home" | "menu" | "locations" | "specials" | "team" | "custom",
  "bannerId": "string (optional)",
  "content": "string (HTML)",
  "isActive": boolean,
  "sortOrder": number
}
```

---

#### Update Page
```
PUT /api/clients/:id/pages/:pageId
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

---

#### Delete Page
```
DELETE /api/clients/:id/pages/:pageId
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Note:** Also deletes associated navigation items and footer links

---

### Banner Endpoints (Admin - Auth Required)

#### Get Banners
```
GET /api/clients/:id/banners
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Purpose:** Get all banners for a client

---

#### Create Banner
```
POST /api/clients/:id/banners
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Request Body:**
```json
{
  "title": "string",
  "subtitle": "string",
  "text": "string",
  "imageUrl": "string",
  "buttonText": "string",
  "buttonUrl": "string",
  "isExternal": boolean,
  "isActive": boolean,
  "location": "home" | "both",
  "sortOrder": number
}
```

---

#### Update Banner
```
PUT /api/clients/:id/banners/:bannerId
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

---

#### Delete Banner
```
DELETE /api/clients/:id/banners/:bannerId
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

---

### Menu Endpoints (Admin - Auth Required)

#### Get Menu Categories
```
GET /api/menuCategories
```

**Auth Required:** Yes (authenticateToken)

**Purpose:** Get all menu categories (filtered by user access)

---

#### Create Menu Category
```
POST /api/menuCategories
```

**Auth Required:** Yes (authenticateToken)

---

#### Update Menu Category
```
PUT /api/menuCategories/:id
```

**Auth Required:** Yes (authenticateToken)

---

#### Delete Menu Category
```
DELETE /api/menuCategories/:id
```

**Auth Required:** Yes (authenticateToken)

---

#### Get Menu Items
```
GET /api/menuItems
```

**Auth Required:** Yes (authenticateToken)

**Purpose:** Get all menu items (filtered by user access)

**Query Params:**
- `categoryId` - Filter by category
- `clientId` - Filter by client

---

#### Create Menu Item
```
POST /api/menuItems
```

**Auth Required:** Yes (authenticateToken)

**Request Body:**
```json
{
  "clientId": "string",
  "categoryId": "string",
  "name": "string",
  "description": "string",
  "price": number,
  "imageUrl": "string",
  "isAvailable": boolean,
  "isFeatured": boolean,
  "dietaryTags": string[],
  "sortOrder": number
}
```

---

#### Update Menu Item
```
PUT /api/menuItems/:id
```

**Auth Required:** Yes (authenticateToken)

---

#### Delete Menu Item
```
DELETE /api/menuItems/:id
```

**Auth Required:** Yes (authenticateToken)

---

### Team Endpoints (Admin - Auth Required)

#### Get Departments
```
GET /api/clients/:id/departments
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Purpose:** Get all team departments

---

#### Create Department
```
POST /api/clients/:id/departments
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "isActive": boolean,
  "sortOrder": number
}
```

---

#### Update Department
```
PUT /api/clients/:id/departments/:deptId
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

---

#### Delete Department
```
DELETE /api/clients/:id/departments/:deptId
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

---

### Homepage Endpoints (Admin - Auth Required)

#### Get Homepage Sections
```
GET /api/clients/:id/homepage
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Purpose:** Get homepage sections configuration

---

#### Update Homepage Sections
```
PUT /api/clients/:id/homepage
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Request Body:**
```json
{
  "sections": [
    {
      "id": "string",
      "type": "string",
      "title": "string",
      "content": object,
      "sortOrder": number,
      "isActive": boolean
    }
  ]
}
```

---

### Configuration Endpoints (Admin - Auth Required)

#### Get Config
```
GET /api/clients/:id/config
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Purpose:** Get client configuration (settings, colours, etc.)

---

#### Update Config
```
PUT /api/clients/:id/config
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Request Body:**
```json
{
  "settings": { ... },
  "colours": { ... },
  "analytics": { ... },
  "homepage": { ... },
  "booking": { ... },
  "header": { ... },
  "headerCtas": [...],
  "footer": { ... },
  "social": { ... },
  "ordering": { ... },
  "reviews": { ... }
}
```

---

### Image Upload Endpoints (Admin - Auth Required)

#### Upload Image
```
POST /api/images/upload
```

**Auth Required:** Yes (authenticateToken)

**Purpose:** Upload image file

**Request:** multipart/form-data with `file` field

**Response:**
```json
{
  "url": "string",
  "filename": "string"
}
```

---

#### Delete Image
```
DELETE /api/images/:filename
```

**Auth Required:** Yes (authenticateToken)

**Purpose:** Delete uploaded image

---

### Legal Documents Endpoints (Admin - Auth Required)

#### Get Legal Docs
```
GET /api/clients/:id/legal
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Purpose:** Get legal documents (privacy, terms, etc.)

---

#### Create Legal Doc
```
POST /api/clients/:id/legal
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Request Body:**
```json
{
  "type": "privacy" | "terms" | "refund",
  "title": "string",
  "content": "string (HTML)",
  "isActive": boolean
}
```

---

#### Update Legal Doc
```
PUT /api/clients/:id/legal/:docId
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

---

#### Delete Legal Doc
```
DELETE /api/clients/:id/legal/:docId
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

---

### Group Endpoints (Admin - Auth Required)

#### Get Groups
```
GET /api/groups
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Purpose:** Get all groups

---

#### Create Group
```
POST /api/groups
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Request Body:**
```json
{
  "name": "string",
  "description": "string"
}
```

---

#### Update Group
```
PUT /api/groups/:id
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

---

#### Delete Group
```
DELETE /api/groups/:id
```

**Auth Required:** Yes (SUPER_ADMIN)

---

### User Management Endpoints (Admin - Auth Required)

#### Get Users
```
GET /api/users
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Purpose:** Get all users

---

#### Create User
```
POST /api/users
```

**Auth Required:** Yes (SUPER_ADMIN)

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "SUPER_ADMIN" | "MANAGER" | "EDITOR",
  "clientAccess": ["string"] // Client IDs
}
```

---

#### Update User
```
PUT /api/users/:id
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

---

#### Delete User
```
DELETE /api/users/:id
```

**Auth Required:** Yes (SUPER_ADMIN)

---

### Authentication Endpoints (Public)

#### Login
```
POST /api/auth/login
```

**Purpose:** User login

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": { ... }
}
```

---

#### Register
```
POST /api/auth/register
```

**Purpose:** User registration (if enabled)

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

---

#### Get Current User
```
GET /api/auth/me
```

**Auth Required:** Yes (authenticateToken)

**Purpose:** Get current authenticated user

---

#### Logout
```
POST /api/auth/logout
```

**Auth Required:** Yes (authenticateToken)

**Purpose:** User logout

---

### Platform Configuration Endpoints (Admin - Auth Required)

#### Get Platform Config
```
GET /api/platform
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Purpose:** Get global platform configuration

---

#### Update Platform Config
```
PUT /api/platform
```

**Auth Required:** Yes (SUPER_ADMIN)

**Request Body:**
```json
{
  "siteName": "string",
  "defaultTemplate": "string",
  "features": { ... }
}
```

---

### Deployment Endpoints (Admin - Auth Required)

#### Create Netlify Site
```
POST /api/deployments/netlify
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Purpose:** Create new Netlify site for client

**Request Body:**
```json
{
  "clientId": "string",
  "siteName": "string",
  "customDomain": "string (optional)"
}
```

---

#### Trigger Netlify Build
```
POST /api/deployments/netlify/:siteId/build
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Purpose:** Trigger manual build for Netlify site

---

#### Update Netlify Environment Variables
```
PUT /api/deployments/netlify/:siteId/env
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Purpose:** Update environment variables for Netlify site

---

### Analytics Endpoints (Admin - Auth Required)

#### Get Analytics Data
```
GET /api/clients/:id/analytics
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER, EDITOR for assigned clients)

**Purpose:** Get analytics data for client

**Query Params:**
- `startDate` - ISO date string
- `endDate` - ISO date string
- `metric` - Specific metric (visits, orders, revenue)

---

### Activity Log Endpoints (Admin - Auth Required)

#### Get Activity Log
```
GET /api/activity-log
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Purpose:** Get system activity log

**Query Params:**
- `clientId` - Filter by client
- `userId` - Filter by user
- `action` - Filter by action type
- `limit` - Limit results
- `offset` - Pagination offset

---

### Alert Endpoints (Admin - Auth Required)

#### Get Alerts
```
GET /api/alerts
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Purpose:** Get system alerts

---

#### Create Alert
```
POST /api/alerts
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

**Request Body:**
```json
{
  "type": "info" | "warning" | "error",
  "message": "string",
  "clientId": "string (optional)"
}
```

---

#### Dismiss Alert
```
PATCH /api/alerts/:id/dismiss
```

**Auth Required:** Yes (SUPER_ADMIN, MANAGER)

---

## API Authentication

### Token-Based Authentication

Most admin endpoints require authentication via Bearer token.

**Header:**
```
Authorization: Bearer <token>
```

**Middleware:** `authenticateToken` (in `packages/api/src/middleware/auth.js`)

### Role-Based Access Control

**Roles:**
- `SUPER_ADMIN` - Full access to all clients and settings
- `MANAGER` - Full access to assigned clients
- `EDITOR` - Read/write access to assigned clients (no delete)

**Middleware:** `requireRole(...)` in route definitions

### Public Endpoints

The following endpoints are public (no auth required):
- `GET /api/clients/:id/export` - Template data export
- `POST /api/clients/:id/orders` - Create order
- `GET /api/clients/:id/orders/:orderId` - Get order
- `POST /api/clients/:id/payments/create-intent` - Create payment intent
- `POST /api/clients/:id/payments/webhook` - Stripe webhook
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (if enabled)

---

## Environment Variables

### Required for Site Template

```bash
# API URL
NEXT_PUBLIC_CMS_API_URL=http://localhost:3001/api
CMS_API_URL=http://localhost:3001/api

# Site ID (for production)
NEXT_PUBLIC_SITE_ID=client-id
SITE_ID=client-id

# Template (fallback)
SITE_TEMPLATE=theme-d1
```

### Required for API

```bash
# Database
DATABASE_URL=postgresql://...

# Google Places API (optional)
GOOGLE_PLACES_API_KEY=your-api-key

# Template Repository (for Netlify)
SITE_TEMPLATE_REPO=https://github.com/hetdinedesk/DineDesk
SITE_TEMPLATE_REPO_BRANCH=master
```

---

## Common Issues & Troubleshooting

### Issue: Template Not Loading

**Symptoms:** Blank page, template not rendering

**Possible Causes:**
1. Template not registered in `pages/index.js`
2. `colours.theme` value doesn't match registered template
3. Client ID not set in env or URL

**Solutions:**
1. Check template registration in `pages/index.js`
2. Verify `colours.theme` in CMS config
3. Check `NEXT_PUBLIC_SITE_ID` or `?site=` parameter

---

### Issue: Missing Data in Template

**Symptoms:** Empty sections, missing images

**Possible Causes:**
1. Data not in database
2. Cache not invalidated
3. Filter conditions not met (e.g., `isActive: false`)

**Solutions:**
1. Check database for data
2. Clear cache: `exportCache.delete(clientId)`
3. Verify `isActive` flags and filters

---

### Issue: Colors Not Applying

**Symptoms:** Default colors instead of theme colors

**Possible Causes:**
1. `colours` object empty in config
2. CSS variables not set
3. Template not using CSS variables

**Solutions:**
1. Check `config.colours` in database
2. Verify CSS variable names match
3. Check template uses `var(--color-*)`

---

### Issue: Shortcodes Not Replacing

**Symptoms:** `{{restaurantName}}` showing literally

**Possible Causes:**
1. Shortcodes not in config
2. Template not using `replaceShortcodes()`
3. Auto-generation failing

**Solutions:**
1. Check `config.shortcodes` in database
2. Verify template imports and uses `replaceShortcodes()`
3. Check client/location data for auto-generation

---

### Issue: Navigation Not Showing

**Symptoms:** Empty navigation menu

**Possible Causes:**
1. No navigation items in database
2. All items have `isActive: false`
3. Items have no children (headings require children)

**Solutions:**
1. Add navigation items in CMS
2. Set `isActive: true` on items
3. Add child pages to navigation headings

---

### Issue: Banners Not Showing

**Symptoms:** No banner carousel

**Possible Causes:**
1. No banners in database
2. All banners have `isActive: false`
3. Banner `location` not set to 'home'

**Solutions:**
1. Add banners in CMS
2. Set `isActive: true` on banners
3. Set `location: 'home'` or `'both'`

---

### Issue: Google Reviews Not Showing

**Symptoms:** No review score, missing reviews

**Possible Causes:**
1. No `placeId` in config
2. Google Places API key not set
3. API quota exceeded

**Solutions:**
1. Add Google Place ID in CMS
2. Set `GOOGLE_PLACES_API_KEY` env var
3. Check API quota and billing

---

## Testing Template Data

### Manual Export Test

```bash
curl http://localhost:3001/api/clients/CLIENT_ID/export
```

### Verify Data Structure

Check that export includes all required fields for your template.

### Test with Different Clients

Test with multiple clients to ensure data consistency.

---

## Best Practices

### Database

1. **Always use `isActive` flags** for soft deletes
2. **Use `sortOrder` for display order** (not ID)
3. **Normalize data** before export (e.g., hours format)
4. **Validate data** before saving (e.g., URLs, dates)
5. **Clear cache** after any data update

### API

1. **Use single export endpoint** for template data (efficient)
2. **Cache aggressively** (60s TTL for export)
3. **Invalidate cache** on updates
4. **Handle missing data** gracefully (return empty arrays/objects)
5. **Filter by `clientId`** on all queries

### Configuration

1. **Use `colours.theme` for template selection** (per-client)
2. **Provide defaults** for all config values
3. **Validate config schema** (type checking)
4. **Document config structure** (for frontend team)
5. **Version config schema** (for migrations)

---

## Data Migration

When adding new template features:

1. **Add database fields** (Prisma migration)
2. **Update export endpoint** (include new data)
3. **Update CMSContext** (adapt new data for frontend)
4. **Update templates** (use new data)
5. **Clear cache** (force refresh)
6. **Test with existing clients** (backward compatibility)

---

## Security Considerations

1. **Export endpoint is public** (no auth required)
2. **Rate limit export endpoint** (prevent abuse)
3. **Sanitize user input** (XSS prevention)
4. **Validate image URLs** (prevent XSS)
5. **Don't expose sensitive data** (API keys, secrets)

---

## Performance Optimization

1. **Use database indexes** on frequently queried fields
2. **Batch queries** with `Promise.all()`
3. **Select only needed fields** (not `*`)
4. **Cache aggressively** (60s TTL)
5. **Use CDN for images** (not local storage)

---

## Monitoring

### Key Metrics

- Export endpoint response time
- Cache hit rate
- Database query time
- Google Places API success rate

### Logging

Export endpoint logs:
```javascript
console.log('📥 Export route called for ID:', req.params.id)
console.error('Export error:', err.message)
```

---

## Future Enhancements

### Planned Features

1. **Real-time updates** (WebSocket for live data)
2. **Draft mode** (preview unpublished changes)
3. **A/B testing** (multiple template variants)
4. **Advanced caching** (Redis instead of in-memory)
5. **CDN caching** (cache export responses at edge)

### Backend Considerations

1. **Separate template config** from client config
2. **Template versioning** (support multiple versions)
3. **Template marketplace** (share templates between clients)
4. **Template analytics** (track template usage)
5. **Template preview** (live preview without deployment)

---

## Resources

**Documentation:**
- `TEMPLATE_ADDITION_GUIDE.md` - Complete template system guide
- `FRONTEND_TEMPLATE_REQUIREMENTS.md` - Frontend requirements

**Key Files:**
- `packages/api/src/routes/clients.js` - Export endpoint
- `packages/api/prisma/schema.prisma` - Database schema
- `packages/site-template/contexts/CMSContext.jsx` - Data adaptation
- `packages/site-template/lib/api.js` - API client

**Support:**
- Contact frontend team for template requirements
- Contact DevOps for deployment issues
