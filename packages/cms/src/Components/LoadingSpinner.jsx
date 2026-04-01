import { forwardRef } from 'react'

const C = {
  acc:'#FF6B2B', cyan:'#00D4FF', green:'#22C55E', 
  t2:'#7A8BAD', t3:'#445572'
}

const LoadingSpinner = forwardRef(({ 
  size = 24, 
  color = C.acc, 
  thickness = 3, 
  speed = '1s',
  className = ''
}, ref) => (
  <svg 
    ref={ref}
    className={className}
    width={size} 
    height={size} 
    viewBox="0 0 38 38" 
    stroke={color}
    strokeWidth={thickness}
    style={{
      animation: `spin ${speed} linear infinite`,
      display: 'block'
    }}
  >
    <defs>
      <linearGradient id="spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="1"/>
        <stop offset="50%" stopColor={color} stopOpacity="0.3"/>
        <stop offset="100%" stopColor={color} stopOpacity="0"/>
      </linearGradient>
    </defs>
    
    <g transform="translate(19,19)" stroke="url(#spinner-grad)">
      <circle cx="0" cy="0" r="15" strokeDasharray="85 85" strokeLinecap="round"/>
    </g>
  </svg>
))

LoadingSpinner.displayName = 'LoadingSpinner'

export default LoadingSpinner

// Global CSS (add to index.css)
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
}

// Usage:
///**
// <LoadingSpinner size={32} color={C.cyan} thickness={3} />
// <LoadingSpinner size={20} speed="0.8s" /> 
//**/

