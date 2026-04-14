const { prisma } = require('../src/lib/prisma')

async function seedLegalDocs() {
  console.log('📄 Seeding legal documents for existing clients...')

  const clients = await prisma.client.findMany({
    include: { legalDocs: true, footerSections: { include: { links: true } } }
  })

  console.log(`Found ${clients.length} clients`)

  for (const client of clients) {
    console.log(`\nProcessing client: ${client.name}`)

    // Check if legal docs already exist
    const existingTypes = client.legalDocs.map(doc => doc.type)
    const hasPrivacy = existingTypes.includes('privacy')
    const hasTerms = existingTypes.includes('terms')
    const hasRestaurantTerms = existingTypes.includes('restaurant-terms')

    // Create legal docs if they don't exist
    if (!hasPrivacy || !hasTerms || !hasRestaurantTerms) {
      const privacyContent = `# Privacy Policy

## What Data We Collect

We collect the following types of data from our customers:

- **Personal Information**: Name, email address, phone number provided during checkout
- **Order Information**: Order details, items ordered, delivery/pickup preferences
- **Location Data**: Selected restaurant location for order fulfillment
- **Payment Information**: Payment method used (processed securely through Stripe)

## How We Use Your Data

We use your data to:

- Process and fulfill your orders
- Send order confirmations and receipts
- Communicate about your order status
- Improve our services and customer experience
- Respond to your inquiries and support requests

## How We Store and Protect Your Data

- All data is stored securely in encrypted databases
- Payment information is processed through Stripe and never stored on our servers
- We use industry-standard security measures to protect your data
- Access to your data is restricted to authorized personnel only

## Third-Party Services

We use the following third-party services:

- **Stripe**: For secure payment processing
- **Email Service**: For sending order confirmations and notifications
- **Cloudflare R2**: For secure file storage

## Cookie Policy

We use cookies to:
- Remember your preferences
- Maintain your shopping cart session
- Improve website performance
- Analyze website usage

## Data Retention

We retain your data for:
- Order records: 7 years (as required by law)
- Customer accounts: Until you request deletion
- Marketing communications: Until you opt out

## Your Rights

You have the right to:
- Access your personal data
- Request deletion of your data
- Opt out of marketing communications
- Update your information
- Lodge a complaint with relevant authorities

To exercise these rights, contact us at support@${client.name.toLowerCase().replace(/\s+/g, '')}.com`

      const termsContent = `# Terms & Conditions

## Order Acceptance & Cancellation Policies

- All orders are subject to availability
- We reserve the right to cancel orders if items are unavailable
- Customers may cancel orders within 30 minutes of placement
- Cancellations after 30 minutes may incur a fee
- We reserve the right to refuse service to anyone

## Payment Terms & Conditions

- Payment is required at time of ordering
- We accept credit/debit cards (via Stripe) and cash
- All prices are in AUD
- Prices are subject to change without notice
- Refunds will be processed to the original payment method

## Refund Policies

- Full refunds for cancelled orders before preparation begins
- Partial refunds for orders cancelled during preparation
- No refunds for completed orders
- Refunds processed within 5-7 business days

## Service Availability & Disclaimers

- Online ordering is available during restaurant operating hours
- We do not guarantee preparation or delivery times
- We are not liable for delays due to weather, traffic, or other circumstances
- Images are for illustration purposes only

## User Accounts & Responsibilities

- Users must provide accurate and complete information
- Users are responsible for maintaining account security
- Users must be at least 18 years old to place orders
- One account per person is permitted

## Intellectual Property Rights

- All website content is owned by ${client.name}
- Menu items, recipes, and branding are proprietary
- Unauthorized reproduction is prohibited

## Limitation of Liability

- We are not liable for indirect or consequential damages
- Our liability is limited to the order value
- We are not responsible for third-party service interruptions

## Governing Law & Jurisdiction

- These terms are governed by the laws of Australia
- Any disputes will be resolved in Australian courts
- By using our service, you agree to these terms`

      const restaurantTermsContent = `# Terms of Service for Restaurants

## Restaurant Responsibilities

- Accurately maintain menu items, prices, and descriptions
- Fulfill orders within estimated preparation times
- Ensure food safety and quality standards
- Maintain accurate operating hours
- Provide excellent customer service

## Commission/Fee Structure

- Commission rates are as agreed in the restaurant agreement
- Fees are deducted from order totals before payout
- Detailed commission statements provided monthly
- Payment to restaurants within 7 days of order completion

## Payment Processing Terms

- All payments processed through the platform
- Stripe processes payments securely
- Restaurant agrees to payment terms and conditions
- Disputes handled according to Stripe's policies

## Order Fulfillment Obligations

- Accept all orders unless capacity is reached
- Notify platform immediately of capacity issues
- Cancel orders only in exceptional circumstances
- Maintain inventory accuracy

## Menu Accuracy Requirements

- Keep menu items, prices, and descriptions current
- Remove unavailable items promptly
- Update seasonal items regularly
- Ensure allergen information is accurate

## Cancellation Policies

- Restaurant may cancel orders with valid reason
- Customers may cancel within specified timeframes
- Platform reserves right to mediate disputes
- Repeated cancellations may affect restaurant rating

## Performance Standards

- Maintain average order completion time under 30 minutes
- Maintain customer satisfaction rating above 4.0/5.0
- Respond to customer inquiries within 24 hours
- Keep cancellation rate below 5%

## Termination

- Either party may terminate with 30 days notice
- Immediate termination for material breach
- Platform may suspend for policy violations
- Outstanding fees due at termination`

      const legalDocsToCreate = []
      if (!hasPrivacy) {
        legalDocsToCreate.push({
          clientId: client.id,
          type: 'privacy',
          title: 'Privacy Policy',
          content: privacyContent,
          urlSlug: 'privacy',
          isActive: true
        })
      }
      if (!hasTerms) {
        legalDocsToCreate.push({
          clientId: client.id,
          type: 'terms',
          title: 'Terms & Conditions',
          content: termsContent,
          urlSlug: 'terms',
          isActive: true
        })
      }
      if (!hasRestaurantTerms) {
        legalDocsToCreate.push({
          clientId: client.id,
          type: 'restaurant-terms',
          title: 'Restaurant Terms of Service',
          content: restaurantTermsContent,
          urlSlug: 'restaurant-terms',
          isActive: true
        })
      }

      if (legalDocsToCreate.length > 0) {
        await prisma.legalDoc.createMany({
          data: legalDocsToCreate
        })
        console.log(`  ✅ Created ${legalDocsToCreate.length} legal documents`)
      }
    } else {
      console.log('  ℹ️  Legal documents already exist')
    }

    // Check if legal footer section exists
    const legalSection = client.footerSections.find(s => s.title === 'Legal')
    if (!legalSection) {
      // Create legal footer section
      const newSection = await prisma.footerSection.create({
        data: {
          clientId: client.id,
          title: 'Legal',
          sortOrder: 999,
          isActive: true
        }
      })

      // Create footer links
      await prisma.footerLink.createMany({
        data: [
          {
            clientId: client.id,
            footerSectionId: newSection.id,
            label: 'Privacy Policy',
            externalUrl: '/privacy',
            sortOrder: 1,
            isActive: true
          },
          {
            clientId: client.id,
            footerSectionId: newSection.id,
            label: 'Terms & Conditions',
            externalUrl: '/terms',
            sortOrder: 2,
            isActive: true
          },
          {
            clientId: client.id,
            footerSectionId: newSection.id,
            label: 'Restaurant Terms',
            externalUrl: '/restaurant-terms',
            sortOrder: 3,
            isActive: true
          }
        ]
      })
      console.log('  ✅ Created legal footer section and links')
    } else {
      console.log('  ℹ️  Legal footer section already exists')
      // Check if links exist, create if missing
      const existingLabels = legalSection.links.map(l => l.label)
      const linksToCreate = []

      if (!existingLabels.includes('Privacy Policy')) {
        linksToCreate.push({
          clientId: client.id,
          footerSectionId: legalSection.id,
          label: 'Privacy Policy',
          externalUrl: '/privacy',
          sortOrder: 1,
          isActive: true
        })
      }
      if (!existingLabels.includes('Terms & Conditions')) {
        linksToCreate.push({
          clientId: client.id,
          footerSectionId: legalSection.id,
          label: 'Terms & Conditions',
          externalUrl: '/terms',
          sortOrder: 2,
          isActive: true
        })
      }
      if (!existingLabels.includes('Restaurant Terms')) {
        linksToCreate.push({
          clientId: client.id,
          footerSectionId: legalSection.id,
          label: 'Restaurant Terms',
          externalUrl: '/restaurant-terms',
          sortOrder: 3,
          isActive: true
        })
      }

      if (linksToCreate.length > 0) {
        await prisma.footerLink.createMany({
          data: linksToCreate
        })
        console.log(`  ✅ Added ${linksToCreate.length} missing footer links`)
      } else {
        console.log('  ℹ️  All footer links already exist')
      }
    }
  }

  console.log('\n✅ Legal documents seeding completed!')
}

seedLegalDocs()
  .catch(e => {
    console.error('❌ Error seeding legal documents:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
