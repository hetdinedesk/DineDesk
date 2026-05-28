import { Navigation } from '@/components/navigation'
import { HowItWorks } from '@/components/how-it-works'
import { HomeComparison } from '@/components/home-comparison'
import { Footer } from '@/components/footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works — DineDesk',
  description: 'See how DineDesk works: contact us, we build your site, you review and approve, then go live with full control.',
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
