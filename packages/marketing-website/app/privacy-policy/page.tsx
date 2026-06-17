import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

export const metadata = {
  title: 'Privacy Policy - DineDesk',
  description: 'Learn how DineDesk collects, uses, and protects your data. Australian Privacy Act compliant.',
}

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-dine-dark">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-8">
          Privacy Policy
        </h1>
        <p className="text-white/60 mb-12">
          Last updated: May 2026
        </p>

        <div className="prose prose-invert prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Introduction</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              DineDesk (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our restaurant platform services. We comply with the Australian Privacy Act 1988 (Cth) and the Privacy Amendment (Notifiable Data Breaches) Act 2017 (Cth).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3">Restaurant Owner Information</h3>
            <p className="text-white/70 leading-relaxed mb-4">
              When you sign up for DineDesk, we collect:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>Contact information: name, email address, phone number</li>
              <li>Business information: restaurant name, address, ABN (if provided)</li>
              <li>Payment information: processed securely through Stripe (we do not store complete card details)</li>
              <li>Account credentials: encrypted passwords and authentication tokens</li>
              <li>Configuration data: branding preferences, menu items, pricing, operating hours</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">Customer Information (via Restaurant Websites)</h3>
            <p className="text-white/70 leading-relaxed mb-4">
              Through restaurant websites powered by DineDesk, our restaurant partners collect customer information for orders, reservations, and loyalty programs:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>Order information: customer name, email, phone, delivery address, order details</li>
              <li>Reservation information: name, contact details, booking date/time, party size</li>
              <li>Loyalty program data: points, rewards, purchase history</li>
              <li>Payment information: processed securely through Stripe</li>
              <li>Reviews and feedback (if provided)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">Technical Information</h3>
            <p className="text-white/70 leading-relaxed mb-4">
              We automatically collect:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>IP addresses and browser type</li>
              <li>Device information and operating system</li>
              <li>Usage data through Google Analytics</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">How We Use Your Information</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              We use the collected information for:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Providing and operating the DineDesk platform</li>
              <li>Processing orders, reservations, and payments</li>
              <li>Managing loyalty programs and rewards</li>
              <li>Communicating with you about your account and services</li>
              <li>Improving our platform and developing new features</li>
              <li>Analysing usage patterns to enhance user experience</li>
              <li>Complying with legal obligations</li>
              <li>Preventing fraud and ensuring security</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Data Sharing and Third-Party Services</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              We may share your information with:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li><strong>Stripe:</strong> For secure payment processing. Stripe is PCI DSS Level 1 certified.</li>
              <li><strong>Netlify:</strong> For website hosting and deployment. Your data is stored on Australian servers.</li>
              <li><strong>Google:</strong> For Google Analytics (usage data) and Google Reviews integration.</li>
              <li><strong>Service Providers:</strong> Trusted third parties who assist in operating our platform (e.g., email services, customer support tools).</li>
            </ul>
            <p className="text-white/70 leading-relaxed">
              We do not sell your personal information to third parties for marketing purposes.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Data Storage and Security</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              We implement appropriate technical and organisational measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>SSL/TLS encryption for data in transit</li>
              <li>Encrypted storage for sensitive data (passwords, payment tokens)</li>
              <li>Australian-based data hosting for compliance with Australian data sovereignty requirements</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Access controls and authentication systems</li>
              <li>Regular data backups</li>
            </ul>
            <p className="text-white/70 leading-relaxed">
              Despite our security measures, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Data Retention</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              We retain your information for as long as necessary to provide our services and for legitimate business purposes:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li><strong>Account Data:</strong> Retained while your account is active and for a reasonable period after closure (typically 7 years for legal compliance).</li>
              <li><strong>Order Data:</strong> Retained for tax and accounting purposes (minimum 7 years under Australian law).</li>
              <li><strong>Loyalty Data:</strong> Retained while the loyalty program is active and for a reasonable period after.</li>
              <li><strong>Analytics Data:</strong> Retained for 26 months by Google Analytics (configurable).</li>
            </ul>
            <p className="text-white/70 leading-relaxed">
              Upon your request, we will delete your personal information unless we are required by law to retain it.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Your Rights Under Australian Privacy Law</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              Under the Australian Privacy Act, you have the right to:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li><strong>Access:</strong> Request access to the personal information we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements).</li>
              <li><strong>Opt-out:</strong> Opt-out of marketing communications at any time.</li>
              <li><strong>Complain:</strong> Lodge a complaint with us or the Office of the Australian Information Commissioner (OAIC).</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Cookies and Tracking</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>Remember your preferences and settings</li>
              <li>Analyze website traffic through Google Analytics</li>
              <li>Improve user experience</li>
              <li>Provide personalised content</li>
            </ul>
            <p className="text-white/70 leading-relaxed">
              You can control cookies through your browser settings. Note that disabling cookies may affect certain features of our platform.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">International Data Transfers</h2>
            <p className="text-white/70 leading-relaxed">
              Your data is primarily stored on Australian servers. We may transfer data to countries outside Australia only when:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mt-4">
              <li>Required to provide our services (e.g., Stripe for payments)</li>
              <li>The recipient has adequate data protection laws in place</li>
              <li>We have your explicit consent</li>
              <li>Required by law</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Children's Privacy</h2>
            <p className="text-white/70 leading-relaxed">
              Our services are not intended for children under the age of 13. We do not knowingly collect personal information from children. If we become aware that we have collected such information, we will take steps to delete it.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Data Breaches</h2>
            <p className="text-white/70 leading-relaxed">
              In the event of a data breach that is likely to result in serious harm to individuals, we will notify affected individuals and the Office of the Australian Information Commissioner (OAIC) as required by the Privacy Amendment (Notifiable Data Breaches) Act 2017 (Cth).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Changes to This Privacy Policy</h2>
            <p className="text-white/70 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on our website and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Contact Us</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              If you have questions about this Privacy Policy or how we handle your personal information, please contact us:
            </p>
            <div className="text-white/70 space-y-2">
              <p>Email: <a href="mailto:dinedesk.support@gmail.com" className="text-dine-orange hover:underline">dinedesk.support@gmail.com</a></p>
              <p>Location: Australia</p>
              <p className="mt-4">
                If you are not satisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-dine-orange hover:underline">www.oaic.gov.au</a>.
              </p>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
