import Head from 'next/head'
import Link from 'next/link'

export default function Custom500() {
  return (
    <>
      <Head>
        <title>Server Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '40px',
        background: '#fff',
        color: '#333'
      }}>
        <div style={{
          maxWidth: '500px',
          textAlign: 'center',
          padding: '40px',
          background: '#f9f9f9',
          borderRadius: '12px',
          border: '1px solid #e0e0e0'
        }}>
          <h1 style={{ fontSize: '120px', margin: '0', color: '#FF6B2B' }}>500</h1>
          <h2 style={{ fontSize: '24px', margin: '20px 0', color: '#333' }}>Server Error</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Something went wrong on our end. Please try again later.
          </p>
          <Link href="/">
            <button style={{
              padding: '12px 24px',
              background: '#FF6B2B',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Go to Homepage
            </button>
          </Link>
        </div>
      </div>
    </>
  )
}
