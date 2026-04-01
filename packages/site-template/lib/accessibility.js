/**
 * Accessibility Utilities for DineDesk
 * Provides ARIA labels, keyboard navigation helpers, and focus management
 */

// Common ARIA labels for reusable components
export const ariaLabels = {
  // Navigation
  mainNav: 'Main navigation',
  mobileMenu: 'Mobile navigation menu',
  skipLink: 'Skip to main content',
  
  // Buttons
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  toggleSubmenu: (label) => `Toggle ${label} submenu`,
  
  // Forms
  searchInput: 'Search',
  submitForm: 'Submit form',
  
  // Media
  decorativeImage: '',
  externalLink: (label) => `${label} (opens in new tab)`,
  
  // Sections
  mainContent: 'Main content',
  footer: 'Footer',
  header: 'Site header',
  
  // Booking
  bookTable: 'Book a table',
  callRestaurant: 'Call restaurant',
  getDirections: 'Get directions'
};

// Keyboard navigation helpers
export const handleKeyboardNav = {
  // Handle Enter and Space keys for button-like elements
  activateOnEnter: (callback) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback(e);
    }
  },
  
  // Close on Escape
  closeOnEscape: (onClose) => (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  },
  
  // Trap focus within a container (for modals/menus)
  trapFocus: (container) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    firstFocusable.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
};

// Focus management utilities
export const focusManagement = {
  // Save current focus before opening modal/menu
  saveFocus: () => document.activeElement,
  
  // Restore focus to previously focused element
  restoreFocus: (element) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  },
  
  // Get all focusable elements within a container
  getFocusableElements: (container) => {
    return container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  },
  
  // Move focus to specific element
  moveFocus: (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};

// Screen reader announcements
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Responsive breakpoint utilities
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280
};

// Check if viewport is mobile
export const isMobileViewport = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= breakpoints.mobile;
};

// Generate responsive className based on state
export const responsiveClass = (baseClass, states) => {
  const classes = [baseClass];
  
  if (states?.hideOnMobile) classes.push(`${baseClass}--hide-mobile`);
  if (states?.hideOnTablet) classes.push(`${baseClass}--hide-tablet`);
  if (states?.showOnlyMobile) classes.push(`${baseClass}--mobile-only`);
  
  return classes.join(' ');
};

// Accessible click handler (works with both mouse and keyboard)
export const createAccessibleClickHandler = (handler) => {
  return (e) => {
    // Prevent default for keyboard events to avoid double-triggering
    if (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
    }
    handler(e);
  };
};
