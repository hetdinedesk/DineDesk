import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

export const metadata = {
  title: 'Terms & Conditions - DineDesk',
  description: 'DineDesk terms and conditions for restaurant platform services in Australia.',
}

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen bg-dine-dark">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-8">
          Terms & Conditions
        </h1>
        <p className="text-white/60 mb-12">
          Last updated: May 2026
        </p>

        <div className="prose prose-invert prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              By accessing or using DineDesk services (&quot;Services&quot;), you agree to be bound by these Terms & Conditions (&quot;Terms&quot;). If you do not agree to these Terms, you may not use our Services. These Terms constitute a legally binding agreement between you (&quot;Client&quot; or &quot;you&quot;) and DineDesk (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">2. Service Description</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              DineDesk provides a comprehensive restaurant operating platform including:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>Website design and development</li>
              <li>Content management system (CMS) for restaurant content</li>
              <li>Online ordering system with QR code table ordering</li>
              <li>Reservation and table booking system</li>
              <li>Loyalty program management</li>
              <li>Payment processing integration (via Stripe)</li>
              <li>Google Reviews integration</li>
              <li>Analytics and reporting tools</li>
              <li>Ongoing technical support and maintenance</li>
            </ul>
            <p className="text-white/70 leading-relaxed">
              Specific features and services may vary depending on the subscription plan selected.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">3. Fees and Payment</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3">3.1 Setup Fee</h3>
            <p className="text-white/70 leading-relaxed mb-4">
              A one-time setup fee of AUD 249 applies to all new clients. This fee includes:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>Website design and development</li>
              <li>Menu import and configuration</li>
              <li>Domain connection</li>
              <li>Payment gateway setup</li>
              <li>System configuration and testing</li>
              <li>Initial training and onboarding</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">3.2 Monthly Subscription Plans</h3>
            <p className="text-white/70 leading-relaxed mb-4">
              Monthly subscription fees are charged based on the selected plan:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li><strong>Essential:</strong> AUD 79 per month</li>
              <li><strong>Growth:</strong> AUD 149 per month</li>
              <li><strong>Pro:</strong> AUD 249 per month</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">3.3 Payment Terms</h3>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Setup fee is payable before work commences</li>
              <li>Monthly subscriptions are billed in advance on the first day of each billing cycle</li>
              <li>Payments are processed via Stripe</li>
              <li>Prices are in Australian Dollars (AUD)</li>
              <li>We reserve the right to change pricing with 30 days notice to existing clients</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">4. Cancellation and Termination</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3">4.1 Client Cancellation</h3>
            <p className="text-white/70 leading-relaxed mb-4">
              You may cancel your subscription at any time without penalty. There are no lock-in contracts.
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>Cancellations take effect at the end of the current billing cycle</li>
              <li>No refunds for partial months of service</li>
              <li>The setup fee is non-refundable once work has commenced</li>
              <li>Upon cancellation, you will retain access until the end of your billing period</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">4.2 Termination by DineDesk</h3>
            <p className="text-white/70 leading-relaxed mb-4">
              We reserve the right to suspend or terminate your access to the Services if:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>You breach these Terms</li>
              <li>You fail to pay fees when due</li>
              <li>You use the Services for illegal or prohibited activities</li>
              <li>Your account poses a security risk to our systems</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">4.3 Data Export</h3>
            <p className="text-white/70 leading-relaxed">
              Upon cancellation or termination, you may request export of your data (menu items, customer data, order history) within 30 days. After this period, data may be deleted in accordance with our retention policies.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">5. Intellectual Property Ownership</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3">5.1 DineDesk Ownership</h3>
            <p className="text-white/70 leading-relaxed mb-4">
              DineDesk retains full ownership of:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>The DineDesk CMS platform and software</li>
              <li>Website templates and themes</li>
              <li>Source code and technical infrastructure</li>
              <li>Proprietary algorithms and business methods</li>
              <li>DineDesk branding, logos, and trademarks</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">5.2 Client Ownership</h3>
            <p className="text-white/70 leading-relaxed mb-4">
              You retain full ownership of:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>Your restaurant's data (menu items, pricing, descriptions)</li>
              <li>Customer data (orders, reservations, loyalty information)</li>
              <li>Your branding materials (logos, images, content)</li>
              <li>Custom content created specifically for your restaurant</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">5.3 Licences</h3>
            <p className="text-white/70 leading-relaxed">
              We grant you a non-exclusive, non-transferable licence to use the DineDesk platform for the duration of your subscription. You may not reproduce, modify, distribute, or create derivative works of our software.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">6. Client Responsibilities</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              As a Client, you agree to:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Provide accurate and complete information for your website</li>
              <li>Maintain the security of your account credentials</li>
              <li>Ensure all content you provide does not infringe third-party rights</li>
              <li>Comply with all applicable laws (including Australian Consumer Law, Food Standards Code)</li>
              <li>Keep your menu, pricing, and business information up to date</li>
              <li>Respond to customer orders and inquiries in a timely manner</li>
              <li>Handle customer complaints and disputes directly</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">7. Acceptable Use Policy</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              You may not use the Services to:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>Violate any applicable laws or regulations</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Attempt to unauthorised access to our systems or other clients' data</li>
              <li>Use the Services for fraudulent activities</li>
              <li>Display false or misleading information</li>
              <li>Infringe intellectual property rights</li>
              <li>Send spam or unsolicited communications</li>
              <li>Compete directly with DineDesk using our platform</li>
            </ul>
            <p className="text-white/70 leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate this Acceptable Use Policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>DineDesk's total liability is limited to the fees paid by you in the 12 months preceding the claim</li>
              <li>We are not liable for indirect, incidental, special, or consequential damages</li>
              <li>We are not liable for lost profits, revenue, data, or business opportunities</li>
              <li>We are not liable for downtime, service interruptions, or technical issues</li>
              <li>We are not liable for third-party service failures (e.g., Stripe, Netlify)</li>
            </ul>
            <p className="text-white/70 leading-relaxed">
              Certain consumer rights under Australian Consumer Law cannot be excluded, including guarantees regarding services supplied with skill and care, and services fit for a specified purpose.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">9. Disclaimer of Warranties</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              The Services are provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied, including but not limited to:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Merchantability and fitness for a particular purpose</li>
              <li>Non-infringement of third-party rights</li>
              <li>Uninterrupted or error-free operation</li>
              <li>Security of data transmission</li>
              <li>Accuracy of third-party data (e.g., Google Reviews)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">10. Indemnification</h2>
            <p className="text-white/70 leading-relaxed">
              You agree to indemnify and hold DineDesk harmless from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mt-4">
              <li>Your use of the Services</li>
              <li>Your breach of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Content you provide or display on your website</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">11. Service Availability</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance may be required with reasonable notice. We are not liable for downtime caused by:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Force majeure events (natural disasters, acts of war)</li>
              <li>Third-party service failures</li>
              <li>Internet infrastructure issues</li>
              <li>Your own equipment or network problems</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">12. Modifications to Services</h2>
            <p className="text-white/70 leading-relaxed">
              We reserve the right to modify, suspend, or discontinue any aspect of the Services at any time with reasonable notice. We will not be liable to you or any third party for any modification, suspension, or discontinuation.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">13. Changes to Terms</h2>
            <p className="text-white/70 leading-relaxed">
              We may update these Terms from time to time. Significant changes will be communicated via email or posted on our website. Continued use of the Services after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">14. Governing Law and Dispute Resolution</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              These Terms are governed by the laws of New South Wales, Australia. Any disputes shall be resolved as follows:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>First, through good faith negotiation between the parties</li>
              <li>If unresolved, through mediation administered by a recognised Australian mediation service</li>
              <li>If still unresolved, through the courts of New South Wales</li>
            </ul>
            <p className="text-white/70 leading-relaxed">
              Nothing in this clause prevents you from seeking remedies under Australian Consumer Law.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">15. Severability</h2>
            <p className="text-white/70 leading-relaxed">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue in full force and effect.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">16. Entire Agreement</h2>
            <p className="text-white/70 leading-relaxed">
              These Terms constitute the entire agreement between you and DineDesk regarding the Services and supersede all prior agreements, communications, and understandings.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">17. Contact Information</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              For questions about these Terms, please contact us:
            </p>
            <div className="text-white/70 space-y-2">
              <p>Email: <a href="mailto:dinedesk.support@gmail.com" className="text-dine-orange hover:underline">dinedesk.support@gmail.com</a></p>
              <p>Location: Australia</p>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
