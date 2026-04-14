# DineDesk CMS - Frontend API Integration Guide

Complete list of all CMS features and API endpoints for frontend integration.

---

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require Bearer token authentication:
```
Authorization: Bearer {token}
```

Public endpoints (no auth required):
- `GET /clients/{id}/export` - Full site data export
- `GET /clients/{id}/navbar` - Navigation & footer data

---

## 1. Site Configuration & Branding

### Site Config
**Endpoint:** `GET /clients/{clientId}/config`
**Auth:** Required

**Endpoint:** `PUT /clients/{clientId}/config`
**Auth:** Required

**Data Structure:**
```json
{
  "settings": {
    "siteName": string,
    "tagline": string,
    "description": string,
    "contactEmail": string,
    "phone": string,
    "siteType": "restaurant" | "finedine" | "cafe" | "foodtruck" | "delivery" | "quickserve" | "catering" | "mealprep",
    "logoLight": string (URL),
    "logoDark": string (URL),
    "favicon": string (URL),
    "country": string,
    "timezone": string
  },
  "colours": {
    "theme": string,
    "primary": string,
    "secondary": string,
    "headerBg": string,
    "headerText": string,
    "navBg": string,
    "navText": string,
    "bodyBg": string,
    "bodyText": string,
    "ctaBg": string,
    "ctaText": string,
    "accentBg": string
  },
  "header": {
    "type": string,
    "utilityBelt": boolean,
    "utilityItems": {
      "phone": boolean,
      "email": boolean,
      "social": boolean
    },
    "headerTheme": "light" | "dark"
  },
  "headerCtas": [
    {
      "id": string,
      "label": string,
      "type": "internal" | "external",
      "value": string,
      "variant": "primary" | "secondary",
      "active": boolean,
      "workingTitle": string
    }
  ],
  "footer": {
    "tagline": string,
    "copyrightText": string,
    "legalLinks": [
      { "label": string, "href": string }
    ]
  },
  "social": {
    "facebook": string (URL),
    "instagram": string (URL),
    "twitter": string (URL),
    "tiktok": string (URL),
    "youtube": string (URL),
    "linkedin": string (URL),
    "showInFooter": boolean,
    "showInUtility": boolean
  },
  "reviews": {
    "overallScore": number,
    "totalReviews": number,
    "googleScore": number,
    "googleCount": number,
    "tripScore": number,
    "tripCount": number,
    "fbScore": number,
    "fbCount": number,
    "googlePlaceId": string,
    "minStars": number,
    "enableHeader": boolean,
    "enableFooter": boolean,
    "carouselHeading": string,
    "carouselSubHeading": string,
    "carouselContent": string,
    "ctas": [...],
    "enableFloating": boolean,
    "showReviewCta": boolean,
    "alternateStyles": boolean
  },
  "booking": {
    "bookingUrl": string,
    "bookingPhone": string,
    "bookLabel": string,
    "orderUrl": string,
    "orderLabel": string,
    "uberEatsUrl": string,
    "doorDashUrl": string,
    "menulogUrl": string,
    "showInHeader": boolean,
    "showInUtility": boolean,
    "showInHero": boolean,
    "showOnLocations": boolean,
    "showInFooter": boolean,
    "showOrderBtn": boolean,
    "useDirectForm": boolean,
    "minParty": number,
    "maxParty": number,
    "advanceNotice": number,
    "maxDaysAhead": number,
    "slotInterval": number,
    "notifyEmail": string,
    "pickupEnabled": boolean,
    "deliveryEnabled": boolean,
    "dineInEnabled": boolean,
    "pickupTime": string,
    "minOrder": number,
    "deliveryFee": number,
    "deliveryTime": string,
    "freeDeliveryOver": number
  },
  "shortcodes": {
    "primaryColor": string,
    "phone": string,
    "email": string,
    "address": string,
    "abn": string
  },
  "analytics": {
    "gtmId": string,
    "ga4MeasurementId": string,
    "fbPixelId": string,
    "googleVerification": string,
    "fbDomainVerification": string
  },
  "homepage": {
    "heroTitle": string,
    "heroSubtext": string,
    "heroBgImage": string (URL),
    "heroBadge": string,
    "stat1": string,
    "stat2": string,
    "stat3": string,
    "feature1": string,
    "feature2": string,
    "feature3": string,
    "feature4": string,
    "metaTitle": string,
    "metaDescription": string,
    "ogImage": string (URL)
  },
  "netlify": {
    "siteId": string,
    "previewUrl": string,
    "buildHook": string,
    "template": string,
    "primaryDomain": string,
    "domainLive": boolean
  },
  "notes": {
    "content": string
  }
}
```

---

## 2. Navigation (Header & Footer)

### Get Full Navbar Data
**Endpoint:** `GET /clients/{clientId}/navbar`
**Auth:** Not required (public)

**Response:**
```json
{
  "headerSections": [
    {
      "id": string,
      "label": string,
      "url": string,
      "imageUrl": string,
      "isActive": boolean,
      "sortOrder": number,
      "pageId": string,
      "children": [...]
    }
  ],
  "pages": [...],
  "footerSections": [...],
  "locations": [...],
  "banners": [...]
}
```

### Update Navigation
**Endpoint:** `PUT /clients/{clientId}/navbar`
**Auth:** Required

**Request Body:**
```json
{
  "headerSections": [
    {
      "id": string,
      "label": string,
      "url": string,
      "isActive": boolean,
      "pageId": string,
      "children": [...]
    }
  ],
  "footerSections": [
    {
      "title": string,
      "isActive": boolean,
      "sortOrder": number,
      "links": [
        {
          "label": string,
          "pageId": string,
          "externalUrl": string,
          "sortOrder": number
        }
      ]
    }
  ]
}
```

### Get Navigation Tree
**Endpoint:** `GET /clients/{clientId}/navbar/tree`
**Auth:** Not required (public)

**Response:** Hierarchical navigation tree structure

---

## 3. Homepage Sections

### Get Homepage Sections
**Endpoint:** `GET /clients/{clientId}/homepage`
**Auth:** Required

**Response:**
```json
[
  {
    "id": string,
    "type": "hero" | "promo-tile" | "specials" | "about" | "locations" | "reviews" | "cta" | "content",
    "title": string,
    "content": string,
    "imageUrl": string (URL),
    "buttonText": string,
    "buttonUrl": string,
    "sortOrder": number,
    "isActive": boolean,
    "departmentIds": [string],
    "departments": [...]
  }
]
```

### Save Homepage Sections
**Endpoint:** `PUT /clients/{clientId}/homepage`
**Auth:** Required

**Request Body:** Array of homepage section objects (replaces all existing sections)

### Create Single Section
**Endpoint:** `POST /clients/{clientId}/homepage`
**Auth:** Required

### Delete Section
**Endpoint:** `DELETE /clients/{clientId}/homepage/{id}`
**Auth:** Required

---

## 4. Team Departments

### Get Departments
**Endpoint:** `GET /clients/{clientId}/departments`
**Auth:** Required

**Response:**
```json
[
  {
    "id": string,
    "name": string,
    "sortOrder": number,
    "isActive": boolean
  }
]
```

### Create Department
**Endpoint:** `POST /clients/{clientId}/departments`
**Auth:** Required

### Update Department
**Endpoint:** `PUT /clients/{clientId}/departments/{deptId}`
**Auth:** Required

### Delete Department
**Endpoint:** `DELETE /clients/{clientId}/departments/{deptId}`
**Auth:** Required

---

## 5. Pages

### Get Pages
**Endpoint:** `GET /clients/{clientId}/pages`
**Auth:** Required

**Response:**
```json
[
  {
    "id": string,
    "slug": string,
    "title": string,
    "subtitle": string,
    "content": string (rich text JSON),
    "metaTitle": string,
    "metaDesc": string,
    "ogImage": string (URL),
    "status": "draft" | "published",
    "inNavigation": boolean,
    "navOrder": number,
    "parentId": string,
    "pageType": string,
    "bannerId": string,
    "showEnquiryForm": boolean,
    "showLocationMap": boolean
  }
]
```

### Create Page
**Endpoint:** `POST /clients/{clientId}/pages`
**Auth:** Required

### Update Page
**Endpoint:** `PUT /clients/{clientId}/pages/{id}`
**Auth:** Required

### Delete Page
**Endpoint:** `DELETE /clients/{clientId}/pages/{id}`
**Auth:** Required

---

## 6. Menu (Categories & Items)

### Get Menu Categories with Items
**Endpoint:** `GET /clients/{clientId}/menu-categories`
**Auth:** Required

**Response:**
```json
[
  {
    "id": string,
    "name": string,
    "sortOrder": number,
    "items": [
      {
        "id": string,
        "name": string,
        "description": string,
        "price": number,
        "imageUrl": string (URL),
        "isAvailable": boolean,
        "isFeatured": boolean,
        "sortOrder": number
      }
    ]
  }
]
```

### Create Category
**Endpoint:** `POST /clients/{clientId}/menu-categories`
**Auth:** Required

### Update Category
**Endpoint:** `PUT /clients/{clientId}/menu-categories/{id}`
**Auth:** Required

### Delete Category
**Endpoint:** `DELETE /clients/{clientId}/menu-categories/{id}`
**Auth:** Required

### Get Menu Items
**Endpoint:** `GET /clients/{clientId}/menu-items`
**Auth:** Required

### Create Menu Item
**Endpoint:** `POST /clients/{clientId}/menu-items`
**Auth:** Required

### Update Menu Item
**Endpoint:** `PUT /clients/{clientId}/menu-items/{id}`
**Auth:** Required

### Reorder Menu Items
**Endpoint:** `PUT /clients/{clientId}/menu-items/reorder`
**Auth:** Required

### Delete Menu Item
**Endpoint:** `DELETE /clients/{clientId}/menu-items/{id}`
**Auth:** Required

---

## 7. Locations

### Get Locations
**Endpoint:** `GET /clients/{clientId}/locations`
**Auth:** Required

**Response:**
```json
[
  {
    "id": string,
    "name": string,
    "displayName": string,
    "address": string,
    "suburb": string,
    "city": string,
    "state": string,
    "postcode": string,
    "country": string,
    "phone": string,
    "bookingPhone": string,
    "deliveryPhone": string,
    "lat": string,
    "lng": string,
    "hours": {
      "Monday": { "open": "11:30", "close": "22:00" },
      ...
    },
    "exteriorImages": [string],
    "formEmail": string,
    "showInFooter": boolean,
    "alternateStyling": boolean,
    "galleryImages": [string],
    "isPrimary": boolean,
    "isActive": boolean,
    "deliveryZone": boolean,
    "menuCategories": [string],
    "servicesAvailable": [string]
  }
]
```

### Create Location
**Endpoint:** `POST /clients/{clientId}/locations`
**Auth:** Required

### Update Location
**Endpoint:** `PUT /clients/{clientId}/locations/{id}`
**Auth:** Required

### Delete Location
**Endpoint:** `DELETE /clients/{clientId}/locations/{id}`
**Auth:** Required

---

## 8. Specials & Offers

### Get Specials
**Endpoint:** `GET /clients/{clientId}/specials`
**Auth:** Required

**Response:**
```json
[
  {
    "id": string,
    "title": string,
    "description": string,
    "price": number,
    "imageUrl": string (URL),
    "bannerImage": string (URL),
    "startDate": string (ISO date),
    "endDate": string (ISO date),
    "isActive": boolean,
    "showInNav": boolean
  }
]
```

### Create Special
**Endpoint:** `POST /clients/{clientId}/specials`
**Auth:** Required

### Update Special
**Endpoint:** `PUT /clients/{clientId}/specials/{id}`
**Auth:** Required

### Delete Special
**Endpoint:** `DELETE /clients/{clientId}/specials/{id}`
**Auth:** Required

### Specials Config
**Endpoint:** `GET /clients/{clientId}/specials-config`
**Endpoint:** `PUT /clients/{clientId}/specials-config`
**Auth:** Required

**Data:**
```json
{
  "heading": string,
  "subheading": string,
  "showOnHomepage": boolean,
  "maxItems": number,
  "isActive": boolean
}
```

---

## 9. Banners

### Get Banners
**Endpoint:** `GET /clients/{clientId}/banners`
**Auth:** Required

**Response:**
```json
[
  {
    "id": string,
    "title": string,
    "subtitle": string,
    "text": string,
    "imageUrl": string (URL),
    "buttonText": string,
    "buttonUrl": string,
    "isExternal": boolean,
    "isActive": boolean,
    "location": "home" | "pages" | "both",
    "assignTo": [string],
    "sortOrder": number,
    "widthPx": number,
    "heightPx": number
  }
]
```

### Create Banner
**Endpoint:** `POST /clients/{clientId}/banners`
**Auth:** Required

### Update Banner
**Endpoint:** `PUT /clients/{clientId}/banners/{id}`
**Auth:** Required

### Delete Banner
**Endpoint:** `DELETE /clients/{clientId}/banners/{id}`
**Auth:** Required

---

## 10. Promo Tiles

### Get Promo Tiles
**Endpoint:** `GET /clients/{clientId}/promo-tiles`
**Auth:** Required

**Response:**
```json
[
  {
    "id": string,
    "heading": string,
    "subheading": string,
    "imageUrl": string (URL),
    "linkUrl": string,
    "linkLabel": string,
    "isExternal": boolean,
    "isActive": boolean,
    "sortOrder": number
  }
]
```

### Create Promo Tile
**Endpoint:** `POST /clients/{clientId}/promo-tiles`
**Auth:** Required

### Update Promo Tile
**Endpoint:** `PUT /clients/{clientId}/promo-tiles/{id}`
**Auth:** Required

### Delete Promo Tile
**Endpoint:** `DELETE /clients/{clientId}/promo-tiles/{id}`
**Auth:** Required

### Promo Config
**Endpoint:** `GET /clients/{clientId}/promo-config`
**Endpoint:** `PUT /clients/{clientId}/promo-config`
**Auth:** Required

---

## 11. Featured Menu Config

### Get Featured Config
**Endpoint:** `GET /clients/{clientId}/featured-config`
**Auth:** Required

**Endpoint:** `PUT /clients/{clientId}/featured-config`
**Auth:** Required

**Data:**
```json
{
  "heading": string,
  "subheading": string,
  "isActive": boolean
}
```

---

## 12. Welcome Content

### Get Welcome Content
**Endpoint:** `GET /clients/{clientId}/welcome-content`
**Auth:** Required

**Endpoint:** `PUT /clients/{clientId}/welcome-content`
**Auth:** Required

**Data:**
```json
{
  "subtitle": string,
  "heading": string,
  "text": string,
  "imageUrl": string (URL),
  "ctaText": string,
  "ctaUrl": string,
  "isExternal": boolean,
  "isActive": boolean
}
```

---

## 13. Homepage Layout

### Get Homepage Layout
**Endpoint:** `GET /clients/{clientId}/homepage-layout`
**Auth:** Required

**Endpoint:** `PUT /clients/{clientId}/homepage-layout`
**Auth:** Required

**Data:**
```json
{
  "components": [
    {
      "id": string,
      "type": string,
      "visible": boolean,
      "order": number
    }
  ]
}
```

---

## 14. Custom Text Blocks

### Get Custom Text Blocks
**Endpoint:** `GET /clients/{clientId}/custom-text-blocks`
**Auth:** Required

**Response:**
```json
[
  {
    "id": string,
    "title": string,
    "content": string,
    "isActive": boolean
  }
]
```

### Create Custom Text Block
**Endpoint:** `POST /clients/{clientId}/custom-text-blocks`
**Auth:** Required

### Update Custom Text Block
**Endpoint:** `PUT /clients/{clientId}/custom-text-blocks/{id}`
**Auth:** Required

### Delete Custom Text Block
**Endpoint:** `DELETE /clients/{clientId}/custom-text-blocks/{id}`
**Auth:** Required

---

## 15. Navigation Items (Legacy)

### Get Navigation
**Endpoint:** `GET /clients/{clientId}/navigation`
**Auth:** Required

**Response:**
```json
{
  "flat": [...],
  "tree": [...],
  "active": [...]
}
```

### Get Navigation Tree
**Endpoint:** `GET /clients/{clientId}/navigation/tree`
**Auth:** Required

### Save Navigation
**Endpoint:** `PUT /clients/{clientId}/navigation`
**Auth:** Required

### Create/Update/Delete Navigation Item
**Endpoints:** `POST`, `PATCH`, `DELETE /clients/{clientId}/navigation`
**Auth:** Required

### Reorder Navigation
**Endpoint:** `PUT /clients/{clientId}/navigation/reorder`
**Auth:** Required

---

## 16. Full Site Export (Public)

### Export All Site Data
**Endpoint:** `GET /clients/{id}/export`
**Auth:** Not required (public)

**Response:** Complete site data including:
- Client info
- Locations
- Menu categories & items
- Specials
- Pages
- Banners
- Footer sections with links
- Navigation items
- Homepage sections
- Promo tiles & config
- Featured config
- Welcome content
- Team departments
- Specials config
- Homepage layout
- Custom text blocks
- Site config (settings, colours, analytics, shortcodes, homepage, booking, header, footer, headerCtas, social)
- Reviews (with live Google data integration)

---

## 17. Images

### Upload Image (R2/Cloudflare)
**Endpoint:** `POST /clients/{clientId}/images`
**Auth:** Required
**Content-Type:** `multipart/form-data`

**Request:** `file` field with image

**Response:**
```json
{
  "url": string,
  "filename": string
}
```

### Upload Image (Legacy)
**Endpoint:** `POST /clients/{clientId}/upload`
**Auth:** Required
**Content-Type:** `multipart/form-data`

**Response:** Image URL

---

## 18. Analytics

### Get Analytics Data (GA4)
**Endpoint:** `GET /clients/{clientId}/analytics`
**Auth:** Required

**Query Parameters:**
- `period` - `W` (7 days), `M` (30 days, default), `Y` (365 days)

**Response:**
```json
{
  "uniqueVisitors": number,
  "pageviews": number,
  "bounceRate": string (percentage),
  "avgDuration": string (e.g., "5m 30s"),
  "chartData": [
    {
      "date": string (YYYY-MM-DD),
      "views": number
    }
  ]
}
```

**Requirements:**
- GA4 Property ID must be configured in `config.analytics.ga4PropertyId`
- GA4 Service Account key must be set in environment

---

## 19. Deployment

### Get Deployment Status
**Endpoint:** `GET /clients/{clientId}/deployments`
**Auth:** Required

**Response:**
```json
[
  {
    "id": string,
    "status": string,
    "triggeredBy": string,
    "createdAt": string (ISO date)
  }
]
```

### Trigger Deployment
**Endpoint:** `POST /clients/{clientId}/deploy`
**Auth:** Required

### Netlify - Create Site
**Endpoint:** `POST /clients/{id}/netlify/create`
**Auth:** Required

**Request Body:**
```json
{
  "template": string (optional - defaults to config.colours.theme)
}
```

**Response:**
```json
{
  "success": boolean,
  "siteId": string,
  "siteName": string,
  "customDomain": string
}
```

### Netlify - Add Domain
**Endpoint:** `POST /clients/{id}/netlify/domain`
**Auth:** Required

**Request Body:**
```json
{
  "domain": string
}
```

### Netlify - Get Deploys
**Endpoint:** `GET /clients/{id}/netlify/deploys`
**Auth:** Required

### Netlify - Verify Domain
**Endpoint:** `GET /clients/{id}/netlify/verify`
**Auth:** Required

### Netlify - Rebuild Site
**Endpoint:** `POST /clients/{id}/netlify/rebuild`
**Auth:** Required

### Netlify - Setup Status
**Endpoint:** `GET /clients/{id}/netlify/setup-status`
**Auth:** Required

**Response:**
```json
{
  "siteId": string,
  "siteName": string,
  "customDomain": string,
  "domainLive": boolean,
  "template": string,
  "primaryDomain": string
}
```

### Netlify - Link Repository
**Endpoint:** `POST /clients/{id}/netlify/link-repo`
**Auth:** Required

**Request Body:**
```json
{
  "repo": string
}
```

### Netlify - Get Environment Variables
**Endpoint:** `GET /clients/{id}/netlify/env`
**Auth:** Required

### Netlify - Set Environment Variable
**Endpoint:** `PUT /clients/{id}/netlify/env`
**Auth:** Required

**Request Body:**
```json
{
  "key": string,
  "value": string
}
```

### Netlify - Delete Environment Variable
**Endpoint:** `DELETE /clients/{id}/netlify/env/{key}`
**Auth:** Required

### Netlify - Rollback Deployment
**Endpoint:** `POST /clients/{id}/netlify/rollback/{deployId}`
**Auth:** Required

---

## 20. Legal Documents

### Get Legal Docs
**Endpoint:** `GET /clients/{clientId}/legal-docs`
**Auth:** Required

**Response:**
```json
[
  {
    "id": string,
    "type": "privacy" | "terms" | "cookies",
    "title": string,
    "content": string,
    "urlSlug": string,
    "isActive": boolean
  }
]
```

### Create/Update/Delete Legal Doc
**Endpoints:** `POST`, `PUT`, `DELETE /clients/{clientId}/legal-docs`
**Auth:** Required

---

## 21. Form Submissions

### Get Form Submissions
**Endpoint:** `GET /clients/{clientId}/form-submissions`
**Auth:** Required

**Response:**
```json
[
  {
    "id": string,
    "formType": string,
    "data": object,
    "createdAt": string (ISO date)
  }
]
```

### Create Form Submission
**Endpoint:** `POST /clients/{clientId}/form-submissions`
**Auth:** Not required (public)

---

## 22. Alert Popups

### Get Alerts
**Endpoint:** `GET /clients/{clientId}/alerts`
**Auth:** Required

**Response:**
```json
[
  {
    "id": string,
    "title": string,
    "message": string,
    "startDate": string (ISO date),
    "endDate": string (ISO date),
    "pages": [string],
    "isDismissible": boolean,
    "isActive": boolean
  }
]
```

### Create/Update/Delete Alert
**Endpoints:** `POST`, `PUT`, `DELETE /clients/{clientId}/alerts`
**Auth:** Required

---

## 23. Payment Gateway

### Get Payment Config
**Endpoint:** `GET /clients/{clientId}/payment-gateway`
**Auth:** Required

**Endpoint:** `PUT /clients/{clientId}/payment-gateway`
**Auth:** Required

**Data:**
```json
{
  "provider": "stripe" | "paypal",
  "config": object,
  "isActive": boolean,
  "currency": string,
  "taxRate": number
}
```

---

## 24. Activity Log

### Get Activity Log
**Endpoint:** `GET /activity-log`
**Auth:** Required (admin only)

**Response:**
```json
[
  {
    "id": string,
    "action": string,
    "entity": string,
    "entityName": string,
    "userId": string,
    "userName": string,
    "clientId": string,
    "clientName": string,
    "metadata": object,
    "createdAt": string (ISO date)
  }
]
```

---

## 25. Client Management

### Get All Clients
**Endpoint:** `GET /clients`
**Auth:** Required (admin/manager)

**Response:**
```json
[
  {
    "id": string,
    "name": string,
    "domain": string,
    "status": "draft" | "live",
    "groupId": string,
    "clonable": boolean,
    "createdAt": string
  }
]
```

### Get Client by ID
**Endpoint:** `GET /clients/{id}`
**Auth:** Required

**Response:**
```json
{
  "id": string,
  "name": string,
  "domain": string,
  "status": string,
  "groupId": string,
  "clonable": boolean,
  "locations": [...],
  "createdAt": string
}
```

### Create Client
**Endpoint:** `POST /clients`
**Auth:** Required (admin/manager)

**Request Body:**
```json
{
  "name": string,
  "domain": string,
  "status": string,
  "groupId": string,
  "clonable": boolean
}
```

### Update Client
**Endpoint:** `PUT /clients/{id}`
**Auth:** Required (admin/manager)

### Delete Client
**Endpoint:** `DELETE /clients/{id}`
**Auth:** Required (admin/manager)

### Clone Client
**Endpoint:** `POST /clients/{id}/clone`
**Auth:** Required (admin/manager)

**Request Body:**
```json
{
  "name": string,
  "domain": string
}
```

---

## 26. Form Submissions

### Get Form Submissions
**Endpoint:** `GET /clients/{clientId}/form-submissions`
**Auth:** Required

**Response:**
```json
[
  {
    "id": string,
    "formType": string,
    "data": object,
    "createdAt": string (ISO date)
  }
]
```

### Submit Form (Public)
**Endpoint:** `POST /clients/{clientId}/form-submissions`
**Auth:** Not required (public)

**Request Body:**
```json
{
  "formType": string,
  "data": object
}
```

---

## 27. Platform Configuration (Super Admin)

### Get Global Config
**Endpoint:** `GET /platform`
**Auth:** Required (SUPER_ADMIN only)

**Response:**
```json
{
  "id": "global",
  "settings": object,
  "updatedAt": string
}
```

### Update Global Config
**Endpoint:** `PUT /platform`
**Auth:** Required (SUPER_ADMIN only)

**Request Body:** Settings object

---

## 28. Theme Integration Guide

### For Frontend Theme Developers

When creating a new DineDesk theme, follow this checklist to ensure full integration:

#### Phase 1: Essential Data Fetching (All Themes)

**1. Get Client Data**
```
GET /clients/{clientId}/export
```
This is your primary data source. It returns ALL site data in a single call.

**2. Get Navigation (for header/footer rendering)**
```
GET /clients/{clientId}/navbar
```
Returns header sections, footer sections, pages, locations, and banners.

#### Phase 2: Required Theme Components

**Every theme must implement:**

1. **Header/Navigation**
   - Use `headerSections` from navbar endpoint
   - Support nested menu items (children array)
   - Respect `isActive` flag
   - Handle page links vs external URLs

2. **Footer**
   - Use `footerSections` from navbar endpoint
   - Render footer links (pageId or externalUrl)
   - Show social links from config.social

3. **Homepage**
   - Render sections based on `homeSections` type:
     - `hero` - Main hero banner
     - `promo-tile` - Promotional cards
     - `content` - Rich text content
     - `about` - Team members (type: 'about')
     - `locations` - Location cards
     - `reviews` - Customer reviews
     - `specials` - Special offers
     - `cta` - Call-to-action sections
   - Respect `isActive` and `sortOrder`
   - Handle department associations for team members

4. **Pages**
   - Use `pages` from export endpoint
   - Render rich text content (stored as JSON)
   - Handle meta tags (metaTitle, metaDesc, ogImage)
   - Support page-specific banners
   - Show enquiry forms if `showEnquiryForm` is true
   - Show location maps if `showLocationMap` is true

5. **Menu**
   - Use `menuCategories` with nested `items`
   - Display `price` for each item
   - Show `isFeatured` items prominently
   - Respect `isAvailable` flag
   - Filter by category if needed

6. **Locations**
   - Use `locations` array
   - Display hours (JSON format)
   - Show `isPrimary` location prominently
   - Render gallery images
   - Display contact info (phone, email)
   - Show address with map integration

7. **Specials**
   - Use `specials` array
   - Check `startDate` and `endDate` for validity
   - Show `showInNav` items in navigation
   - Display price and images

8. **Banners**
   - Use `banners` array
   - Check `location` field ("home", "pages", "both")
   - Respect `isActive` flag
   - Handle external vs internal links

9. **Branding/Colors**
   - Apply `config.colours` to theme
   - Use logo from `config.settings.logoLight/logoDark`
   - Apply `config.colours.theme` for theme selection
   - Use favicon from `config.settings.favicon`

10. **Reviews**
    - Use `config.reviews` for review scores
    - Display `googleReviews` array
    - Show rating stars
    - Handle Google Places integration if enabled

#### Phase 3: Optional Features (Enhanced Themes)

**Add these for premium themes:**

1. **Welcome Content**
   - Endpoint: `GET /clients/{clientId}/welcome-content`
   - Render heading, text, image, CTA button

2. **Promo Tiles**
   - Endpoint: `GET /clients/{clientId}/promo-tiles`
   - Config: `GET /clients/{clientId}/promo-config`
   - Render promotional cards with images

3. **Featured Menu**
   - Config: `GET /clients/{clientId}/featured-config`
   - Display featured menu items

4. **Homepage Layout Customization**
   - Endpoint: `GET /clients/{clientId}/homepage-layout`
   - Respect component visibility and order
   - Allow drag-and-drop reordering

5. **Custom Text Blocks**
   - Endpoint: `GET /clients/{clientId}/custom-text-blocks`
   - Render custom content sections

6. **Alert Popups**
   - Endpoint: `GET /clients/{clientId}/alerts`
   - Show based on `pages` array and date range
   - Handle dismissible alerts

7. **Booking Integration**
   - Use `config.booking` for booking settings
   - Render booking buttons in header/hero
   - Show delivery options if enabled
   - Display pickup/delivery info

8. **Social Media**
   - Use `config.social` for social links
   - Show in header utility belt and footer
   - Respect `showInFooter` and `showInUtility` flags

9. **Analytics**
   - Inject GTM script from `config.analytics.gtmId`
   - Inject GA4 from `config.analytics.ga4MeasurementId`
   - Inject Facebook Pixel from `config.analytics.fbPixelId`

10. **Legal Pages**
    - Endpoint: `GET /clients/{clientId}/legal-docs`
    - Render privacy, terms, cookies pages
    - Use `urlSlug` for page URLs

#### Phase 4: Interactive Features

**For themes with user interaction:**

1. **Form Submissions**
   - Endpoint: `POST /clients/{clientId}/form-submissions` (public)
   - Submit contact forms, enquiry forms, etc.

2. **Image Upload**
   - Endpoint: `POST /clients/{clientId}/images` (auth required)
   - Upload images for CMS use

#### Phase 5: Deployment Integration

**For themes supporting auto-deployment:**

1. **Netlify Integration**
   - Use Netlify endpoints for deployment
   - Trigger rebuilds on content changes
   - Manage custom domains
   - Handle environment variables

#### Data Structure Reference

**Export Endpoint Response Structure:**
```json
{
  "client": { ... },
  "locations": [ ... ],
  "menuCategories": [ { "items": [ ... ] } ],
  "menuItems": [ ... ],
  "specials": [ ... ],
  "pages": [ ... ],
  "banners": [ ... ],
  "footerSections": [ { "links": [ ... ] } ],
  "navigationItems": [ ... ],
  "homeSections": [ ... ],
  "promoTiles": [ ... ],
  "promoConfig": { ... },
  "featuredConfig": { ... },
  "welcomeContent": { ... },
  "teamDepartments": [ ... ],
  "specialsConfig": { ... ],
  "homepageLayout": { ... },
  "customTextBlocks": [ ... ],
  "settings": { ... },
  "colours": { ... },
  "analytics": { ... },
  "homepage": { ... },
  "booking": { ... },
  "header": { ... },
  "headerCtas": [ ... ],
  "footer": { ... },
  "social": { ... },
  "reviews": { ... }
}
```

#### Theme Best Practices

1. **Single Source of Truth**
   - Always use the export endpoint for initial data load
   - Cache responses appropriately (5-minute cache recommended)

2. **Error Handling**
   - Handle missing data gracefully
   - Provide fallbacks for optional fields
   - Show loading states during data fetch

3. **Responsive Design**
   - Support mobile, tablet, desktop
   - Test with various content lengths
   - Handle large menus gracefully

4. **Performance**
   - Lazy load images
   - Implement infinite scroll for long lists
   - Optimize bundle size

5. **SEO**
   - Use meta tags from page data
   - Implement structured data
   - Handle OG tags for social sharing

6. **Accessibility**
   - Use semantic HTML
   - Support keyboard navigation
   - Add ARIA labels where needed

#### Quick Start Template

```javascript
// 1. Fetch all site data
const siteData = await fetch(`${API_BASE}/clients/${clientId}/export`).then(r => r.json())

// 2. Extract key data
const { client, settings, colours, pages, menuCategories, locations, homeSections } = siteData

// 3. Apply theme colors
document.documentElement.style.setProperty('--primary', colours.primary)
document.documentElement.style.setProperty('--secondary', colours.secondary)

// 4. Render navigation
renderNavigation(siteData.headerSections)

// 5. Render homepage
renderHomepage(homeSections)

// 6. Render other pages as needed
```

---

## Summary of Key Frontend Features

### Must-Have Features for Website:
1. **Site Config** - Branding, colors, theme
2. **Navigation** - Header menu & footer links
3. **Homepage Sections** - Hero, promo tiles, content, team, locations, reviews
4. **Pages** - Custom pages with rich text content
5. **Menu** - Categories and items with pricing
6. **Locations** - Multiple locations with hours
7. **Specials** - Time-limited offers
8. **Banners** - Promotional banners
9. **Reviews** - Google reviews integration
10. **Booking Integration** - External booking links
11. **Social Media** - Social links
12. **Analytics** - GTM, GA4, Facebook Pixel

### Optional Features:
- Welcome content section
- Homepage layout customization
- Custom text blocks
- Alert popups
- Form submissions
- Payment gateway
- Legal documents
- Netlify deployment integration

### Public Endpoints (No Auth):
- `GET /clients/{id}/export` - Full site data (PRIMARY DATA SOURCE)
- `GET /clients/{clientId}/navbar` - Navigation & footer
- `POST /clients/{clientId}/form-submissions` - Submit forms

### Authentication:
- `POST /auth/login` - Get bearer token
- Header: `Authorization: Bearer {token}`
