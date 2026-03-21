const axios = require('axios')

// Netlify API client — all requests go through this
const netlify = axios.create({
  baseURL: 'https://api.netlify.com/api/v1',
  headers: { Authorization: 'Bearer ' + process.env.NETLIFY_TOKEN }
})

// Create a new Netlify site for a restaurant
async function createSite(name, domain) {
  const res = await netlify.post('/sites', {
    name:          name,
    custom_domain: domain
  })
  return res.data
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
async function setEnvVars(siteId, envVars) {
  await netlify.patch(`/sites/${siteId}`, {
    build_settings: { env: envVars }
  })
}

module.exports = { createSite, triggerDeploy, getDeploys, setEnvVars }