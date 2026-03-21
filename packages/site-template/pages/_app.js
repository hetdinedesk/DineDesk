import Head from 'next/head'
import { buildThemeCSS } from '../lib/theme'

export default function App({ Component, pageProps }) {
  const css      = buildThemeCSS(pageProps.colours)
  const settings = pageProps.data?.settings || {}
  const isLive   = settings.indexing === 'allowed'

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        {isLive
          ? <meta name="robots" content="index, follow"/>
          : <meta name="robots" content="noindex, nofollow"/>
        }
      </Head>
      {css && <style dangerouslySetInnerHTML={{ __html: css }}/>}
      <Component {...pageProps}/>
    </>
  )
}