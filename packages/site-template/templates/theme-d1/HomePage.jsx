import React from 'react';
import { CMSProvider, useCMS } from '../../contexts/CMSContext';
import { HeroSection } from '../../components/theme-d1/sections/HeroSection';
import { FeaturedItemsSection } from '../../components/theme-d1/sections/FeaturedItemsSection';
import { SpecialsSection } from '../../components/theme-d1/sections/SpecialsSection';
import { ReviewsSection } from '../../components/theme-d1/sections/ReviewsSection';
import { AboutSection } from '../../components/theme-d1/sections/AboutSection';
import { Header } from '../../components/theme-d1/Header';
import { Footer } from '../../components/theme-d1/Footer';
import { FloatingReviewWidget } from '../../components/theme-d1/FloatingReviewWidget';
import { replaceShortcodes } from '../../lib/shortcodes';

const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1761095596849-608b6a337c36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5lJTIwZGluaW5nJTIwcmVzdGF1cmFudCUyMGVsZWdhbnR8ZW58MXx8fHwxNzc0Nzk4MjYxfDA&ixlib=rb-4.1.0&q=80&w=1080',
  about: 'https://images.unsplash.com/photo-1592498546551-222538011a27?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVmJTIwY29va2luZyUyMGtpdGNoZW58ZW58MXx8fHwxNzc0NzczODgyfDA&ixlib=rb-4.1.0&q=80&w=1080',
};

function HomePageContent() {
  const { homepageSections, shortcodes } = useCMS();

  const activeSections = (homepageSections || [])
    .filter((section) => section.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {activeSections.map((section) => {
          const title = replaceShortcodes(section.title || '', shortcodes);
          const subtitle = replaceShortcodes(
            section.subtitle || section.content?.subtitle || '', 
            shortcodes
          );

          switch (section.type) {
            case 'hero':
              return (
                <HeroSection
                  key={section.id}
                  title={title}
                  subtitle={subtitle}
                  image={section.content?.image || IMAGES.hero}
                  cta={section.content?.cta}
                />
              );
            case 'featured-items':
              return (
                <FeaturedItemsSection
                  key={section.id}
                  title={title}
                  subtitle={subtitle}
                />
              );
            case 'specials':
              return (
                <SpecialsSection
                  key={section.id}
                  title={title}
                  subtitle={subtitle}
                />
              );
            case 'reviews':
              return (
                <ReviewsSection
                  key={section.id}
                  title={title}
                  subtitle={subtitle}
                  content={section.content || {}}
                />
              );
            case 'about':
              return (
                <AboutSection
                  key={section.id}
                  title={title}
                  subtitle={subtitle}
                  content={{
                    text: replaceShortcodes(section.content?.text || '', shortcodes),
                    image: section.content?.image || IMAGES.about,
                  }}
                />
              );
            default:
              return null;
          }
        })}
      </main>
      <Footer />
      <FloatingReviewWidget />
    </div>
  );
}

export default function ThemeD1HomePage({ data, siteType }) {
  return (
    <CMSProvider data={data}>
      <HomePageContent />
    </CMSProvider>
  );
}


