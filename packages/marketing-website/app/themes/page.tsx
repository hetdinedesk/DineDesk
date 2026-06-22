import { Navigation } from '@/components/navigation'
import { Themes } from '@/components/themes'
import { Footer } from '@/components/footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Restaurant Website Themes — Professional Designs for Every Cuisine',
  description: 'Browse professional restaurant website themes designed for fine dining, café, food truck, casual dining, and more. Every theme includes online ordering, table reservations, and loyalty program — ready to go live.',
  keywords: [
    'restaurant website themes',
    'restaurant website templates',
    'professional restaurant website design',
    'fine dining website template',
    'cafe website design',
    'food truck website',
    'restaurant website design Australia',
  ],
  alternates: { canonical: 'https://dinedesk.app/themes' },
  openGraph: {
    title: 'Restaurant Website Themes — Professional Designs for Every Cuisine | DineDesk',
    description: 'Professional restaurant website themes for fine dining, cafés, food trucks and more. Every theme includes ordering, reservations and loyalty — built for you.',
    url: 'https://dinedesk.app/themes',
  },
}

export default function ThemesPage() {
  return (
    <main className="min-h-screen bg-dine-dark">
      <Navigation />
      <div className="pt-20">
        <Themes />
      </div>
      <Footer />
    </main>
  )
}
