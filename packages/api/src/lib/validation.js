const { z } = require('zod')

// Colour hex validation
const colourHex = z.string().regex(/^#[0-9A-Fa-f]{6}$/)

// SiteConfig validation schemas
const coloursSchema = z.object({
  theme: z.string().optional(),
  primary: colourHex.optional(),
  secondary: colourHex.optional(),
  headerBg: colourHex.optional(),
  headerText: colourHex.optional(),
  navBg: colourHex.optional(),
  navText: colourHex.optional(),
  bodyBg: colourHex.optional(),
  bodyText: colourHex.optional(),
  ctaBg: colourHex.optional(),
  ctaText: colourHex.optional(),
  accentBg: colourHex.optional(),
  utilityBeltBg: colourHex.optional(),
  utilityBeltText: colourHex.optional(),
}).optional()

const optionalUrl = z.string().url().optional().nullable().or(z.literal(''))
const optionalEmail = z.string().email().optional().nullable().or(z.literal(''))

const settingsSchema = z.object({
  restaurantName: z.string().max(100).optional().nullable(),
  displayName: z.string().max(100).optional().nullable(),
  defaultEmail: optionalEmail,
  abn: z.string().optional().nullable(),
  siteType: z.enum(['restaurant', 'cafe', 'foodtruck', 'delivery', 'quickserve', 'catering', 'mealprep', 'finedine']).optional().nullable(),
  indexing: z.enum(['allowed', 'blocked']).optional().nullable(),
  phone: z.string().optional().nullable(),
  suburb: z.string().optional().nullable(),
  logoLight: optionalUrl,
  logoDark: optionalUrl,
  favicon: optionalUrl,
  mapMarker: optionalUrl,
  country: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
}).optional().nullable()

const headerCtaSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1).optional(),
  type: z.enum(['internal', 'external', 'phone', 'email', 'url']).optional(),
  value: z.string().optional(),
  variant: z.enum(['primary', 'secondary', 'outline', 'text']).optional(),
  active: z.boolean().optional(),
  workingTitle: z.string().optional(),
}).passthrough().optional()

const headerSchema = z.object({
  type: z.enum(['standard-full', 'sticky', 'minimal', 'split', 'transparent']).optional(),
  utilityBelt: z.boolean().optional(),
  utilityItems: z.object({
    order: z.array(z.string()).optional(),
  }).catchall(z.boolean()).optional(),
  headerTheme: z.enum(['light', 'dark', 'not-set']).optional(),
}).optional()

const footerSchema = z.object({
  tagline: z.string().optional().nullable(),
  copyrightText: z.string().optional().nullable(),
  legalLinks: z.array(z.object({
    label: z.string(),
    href: z.string(),
  })).optional().nullable(),
}).optional().nullable()

const socialSchema = z.object({
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  linkedin: z.string().optional(),
  showInFooter: z.boolean().optional(),
  showInUtility: z.boolean().optional(),
}).optional()

const reviewsSchema = z.object({
  overallScore: z.number().min(0).max(5).optional(),
  googleScore: z.number().min(0).max(5).optional(),
  googleCount: z.number().optional(),
  tripScore: z.number().min(0).max(5).optional(),
  tripCount: z.number().optional(),
  fbScore: z.number().min(0).max(5).optional(),
  fbCount: z.number().optional(),
  googlePlaceId: z.string().optional(),
  minStars: z.number().min(1).max(5).optional(),
  enableHeader: z.boolean().optional(),
  enableFooter: z.boolean().optional(),
  enableFloating: z.boolean().optional(),
  carouselHeading: z.string().optional(),
  carouselSubHeading: z.string().optional(),
  carouselContent: z.string().optional(),
  showReviewsCarousel: z.boolean().optional(),
  alternateStyles: z.boolean().optional(),
  ctas: z.array(headerCtaSchema).optional(),
  // Google Reviews configuration
  averageRating: z.number().min(0).max(5).optional(),
  totalReviews: z.number().optional(),
  showFloatingWidget: z.boolean().optional(),
  showReviewCta: z.boolean().optional(),
  reviews: z.array(z.object({
    id: z.string(),
    rating: z.number().min(1).max(5),
    content: z.string(),
    author: z.string(),
    date: z.string(),
    platform: z.string().optional()
  })).optional()
}).optional()

const bookingSchema = z.object({
  enabled: z.boolean().optional(),
  confirmationMethod: z.string().optional(),
  bookingUrl: optionalUrl,
  bookingPhone: z.string().optional(),
  bookLabel: z.string().optional(),
  bookingPlatform: z.string().optional(),
  bookConfirmMsg: z.string().optional(),
  orderUrl: optionalUrl,
  orderLabel: z.string().optional(),
  uberEatsUrl: optionalUrl,
  doorDashUrl: optionalUrl,
  menulogUrl: optionalUrl,
  showInHeader: z.boolean().optional(),
  showInUtility: z.boolean().optional(),
  showInHero: z.boolean().optional(),
  showOnLocations: z.boolean().optional(),
  showInFooter: z.boolean().optional(),
  showOrderBtn: z.boolean().optional(),
  showInNav: z.boolean().optional(),
  useDirectForm: z.boolean().optional(),
  minParty: z.union([z.number(), z.string()]).optional(),
  maxParty: z.union([z.number(), z.string()]).optional(),
  maxTables: z.union([z.number(), z.string()]).optional(),
  advanceNotice: z.union([z.number(), z.string()]).optional(),
  maxDaysAhead: z.union([z.number(), z.string()]).optional(),
  slotInterval: z.union([z.number(), z.string()]).optional(),
  notifyEmail: optionalEmail,
  pickupEnabled: z.boolean().optional(),
  deliveryEnabled: z.boolean().optional(),
  dineInEnabled: z.boolean().optional(),
  pickupTime: z.string().optional(),
  minOrder: z.union([z.number(), z.string()]).optional(),
  deliveryFee: z.union([z.number(), z.string()]).optional(),
  deliveryTime: z.string().optional(),
  freeDeliveryOver: z.union([z.number(), z.string()]).optional(),
}).catchall(z.any()).passthrough().optional()

const shortcodesSchema = z.object({
  _overrides: z.record(z.string()).optional(),
}).catchall(z.string()).optional()

const analyticsSchema = z.object({
  gtmId: z.string().optional(),
  ga4MeasurementId: z.string().optional(),
  fbPixelId: z.string().optional(),
  googleVerification: z.string().optional(),
  fbDomainVerification: z.string().optional(),
}).optional()

const homepageSchema = z.object({
  heroTitle: z.string().optional(),
  heroSubtext: z.string().optional(),
  heroBgImage: optionalUrl,
  heroBadge: z.string().optional(),
  stat1: z.string().optional(),
  stat2: z.string().optional(),
  stat3: z.string().optional(),
  feature1: z.string().optional(),
  feature2: z.string().optional(),
  feature3: z.string().optional(),
  feature4: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImage: optionalUrl,
}).optional()

const netlifySchema = z.object({
  siteId: z.string().optional(),
  previewUrl: optionalUrl,
  buildHook: optionalUrl,
  template: z.string().optional(),
  primaryDomain: z.string().optional(),
  domainLive: z.boolean().optional(),
}).optional()

const orderingSchema = z.object({
  enabled: z.boolean().optional(),
  taxRate: z.number().optional(),
  taxLabel: z.string().optional(),
  minOrderAmount: z.number().optional(),
  deliveryFee: z.number().optional(),
  freeDeliveryThreshold: z.number().optional(),
  estimatedPrepTime: z.string().optional(),
  acceptingOrders: z.boolean().optional(),
  pauseMessage: z.string().optional(),
  orderTypes: z.array(z.string()).optional(),
  requirePhone: z.boolean().optional(),
  requireEmail: z.boolean().optional(),
  notificationEmail: z.string().optional().nullable(),
  checkoutMessage: z.string().optional(),
  successMessage: z.string().optional(),
}).optional()

const notesSchema = z.object({
  general: z.string().optional(),
  stock: z.string().optional(),
}).optional()

// Main SiteConfig update schema
const siteConfigUpdateSchema = z.object({
  version: z.number().int().positive().optional(),
  settings: settingsSchema,
  colours: coloursSchema,
  header: headerSchema,
  headerCtas: z.array(headerCtaSchema).optional(),
  footer: footerSchema,
  social: socialSchema,
  reviews: reviewsSchema,
  booking: bookingSchema,
  shortcodes: shortcodesSchema,
  analytics: analyticsSchema,
  homepage: homepageSchema,
  netlify: netlifySchema,
  notes: notesSchema,
  ordering: orderingSchema,
}).partial()

// Validation function
function validateSiteConfig(data) {
  const result = siteConfigUpdateSchema.safeParse(data)
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
    return { valid: false, errors }
  }

  return { valid: true, data: result.data }
}

module.exports = {
  validateSiteConfig,
  siteConfigUpdateSchema,
  coloursSchema,
  settingsSchema,
  headerSchema,
  footerSchema,
  socialSchema,
  reviewsSchema,
  bookingSchema,
  analyticsSchema,
}
