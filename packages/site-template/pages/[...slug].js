import Head from 'next/head'
import { getSiteData } from '../lib/api'
import { replaceShortcodes } from '../lib/shortcodes'
import { CMSProvider } from '../contexts/CMSContext'
import DOMPurify from 'dompurify'
import { useState, useEffect } from 'react'
import { Suspense } from 'react'

// DOMPurify configuration for allowed tags and attributes
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'a', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
  SANITIZE_DOM: true,
  KEEP_CONTENT: true
}

// Clean HTML content using DOMPurify for security
const cleanPageContent = (html) => {
  if (!html) return ''
  
  // DOMPurify only works in browser, not SSR
  if (typeof window !== 'undefined' && DOMPurify) {
    return DOMPurify.sanitize(html, DOMPURIFY_CONFIG)
  }
  
  // Server-side fallback: basic HTML escaping
  // Remove script tags and event handlers as basic protection
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
}

// Dynamic theme loading for templates
function DynamicTemplateLoader({ themeKey, templateName, data, page, banner }) {
  const [Header, setHeader] = useState(null)
  const [Footer, setFooter] = useState(null)
  const [FloatingReviewWidget, setFloatingReviewWidget] = useState(null)
  const [Template, setTemplate] = useState(null)

  useEffect(() => {
    const theme = themeKey || 'theme-d1'
    
    Promise.all([
      import(`../components/${theme}/Header`),
      import(`../components/${theme}/Footer`),
      import(`../components/${theme}/FloatingReviewWidget`),
      import(`../templates/${theme}/${templateName}`)
    ]).then(([headerModule, footerModule, widgetModule, templateModule]) => {
      setHeader(() => headerModule.Header)
      setFooter(() => footerModule.Footer)
      setFloatingReviewWidget(() => widgetModule.default)
      setTemplate(() => templateModule.default)
    }).catch(() => {
      // Fallback to theme-d1
      Promise.all([
        import('../components/theme-d1/Header'),
        import('../components/theme-d1/Footer'),
        import('../components/theme-d1/FloatingReviewWidget'),
        import(`../templates/theme-d1/${templateName}`)
      ]).then(([headerModule, footerModule, widgetModule, templateModule]) => {
        setHeader(() => headerModule.Header)
        setFooter(() => footerModule.Footer)
        setFloatingReviewWidget(() => widgetModule.default)
        setTemplate(() => templateModule.default)
      })
    })
  }, [themeKey, templateName])

  return (
    <>
      {Header && <Header />}
      {Template && <Template data={data} page={page} banner={banner} />}
      {Footer && <Footer />}
      {FloatingReviewWidget && <FloatingReviewWidget />}
    </>
  )
}

export async function getServerSideProps({ query, params }) {
  const slugParts = Array.isArray(params?.slug) ? params.slug : []
  const slug = slugParts.join('/').replace(/^\//, '')

  // Don't fetch data for common static assets that might fall through to dynamic routes
  if (slug === 'favicon.ico' || slug.startsWith('_next/')) {
    return { notFound: true }
  }

  // Reject literal string "undefined" as invalid site ID
  const rawSite = query.site
  const siteId = (rawSite && rawSite !== 'undefined' && rawSite.trim() !== '')
    ? rawSite
    : (process.env.NEXT_PUBLIC_SITE_ID || process.env.SITE_ID || '')
  const data = await getSiteData(siteId)

  const template = data.colours?.theme || process.env.SITE_TEMPLATE || 'theme-d1'

  return {
    props: {
      data,
      colours: data.colours || null,
      slug,
      template
    }
  }
}

export default function DynamicPage({ data, slug, template }) {
  const pages = data?.pages || []
  const shortcodes = data?.shortcodes || {}
  const settings = data?.settings || {}

  const norm = (s) => String(s || '').replace(/^\//, '')
  const page = pages.find((p) => norm(p.slug) === norm(slug))

  // For hardcoded routes, also try to find page by pageType if slug lookup failed
  const slugNorm = norm(slug)
  const hardcodedPageType =
    slugNorm === 'menu' ? 'menu' :
    slugNorm === 'specials' ? 'specials' :
    slugNorm === 'team' ? 'team' :
    slugNorm === 'locations' ? 'locations' : null
  const hardcodedPage = hardcodedPageType ? pages.find((p) => p.pageType === hardcodedPageType) : null

  // Use page from slug lookup, or fall back to hardcoded page type lookup
  const effectivePage = page || hardcodedPage

  const sc = (text) => replaceShortcodes(text || '', shortcodes)

  const siteName = settings.displayName || settings.restaurantName || data?.client?.name || ''
  const title = effectivePage?.metaTitle || effectivePage?.title || siteName || 'Page'
  const desc = effectivePage?.metaDesc || ''
  const ogImage = effectivePage?.ogImage || null

  const banner = effectivePage?.bannerId ? (data?.banners || []).find((b) => b.id === effectivePage.bannerId) : null
  const pageType = effectivePage?.pageType || null

  // pageType takes precedence; slug is the fallback for legacy routes
  // Locked templates: Menu, Specials, Team, Locations
  const isMenu     = pageType === 'menu'     || norm(slug) === 'menu'
  const isSpecials = pageType === 'specials' || norm(slug) === 'specials'
  const isTeam     = pageType === 'team'     || norm(slug) === 'team'
  const isLocations= pageType === 'locations'|| norm(slug) === 'locations'
  const isHardcoded = isMenu || isSpecials || isTeam || isLocations

  const domain = data?.client?.domain || ''
  const siteUrl = domain ? (domain.startsWith('http') ? domain : `https://${domain}`) : ''
  const canonicalUrl = siteUrl && slug ? `${siteUrl}/${slug}` : ''

  const headTags = (
    <Head>
      <title>{sc(title)}</title>
      {desc && <meta name="description" content={sc(desc)} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:title" content={sc(title)} />
      {desc && <meta property="og:description" content={sc(desc)} />}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="twitter:title" content={sc(title)} />
      {desc && <meta name="twitter:description" content={sc(desc)} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Head>
  )

  // Hardcoded page types ALWAYS use their own templates (toggles don't affect them)
  if (isMenu) {
    return (
      <>
        {headTags}
        <Suspense fallback={<div>Loading...</div>}>
          <DynamicTemplateLoader themeKey={template} templateName="MenuTemplate" data={data} page={effectivePage} banner={banner} />
        </Suspense>
      </>
    )
  }

  if (isSpecials) {
    return (
      <>
        {headTags}
        <Suspense fallback={<div>Loading...</div>}>
          <DynamicTemplateLoader themeKey={template} templateName="SpecialsTemplate" data={data} page={effectivePage} banner={banner} />
        </Suspense>
      </>
    )
  }

  if (isTeam) {
    return (
      <>
        {headTags}
        <Suspense fallback={<div>Loading...</div>}>
          <DynamicTemplateLoader themeKey={template} templateName="TeamTemplate" data={data} page={effectivePage} banner={banner} />
        </Suspense>
      </>
    )
  }

  if (isLocations) {
    return (
      <>
        {headTags}
        <Suspense fallback={<div>Loading...</div>}>
          <DynamicTemplateLoader themeKey={template} templateName="LocationsTemplate" data={data} page={effectivePage} banner={banner} />
        </Suspense>
      </>
    )
  }

  if (!page) {
    return (
      <>
        <Head>
          <title>{siteName ? `${siteName} — Not Found` : 'Not Found'}</title>
        </Head>
        <Suspense fallback={<div>Loading...</div>}>
          <DynamicTemplateLoader themeKey={template} templateName="MenuTemplate" data={data} page={page} banner={banner} />
        </Suspense>
      </>
    )
  }

  // For custom pages only (not hardcoded types), check for form/map toggles
  const showEnquiryForm = effectivePage?.showEnquiryForm || false
  const showLocationMap = effectivePage?.showLocationMap || false

  if (!isHardcoded && (showEnquiryForm || showLocationMap)) {
    return (
      <>
        {headTags}
        <Suspense fallback={<div>Loading...</div>}>
          <DynamicTemplateLoader themeKey={template} templateName="CustomTemplate" data={data} page={effectivePage} banner={banner} />
        </Suspense>
      </>
    )
  }

  // Simple custom page layout (no toggles enabled)
  const bannerImg = banner?.imageUrl || effectivePage?.ogImage || null

  return (
    <>
      {headTags}
      <Suspense fallback={<div>Loading...</div>}>
        <DynamicTemplateLoader themeKey={template} templateName="CustomTemplate" data={data} page={effectivePage} banner={banner} />
      </Suspense>
    </>
  )
}

