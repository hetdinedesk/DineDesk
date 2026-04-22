const axios = require('axios');

const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN || 'nfp_r4qk7j5z3XxQXGuxZjvzUpu6d3S1p6se2700';

const netlify = axios.create({
  baseURL: 'https://api.netlify.com/api/v1',
  headers: { Authorization: 'Bearer ' + NETLIFY_TOKEN }
});

(async () => {
  try {
    console.log('🔍 Listing Netlify sites...\n');
    const res = await netlify.get('/sites');
    const sites = res.data;
    
    console.log(`Found ${sites.length} sites:\n`);
    
    sites.forEach(site => {
      console.log('📦 Site:');
      console.log('  ID:', site.id);
      console.log('  Name:', site.name);
      console.log('  URL:', site.url);
      console.log('  SSL:', site.ssl);
      console.log('  Repo:', site.build_settings?.repo?.repo_path || 'None');
      console.log('  Branch:', site.build_settings?.repo?.repo_branch || 'None');
      console.log('  Env vars count:', Object.keys(site.build_settings?.env || {}).length);
      console.log('');
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
})();
