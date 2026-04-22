const axios = require('axios');

const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN || 'nfp_r4qk7j5z3XxQXGuxZjvzUpu6d3S1p6se2700';
const SITE_ID = 'ee37b587-10a3-4e92-b37e-eba9c92218a0';

const netlify = axios.create({
  baseURL: 'https://api.netlify.com/api/v1',
  headers: { Authorization: 'Bearer ' + NETLIFY_TOKEN }
});

(async () => {
  try {
    console.log('🔍 Getting build hooks for site:', SITE_ID);
    
    const res = await netlify.get(`/sites/${SITE_ID}/build_hooks`);
    const hooks = res.data;
    
    console.log('\n📋 Build hooks:');
    hooks.forEach(hook => {
      console.log('  Title:', hook.title);
      console.log('  URL:', hook.url);
      console.log('  Branch:', hook.branch);
      console.log('');
    });
    
    if (hooks.length > 0) {
      console.log('✅ Triggering build using first hook...');
      const triggerRes = await axios.post(hooks[0].url);
      console.log('✅ Build triggered successfully');
      console.log('🌐 Site: http://cmnrgxone0000fz466egls8aq-bella-vista.netlify.app');
      console.log('⏳ Build usually takes 1-3 minutes');
    } else {
      console.log('⚠️  No build hooks found. Creating one...');
      const createRes = await netlify.post(`/sites/${SITE_ID}/build_hooks`, {
        title: 'CMS Deploy',
        branch: 'main'
      });
      console.log('✅ Build hook created:', createRes.data.url);
      console.log('🔨 Triggering build...');
      await axios.post(createRes.data.url);
      console.log('✅ Build triggered');
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
