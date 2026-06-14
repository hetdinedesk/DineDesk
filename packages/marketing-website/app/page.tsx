import { Navigation } from '@/components/navigation'
import { Hero } from '@/components/hero'
import { HomePlatformOverview } from '@/components/home-platform-overview'
import { HomeThemesPreview } from '@/components/home-themes-preview'
import { HomeHowItWorks } from '@/components/home-how-it-works'
import { HomeComparison } from '@/components/home-comparison'
import { HomeMarketingTools } from '@/components/home-marketing-tools'
import { GoogleReviewsSection } from '@/components/google-reviews-section'
import { AnalyticsSection } from '@/components/analytics-section'
import { FAQSection } from '@/components/faq-section'
import { HomeCTA } from '@/components/home-cta'
import { Footer } from '@/components/footer'
import { ScrollToTop } from '@/components/scroll-to-top'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-dine-dark">
      <Navigation />
      <Hero />
      <HomePlatformOverview />
      <HomeThemesPreview />
      <HomeHowItWorks />
      <HomeComparison />
      <HomeMarketingTools />
      
      {/* View All Features - Mobile Only */}
      <div className="px-4 sm:px-6 lg:px-8 py-16 sm:hidden">
        <Link
          href="/features"
          className="block w-full py-4 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white font-semibold text-center btn-shine"
        >
          View All Features
          <ArrowRight className="inline-block ml-2 w-5 h-5" />
        </Link>
      </div>

      {/* Sections hidden on mobile, shown on desktop */}
      <div className="hidden sm:block">
        <GoogleReviewsSection />
      </div>
      <div className="hidden sm:block">
        <AnalyticsSection />
      </div>
      <div className="hidden sm:block">
        <FAQSection />
      </div>
      
      <HomeCTA />
      <Footer />
      <ScrollToTop />
    </main>
  )
}
