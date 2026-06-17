import { Navigation } from '@/components/navigation'
import { Themes } from '@/components/themes'
import { Footer } from '@/components/footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Restaurant Website Themes — DineDesk',
  description: 'Choose from professionally designed restaurant website themes. Fine dining, café, food truck, casual dining and more.',
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
