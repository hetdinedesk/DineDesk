// Dynamic Template Loader - Theme-agnostic template system
// This allows templates to be loaded based on active theme

import { getTemplatePath, getThemeConfig } from './themeRegistry.js'

// Cache for dynamically imported templates
const templateCache = new Map()

export async function loadTemplate(templateName, themeKey = 'theme-d1') {
  const cacheKey = `${themeKey}-${templateName}`
  
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)
  }

  try {
    const templatePath = getTemplatePath(themeKey)
    const fullPath = `${templatePath}/${templateName}.jsx`
    
    // Dynamic import - this will work with Next.js
    const templateModule = await import(fullPath)
    const template = templateModule.default
    
    templateCache.set(cacheKey, template)
    return template
  } catch (error) {
    console.error(`Failed to load template ${templateName} for theme ${themeKey}:`, error)
    
    // Fallback to theme-d1 if available
    if (themeKey !== 'theme-d1') {
      console.warn(`Falling back to theme-d1 for template ${templateName}`)
      return loadTemplate(templateName, 'theme-d1')
    }
    
    throw error
  }
}

export async function loadComponent(componentName, themeKey = 'theme-d1') {
  const cacheKey = `${themeKey}-${componentName}`
  
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)
  }

  try {
    const componentPath = getThemeConfig(themeKey).componentPath
    const fullPath = `${componentPath}/${componentName}.jsx`
    
    const componentModule = await import(fullPath)
    const component = componentModule.default
    
    templateCache.set(cacheKey, component)
    return component
  } catch (error) {
    console.error(`Failed to load component ${componentName} for theme ${themeKey}:`, error)
    
    // Fallback to theme-d1 if available
    if (themeKey !== 'theme-d1') {
      console.warn(`Falling back to theme-d1 for component ${componentName}`)
      return loadComponent(componentName, 'theme-d1')
    }
    
    throw error
  }
}

// For static imports (build-time resolution)
export function getTemplateImportPath(templateName, themeKey = 'theme-d1') {
  const templatePath = getTemplatePath(themeKey)
  return `${templatePath}/${templateName}.jsx`
}

export function getComponentImportPath(componentName, themeKey = 'theme-d1') {
  const componentPath = getThemeConfig(themeKey).componentPath
  return `${componentPath}/${componentName}.jsx`
}

// Clear template cache (useful for theme switching in development)
export function clearTemplateCache() {
  templateCache.clear()
}
