'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Cookie, Info } from 'lucide-react'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setShowBanner(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('cookie-preferences', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: false,
    }))
    setShowBanner(false)
    // Trigger analytics load event
    window.dispatchEvent(new Event('cookieConsentAccepted'))
  }

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    localStorage.setItem('cookie-preferences', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
    }))
    setShowBanner(false)
  }

  const handleCustomize = () => {
    setShowDetails(!showDetails)
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto glass rounded-2xl p-6 border border-white/10 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dine-orange to-dine-coral flex items-center justify-center flex-shrink-0">
                <Cookie className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-display font-bold text-white">
                    We Use Cookies
                  </h3>
                  <button
                    onClick={() => setShowBanner(false)}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-white/70 text-sm mb-4">
                  We use cookies to improve your experience, analyze site traffic, and for marketing purposes. 
                  By clicking &quot;Accept All&quot;, you consent to our use of cookies.
                </p>

                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-dine-orange" />
                          <span className="text-white text-sm font-medium">Essential Cookies</span>
                        </div>
                        <span className="text-white/50 text-xs">Required</span>
                      </div>
                      <p className="text-white/50 text-xs pl-6">
                        Required for the site to function (authentication, security, core features)
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="analytics"
                            defaultChecked={true}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-dine-orange focus:ring-dine-orange focus:ring-offset-0"
                          />
                          <label htmlFor="analytics" className="text-white text-sm font-medium">
                            Analytics Cookies
                          </label>
                        </div>
                        <span className="text-white/50 text-xs">Optional</span>
                      </div>
                      <p className="text-white/50 text-xs pl-6">
                        Help us understand how visitors use our site (Google Analytics)
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="marketing"
                            defaultChecked={false}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-dine-orange focus:ring-dine-orange focus:ring-offset-0"
                          />
                          <label htmlFor="marketing" className="text-white text-sm font-medium">
                            Marketing Cookies
                          </label>
                        </div>
                        <span className="text-white/50 text-xs">Optional</span>
                      </div>
                      <p className="text-white/50 text-xs pl-6">
                        Used for personalized advertising and marketing campaigns
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleAccept}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white font-medium text-sm btn-shine"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={handleCustomize}
                    className="px-6 py-2.5 rounded-full border border-white/20 text-white font-medium text-sm hover:bg-white/5 transition-colors"
                  >
                    Customize
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-6 py-2.5 rounded-full text-white/50 font-medium text-sm hover:text-white/70 transition-colors"
                  >
                    Reject Non-Essential
                  </button>
                </div>

                <p className="text-white/40 text-xs mt-4">
                  <a href="/privacy-policy" className="text-dine-orange hover:underline">
                    Privacy Policy
                  </a>
                  {' • '}
                  <a href="/privacy-policy#cookies" className="text-dine-orange hover:underline">
                    Cookie Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
