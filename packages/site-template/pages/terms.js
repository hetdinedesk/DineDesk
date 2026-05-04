import Head from 'next/head'
import { getSiteData } from '../lib/api'
import { CMSProvider } from '../contexts/CMSContext'
import { Header as ThemeD1Header } from '../components/theme-d1/Header'
import { Footer as ThemeD1Footer } from '../components/theme-d1/Footer'
import { Header as ThemeD2Header } from '../components/theme-d2/Header'
import { Footer as ThemeD2Footer } from '../components/theme-d2/Footer'
import { Header as ThemeD3Header } from '../components/theme-d3/Header'
import { Footer as ThemeD3Footer } from '../components/theme-d3/Footer'

// Theme component mapping
const THEME_COMPONENTS = {
  'theme-v1': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'theme-d1': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'theme-d2': { Header: ThemeD2Header, Footer: ThemeD2Footer },
  'theme-d3': { Header: ThemeD3Header, Footer: ThemeD3Footer },
  'cafe': { Header: ThemeD3Header, Footer: ThemeD3Footer },
  'food-truck': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'casual-family': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'modern-trendy': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'delivery': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'urban-bistro': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'noir-fine-dine': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'garden-fresh': { Header: ThemeD1Header, Footer: ThemeD1Footer },
}

export async function getServerSideProps({ query }) {
  const rawSite = query.site
  const siteId = (rawSite && rawSite !== 'undefined' && rawSite.trim() !== '')
    ? rawSite
    : (process.env.SITE_ID || '')
  const data = await getSiteData(siteId)
  const template = data.colours?.theme || process.env.SITE_TEMPLATE || 'theme-d1'
  return { props: { data, template } }
}

export default function TermsPage({ data, template }) {
  const legalDoc = data?.legalDocs?.find(doc => doc.type === 'terms')
  const content = legalDoc?.content || 'Terms & Conditions content not available.'
  const siteName = data?.settings?.displayName || data?.settings?.restaurantName || data?.client?.name || ''

  // Get correct Header/Footer for theme
  const normalizedTemplate = template?.replace(/\s+/g, '-') || 'theme-d1'
  const { Header, Footer } = THEME_COMPONENTS[normalizedTemplate] || THEME_COMPONENTS['theme-d1']

  return (
    <CMSProvider data={data}>
      <Head>
        <title>Terms & Conditions - {siteName}</title>
        <meta name="description" content="Terms & Conditions" />
      </Head>
      <Header />
      <main style={{ minHeight: '60vh', padding: '80px 20px 40px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem' }}>Terms & Conditions</h1>
          <div style={{ lineHeight: 1.8, color: '#333' }}>
            {content.split('\n').map((line, index) => {
              // Skip the first heading since we already display it as h1
              if (index === 0 && line.startsWith('# ')) return null
              if (line.startsWith('# ')) {
                return <h2 key={index} style={{ fontSize: '1.8rem', fontWeight: 600, marginTop: '2rem', marginBottom: '1rem' }}>{line.replace('# ', '')}</h2>
              }
              if (line.startsWith('## ')) {
                return <h3 key={index} style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.75rem' }}>{line.replace('## ', '')}</h3>
              }
              if (line.startsWith('- ')) {
                return <li key={index} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>{line.replace('- ', '')}</li>
              }
              if (line.trim() === '') {
                return <br key={index} />
              }
              return <p key={index} style={{ marginBottom: '1rem' }}>{line}</p>
            })}
          </div>
        </div>
      </main>
      <Footer />
    </CMSProvider>
  )
}
