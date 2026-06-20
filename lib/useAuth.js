/**
 * useAuth — device-token premium check.
 *
 * Web:    token stored in localStorage
 * Mobile: store token in AsyncStorage/SecureStore, call saveToken() on activation
 *
 * On every app launch:
 *   1. Read token from storage
 *   2. Call GET /api/auth/check?token=xxx  (cached 2 min on server)
 *   3. Returns { is_premium, full_name, plan_name, expires_at, expired }
 */

'use client'
import { useState, useEffect, useCallback } from 'react'

const BASE       = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'
const STORAGE_KEY = 'device_token'
const CACHE_MS    = 2 * 60 * 1000  // 2 min client-side cache

let _cache = null   // { data, ts } — module-level so all components share one fetch

export const saveToken = (token) => {
  try { localStorage.setItem(STORAGE_KEY, token) } catch (_) {}
}

export const getToken = () => {
  try { return localStorage.getItem(STORAGE_KEY) || null } catch (_) { return null }
}

export const clearToken = () => {
  _cache = null
  try { localStorage.removeItem(STORAGE_KEY) } catch (_) {}
}

const checkToken = async (token) => {
  const res = await fetch(`${BASE}/api/auth/check?token=${token}`)
  if (!res.ok) return { is_premium: false, reason: 'error' }
  return res.json()
}

// Auto-login via Telegram initData — runs once on first mount inside Telegram
const loginViaTelegram = async () => {
  const tg = window.Telegram?.WebApp
  if (!tg?.initData) return
  try {
    const res = await fetch(`${BASE}/api/auth/telegram`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ initData: tg.initData }),
    })
    const data = await res.json()
    if (data.token) {
      saveToken(data.token)
      _cache = null // force re-check with new token
    }
  } catch (_) {}
}

export function useAuth() {
  const [auth,    setAuth]    = useState(null)   // null = loading
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = getToken()
    if (!token) { setAuth({ is_premium: false }); setLoading(false); return }

    // Use client-side cache
    if (_cache && Date.now() - _cache.ts < CACHE_MS) {
      setAuth(_cache.data); setLoading(false); return
    }

    try {
      const data = await checkToken(token)
      _cache = { data, ts: Date.now() }
      setAuth(data)
    } catch (_) {
      setAuth({ is_premium: false, reason: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // If inside Telegram Mini App and no token yet, auto-login first
    const token = getToken()
    if (!token) {
      loginViaTelegram().then(() => refresh())
    } else {
      refresh()
    }
  }, [refresh])

  return { auth, loading, refresh }
}
