const axios = require('axios');

const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN || 'nfp_r4qk7j5z3XxQXGuxZjvzUpu6d3S1p6se2700';
const SITE_ID = 'ee37b587-10a3-4e92-b37e-eba9c92218a0';

const netlify = axios.create({
  baseURL: 'https://api.netlify.com/api/v1',
  headers: { Authorization: 'Bearer ' + NETLIFY_TOKEN }
});

(async () => {
  try {
    console.log('🔍 Checking Netlify site:', SITE_ID);
    
    // Get site info
    const siteRes = await netlify.get(`/sites/${SITE_ID}`);
    console.log('\n📦 Site Info:');
    console.log('  Name:', siteRes.data.name);
    console.log('  URL:', siteRes.data.url);
    console.log('  Build settings env:', JSON.stringify(siteRes.data.build_settings?.env || {}, null, 2));
    
    // Get account-level env vars
    const accountSlug = siteRes.data.account_slug;
    console.log('\n🔧 Account slug:', accountSlug);
    
    try {
      const envRes = await netlify.get(`/accounts/${accountSlug}/env?site_id=${SITE_ID}`);
      console.log('\n📋 Account-level env vars:');
      console.log(JSON.stringify(envRes.data, null, 2));
    } catch (err) {
      console.log('\n⚠️  Could not fetch account-level env vars:', err.message);
    }
    
    console.log('\n✅ Done');
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
})();
