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
  const isPreview = !!query.site
  const siteId = query.site || process.env.SITE_ID || ''
  
  const data = await getSiteData(siteId)
  
  const template = data.colours?.theme
    || process.env.SITE_TEMPLATE
    || 'theme-v1'  // Default to Fine Dining theme
  const siteType = data.siteType || 'restaurant'
  
  // For live site (Netlify), tell it to revalidate every 60 seconds
  // This gives us near-real-time updates without full rebuilds
  const revalidate = isPreview ? undefined : 60
  
  return {
    props: { data, template, colours: data.colours || null, siteType, isPreview },
    ...(revalidate && { revalidate })
  }
}

export default function HomePage({ data, template, siteType }) {
  // Default to theme-d1 if template not found
  const Template = TEMPLATES[template] || ThemeD1Home
  return <Template data={data} siteType={siteType}/>
}