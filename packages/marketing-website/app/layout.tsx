import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { CookieConsent } from '@/components/cookie-consent'

export const metadata: Metadata = {
  metadataBase: new URL('https://dinedesk.app'),
  title: {
    default: 'DineDesk — Restaurant Website Builder & Online Ordering Platform',
    template: '%s | DineDesk',
  },
  description: 'DineDesk is the all-in-one restaurant management platform. Get a professional website, commission-free online ordering, table reservations, QR table ordering, loyalty programs, and real-time analytics — all built and managed for you.',
  keywords: [
    'restaurant website builder',
    'online ordering system for restaurants',
    'restaurant management system',
    'commission free online ordering',
    'restaurant online ordering platform',
    'table booking system restaurant',
    'restaurant reservation system',
    'QR code menu ordering',
    'restaurant loyalty program',
    'restaurant digital menu',
    'restaurant ordering app',
    'food ordering website',
    'restaurant website design Australia',
    'online ordering without commission',
    'DineDesk',
  ],
  authors: [{ name: 'DineDesk', url: 'https://dinedesk.app' }],
  creator: 'DineDesk',
  publisher: 'DineDesk',
  category: 'Restaurant Technology',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DineDesk',
  },
  openGraph: {
    title: 'DineDesk — Restaurant Website Builder & Online Ordering Platform',
    description: 'Stop paying delivery app commissions. DineDesk gives your restaurant a professional website, direct online ordering, table reservations, loyalty programs and more — all in one platform.',
    url: 'https://dinedesk.app',
    siteName: 'DineDesk',
    type: 'website',
    locale: 'en_AU',
    images: [
      {
        url: '/logo-full.png',
        width: 1200,
        height: 630,
        alt: 'DineDesk — Restaurant Website Builder & Online Ordering Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DineDesk — Restaurant Website Builder & Online Ordering Platform',
    description: 'Stop paying delivery app commissions. Get your own restaurant website with direct ordering, reservations, and loyalty programs.',
    images: ['/logo-full.png'],
  },
  alternates: {
    canonical: 'https://dinedesk.app',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'DineDesk',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://dinedesk.app',
  description: 'All-in-one restaurant management platform with website builder, commission-free online ordering, table reservations, QR ordering, and loyalty programs.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'AUD',
    description: 'Free setup — monthly subscription plans available',
  },
  provider: {
    '@type': 'Organization',
    name: 'DineDesk',
    url: 'https://dinedesk.app',
    logo: 'https://dinedesk.app/logo-full.png',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'dinedesk.support@gmail.com',
      contactType: 'customer support',
    },
    areaServed: 'AU',
    sameAs: [
      'https://www.instagram.com/dine.desk/',
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
