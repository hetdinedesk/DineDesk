// Location utilities - use with getSiteData()
export function getPrimaryLocation(data) {
  return data.client?.locations?.find(loc => loc.isPrimary) || data.client?.locations?.[0]
}

export function getActiveLocations(data) {
  return data.client?.locations?.filter(loc => loc.isActive) || []
}

export function getFooterLocations(data) {
  // Get locations to display in footer (showInFooter flag or all active locations)
  const locs = data.client?.locations || []
  const footerLocs = locs.filter(l => l.showInFooter && l.isActive !== false)
  // Fallback to active locations if none explicitly marked for footer
  return footerLocs.length > 0 ? footerLocs : locs.filter(l => l.isActive !== false)
}

export function getLocationById(data, id) {
  return data.client?.locations?.find(loc => loc.id === id)
}

// Format hours for display
export function formatHours(hours) {
  if (!hours || typeof hours === 'string') return hours
  return Object.entries(hours)
    .filter(([_, times]) => times?.open && times?.close)
    .map(([day, times]) => `${day}: ${times.open}-${times.close}`)
    .join(' | ')
}

