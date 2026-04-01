/**
 * Replace {{shortcode}} tokens with real values from the shortcodes config.
 * Shortcodes stay as-is in the DB — replaced only on the live site / preview.
 */
export function replaceShortcodes(text, values = {}) {
  if (!text) return ''
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] !== undefined && values[key] !== ''
      ? values[key]
      : match
  })
}