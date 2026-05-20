import { Navigation } from '@/components/navigation'
import { Hero } from '@/components/hero'
import { HomePlatformOverview } from '@/components/home-platform-overview'
import { HomeThemesPreview } from '@/components/home-themes-preview'
import { HomeHowItWorks } from '@/components/home-how-it-works'
import { HomeTestimonials } from '@/components/home-testimonials'
import { SecurityTrustSection } from '@/components/security-trust-section'
import { IntegrationsSection } from '@/components/integrations-section'
import { GoogleReviewsSection } from '@/components/google-reviews-section'
import { AnalyticsSection } from '@/components/analytics-section'
import { FAQSection } from '@/components/faq-section'
import { HomeCTA } from '@/components/home-cta'
import { Footer } from '@/components/footer'
import { ScrollToTop } from '@/components/scroll-to-top'

export default function Home() {
  return (
    <main className="min-h-screen bg-dine-dark">
      <Navigation />
      <Hero />
      <HomePlatformOverview />
      <HomeThemesPreview />
      <HomeHowItWorks />
      <HomeTestimonials />
      <SecurityTrustSection />
      <IntegrationsSection />
      <GoogleReviewsSection />
      <AnalyticsSection />
      <FAQSection />
      <HomeCTA />
      <Footer />
      <ScrollToTop />
    </main>
  )
}
