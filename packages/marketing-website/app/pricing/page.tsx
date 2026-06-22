import { Navigation } from '@/components/navigation'
import { Pricing } from '@/components/pricing'
import { ContactCTA } from '@/components/contact-cta'
import { Footer } from '@/components/footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Affordable Restaurant Website & Online Ordering Plans',
  description: 'Simple, transparent pricing for restaurants of all sizes. No setup fees, no commissions, no long-term contracts. DineDesk builds and launches your restaurant website — you pay a flat monthly fee.',
  keywords: [
    'restaurant website pricing',
    'online ordering platform pricing',
    'restaurant management software cost',
    'affordable restaurant website',
    'no commission online ordering price',
  ],
  alternates: { canonical: 'https://dinedesk.app/pricing' },
  openGraph: {
    title: 'Pricing — Affordable Restaurant Website & Online Ordering Plans | DineDesk',
    description: 'No setup fees, no commissions, no lock-in contracts. Flat monthly pricing for your restaurant website, ordering, reservations and more.',
    url: 'https://dinedesk.app/pricing',
  },
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-dine-dark">
      <Navigation />
      <div className="pt-20">
        <Pricing />
        <ContactCTA />
      </div>
      <Footer />
    </main>
  )
}
