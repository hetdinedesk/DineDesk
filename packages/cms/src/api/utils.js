export const API = import.meta.env.VITE_CMS_API_URL || import.meta.env.NEXT_PUBLIC_CMS_API_URL || 'http://localhost:3001/api'

export async function apiFetch(path, method = 'GET', body = null, tokenKey = 'dd_token') {
  const token = localStorage.getItem(tokenKey)
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(API + path, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}
