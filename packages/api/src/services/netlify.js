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

  const maxRetries = 5
  let attempts = 0

  while (attempts < maxRetries) {
    attempts++
    try {
      const res = await netlify.post('/sites', payload)
      return res.data
    } catch (err) {
      console.error('❌ Netlify createSite error:', err.message)
      console.error('Status:', err.response?.status)
      console.error('Response:', err.response?.data)

      // Handle rate limiting (429) with exponential backoff
      if (err.response?.status === 429) {
        const retryAfter = err.response?.headers?.['retry-after'] || 5
        const delay = Math.min(retryAfter * 1000, 30000) // Cap at 30 seconds

        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        } else {
          throw new Error(`Netlify rate limit exceeded after ${maxRetries} attempts. Please wait a few minutes and try again.`)
        }
      }

      // Handle specific errors
      if (err.response?.status === 422) {
        // Netlify sends different 422 errors — distinguish account limits from name conflicts
        const respData = err.response?.data
        const errorMsg = respData?.message || respData?.error || JSON.stringify(respData) || ''
        if (errorMsg.toLowerCase().includes('usage limit') || errorMsg.toLowerCase().includes('exceeded') || errorMsg.toLowerCase().includes('cannot create more')) {
          throw new Error(errorMsg) // pass through account limit errors as-is
        }
        throw new Error(`Site name "${name}" is not available. ${errorMsg || 'Site name is already taken'}`)
      } else if (err.response?.status === 401) {
        throw new Error('Netlify authentication failed. Please check your NETLIFY_TOKEN.')
      } else if (err.response?.status === 403) {
        throw new Error('Netlify token lacks required permissions. Ensure it has api:read, api:write, and site:write scopes.')
      }

      throw err
    }
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
// Strategy: use site-level build_settings.env (works on ALL plans),
// then try account-level API as upgrade path
async function setEnvVars(siteId, envVars) {
  // Primary method: PATCH /sites/{id} with build_settings.env — works on all plans
  try {
    // First get existing env so we don't overwrite them
    const siteRes = await netlify.get(`/sites/${siteId}`)
    const existingEnv = siteRes.data?.build_settings?.env || {}
    const mergedEnv = { ...existingEnv, ...envVars }

    await netlify.patch(`/sites/${siteId}`, {
      build_settings: { env: mergedEnv }
    })
    return { success: true, count: Object.keys(envVars).length }
  } catch (err) {
    console.warn('⚠️  build_settings method failed:', err.message)
  }

  // Fallback: account-level env vars API (requires Pro+ plan)
  try {
    const siteResponse = await netlify.get(`/sites/${siteId}`)
    const accountSlug = siteResponse.data.account_slug
    if (!accountSlug) throw new Error('Could not determine account slug')

    for (const [key, value] of Object.entries(envVars)) {
      await netlify.post(`/accounts/${accountSlug}/env`, {
        key, value,
        scope: { type: 'sites', resources: [siteId] },
        context: 'all'
      })
    }
    return { success: true, count: Object.keys(envVars).length }
  } catch (err) {
    console.error('❌ setEnvVars error:', err.message)
    console.error('Status:', err.response?.status)
    console.error('Response:', err.response?.data)
    throw err
  }
}

// Get environment variables for a site
async function getEnvVars(siteId) {
  try {
    // Primary: read from site build_settings.env (all plans)
    const siteRes = await netlify.get(`/sites/${siteId}`)
    const buildEnv = siteRes.data?.build_settings?.env
    if (buildEnv && Object.keys(buildEnv).length > 0) {
      // Convert { KEY: 'val' } to [{ key, values: [{ value, context }] }] format for UI
      return Object.entries(buildEnv).map(([key, value]) => ({
        key, values: [{ value, context: 'all' }]
      }))
    }
    // Fallback: account-level API
    const accountSlug = siteRes.data.account_slug
    if (accountSlug) {
      const res = await netlify.get(`/accounts/${accountSlug}/env?site_id=${siteId}`)
      return res.data || []
    }
    return []
  } catch (err) {
    console.error('❌ getEnvVars error:', err.message)
    return []
  }
}

// Update a single env var (patch) — creates if not exists
async function upsertEnvVar(siteId, key, value) {
  // Primary: merge into build_settings.env (all plans)
  try {
    const siteRes = await netlify.get(`/sites/${siteId}`)
    const existingEnv = siteRes.data?.build_settings?.env || {}
    existingEnv[key] = value
    await netlify.patch(`/sites/${siteId}`, {
      build_settings: { env: existingEnv }
    })
    return { key, value }
  } catch (err) {
    console.warn('⚠️  build_settings upsert failed, trying account API:', err.message)
  }

  // Fallback: account-level API
  const siteResponse = await netlify.get(`/sites/${siteId}`)
  const accountSlug = siteResponse.data.account_slug
  if (!accountSlug) throw new Error('Could not determine account slug')

  try {
    const res = await netlify.patch(`/accounts/${accountSlug}/env/${encodeURIComponent(key)}`, {
      value, context: 'all', site_id: siteId
    })
    return res.data
  } catch (err) {
    if (err.response?.status === 404) {
      const res = await netlify.post(`/accounts/${accountSlug}/env`, {
        key, value, context: 'all',
        scopes: ['builds', 'functions'], site_id: siteId
      })
      return res.data
    }
    throw err
  }
}

// Delete an env var from a site
async function deleteEnvVar(siteId, key) {
  // Primary: remove from build_settings.env
  try {
    const siteRes = await netlify.get(`/sites/${siteId}`)
    const existingEnv = siteRes.data?.build_settings?.env || {}
    delete existingEnv[key]
    await netlify.patch(`/sites/${siteId}`, {
      build_settings: { env: existingEnv }
    })
    return { success: true }
  } catch (err) {
    console.warn('⚠️  build_settings delete failed, trying account API:', err.message)
  }

  // Fallback: account-level API
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

// Delete a Netlify site
async function deleteSite(siteId) {
  await netlify.delete(`/sites/${siteId}`)
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

  // Preserve existing env vars before updating repo config (Netlify UI resets them on relink)
  let existingEnv = {}
  try {
    const siteRes = await netlify.get(`/sites/${siteId}`)
    existingEnv = siteRes.data?.build_settings?.env || {}
  } catch (err) {
    console.warn('⚠️  Could not fetch existing env vars:', err.message)
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

  // Restore env vars after repo update
  if (Object.keys(existingEnv).length > 0) {
    try {
      await netlify.patch(`/sites/${siteId}`, {
        build_settings: { env: existingEnv }
      })
    } catch (err) {
      console.warn('⚠️  Could not restore env vars after repo link:', err.message)
    }
  }

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
  provisionSSL,
  deleteSite
}