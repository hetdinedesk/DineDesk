import { getSiteData } from '../lib/api'
import ThemeD1Home from '../templates/theme-d1/HomePage'

// Theme → Template mapping
// All themes currently use ThemeD1 as the new default
// Future: Each theme can have its own template component
const TEMPLATES = {
  // Purpose-built themes (all use theme-d1 for now)
  'theme-v1':      ThemeD1Home,  // Override old default with new theme
  'theme-d1':      ThemeD1Home,
  'food-truck':    ThemeD1Home,
  'cafe':          ThemeD1Home,
  'casual-family': ThemeD1Home,
  'modern-trendy': ThemeD1Home,
  'delivery':      ThemeD1Home,
  // Legacy theme keys (for backwards compatibility)
  'urban-bistro':  ThemeD1Home,
  'noir-fine-dine': ThemeD1Home,
  'garden-fresh':  ThemeD1Home,
}

// Detect if running in CMS preview mode (has query.site param)
// Netlify doesn't support query params in getStaticProps, so we use SSR for preview
export async function getServerSideProps({ query, req }) {
  // Check for preview mode (CMS with ?site= param)
  // Reject literal string "undefined" as invalid site ID
  const rawSite = query.site
  const isValidSite = rawSite && rawSite !== 'undefined' && rawSite.trim() !== ''
  const isPreview = isValidSite
  const siteId = isValidSite ? rawSite : (process.env.SITE_ID || '')

  const data = await getSiteData(siteId)
  
  const template = data.colours?.theme
    || process.env.SITE_TEMPLATE
    || 'theme-v1'  // Default to Fine Dining theme
  const siteType = data.siteType || 'restaurant'
  
  return {
    props: { data, template, colours: data.colours || null, siteType, isPreview }
  }
}

export default function HomePage({ data, template, siteType }) {
  // Find Home page record to get its banner/settings
  const pages = data?.pages || []
  const homePage = pages.find((p) => p.pageType === 'home' || p.slug === '' || p.slug === '/')
  
  // Merge home page data into template data
  const enhancedData = {
    ...data,
    _homePage: homePage || null,
    // If home page has a banner, make it available
    _homeBanner: homePage?.bannerId 
      ? (data?.banners || []).find((b) => b.id === homePage.bannerId)
      : null
  }
  
  // Default to theme-d1 if template not found
  const Template = TEMPLATES[template] || ThemeD1Home
  return <Template data={enhancedData} siteType={siteType}/>
}