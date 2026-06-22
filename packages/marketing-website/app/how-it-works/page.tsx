import { Navigation } from '@/components/navigation'
import { HowItWorks } from '@/components/how-it-works'
import { HomeComparison } from '@/components/home-comparison'
import { Footer } from '@/components/footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works — We Build Your Restaurant Website & Ordering System',
  description: 'Getting started with DineDesk is easy. Tell us about your restaurant, we build your entire online presence — website, online ordering, reservations, and loyalty program — then hand you full control.',
  keywords: [
    'how to get a restaurant website',
    'restaurant website setup',
    'done for you restaurant online ordering',
    'restaurant website launch',
    'restaurant digital platform setup',
  ],
  alternates: { canonical: 'https://dinedesk.app/how-it-works' },
  openGraph: {
    title: 'How It Works — We Build Your Restaurant Website & Ordering System | DineDesk',
    description: 'We handle everything — website, ordering, reservations, loyalty. You review, approve, and go live. Full control, zero hassle.',
    url: 'https://dinedesk.app/how-it-works',
  },
}

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-dine-dark">
      <Navigation />
      <div className="pt-20">
        <HowItWorks />
        <HomeComparison />
      </div>
      <Footer />
    </main>
  )
}
