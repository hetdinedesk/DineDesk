import { Navigation } from '@/components/navigation'
import { Pricing } from '@/components/pricing'
import { ContactCTA } from '@/components/contact-cta'
import { Footer } from '@/components/footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — DineDesk',
  description: 'Transparent pricing for every restaurant. One-time $249 setup fee, then monthly subscription. No long-term contracts. We build and launch your site — you pay monthly.',
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
