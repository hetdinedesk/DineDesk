import Head from 'next/head'
import { getSiteData } from '../lib/api'
import { replaceShortcodes } from '../lib/shortcodes'
import { CMSProvider } from '../contexts/CMSContext'
import { Header } from '../components/theme-d1/Header'
import { Footer } from '../components/theme-d1/Footer'
import { ContactTemplate } from '../templates/theme-d1/ContactTemplate'

export async function getServerSideProps({ query }) {
  const siteId = query.site || process.env.SITE_ID || ''
  const data = await getSiteData(siteId)
  return { props: { data } }
}

export default function Page({ data }) {
  const pages = data?.pages || []
  const shortcodes = data?.shortcodes || {}
  const settings = data?.settings || {}
  const slug = 'contact'

  const norm = (s) => String(s || '').replace(/^\//, '')
  const page = pages.find((p) => norm(p.slug) === norm(slug) || norm(p.slug) === 'contact-us')
  const sc = (text) => replaceShortcodes(text || '', shortcodes)

  const siteName = settings.displayName || settings.restaurantName || data?.client?.name || ''
  const title = page?.metaTitle || page?.title || siteName || 'Contact Us'
  const desc = page?.metaDesc || ''
  const ogImage = page?.ogImage || null

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
      <ContactTemplate />
      <Footer />
    </CMSProvider>
  )
}
