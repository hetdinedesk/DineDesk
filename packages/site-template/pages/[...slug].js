import Head from 'next/head'
import { getSiteData } from '../lib/api'
import { replaceShortcodes } from '../lib/shortcodes'
import { CMSProvider } from '../contexts/CMSContext'
import DOMPurify from 'dompurify'
import { useState, useEffect } from 'react'
import { Suspense } from 'react'

// Clean HTML content - strip complex structures, keep basic text elements
const cleanPageContent = (html) => {
  if (!html) return ''
  
  // Create a temporary div to parse HTML
  const tempDiv = typeof document !== 'undefined' ? document.createElement('div') : { innerText: '' }
  if (typeof document !== 'undefined') {
    tempDiv.innerHTML = html
  }
  
  // Extract text content but preserve basic structure
  // We'll rebuild clean HTML with only allowed elements
  const allowedTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'a']
  
  let cleanHtml = html
  
  // Remove all div, section, article, etc. tags but keep their content
  cleanHtml = cleanHtml.replace(/<(div|section|article|aside|header|footer|nav|main|figure|figcaption|span)([^>]*)>([\s\S]*?)<\/\1>/gi, '$3')
  
  // Remove grid, flex, and layout-related classes
  cleanHtml = cleanHtml.replace(/\sclass="[^"]*?(grid|flex|col|row|gap|padding|margin|w-|h-|min-|max-|bg-|text-|shadow|rounded|border|transform|opacity)[^"]*"/gi, '')
  
  // Remove inline styles
  cleanHtml = cleanHtml.replace(/\sstyle="[^"]*"/gi, '')
  
  // Remove empty paragraphs
  cleanHtml = cleanHtml.replace(/<p>\s*<\/p>/gi, '')
  cleanHtml = cleanHtml.replace(/<p><\/p>/gi, '')
  
  // Clean up extra whitespace
  cleanHtml = cleanHtml.replace(/\s+/g, ' ')
  
  // Ensure paragraphs are properly wrapped
  cleanHtml = cleanHtml.replace(/([^.!?])\n([^<])/g, '$1<p>$2')
  
  return cleanHtml
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

  const headTags = (
    <Head>
      <title>{sc(title)}</title>
      {desc && <meta name="description" content={sc(desc)} />}
      <meta property="og:title" content={sc(title)} />
      {desc && <meta property="og:description" content={sc(desc)} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
    </Head>
  )

  // Hardcoded page types ALWAYS use their own templates (toggles don't affect them)
  if (isMenu) {
    return (
      <CMSProvider data={data}>
        {headTags}
        <Suspense fallback={<div>Loading...</div>}>
          <DynamicTemplateLoader themeKey={template} templateName="MenuTemplate" data={data} page={effectivePage} banner={banner} />
        </Suspense>
      </CMSProvider>
    )
  }

  if (isSpecials) {
    return (
      <CMSProvider data={data}>
        {headTags}
        <Suspense fallback={<div>Loading...</div>}>
          <DynamicTemplateLoader themeKey={template} templateName="SpecialsTemplate" data={data} page={effectivePage} banner={banner} />
        </Suspense>
      </CMSProvider>
    )
  }

  if (isTeam) {
    return (
      <CMSProvider data={data}>
        {headTags}
        <Suspense fallback={<div>Loading...</div>}>
          <DynamicTemplateLoader themeKey={template} templateName="TeamTemplate" data={data} page={effectivePage} banner={banner} />
        </Suspense>
      </CMSProvider>
    )
  }

  if (isLocations) {
    return (
      <CMSProvider data={data}>
        {headTags}
        <Suspense fallback={<div>Loading...</div>}>
          <DynamicTemplateLoader themeKey={template} templateName="LocationsTemplate" data={data} page={effectivePage} banner={banner} />
        </Suspense>
      </CMSProvider>
    )
  }

  if (!page) {
    return (
      <CMSProvider data={data}>
        <Head>
          <title>{siteName ? `${siteName} — Not Found` : 'Not Found'}</title>
        </Head>
        <Suspense fallback={<div>Loading...</div>}>
          <DynamicTemplateLoader themeKey={template} templateName="MenuTemplate" data={data} page={page} banner={banner} />
        </Suspense>
      </CMSProvider>
    )
  }

  // For custom pages only (not hardcoded types), check for form/map toggles
  const showEnquiryForm = effectivePage?.showEnquiryForm || false
  const showLocationMap = effectivePage?.showLocationMap || false

  if (!isHardcoded && (showEnquiryForm || showLocationMap)) {
    return (
      <CMSProvider data={data}>
        {headTags}
        <Suspense fallback={<div>Loading...</div>}>
          <DynamicTemplateLoader themeKey={template} templateName="CustomTemplate" data={data} page={effectivePage} banner={banner} />
        </Suspense>
      </CMSProvider>
    )
  }

  // Simple custom page layout (no toggles enabled)
  const bannerImg = banner?.imageUrl || effectivePage?.ogImage || null

  return (
    <CMSProvider data={data}>
      {headTags}
      <Suspense fallback={<div>Loading...</div>}>
        <DynamicTemplateLoader themeKey={template} templateName="CustomTemplate" data={data} page={effectivePage} banner={banner} />
      </Suspense>
    </CMSProvider>
  )
}

