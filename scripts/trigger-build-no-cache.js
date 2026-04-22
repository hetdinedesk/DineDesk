const axios = require('axios');

const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN || 'nfp_r4qk7j5z3XxQXGuxZjvzUpu6d3S1p6se2700';
const SITE_ID = 'ac6a61dc-e299-4fab-bcda-33e37cdd33bf';

const netlify = axios.create({
  baseURL: 'https://api.netlify.com/api/v1',
  headers: { Authorization: 'Bearer ' + NETLIFY_TOKEN }
});

(async () => {
  try {
    console.log('🔨 Triggering build with cache disabled for:', SITE_ID);
    
    // Get build hooks
    const hooksRes = await netlify.get(`/sites/${SITE_ID}/build_hooks`);
    const hooks = hooksRes.data;
    
    if (hooks.length > 0) {
      console.log('📡 Using build hook with cache-busting...');
      // Add timestamp to cache-bust
      const hookUrl = hooks[0].url;
      const res = await axios.post(hookUrl, {}, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log('✅ Build triggered via hook');
    } else {
      console.log('📡 Creating build hook...');
      const createRes = await netlify.post(`/sites/${SITE_ID}/build_hooks`, {
        title: 'CMS Deploy',
        branch: 'main'
      });
      console.log('✅ Build hook created:', createRes.data.url);
      console.log('🔨 Triggering build...');
      await axios.post(createRes.data.url);
      console.log('✅ Build triggered');
    }
    
    console.log('\n🌐 Site: https://ym9yba8o-captain-cons-fish-and-chips.netlify.app');
    console.log('⏳ Build usually takes 1-3 minutes');
    console.log('📊 Monitor at: https://app.netlify.com/sites/ac6a61dc-e299-4fab-bcda-33e37cdd33bf/deploys');
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
})();
