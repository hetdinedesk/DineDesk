import { Navigation } from '@/components/navigation'
import { Features } from '@/components/features'
import { Footer } from '@/components/footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Features — Restaurant Website Builder, Online Ordering & Reservations',
  description: 'Everything your restaurant needs in one platform. Commission-free online ordering, QR table ordering, table reservations, loyalty programs, digital menu management, special offer banners, and real-time analytics.',
  keywords: [
    'restaurant online ordering features',
    'restaurant website features',
    'QR table ordering system',
    'restaurant loyalty program features',
    'table reservation system',
    'digital menu management',
    'restaurant analytics dashboard',
  ],
  alternates: { canonical: 'https://dinedesk.app/features' },
  openGraph: {
    title: 'Features — Restaurant Website Builder, Online Ordering & Reservations | DineDesk',
    description: 'Commission-free online ordering, QR menus, table reservations, loyalty programs, analytics and more — all in one restaurant platform.',
    url: 'https://dinedesk.app/features',
  },
}

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-dine-dark">
      <Navigation />
      <div className="pt-20">
        <Features />
      </div>
      <Footer />
    </main>
  )
}
