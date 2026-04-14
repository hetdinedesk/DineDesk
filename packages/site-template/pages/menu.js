import Head from 'next/head'
import { getSiteData } from '../lib/api'
import { replaceShortcodes } from '../lib/shortcodes'
import { CMSProvider } from '../contexts/CMSContext'
import { Header } from '../components/theme-d1/Header'
import { Footer } from '../components/theme-d1/Footer'
import MenuTemplate from '../templates/theme-d1/MenuTemplate.jsx'

export async function getServerSideProps({ query }) {
  // Reject literal string "undefined" as invalid site ID
  const rawSite = query.site
  const siteId = (rawSite && rawSite !== 'undefined' && rawSite.trim() !== '')
    ? rawSite
    : (process.env.SITE_ID || '')
  const data = await getSiteData(siteId)
  return { props: { data } }
}

export default function Page({ data }) {
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
  const banner = page?.bannerId ? (data?.banners || []).find((b) => b.id === page.bannerId) : null

  return (
    <CMSProvider data={data}>
      <Head>
        <title>{`${sc(title)}`}</title>
        {desc && <meta name="description" content={sc(desc)} />}
        <meta property="og:title" content={sc(title)} />
        {desc && <meta property="og:description" content={sc(desc)} />}
        {ogImage && <meta property="og:image" content={ogImage} />}
      </Head>
      <Header />
      <MenuTemplate data={data} page={page} banner={banner} />
      <Footer />
    </CMSProvider>
  )
}
