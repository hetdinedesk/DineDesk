import React from 'react';
import { motion } from 'framer-motion';
import { CMSProvider, useCMS } from '../../contexts/CMSContext';
import { Header } from '../../components/theme-d1/Header';
import { Footer } from '../../components/theme-d1/Footer';
import { replaceShortcodes } from '../../lib/shortcodes';

const ABOUT_IMAGE = 'https://images.unsplash.com/photo-1592498546551-222538011a27?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVmJTIwY29va2luZyUyMGtpdGNoZW58ZW58MXx8fHwxNzc0NzczODgyfDA&ixlib=rb-4.1.0&q=80&w=1080';
const INTERIOR_IMAGE = 'https://images.unsplash.com/photo-1744776411223-71fb5794617a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwaW50ZXJpb3IlMjBsdXh1cnl8ZW58MXx8fHwxNzc0Nzk2NTQ3fDA&ixlib=rb-4.1.0&q=80&w=1080';

function AboutPageContent() {
  const { contentPages, shortcodes } = useCMS();

  const aboutPage = (contentPages || []).find((page) => page.slug === 'about' && page.isActive);

  if (!aboutPage) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-gray-600">Page not found</p>
      </div>
    );
  }

  const title = replaceShortcodes(aboutPage.banner?.title || '', shortcodes);
  const subtitle = replaceShortcodes(aboutPage.banner?.subtitle || '', shortcodes);
  const content = replaceShortcodes(aboutPage.content || '', shortcodes);

  return (
    <div className="min-h-screen flex flex-col pt-20">
      <Header />
      <main className="flex-grow">
        {/* Hero Banner */}
        {aboutPage.banner && (
          <div className="relative h-96 flex items-center justify-center overflow-hidden">
            <img
              src={INTERIOR_IMAGE}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50" />
            <div className="relative z-10 text-center text-white px-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-6xl font-bold mb-4"
                style={{ fontFamily: 'var(--font-heading, inherit)' }}
              >
                {title}
              </motion.h1>
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl"
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-lg max-w-none"
          >
            <div
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </motion.div>

          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="rounded-lg overflow-hidden shadow-xl h-80">
              <img
                src={ABOUT_IMAGE}
                alt="Our Kitchen"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl h-80">
              <img
                src={INTERIOR_IMAGE}
                alt="Restaurant Interior"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ThemeD1AboutPage({ data }) {
  return (
    <CMSProvider data={data}>
      <AboutPageContent />
    </CMSProvider>
  );
}


