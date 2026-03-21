/**
 * Returns a display string with shortcodes highlighted for the CMS editor.
 * On the live site, call replaceShortcodes(text, values) to get real values.
 */
export function replaceShortcodes(text, values = {}) {
  if (!text) return ''
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] !== undefined ? values[key] : match
  })
}

/**
 * Get shortcode values from config for use in preview/live replace.
 */
export function getShortcodeValues(config) {
  const sc = config?.shortcodes || {}
  const result = {}
  const keys = ['restaurantName','group','address','suburb','state',
                 'phone','primaryEmail','abn']
  keys.forEach(k => {
    if (sc[k] && !k.startsWith('_')) result[k] = sc[k]
  })
  return result
}