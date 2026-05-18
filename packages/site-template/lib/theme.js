// Valid hex color regex
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/
const SAFE_FONT_REGEX = /^[a-zA-Z0-9\s,\-']+$/

// Sanitize color input - must be valid hex
function sanitizeColor(color, defaultColor) {
  if (!color || typeof color !== 'string') return defaultColor
  const trimmed = color.trim()
  if (!HEX_COLOR_REGEX.test(trimmed)) return defaultColor
  return trimmed
}

// Sanitize font family input
function sanitizeFont(font, defaultFont) {
  if (!font || typeof font !== 'string') return defaultFont
  const trimmed = font.trim()
  if (!SAFE_FONT_REGEX.test(trimmed)) return defaultFont
  // Prevent CSS injection by removing dangerous characters
  return trimmed.replace(/[;{}]/g, '')
}

export function buildThemeCSS(colours, settings={}) {
  if (!colours) return ''

  const c = {
    primary:    sanitizeColor(colours.primary, '#C8823A'),
    secondary:  sanitizeColor(colours.secondary, '#1C2B1A'),
    headerBg:   sanitizeColor(colours.headerBg, '#ffffff'),
    headerText: sanitizeColor(colours.headerText, '#1A1A1A'),
    navBg:      sanitizeColor(colours.navBg, '#1C2B1A'),
    navText:    sanitizeColor(colours.navText, '#ffffff'),
    bodyBg:     sanitizeColor(colours.bodyBg, '#ffffff'),
    bodyText:   sanitizeColor(colours.bodyText, '#1A1A1A'),
    ctaBg:      sanitizeColor(colours.ctaBg, '#C8823A'),
    ctaText:    sanitizeColor(colours.ctaText, '#ffffff'),
    accentBg:   sanitizeColor(colours.accentBg, '#F7F2EA'),
    utilityBeltBg: sanitizeColor(colours.utilityBeltBg, colours.primary),
    utilityBeltText: sanitizeColor(colours.utilityBeltText, '#ffffff'),
  }

  const fonts = {
    heading: sanitizeFont(settings.fontFamily, 'Cormorant Garamond, serif'),
    body:    sanitizeFont(settings.bodyFont, 'Inter, sans-serif')
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