'use client'

export function useTelegram() {
  if (typeof window === 'undefined') return { tg: null, user: null, isTg: false, initData: '' }
  const tg = window.Telegram?.WebApp
  const user = tg?.initDataUnsafe?.user
  return {
    tg,
    user,           // { id, first_name, last_name, username, ... }
    isTg: !!user,  // true only inside Telegram
    initData: tg?.initData || '',
  }
}
