import Head from 'next/head'
import { getSiteData } from '../lib/api'
import { replaceShortcodes } from '../lib/shortcodes'
import { CMSProvider } from '../contexts/CMSContext'
import { useState, useEffect } from 'react'
import { Suspense } from 'react'

// Dynamic theme loading
function DynamicMenuTemplate({ themeKey, data, page, banner }) {
  const [Header, setHeader] = useState(null)
  const [Footer, setFooter] = useState(null)
  const [MenuTemplate, setMenuTemplate] = useState(null)

  useEffect(() => {
    const theme = themeKey || 'theme-d1'
    
    Promise.all([
      import(`../components/${theme}/Header`),
      import(`../components/${theme}/Footer`),
      import(`../templates/${theme}/MenuTemplate`)
    ]).then(([headerModule, footerModule, templateModule]) => {
      setHeader(() => headerModule.Header)
      setFooter(() => footerModule.Footer)
      setMenuTemplate(() => templateModule.default)
    }).catch(() => {
      // Fallback to theme-d1
      Promise.all([
        import('../components/theme-d1/Header'),
        import('../components/theme-d1/Footer'),
        import('../templates/theme-d1/MenuTemplate')
      ]).then(([headerModule, footerModule, templateModule]) => {
        setHeader(() => headerModule.Header)
        setFooter(() => footerModule.Footer)
        setMenuTemplate(() => templateModule.default)
      })
    })
  }, [themeKey])

  return (
    <>
      {Header && <Header />}
      {MenuTemplate && <MenuTemplate data={data} page={page} banner={banner} />}
      {Footer && <Footer />}
    </>
  )
}

export async function getServerSideProps({ query }) {
  // Reject literal string "undefined" as invalid site ID
  const rawSite = query.site
  const siteId = (rawSite && rawSite !== 'undefined' && rawSite.trim() !== '')
    ? rawSite
    : (process.env.SITE_ID || '')
  const data = await getSiteData(siteId)

  const template = data.colours?.theme || process.env.SITE_TEMPLATE || 'theme-d1'

  return { props: { data, template } }
}

export default function Page({ data, template }) {
  const pages = data?.pages || []
  const shortcodes = data?.shortcodes || {}
  const settings = data?.settings || {}
  const slug = 'menu'

  const norm = (s) => String(s || '').replace(/^\//, '')
  const page = pages.find((p) => norm(p.slug) === norm(slug))
  const sc = (text) => replaceShortcodes(text || '', shortcodes)

  const siteName = settings.displayName || settings.restaurantName || data?.client?.name || ''
  const title = page?.metaTitle || page?.title || siteName || 'Our Menu'
  const desc = page?.metaDesc || ''
  const ogImage = page?.ogImage || null

  // Get banner if selected for this page
  const banner = page?.bannerId ? (data?.banners || []).find((b) => String(b.id) === String(page.bannerId)) : null

  return (
    <CMSProvider data={data}>
      <Head>
        <title>{`${sc(title)}`}</title>
        {desc && <meta name="description" content={sc(desc)} />}
        <meta property="og:title" content={sc(title)} />
        {desc && <meta property="og:description" content={sc(desc)} />}
        {ogImage && <meta property="og:image" content={ogImage} />}
      </Head>
      <Suspense fallback={<div>Loading...</div>}>
        <DynamicMenuTemplate themeKey={template} data={data} page={page} banner={banner} />
      </Suspense>
    </CMSProvider>
  )
}
