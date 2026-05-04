export function buildThemeCSS(colours, settings={}) {
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
    utilityBeltBg: colours.utilityBeltBg || colours.primary,
    utilityBeltText: colours.utilityBeltText || '#ffffff',
  }

  const fonts = {
    heading: settings.fontFamily || 'Cormorant Garamond, serif',
    body:    settings.bodyFont  || 'Inter, sans-serif'
  }

  return `
:root {
  --primary:           ${c.primary};
  --primary-foreground: ${c.ctaText};
  --secondary:         ${c.secondary};
  --secondary-foreground: ${c.navText};
  --accent:            ${c.accentBg};
  --accent-foreground: ${c.bodyText};
  --background:        ${c.bodyBg};
  --foreground:        ${c.bodyText};
  --card:              ${c.bodyBg};
  --card-foreground:   ${c.bodyText};
  --popover:           ${c.bodyBg};
  --popover-foreground: ${c.bodyText};
  --border:            rgba(0,0,0,0.1);
  --input:             ${c.accentBg};

  --color-primary:     ${c.primary};
  --color-secondary:   ${c.secondary};
  --color-accent:      ${c.accentBg};
  --color-header-bg:   ${c.headerBg};
  --color-header-text: ${c.headerText};
  --color-nav-bg:      ${c.navBg};
  --color-nav-text:    ${c.navText};
  --color-body-bg:     ${c.bodyBg};
  --color-body-text:   ${c.bodyText};
  --color-cta-bg:      ${c.ctaBg};
  --color-cta-text:    ${c.ctaText};
  --color-accent-bg:   ${c.accentBg};
  --color-utility-belt-bg: ${c.utilityBeltBg};
  --color-utility-belt-text: ${c.utilityBeltText};
  --font-heading:      ${fonts.heading};
  --font-body:         ${fonts.body};
}
`.trim()
}