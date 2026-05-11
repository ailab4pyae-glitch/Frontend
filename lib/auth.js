const BASE      = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'
const TOKEN_KEY = 'admin_token'

export const getToken  = () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null)
export const setToken  = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export const isAuthenticated = () => {
  const t = getToken()
  if (!t) return false
  try {
    const { exp } = JSON.parse(atob(t.split('.')[1]))
    return exp * 1000 > Date.now()
  } catch { return false }
}

export const authHeaders = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type':  'application/json',
})

export const adminFetch = (path, opts = {}) =>
  fetch(`${BASE}${path}`, {
    ...opts,
    headers: { ...authHeaders(), ...(opts.headers || {}) },
  }).then(async (r) => {
    if (r.status === 401) { clearToken(); window.location.href = '/login'; return; }
    if (!r.ok && r.status !== 204) throw new Error((await r.json().catch(() => ({}))).error || r.statusText)
    return r.status === 204 ? null : r.json()
  })
