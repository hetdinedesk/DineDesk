#!/usr/bin/env node

/**
 * Netlify Configuration Diagnostic Script
 * Run this to check if your Netlify integration is properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 DineDesk Netlify Configuration Check\n');
console.log('═'.repeat(50));

let allGood = true;

// 1. Check .env file
console.log('\n1️⃣  Checking environment file...');
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check NETLIFY_TOKEN
  const tokenMatch = envContent.match(/NETLIFY_TOKEN\s*=\s*(.+)/);
  if (tokenMatch && tokenMatch[1].trim()) {
    const token = tokenMatch[1].trim();
    if (token.length > 20) {
      console.log('   ✅ NETLIFY_TOKEN is set and looks valid');
    } else {
      console.log('   ⚠️  NETLIFY_TOKEN seems too short - might be invalid');
      allGood = false;
    }
  } else {
    console.log('   ❌ NETLIFY_TOKEN is missing or empty');
    console.log('   👉 Get one from: https://app.netlify.com/user/applications#personal-access-tokens');
    allGood = false;
  }
  
  // Check API URLs
  const apiUrlMatch = envContent.match(/NEXT_PUBLIC_CMS_API_URL\s*=\s*(.+)/);
  if (apiUrlMatch && apiUrlMatch[1].trim()) {
    console.log('   ✅ NEXT_PUBLIC_CMS_API_URL is set:', apiUrlMatch[1].trim());
  } else {
    console.log('   ⚠️  NEXT_PUBLIC_CMS_API_URL not set - using default');
  }
} else {
  console.log('   ❌ .env file not found');
  console.log('   👉 Copy .env.example to .env and fill in your values');
  allGood = false;
}

// 2. Check Netlify service file
console.log('\n2️⃣  Checking Netlify service...');
const servicePath = path.join(__dirname, '../src/services/netlify.js');
if (fs.existsSync(servicePath)) {
  console.log('   ✅ netlify.js service file exists');
  const serviceContent = fs.readFileSync(servicePath, 'utf8');
  
  const requiredFunctions = ['createSite', 'triggerDeploy', 'getDeploys', 'setEnvVars'];
  requiredFunctions.forEach(fn => {
    if (serviceContent.includes(fn)) {
      console.log(`   ✅ Function ${fn}() exists`);
    } else {
      console.log(`   ❌ Function ${fn}() is missing`);
      allGood = false;
    }
  });
} else {
  console.log('   ❌ netlify.js service file not found');
  allGood = false;
}

// 3. Check clients route
console.log('\n3️⃣  Checking API routes...');
const routePath = path.join(__dirname, '../src/routes/clients.js');
if (fs.existsSync(routePath)) {
  const routeContent = fs.readFileSync(routePath, 'utf8');
  
  const requiredEndpoints = [
    '/netlify/create',
    '/netlify/domain',
    '/netlify/deploys'
  ];
  
  requiredEndpoints.forEach(endpoint => {
    if (routeContent.includes(endpoint)) {
      console.log(`   ✅ Endpoint ${endpoint} exists`);
    } else {
      console.log(`   ❌ Endpoint ${endpoint} is missing`);
      allGood = false;
    }
  });
} else {
  console.log('   ❌ clients.js route file not found');
  console.log('   👉 Expected at: src/routes/clients.js');
  allGood = false;
}

// 4. Check if Netlify is mounted in main app
console.log('\n4️⃣  Checking route registration...');
const indexPath = path.join(__dirname, '../src/index.js');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  if (indexContent.includes("require('./routes/clients')")) {
    console.log('   ✅ Clients route is mounted in main app');
  } else {
    console.log('   ❌ Clients route not mounted in main app');
    console.log('   👉 Add to src/index.js: app.use(\'/api/clients\', require(\'./routes/clients\'))');
    allGood = false;
  }
} else {
  console.log('   ❌ index.js not found');
  console.log('   👉 Expected at: src/index.js');
  allGood = false;
}

// 5. Summary
console.log('\n' + '═'.repeat(50));
if (allGood) {
  console.log('\n✅ All checks passed! Your Netlify integration should work.');
  console.log('\n📝 Next steps:');
  console.log('   1. Make sure your API server is running: npm run dev');
  console.log('   2. Open CMS at http://localhost:5173');
  console.log('   3. Go to Config → Deployment');
  console.log('   4. Click "Create Netlify Site"');
} else {
  console.log('\n❌ Some checks failed. Please fix the issues above.');
  console.log('\n📖 See NETLIFY_SETUP.md for detailed instructions.');
}

console.log('\n');

process.exit(allGood ? 0 : 1);
