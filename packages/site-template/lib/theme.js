function buildThemeCSS(colours) {
  if (!colours) return ''

  const c = {
    primary:    colours.primary    || '#C8823A',
    secondary:  colours.secondary  || '#1C2B1A',
    headerBg:   colours.headerBg   || '#ffffff',
    headerText: colours.headerText || '#1A1A1A',
    navBg:      colours.navBg      || '#1C2B1A',
    navText:    colours.navText    || '#ffffff',
    bodyBg:     colours.bodyBg     || '#ffffff',
    bodyText:   colours.bodyText   || '#1A1A1A',
    ctaBg:      colours.ctaBg      || '#C8823A',
    ctaText:    colours.ctaText    || '#ffffff',
    accentBg:   colours.accentBg   || '#F7F2EA',
  }

  return `
:root {
  --color-primary:     ${c.primary};
  --color-secondary:   ${c.secondary};
  --color-header-bg:   ${c.headerBg};
  --color-header-text: ${c.headerText};
  --color-nav-bg:      ${c.navBg};
  --color-nav-text:    ${c.navText};
  --color-body-bg:     ${c.bodyBg};
  --color-body-text:   ${c.bodyText};
  --color-cta-bg:      ${c.ctaBg};
  --color-cta-text:    ${c.ctaText};
  --color-accent-bg:   ${c.accentBg};
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--color-body-bg);
  color: var(--color-body-text);
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
img { display: block; max-width: 100%; }
`.trim()
}

module.exports = { buildThemeCSS }