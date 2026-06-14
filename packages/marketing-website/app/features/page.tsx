import { Navigation } from '@/components/navigation'
import { Features } from '@/components/features'
import { Footer } from '@/components/footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Features — DineDesk',
  description: 'Explore every feature DineDesk offers: online ordering, QR table ordering, reservations, loyalty programs, analytics, and more.',
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
