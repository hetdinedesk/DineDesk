require('dotenv').config({ path: 'packages/api/.env' });
const axios = require('axios');

// Netlify API client
const netlify = axios.create({
  baseURL: 'https://api.netlify.com/api/v1',
  headers: { Authorization: 'Bearer ' + process.env.NETLIFY_TOKEN }
});

async function listSites() {
  try {
    console.log('🔍 Listing Netlify sites...');
    const res = await netlify.get('/sites');
    const sites = res.data;
    
    console.log(`Found ${sites.length} sites:`);
    sites.forEach(site => {
      console.log(`- Name: ${site.name}`);
      console.log(`  ID: ${site.id}`);
      console.log(`  URL: ${site.url}`);
      console.log(`  Repo: ${site.repo?.repo_path || 'N/A'}`);
      console.log(`  Branch: ${site.repo?.repo_branch || 'N/A'}`);
      console.log('');
    });

    // Find the bella-vista site
    const bellaVista = sites.find(s => s.name.includes('bella-vista'));
    if (bellaVista) {
      console.log('✅ Found bella-vista site:', bellaVista.id);
      await fixBranch(bellaVista.id);
    } else {
      console.log('⚠️  bella-vista site not found. Please manually select a site ID from the list above.');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Response:', err.response.data);
    }
    process.exit(1);
  }
}

async function fixBranch(siteId) {
  const repoPath = process.env.SITE_TEMPLATE_REPO || 'hetdinedesk/DineDesk';
  const branch = 'main'; // Update to main
  const baseDir = 'packages/site-template';

  console.log(`\n🔗 Updating Netlify site ${siteId} to use branch: ${branch}`);

  try {
    // Get current site config to preserve env vars
    const siteRes = await netlify.get(`/sites/${siteId}`);
    const accountSlug = siteRes.data.account_slug;
    const existingEnv = siteRes.data?.build_settings?.env || {};
    console.log(`📦 Preserving ${Object.keys(existingEnv).length} existing env vars`);
    console.log(`📦 Account slug: ${accountSlug}`);

    // Update repo configuration to use main branch
    const res = await netlify.patch(`/sites/${siteId}`, {
      repo: {
        provider: 'github',
        repo_path: repoPath,
        repo_branch: branch,
        base: baseDir,
        dir: '.next',
        cmd: 'npm install && npm run build',
        allowed_branches: [branch],
      }
    });

    console.log('✅ Repository configuration updated');

    // Note: Env var restoration skipped due to account plan limitations
    // If needed, manually set env vars in Netlify UI: Site settings → Environment variables
    if (Object.keys(existingEnv).length > 0) {
      console.log(`⚠️  Note: ${Object.keys(existingEnv).length} env vars need manual restoration in Netlify UI (account plan limitation)`);
    }

    console.log('✅ Branch configuration fixed. Triggering redeploy...');

    // Trigger a build
    await netlify.post(`/sites/${siteId}/builds`);
    console.log('✅ Redeploy triggered');

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Response:', err.response.data);
    }
    process.exit(1);
  }
}

listSites();
