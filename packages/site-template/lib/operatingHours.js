/**
 * Check if restaurant is currently open based on operating hours
 * @param {Object|Array} hours - Object with day keys or Array of { day, open, close, closed } objects
 * @param {string} timezone - IANA timezone string (e.g., 'Australia/Sydney', 'America/New_York')
 * @returns {boolean} - True if restaurant is currently open
 */
export function isRestaurantOpen(hours, timezone) {
  if (!hours) {
    // If no hours data, assume open
    return true;
  }

  const now = timezone ? new Date(new Date().toLocaleString('en-US', { timeZone: timezone })) : new Date();
  const currentDayFull = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentDayShort = now.toLocaleDateString('en-US', { weekday: 'short' });
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

  // Handle object format: { Monday: { open, close, closed }, Tuesday: {...} }
  if (typeof hours === 'object' && !Array.isArray(hours)) {
    // Try both full day name and short day name (e.g., "Friday" and "Fri")
    const todayHours = hours[currentDayFull] || hours[currentDayShort];
    if (!todayHours || todayHours.closed) {
      return false;
    }
    if (!todayHours.open || !todayHours.close) {
      return false;
    }
    return checkTimeRange(todayHours.open, todayHours.close, currentTime);
  }

  // Handle array format: [{ day, open, close, closed }, ...]
  if (Array.isArray(hours)) {
    // Try both full day name and short day name
    const todayHours = hours.find(h => h.day === currentDayFull || h.day === currentDayShort);
    if (!todayHours || todayHours.closed) {
      return false;
    }
    if (!todayHours.open || !todayHours.close) {
      return false;
    }
    return checkTimeRange(todayHours.open, todayHours.close, currentTime);
  }

  return true;
}

function checkTimeRange(openStr, closeStr, currentTime) {
  // Parse time strings (e.g., "9:00am", "5:30pm")
  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    
    const match = timeStr.toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (!match) return 0;

    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const meridiem = match[3];

    if (meridiem === 'pm' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  };

  const openMinutes = parseTime(openStr);
  const closeMinutes = parseTime(closeStr);

  // Handle overnight hours (e.g., 11pm to 2am)
  if (closeMinutes < openMinutes) {
    return currentTime >= openMinutes || currentTime < closeMinutes;
  }

  return currentTime >= openMinutes && currentTime < closeMinutes;
}

/**
 * Get formatted operating hours for display
 * @param {Object|Array} hours - Object with day keys or Array of { day, open, close, closed } objects
 * @returns {string} - Formatted hours string
 */
export function formatOperatingHours(hours) {
  if (!hours) {
    return 'Hours not available';
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  let todayHours;

  // Handle object format
  if (typeof hours === 'object' && !Array.isArray(hours)) {
    todayHours = hours[today];
  } 
  // Handle array format
  else if (Array.isArray(hours)) {
    todayHours = hours.find(h => h.day === today);
  } else {
    return 'Hours not available';
  }

  if (!todayHours || todayHours.closed) {
    return 'Closed today';
  }

  if (!todayHours.open || !todayHours.close) {
    return 'Closed today';
  }

  return `${todayHours.open} - ${todayHours.close}`;
}
