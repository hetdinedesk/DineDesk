import { Navigation } from '@/components/navigation'
import { ContactCTA } from '@/components/contact-cta'
import { Footer } from '@/components/footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us — Get Your Restaurant Website & Online Ordering System Built',
  description: 'Ready to stop paying delivery app commissions? Contact DineDesk today. Tell us about your restaurant and we will build your website, online ordering system, reservations, and loyalty program — all done for you.',
  keywords: [
    'get a restaurant website built',
    'restaurant website contact',
    'start restaurant online ordering',
    'restaurant digital platform inquiry',
  ],
  alternates: { canonical: 'https://dinedesk.app/contact' },
  openGraph: {
    title: 'Contact DineDesk — Get Your Restaurant Website & Ordering System Built',
    description: 'Tell us about your restaurant. We build your entire online presence — website, ordering, reservations, loyalty — and hand you full control.',
    url: 'https://dinedesk.app/contact',
  },
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-dine-dark">
      <Navigation />
      <div className="pt-20">
        <ContactCTA />
      </div>
      <Footer />
    </main>
  )
}
