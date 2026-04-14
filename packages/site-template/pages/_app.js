import Head from 'next/head'
import { buildThemeCSS } from '../lib/theme'
import { CartProvider } from '../contexts/CartContext'
import CartDrawer from '../components/theme-d1/CartDrawer'
import '../styles/theme-d1/index.css'

export default function App({ Component, pageProps }) {
  const data      = pageProps.data     || {}
  const settings  = data.settings      || {}
  const analytics = data.analytics     || {}
  const colours   = data.colours       || {}
  const css       = buildThemeCSS(colours, settings)
  const isLive    = settings.indexing  === 'allowed'
  const siteName  = settings.displayName || settings.restaurantName || data.client?.name || 'Restaurant'
  const faviconUrl = settings.favicon  || null

  return (
    <>
      <Head>
        {/* Basics */}
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta charSet="utf-8"/>
        {siteName && <title>{`${siteName}`}</title>}

        {/* Favicon */}
        {faviconUrl && <link rel="icon" href={faviconUrl}/>}
        {faviconUrl && <link rel="shortcut icon" href={faviconUrl}/>}
        {!faviconUrl && <link rel="icon" href="/favicon.ico"/>}

        {/* Robots */}
        {isLive
          ? <meta name="robots" content="index, follow"/>
          : <meta name="robots" content="noindex, nofollow"/>
        }

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

      <CartProvider ordering={data.ordering}>
        <Component {...pageProps}/>
        <CartDrawer />
      </CartProvider>
    </>
  )
}
