import Head from 'next/head'
import { buildThemeCSS } from '../lib/theme'
import { CartProvider } from '../contexts/CartContext'
import { WishlistProvider } from '../contexts/WishlistContext'
import { CMSProvider } from '../contexts/CMSContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import '../styles/theme-d1/index.css'
import '../styles/theme-d2/index.css'
import '../styles/theme-d3/index.css'
import ErrorBoundary from '../components/ErrorBoundary'

// Dynamic theme loading
function ThemeLoader({ themeKey, children }) {
  const [CartDrawer, setCartDrawer] = useState(null)
  const [FloatingCartIcon, setFloatingCartIcon] = useState(null)

  useEffect(() => {
    const loadTheme = async () => {
      const theme = themeKey || 'theme-d1'

      // Load CartDrawer and FloatingCartIcon components
      try {
        const [cartModule, floatModule] = await Promise.all([
          import(`../components/${theme}/CartDrawer`),
          import(`../components/${theme}/FloatingCartIcon`)
        ])
        setCartDrawer(() => cartModule.default)
        setFloatingCartIcon(() => floatModule.default)
      } catch (error) {
        console.warn(`Failed to load components for theme ${theme}, falling back to theme-d1`)
        const [cartModule, floatModule] = await Promise.all([
          import('../components/theme-d1/CartDrawer'),
          import('../components/theme-d1/FloatingCartIcon')
        ])
        setCartDrawer(() => cartModule.default)
        setFloatingCartIcon(() => floatModule.default)
      }
    }

    loadTheme()
  }, [themeKey])

  return <>{children(CartDrawer, FloatingCartIcon)}</>
}

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const data      = pageProps.data     || {}
  const settings  = data.settings      || {}
  const analytics = data.analytics     || {}
  const colours   = data.colours       || {}
  const css       = buildThemeCSS(colours, settings)
  const isLive    = settings.indexing  === 'allowed'
  const siteName  = settings.displayName || settings.restaurantName || data.client?.name || 'Restaurant'
  const faviconUrl = settings.favicon || colours.logoLight || colours.logoDark || null
  const themeKey  = data.themeKey || 'theme-d1'
  const siteDescription = settings.tagline || data.client?.description || `${siteName} — Order online, view our menu, book a table and more.`
  const domain = data.client?.domain || ''
  const siteUrl = domain ? (domain.startsWith('http') ? domain : `https://${domain}`) : ''
  const logoUrl = settings.logoLight || settings.logoDark || colours.logoLight || colours.logoDark || ''
  const primaryLoc = data.client?.locations?.find(l => l.isPrimary) || data.client?.locations?.[0] || {}
  const phone = primaryLoc.phone || settings.phone || ''
  const address = primaryLoc.address || ''
  const city = primaryLoc.city || ''
  const state = primaryLoc.state || ''
  const postcode = primaryLoc.postcode || ''
  const country = primaryLoc.country || 'AU'
  const siteType = data.siteType || settings.siteType || 'restaurant'
  const currentPath = router.asPath?.split('?')[0] || '/'
  const canonicalUrl = siteUrl ? `${siteUrl}${currentPath === '/' ? '' : currentPath}` : ''

  // Scroll to top on route change
  useEffect(() => {
    const handleRouteChange = (url) => {
      window.scrollTo(0, 0)
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])

  // Build JSON-LD structured data
  const jsonLd = siteUrl ? {
    '@context': 'https://schema.org',
    '@type': siteType === 'cafe' ? 'CafeOrCoffeeShop' : 'Restaurant',
    name: siteName,
    description: siteDescription,
    url: siteUrl,
    ...(logoUrl && { logo: logoUrl, image: logoUrl }),
    ...(phone && { telephone: phone }),
    ...(address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: typeof address === 'string' ? address : (address.street || ''),
        addressLocality: city,
        addressRegion: state,
        postalCode: postcode,
        addressCountry: country,
      }
    }),
    ...(primaryLoc.lat && primaryLoc.lng && {
      geo: { '@type': 'GeoCoordinates', latitude: primaryLoc.lat, longitude: primaryLoc.lng }
    }),
    servesCuisine: settings.cuisineType || 'Various',
    priceRange: settings.priceRange || '$$',
    ...(data.ordering?.acceptingOrders && { hasMenu: `${siteUrl}/menu` }),
  } : null

  // Only show floating cart on menu and specials pages
  const showFloatingCart = router.pathname === '/menu' || router.pathname === '/specials'

  return (
    <>
      <Head>
        {/* Basics */}
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta charSet="utf-8"/>
        {siteName && <title>{`${siteName}`}</title>}

        {/* Favicon */}
        {faviconUrl && <link rel="icon" href={faviconUrl}/>}
        {faviconUrl && <link rel="apple-touch-icon" href={faviconUrl}/>}
        {!faviconUrl && <link rel="icon" href="/favicon.ico"/>}

        {/* SEO description */}
        <meta name="description" content={siteDescription}/>

        {/* Canonical URL */}
        {canonicalUrl && <link rel="canonical" href={canonicalUrl}/>}

        {/* Open Graph */}
        <meta property="og:type" content="website"/>
        <meta property="og:site_name" content={siteName}/>
        <meta property="og:title" content={siteName}/>
        <meta property="og:description" content={siteDescription}/>
        <meta property="og:locale" content="en_AU"/>
        {canonicalUrl && <meta property="og:url" content={canonicalUrl}/>}
        {logoUrl && <meta property="og:image" content={logoUrl}/>}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:title" content={siteName}/>
        <meta name="twitter:description" content={siteDescription}/>
        {logoUrl && <meta name="twitter:image" content={logoUrl}/>}

        {/* Robots */}
        {isLive
          ? <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"/>
          : <meta name="robots" content="noindex, nofollow"/>
        }

        {/* JSON-LD Structured Data */}
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}

        {/* Google Site Verification */}
        {analytics.googleVerification && (
          <meta name="google-site-verification"
            content={analytics.googleVerification}/>
        )}

        {/* Facebook Domain Verification */}
        {analytics.fbDomainVerification && (
          <meta name="facebook-domain-verification"
            content={analytics.fbDomainVerification}/>
        )}

        {/* Google Tag Manager — in head */}
        {analytics.gtmId && (
          <script dangerouslySetInnerHTML={{ __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${analytics.gtmId}');
          `}}/>
        )}

        {/* GA4 — only if no GTM (avoid double tracking) */}
        {analytics.ga4MeasurementId && !analytics.gtmId && (
          <>
            <script async
              src={`https://www.googletagmanager.com/gtag/js?id=${analytics.ga4MeasurementId}`}/>
            <script dangerouslySetInnerHTML={{ __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${analytics.ga4MeasurementId}');
            `}}/>
          </>
        )}

        {/* Facebook Pixel */}
        {analytics.fbPixelId && (
          <script dangerouslySetInnerHTML={{ __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${analytics.fbPixelId}');
            fbq('track', 'PageView');
          `}}/>
        )}
      </Head>

      {/* GTM noscript — must be first thing after <body> opens */}
      {analytics.gtmId && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${analytics.gtmId}`}
            height="0" width="0"
            style={{ display:'none', visibility:'hidden' }}/>
        </noscript>
      )}

      {/* Theme CSS */}
      {css && <style dangerouslySetInnerHTML={{ __html: css }}/>}

      <ErrorBoundary>
        <CMSProvider data={data}>
          <CartProvider ordering={data.ordering} siteId={data.id} query={router.query}>
            <WishlistProvider>
              <ThemeLoader themeKey={themeKey}>
                {(CartDrawer, FloatingCartIcon) => (
                  <>
                    <Component {...pageProps}/>
                    {CartDrawer && <CartDrawer />}
                    {FloatingCartIcon && showFloatingCart && <FloatingCartIcon />}
                  </>
                )}
              </ThemeLoader>
            </WishlistProvider>
          </CartProvider>
        </CMSProvider>
      </ErrorBoundary>
    </>
  )
}
