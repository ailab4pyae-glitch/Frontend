'use client'
import { useEffect } from 'react'

export default function TelegramInit() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (!tg) return
    tg.ready()
    tg.expand()
  }, [])
  return null
}
