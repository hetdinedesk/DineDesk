import { Navigation } from '@/components/navigation'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { Themes } from '@/components/themes'
import { HowItWorks } from '@/components/how-it-works'
import { QrOrdering } from '@/components/qr-ordering'
import { CmsPreview } from '@/components/cms-preview'
import { BookingLoyalty } from '@/components/booking-loyalty'
import { AnalyticsSection } from '@/components/analytics-section'
import { Testimonials } from '@/components/testimonials'
import { Pricing } from '@/components/pricing'
import { ContactCTA } from '@/components/contact-cta'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-dine-dark">
      <Navigation />
      <Hero />
      <Features />
      <Themes />
      <HowItWorks />
      <QrOrdering />
      <CmsPreview />
      <BookingLoyalty />
      <AnalyticsSection />
      <Testimonials />
      <Pricing />
      <ContactCTA />
      <Footer />
    </main>
  )
}
