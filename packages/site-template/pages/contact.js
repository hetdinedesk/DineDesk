import { useState } from 'react'
import Head from 'next/head'
import { getSiteData, CMS_API_URL, SITE_ID } from '../lib/api'
import UtilityBelt      from '../components/UtilityBelt'
import SiteHeader       from '../components/SiteHeader'
import Navbar           from '../components/Navbar'
import SiteFooter       from '../components/SiteFooter'

export async function getStaticProps() {
  const data = await getSiteData()
  return {
    props:      { data, colours: data.colours || null },
    revalidate: 60
  }
}

export default function ContactPage({ data }) {
  const { settings={}, booking={} } = data
  const name = settings.restaurantName || data.client?.name || 'Our Restaurant'

  const [name_,    setName]    = useState('')
  const [email,    setEmail]   = useState('')
  const [phone,    setPhone]   = useState('')
  const [message,  setMessage] = useState('')
  const [status,   setStatus]  = useState('idle')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch(`${CMS_API_URL}/clients/${SITE_ID}/form-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: 'Contact Enquiry',
          fields: { name: name_, email, phone, message }
        })
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const inp = {
    width:'100%', padding:'12px 14px', fontSize:14,
    border:'1px solid #D1D5DB', borderRadius:8,
    fontFamily:'inherit', outline:'none', boxSizing:'border-box',
    marginTop:6, background:'#fff'
  }

  return (
    <>
      <Head>
        <title>Contact — {name}</title>
        <meta name="description" content={`Get in touch with ${name}`}/>
      </Head>

      <UtilityBelt settings={settings} booking={booking} data={data}/>
      <SiteHeader  settings={settings} booking={booking} data={data}/>
      <Navbar      settings={settings} booking={booking}/>

      <main style={{ maxWidth:640, margin:'0 auto', padding:'56px 32px' }}>
        <h1 style={{ fontFamily:'Georgia,serif', fontSize:40, fontWeight:900,
          color:'var(--color-text,#1A1A1A)', marginBottom:8 }}>Contact Us</h1>
        <p style={{ fontSize:15, color:'#888', marginBottom:40, lineHeight:1.6 }}>
          Send us a message and we will get back to you shortly.
        </p>

        {status === 'sent' ? (
          <div style={{ background:'#ECFDF5', border:'1px solid #A7F3D0',
            borderRadius:12, padding:40, textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <h2 style={{ fontWeight:700, color:'#065F46', marginBottom:8 }}>Message sent!</h2>
            <p style={{ color:'#047857' }}>Thank you — we will be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}
            style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:700, color:'#374151' }}>
                Your Name *
              </label>
              <input value={name_} onChange={e => setName(e.target.value)}
                required placeholder="e.g. John Smith" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:700, color:'#374151' }}>
                Email Address *
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="your@email.com" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:700, color:'#374151' }}>
                Phone
              </label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+61 400 000 000" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:700, color:'#374151' }}>
                Message *
              </label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                required rows={5} placeholder="How can we help you?"
                style={{ ...inp, resize:'vertical' }}/>
            </div>

            {status === 'error' && (
              <div style={{ background:'#FEF2F2', border:'1px solid #FECACA',
                borderRadius:8, padding:'12px 16px', fontSize:13, color:'#DC2626' }}>
                Something went wrong. Please try again or call us directly.
              </div>
            )}

            <button type="submit" disabled={status === 'sending'}
              style={{ background:'var(--color-primary)', color:'#fff',
                padding:'14px 32px', borderRadius:8, border:'none',
                fontWeight:700, fontSize:15, cursor: status === 'sending'
                  ? 'not-allowed' : 'pointer',
                fontFamily:'inherit',
                opacity: status === 'sending' ? 0.7 : 1 }}>
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}

        {/* Contact details box */}
        {(settings.phone || settings.address || settings.defaultEmail) && (
          <div style={{ marginTop:48, padding:24, background:'#F9FAFB',
            border:'1px solid #E5E7EB', borderRadius:12 }}>
            <h3 style={{ fontWeight:700, marginBottom:16,
              color:'var(--color-text,#1A1A1A)', fontSize:16 }}>
              Get in touch directly
            </h3>
            {settings.phone && (
              <div style={{ display:'flex', gap:10, marginBottom:10, fontSize:14 }}>
                <span>📞</span>
                <a href={`tel:${settings.phone}`}
                  style={{ color:'var(--color-primary)', fontWeight:600,
                    textDecoration:'none' }}>{settings.phone}</a>
              </div>
            )}
            {settings.address && (
              <div style={{ display:'flex', gap:10, marginBottom:10,
                fontSize:14, color:'#555' }}>
                <span>📍</span><span>{settings.address}</span>
              </div>
            )}
            {settings.defaultEmail && (
              <div style={{ display:'flex', gap:10, fontSize:14 }}>
                <span>✉️</span>
                <a href={`mailto:${settings.defaultEmail}`}
                  style={{ color:'var(--color-primary)', textDecoration:'none' }}>
                  {settings.defaultEmail}
                </a>
              </div>
            )}
            {settings.openingHours && (
              <div style={{ display:'flex', gap:10, marginTop:10,
                fontSize:14, color:'#555' }}>
                <span>🕐</span><span>{settings.openingHours}</span>
              </div>
            )}
          </div>
        )}
      </main>

      <SiteFooter settings={settings} data={data}/>
    </>
  )
}