import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

export const metadata = {
  title: 'Refund & Cancellation Policy - DineDesk',
  description: 'DineDesk refund and cancellation policy compliant with Australian Consumer Law.',
}

export default function RefundPolicy() {
  return (
    <main className="min-h-screen bg-dine-dark">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-8">
          Refund & Cancellation Policy
        </h1>
        <p className="text-white/60 mb-12">
          Last updated: May 2026
        </p>

        <div className="prose prose-invert prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Overview</h2>
            <p className="text-white/70 leading-relaxed">
              This policy explains our refund and cancellation practices. DineDesk is committed to fair and transparent business practices compliant with Australian Consumer Law (ACL). We do not have a blanket &quot;no refunds&quot; policy. Refunds are assessed on a case-by-case basis depending on the circumstances.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Setup Fee Refund Policy</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              The $249 setup fee is <strong>non-negotiable and paid upfront</strong>. This signals we are a real service, not a free trial. It ensures clients are genuinely interested before work begins — no tyre-kickers. At $249 you are still a fraction of any web agency ($2k–5k minimum).
            </p>
            <p className="text-white/70 leading-relaxed mb-4">
              The setup fee is non-refundable once work has commenced on your website and platform setup. This includes:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>Initial consultation and requirements gathering</li>
              <li>Website design and development work</li>
              <li>Menu import and configuration</li>
              <li>Payment gateway setup</li>
              <li>Domain configuration</li>
            </ul>
            <p className="text-white/70 leading-relaxed mb-4">
              <strong>Refund Eligibility for Setup Fee:</strong>
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>Full refund if work has not commenced</li>
              <li>Partial refund (pro-rata) if work is cancelled before completion and we can recover unused resources</li>
              <li>No refund if work is substantially complete or your website has launched</li>
            </ul>
            <p className="text-white/70 leading-relaxed">
              If you are dissatisfied with the quality of work delivered, please contact us within 14 days of delivery. We will work with you to address any issues and may offer a partial refund if the service does not meet the agreed specifications.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Monthly Subscription Cancellation</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              You may cancel your monthly subscription at any time. There are no lock-in contracts or cancellation penalties.
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li><strong>Notice Period:</strong> Provide 30 days notice before cancellation to take effect</li>
              <li><strong>Cancellation Process:</strong> Email dinedesk.support@gmail.com or use the cancellation option in your account</li>
              <li><strong>Effective Date:</strong> Cancellation takes effect at the end of your current billing cycle</li>
              <li><strong>Service Access:</strong> You retain full access until the end of your billing period</li>
              <li><strong>Refunds:</strong> No refunds for partial months of service</li>
            </ul>
            <p className="text-white/70 leading-relaxed">
              If you cancel without 30 days notice, you will be charged for the notice period but services will continue until the end of that period.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Service Quality Guarantees</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              Under Australian Consumer Law, we guarantee that our services will be:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>Provided with due care and skill</li>
              <li>Fit for the specified purpose</li>
              <li>Match the description provided</li>
              <li>Delivered within the agreed timeframe</li>
            </ul>
            <p className="text-white/70 leading-relaxed mb-4">
              If our services fail to meet these guarantees, you may be entitled to:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>A refund or partial refund</li>
              <li>Service rectification or re-performance</li>
              <li>Compensation for any reasonably foreseeable loss or damage</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Refund Request Process</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              To request a refund, please:
            </p>
            <ol className="list-decimal list-inside text-white/70 space-y-2 mb-6">
              <li>Contact us at dinedesk.support@gmail.com with your refund request</li>
              <li>Provide your account details and the reason for the refund request</li>
              <li>Include any relevant evidence or documentation</li>
            </ol>
            <p className="text-white/70 leading-relaxed mb-4">
              <strong>Response Time:</strong>
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>We will acknowledge your request within 2 business days</li>
              <li>We will assess your request and provide a decision within 10 business days</li>
              <li>Approved refunds will be processed within 5 business days of approval</li>
              <li>Refunds are credited to the original payment method</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Exceptions to Refund Policy</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              Refunds may not be available in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Service has been fully delivered and used as intended</li>
              <li>Cancellation is due to a change in your business circumstances (unless due to our breach)</li>
              <li>You have violated our Acceptable Use Policy or Terms & Conditions</li>
              <li>The refund request is made more than 30 days after the charge</li>
              <li>The service was custom-built specifically for your requirements and cannot be reused</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Service Interruptions and Downtime</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              If you experience significant service interruptions that affect your ability to operate your business:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
              <li>Report the issue immediately to our support team</li>
              <li>We will investigate and resolve the issue as a priority</li>
              <li>For extended outages (more than 24 hours), we may offer service credits or partial refunds</li>
              <li>Credits or refunds are calculated based on the duration and impact of the outage</li>
            </ul>
            <p className="text-white/70 leading-relaxed">
              We are not responsible for outages caused by third-party services (e.g., Stripe, Netlify) or force majeure events.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Plan Changes and Upgrades</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              When changing between subscription plans:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li><strong>Upgrades:</strong> Prorated charges apply for the remainder of the billing cycle</li>
              <li><strong>Downgrades:</strong> Effective at the start of the next billing cycle</li>
              <li><strong>Plan Switching:</strong> No refunds for unused portions of higher-tier plans when downgrading</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Your Rights Under Australian Consumer Law</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              This policy does not limit your rights under Australian Consumer Law. You may be entitled to a remedy if our services:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Have a major problem that cannot be fixed</li>
              <li>Cannot be used for their intended purpose</li>
              <li>Do not match the description or sample shown</li>
              <li>Are not of acceptable quality or fit for purpose</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-4">
              For major problems, you may choose between a refund, replacement, or compensation. For minor problems, we may offer a free repair or replacement.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Dispute Resolution</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              If you are dissatisfied with our refund decision:
            </p>
            <ol className="list-decimal list-inside text-white/70 space-y-2">
              <li>Request escalation to our management team</li>
              <li>We will review the decision within 5 business days</li>
              <li>If unresolved, you may contact the Australian Competition and Consumer Commission (ACCC)</li>
              <li>As a last resort, you may seek resolution through NSW Fair Trading or the NSW Civil and Administrative Tribunal (NCAT)</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Policy Changes</h2>
            <p className="text-white/70 leading-relaxed">
              We may update this policy from time to time. Significant changes will be communicated via email and posted on our website. Changes will not apply retroactively to requests made before the change date.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Contact Us</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              For refund requests or questions about this policy, please contact us:
            </p>
            <div className="text-white/70 space-y-2">
              <p>Email: <a href="mailto:dinedesk.support@gmail.com" className="text-dine-orange hover:underline">dinedesk.support@gmail.com</a></p>
              <p>Location: Australia</p>
              <p className="mt-4">
                For consumer rights information, visit the <a href="https://www.accc.gov.au" target="_blank" rel="noopener noreferrer" className="text-dine-orange hover:underline">Australian Competition and Consumer Commission (ACCC)</a> or <a href="https://www.fairtrading.nsw.gov.au" target="_blank" rel="noopener noreferrer" className="text-dine-orange hover:underline">NSW Fair Trading</a>.
              </p>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
