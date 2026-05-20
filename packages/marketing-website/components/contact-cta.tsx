'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Send, ArrowRight, Mail, Clock, CheckCircle2, Loader2 } from 'lucide-react'

export function ContactCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const form = e.target as HTMLFormElement
    const formData = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      restaurantName: (form.elements.namedItem('restaurantName') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement)?.value || '',
      type: (form.elements.namedItem('type') as HTMLSelectElement)?.value || '',
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsSubmitted(true)
        form.reset()
      } else {
        console.error('Failed to send email')
        alert('Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dine-dark via-dine-navy to-dine-dark" />
      <div className="absolute inset-0 dot-pattern opacity-20" />
      
      {/* Floating Orbs */}
      <motion.div
        className="absolute top-20 right-20 w-96 h-96 bg-dine-orange/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div ref={ref}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            >
              <Send className="w-4 h-4 text-dine-orange" />
              <span className="text-sm text-white/80">Get Started Today</span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6"
            >
              Ready to Transform{' '}
              <span className="gradient-text">Your Restaurant?</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/60 mb-8"
            >
              Tell us about your restaurant and we will create a custom solution 
              tailored to your needs. No obligation, just a conversation about 
              growing your business.
            </motion.p>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-dine-orange/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-dine-orange" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Email us</p>
                  <p className="text-white">dinedesk.support@gmail.com</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-dine-orange/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-dine-orange" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Response time</p>
                  <p className="text-white">Within 24 hours</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 }}
          >
            <div className="glass rounded-2xl p-8 glow-orange">
              {isSubmitted ? (
                <div className="text-center py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-white/60">
                    We will get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h3 className="text-xl font-display font-bold text-white mb-6">
                    Tell Us About Your Restaurant
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Your Name</label>
                      <input
                        name="name"
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-dine-orange/50 transition-colors"
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Restaurant Name</label>
                      <input
                        name="restaurantName"
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-dine-orange/50 transition-colors"
                        placeholder="Bella Vista"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Email</label>
                      <input
                        name="email"
                        type="email"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-dine-orange/50 transition-colors"
                        placeholder="john@restaurant.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Phone</label>
                      <input
                        name="phone"
                        type="tel"
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-dine-orange/50 transition-colors"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-2">Restaurant Type</label>
                    <select
                      name="type"
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-dine-orange/50 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-dine-dark">Select type...</option>
                      <option value="fine-dining" className="bg-dine-dark">Fine Dining</option>
                      <option value="casual" className="bg-dine-dark">Casual Dining</option>
                      <option value="cafe" className="bg-dine-dark">Café / Coffee Shop</option>
                      <option value="food-truck" className="bg-dine-dark">Food Truck</option>
                      <option value="fast-casual" className="bg-dine-dark">Fast Casual</option>
                      <option value="other" className="bg-dine-dark">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-2">Tell Us More</label>
                    <textarea
                      name="message"
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-dine-orange/50 transition-colors resize-none"
                      placeholder="What features are you interested in? Any specific requirements?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-full bg-gradient-to-r from-dine-orange to-dine-coral text-white font-semibold flex items-center justify-center gap-2 btn-shine disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
