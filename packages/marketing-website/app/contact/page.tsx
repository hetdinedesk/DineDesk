import { Navigation } from '@/components/navigation'
import { ContactCTA } from '@/components/contact-cta'
import { Footer } from '@/components/footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us — DineDesk',
  description: 'Get in touch with the DineDesk team. Tell us about your restaurant and we will build you a custom platform.',
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
