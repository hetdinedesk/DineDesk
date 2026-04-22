const axios = require('axios');

const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN || 'nfp_r4qk7j5z3XxQXGuxZjvzUpu6d3S1p6se2700';
const SITE_ID = 'ee37b587-10a3-4e92-b37e-eba9c92218a0';
const BUILD_HOOK = 'https://api.netlify.com/build_hooks/69defa7dd169df06db2fae7e';

(async () => {
  try {
    console.log('🔨 Triggering Netlify build for site:', SITE_ID);
    
    // Try using build hook first (preferred method)
    console.log('\n📡 Method 1: Using build hook...');
    try {
      const hookRes = await axios.post(BUILD_HOOK);
      console.log('✅ Build hook triggered successfully');
      console.log('📋 Response:', hookRes.data);
    } catch (err) {
      console.warn('⚠️  Build hook failed:', err.message);
      console.log('\n📡 Method 2: Using Netlify API...');
      
      // Fallback: Trigger build via API
      const netlify = axios.create({
        baseURL: 'https://api.netlify.com/api/v1',
        headers: { Authorization: 'Bearer ' + NETLIFY_TOKEN }
      });
      
      const res = await netlify.post(`/sites/${SITE_ID}/builds`);
      console.log('✅ Build triggered via API');
      console.log('📋 Response:', res.data);
    }
    
    console.log('\n🌐 Check your site at: http://cmnrgxone0000fz466egls8aq-bella-vista.netlify.app');
    console.log('⏳ Build usually takes 1-3 minutes to complete');
    console.log('📊 Monitor build at: https://app.netlify.com/sites/ee37b587-10a3-4e92-b37e-eba9c92218a0/deploys');
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
})();
