const axios = require('axios')

// Netlify API client — all requests go through this
const netlify = axios.create({
  baseURL: 'https://api.netlify.com/api/v1',
  headers: { Authorization: 'Bearer ' + process.env.NETLIFY_TOKEN }
})

// Create a new Netlify site for a restaurant
async function createSite(name, domain = null) {
  const payload = {
    name: name,
    // Force HTTPS, set notification email
    account_name: 'me',
    notify_context: 'production',
  }
  
  if (domain) {
    payload.custom_domain = domain
  }
  
  try {
    console.log('🔵 Netlify API Request: POST /sites')
    console.log('📦 Payload:', JSON.stringify(payload, null, 2))
    const res = await netlify.post('/sites', payload)
    console.log('✅ Netlify Response:', res.status)
    return res.data
  } catch (err) {
    console.error('❌ Netlify createSite error:', err.message)
    console.error('Status:', err.response?.status)
    console.error('Response:', err.response?.data)
    
    // Handle specific errors
    if (err.response?.status === 422) {
      const errorMsg = err.response?.data?.message || 'Site name is already taken'
      throw new Error(`Site name "${name}" is not available. ${errorMsg}`)
    } else if (err.response?.status === 401) {
      throw new Error('Netlify authentication failed. Please check your NETLIFY_TOKEN.')
    } else if (err.response?.status === 403) {
      throw new Error('Netlify token lacks required permissions. Ensure it has api:read, api:write, and site:write scopes.')
    }
    
    throw err
  }
}

// Fire a build hook URL to trigger a rebuild
async function triggerDeploy(hookUrl) {
  await axios.post(hookUrl)
}

// Get the last 10 deploys for a Netlify site
async function getDeploys(siteId) {
  const res = await netlify.get(`/sites/${siteId}/deploys?per_page=10`)
  return res.data
}

// Set environment variables on a Netlify site
// Uses Netlify's Environment Variables API v2 (2024+)
// Reference: https://open-api.netlify.com/#tag/environmentVariables
async function setEnvVars(siteId, envVars) {
  try {
    console.log('🔵 Netlify API Request: Setting environment variables for site', siteId)
    console.log('🔧 Env vars:', JSON.stringify(envVars, null, 2))
    
    // First, get the site details to find the account_slug
    console.log('   Fetching site details to get account info...')
    const siteResponse = await netlify.get(`/sites/${siteId}`)
    const accountSlug = siteResponse.data.account_slug
    
    if (!accountSlug) {
      throw new Error('Could not determine account slug from site')
    }
    
    console.log('   Account slug:', accountSlug)
    const results = []
    
    // Netlify's new API requires creating env vars individually via account-level endpoint
    for (const [key, value] of Object.entries(envVars)) {
      console.log(`   Setting env var: ${key} = ${value.substring(0, 10)}...`)
      
      try {
        // Use the new Account Environment Variables API
        // POST /accounts/{account_slug}/env
        const res = await netlify.post(`/accounts/${accountSlug}/env`, {
          key: key,
          value: value,
          scope: {
            type: 'sites',
            resources: [siteId]
          },
          context: 'all'  // Apply to all contexts
        })
        results.push(res.data)
        console.log(`   ✅ Env var ${key} set successfully`)
      } catch (err) {
        console.error(`   ❌ Failed to set ${key}:`, err.message)
        if (err.response?.status === 404) {
          console.error('   ⚠️  Endpoint not found - your Netlify token may lack env var permissions')
        } else if (err.response?.status === 403) {
          console.error('   ⚠️  Permission denied - ensure token has env:write scope')
        }
        throw err
      }
    }
    
    console.log('✅ All environment variables set successfully')
    return { success: true, count: results.length }
  } catch (err) {
    console.error('❌ setEnvVars error:', err.message)
    console.error('Status:', err.response?.status)
    console.error('Response:', err.response?.data)
    
    // Provide helpful guidance
    if (err.response?.status === 404) {
      throw new Error('Netlify Environment Variables API endpoint not found. Your account may not have access to the new env vars API yet.')
    } else if (err.response?.status === 403) {
      throw new Error('Permission denied for environment variables. Your Netlify token needs "env:write" scope.')
    }
    
    throw err
  }
}

// Get environment variables for a site
async function getEnvVars(siteId) {
  try {
    const siteResponse = await netlify.get(`/sites/${siteId}`)
    const accountSlug = siteResponse.data.account_slug
    if (!accountSlug) throw new Error('Could not determine account slug')
    const res = await netlify.get(`/accounts/${accountSlug}/env?site_id=${siteId}`)
    return res.data || []
  } catch (err) {
    console.error('❌ getEnvVars error:', err.message)
    if (err.response?.status === 404) return []
    throw err
  }
}

// Update a single env var (patch) — creates if not exists
async function upsertEnvVar(siteId, key, value) {
  const siteResponse = await netlify.get(`/sites/${siteId}`)
  const accountSlug = siteResponse.data.account_slug
  if (!accountSlug) throw new Error('Could not determine account slug')

  // Try PATCH first (update existing), fall back to POST (create new)
  try {
    const res = await netlify.patch(`/accounts/${accountSlug}/env/${encodeURIComponent(key)}`, {
      value,
      context: 'all',
      site_id: siteId
    })
    return res.data
  } catch (err) {
    if (err.response?.status === 404) {
      // Var doesn't exist — create it
      const res = await netlify.post(`/accounts/${accountSlug}/env`, {
        key,
        value,
        context: 'all',
        scopes: ['builds', 'functions'],
        site_id: siteId
      })
      return res.data
    }
    throw err
  }
}

// Delete an env var from a site
async function deleteEnvVar(siteId, key) {
  const siteResponse = await netlify.get(`/sites/${siteId}`)
  const accountSlug = siteResponse.data.account_slug
  if (!accountSlug) throw new Error('Could not determine account slug')
  await netlify.delete(`/accounts/${accountSlug}/env/${encodeURIComponent(key)}?site_id=${siteId}`)
  return { success: true }
}

// Restore a previous deploy (rollback)
async function rollbackDeploy(siteId, deployId) {
  const res = await netlify.post(`/sites/${siteId}/deploys/${deployId}/restore`)
  return res.data
}

// Add custom domain to existing Netlify site
async function addDomain(siteId, domain) {
  try {
    const res = await netlify.post(`/sites/${siteId}/domain_aliases`, {
      hostname: domain
    })
    return { success: true, data: res.data }
  } catch (err) {
    if (err.response?.status === 422) {
      throw new Error(`Domain ${domain} is already in use by another site`)
    }
    throw err
  }
}

// Set primary domain for site
async function setPrimaryDomain(siteId, domain) {
  await netlify.put(`/sites/${siteId}/domains/primary`, {
    name: domain
  })
}

// Provision SSL certificate for domain
async function provisionSSL(siteId, domain) {
  // Netlify auto-provisions SSL, just need to wait
  // This endpoint triggers the provisioning
  await netlify.post(`/sites/${siteId}/domains/${domain}/dns`)
}

// Link a Netlify site to the site-template GitHub repo.
// Requires SITE_TEMPLATE_REPO env var (e.g. "owner/dinedesk").
// The Netlify account must have GitHub OAuth already authorized.
async function linkRepoToSite(siteId, branchOverride = null) {
  const repoPath = process.env.SITE_TEMPLATE_REPO
  const branch   = branchOverride || process.env.SITE_TEMPLATE_REPO_BRANCH || 'main'
  const baseDir  = process.env.SITE_TEMPLATE_BASE_DIR    || 'packages/site-template'

  if (!repoPath) {
    throw new Error('SITE_TEMPLATE_REPO is not set. Add it to your .env (e.g. SITE_TEMPLATE_REPO=owner/dinedesk).')
  }

  const res = await netlify.patch(`/sites/${siteId}`, {
    repo: {
      provider:         'github',
      repo_path:        repoPath,
      repo_branch:      branch,
      base:             baseDir,                   // cd into packages/site-template first
      dir:              '.next',                   // publish dir, relative to base
      cmd:              'npm install && npm run build', // runs inside base
      allowed_branches: [branch],
    }
  })
  return res.data
}

module.exports = { 
  createSite, 
  triggerDeploy, 
  getDeploys, 
  setEnvVars,
  getEnvVars,
  upsertEnvVar,
  deleteEnvVar,
  rollbackDeploy,
  linkRepoToSite,
  addDomain,
  setPrimaryDomain,
  provisionSSL
}