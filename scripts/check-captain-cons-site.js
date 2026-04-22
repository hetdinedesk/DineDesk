const axios = require('axios');

const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN || 'nfp_r4qk7j5z3XxQXGuxZjvzUpu6d3S1p6se2700';
const SITE_ID = 'ac6a61dc-e299-4fab-bcda-33e37cdd33bf';

const netlify = axios.create({
  baseURL: 'https://api.netlify.com/api/v1',
  headers: { Authorization: 'Bearer ' + NETLIFY_TOKEN }
});

(async () => {
  try {
    console.log('🔍 Checking Captain Cons site:', SITE_ID);
    
    const siteRes = await netlify.get(`/sites/${SITE_ID}`);
    const site = siteRes.data;
    
    console.log('\n📦 Site Info:');
    console.log('  Name:', site.name);
    console.log('  URL:', site.url);
    console.log('  Build settings env:', JSON.stringify(site.build_settings?.env || {}, null, 2));
    
    // Get account-level env vars
    const accountSlug = site.account_slug;
    console.log('\n🔧 Account slug:', accountSlug);
    
    const envRes = await netlify.get(`/accounts/${accountSlug}/env?site_id=${SITE_ID}`);
    const envVars = envRes.data;
    
    console.log('\n📋 Environment Variables:');
    envVars.forEach(env => {
      console.log(`  ${env.key}: ${env.values[0]?.value}`);
    });
    
    // Test the API URL
    const cmsApiUrl = envVars.find(v => v.key === 'NEXT_PUBLIC_CMS_API_URL')?.values[0]?.value;
    if (cmsApiUrl) {
      console.log('\n🧪 Testing API URL:', cmsApiUrl);
      try {
        const siteIdVar = envVars.find(v => v.key === 'NEXT_PUBLIC_SITE_ID')?.values[0]?.value;
        console.log('📋 Site ID from env:', siteIdVar);
        const testRes = await axios.get(`${cmsApiUrl}/clients/ym9yba8o/export`);
        console.log('✅ API is accessible');
        console.log('📊 Client name:', testRes.data.client?.name);
        console.log('📊 Menu items count:', testRes.data.menuItems?.length);
        console.log('📊 Banners count:', testRes.data.banners?.length);
        console.log('📊 Banner details:', JSON.stringify(testRes.data.banners?.slice(0, 2) || [], null, 2));
      } catch (err) {
        console.error('❌ API test failed:', err.message);
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
})();
