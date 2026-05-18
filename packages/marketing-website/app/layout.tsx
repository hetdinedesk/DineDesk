import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DineDesk - The Complete Restaurant Operating Platform',
  description: 'Build, manage, and grow your restaurant with DineDesk. Website builder, online ordering, reservations, QR table ordering, loyalty programs, and more - all in one powerful platform.',
  keywords: 'restaurant website builder, online ordering, restaurant management, QR ordering, table reservations, loyalty program, restaurant POS',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
