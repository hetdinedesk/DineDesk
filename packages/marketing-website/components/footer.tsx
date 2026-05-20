'use client'

import { motion } from 'framer-motion'
import { Mail, MapPin, Instagram, Facebook } from 'lucide-react'
import Link from 'next/link'

const footerLinks = {
  product: [
    { name: 'Features', href: '/features' },
    { name: 'Themes', href: '/themes' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Pricing', href: '/pricing' },
  ],
  contact: [
    { name: 'Get Started', href: '/contact' },
    { name: 'Contact Us', href: '/contact' },
  ],
}

export function Footer() {
  return (
    <footer className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 bg-dine-dark border-t border-white/5" />
      <div className="absolute inset-0 grid-pattern opacity-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="sm:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-5">
              <img src="/logo-icon.png" alt="DineDesk" className="w-10 h-10" />
              <span className="text-xl font-black tracking-tight" style={{ fontSize: '28px', letterSpacing: '-0.04em' }}>
                <span className="text-white">Dine</span>
                <span className="bg-gradient-to-r from-dine-orange to-dine-coral bg-clip-text text-transparent">Desk</span>
              </span>
            </Link>
            <p className="text-white/50 text-sm mb-6 max-w-sm leading-relaxed">
              The complete restaurant operating platform. We build your website, configure your
              ordering, reservations and loyalty systems, then hand you full control.
            </p>

            <div className="space-y-3">
              <a
                href="mailto:dinedesk.support@gmail.com"
                className="flex items-center gap-3 text-white/50 hover:text-white transition-colors text-sm"
              >
                <Mail className="w-4 h-4 text-dine-orange" />
                dinedesk.support@gmail.com
              </a>
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <MapPin className="w-4 h-4 text-dine-orange" />
                Australia
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-white/50 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Get Started</h4>
            <ul className="space-y-3">
              {footerLinks.contact.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-white/50 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            © 2026 DineDesk. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="text-white/20 text-xs hover:text-white/40 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-and-conditions" className="text-white/20 text-xs hover:text-white/40 transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/refund-policy" className="text-white/20 text-xs hover:text-white/40 transition-colors">
              Refund Policy
            </Link>
            <p className="text-white/20 text-xs">
              Built for Australian restaurants
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
