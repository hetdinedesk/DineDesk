import type { Metadata } from 'next'
import './globals.css'
import { CookieConsent } from '@/components/cookie-consent'

export const metadata: Metadata = {
  title: 'DineDesk - The Complete Restaurant Operating Platform',
  description: 'Build, manage, and grow your restaurant with DineDesk. Website builder, online ordering, reservations, QR table ordering, loyalty programs, and more - all in one powerful platform.',
  keywords: 'restaurant website builder, online ordering, restaurant management, QR ordering, table reservations, loyalty program, restaurant POS',
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
    title: 'DineDesk - The Complete Restaurant Operating Platform',
    description: 'Everything your restaurant needs to succeed online and in-store.',
    type: 'website',
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
      </head>
      <body className="antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
