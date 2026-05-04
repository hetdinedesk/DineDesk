// Theme Registry - Dynamic theme system for multi-theme support
// This allows themes to be swapped without affecting core logic

export const THEME_REGISTRY = {
  'theme-d1': {
    name: 'Modern Restaurant (D1)',
    description: 'Clean, modern, and highly configurable',
    templatePath: '../templates/theme-d1',
    componentPath: '../components/theme-d1',
    defaultColors: {
      primary: '#C8823A',
      secondary: '#1C2B1A',
      headerBg: '#ffffff',
      headerText: '#1A1A1A',
      navBg: '#1C2B1A',
      navText: '#ffffff',
      bodyBg: '#ffffff',
      bodyText: '#1A1A1A',
      ctaBg: '#C8823A',
      ctaText: '#ffffff',
      accentBg: '#F7F2EA',
      utilityBeltBg: '#C8823A',
      utilityBeltText: '#ffffff',
    },
    features: ['Utility belt', 'Dynamic sections', 'Reviews carousel', 'Responsive header'],
    targetBusinessTypes: ['Full-service restaurants', 'Cafes', 'Fine dining']
  },
  'theme-d2': {
    name: 'Cafe Theme (D2)',
    description: 'Warm, elegant cafe theme with rounded corners and serif typography',
    templatePath: '../templates/theme-d2',
    componentPath: '../components/theme-d2',
    defaultColors: {
      primary: '#C8823A',
      secondary: '#1C2B1A',
      accentBg: '#F7F2EA',
      headerBg: '#ffffff',
      headerText: '#1A1A1A',
      navBg: '#1C2B1A',
      navText: '#ffffff',
      bodyBg: '#F7F2EA',
      bodyText: '#1C2B1A',
      ctaBg: '#C8823A',
      ctaText: '#ffffff',
    },
    features: ['Utility belt', 'Banner carousel', 'Promo tiles', 'Reviews carousel', 'Responsive header', 'Rounded corners', 'Serif typography'],
    targetBusinessTypes: ['Coffee shops', 'Artisan cafes', 'Bakeries', 'Brunch spots']
  },
  'theme-d3': {
    name: 'Cafe Theme (D3)',
    description: 'Alternative cafe theme with unique styling',
    templatePath: '../templates/theme-d3',
    componentPath: '../components/theme-d3',
    defaultColors: {
      primary: '#C8823A',
      secondary: '#1C2B1A',
      accentBg: '#F7F2EA',
      headerBg: '#ffffff',
      headerText: '#1A1A1A',
      navBg: '#1C2B1A',
      navText: '#ffffff',
      bodyBg: '#F7F2EA',
      bodyText: '#1C2B1A',
      ctaBg: '#C8823A',
      ctaText: '#ffffff',
    },
    features: ['Utility belt', 'Banner carousel', 'Promo tiles', 'Reviews carousel', 'Responsive header'],
    targetBusinessTypes: ['Coffee shops', 'Artisan cafes', 'Bakeries', 'Brunch spots']
  }
}

export function getThemeConfig(themeKey = 'theme-d1') {
  return THEME_REGISTRY[themeKey] || THEME_REGISTRY['theme-d1']
}

export function getTemplatePath(themeKey = 'theme-d1') {
  const theme = getThemeConfig(themeKey)
  return theme.templatePath
}

export function getComponentPath(themeKey = 'theme-d1') {
  const theme = getThemeConfig(themeKey)
  return theme.componentPath
}

export function getAvailableThemes() {
  return Object.keys(THEME_REGISTRY).map(key => ({
    key,
    ...THEME_REGISTRY[key]
  }))
}

export function isValidTheme(themeKey) {
  return themeKey in THEME_REGISTRY
}
