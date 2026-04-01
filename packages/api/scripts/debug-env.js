#!/usr/bin/env node

// Quick debug script to check environment variables
require('dotenv').config();

console.log('\n🔍 Environment Variables Check\n');
console.log('═'.repeat(50));

console.log('\nDatabase:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
if (process.env.DATABASE_URL) {
  console.log('    →', process.env.DATABASE_URL.replace(/\/\/.*:/, '//***:')); // Hide password
}

console.log('\nAuthentication:');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set (' + process.env.JWT_SECRET.length + ' chars)' : '❌ Missing');

console.log('\nNetlify:');
console.log('  NETLIFY_TOKEN:', process.env.NETLIFY_TOKEN ? '✅ Set (' + process.env.NETLIFY_TOKEN.substring(0, 8) + '...)' : '❌ Missing');

console.log('\nAPI URLs:');
console.log('  NEXT_PUBLIC_CMS_API_URL:', process.env.NEXT_PUBLIC_CMS_API_URL || '❌ Missing');
console.log('  CMS_API_URL:', process.env.CMS_API_URL || '❌ Missing');
console.log('  PUBLIC_API_URL:', process.env.PUBLIC_API_URL || '❌ Missing');

console.log('\nServer:');
console.log('  PORT:', process.env.PORT || '3001 (default)');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development (default)');

console.log('\n' + '═'.repeat(50));
console.log('\n💡 Tip: If any show ❌ Missing, check your .env file\n');
