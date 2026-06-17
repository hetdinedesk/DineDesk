import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const msg = {
      to: process.env.SENDGRID_TO_EMAIL!,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: `New Contact Form: ${body.restaurantName}`,
      text: `
Name: ${body.name}
Restaurant: ${body.restaurantName}
Email: ${body.email}
Phone: ${body.phone || 'Not provided'}
Type: ${body.type || 'Not specified'}
Message: ${body.message}
      `,
    }

    await sgMail.send(msg)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('SendGrid error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
