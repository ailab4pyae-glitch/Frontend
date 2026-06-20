'use client'
import { Suspense, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useConfig } from '@/lib/config'
import { useAuth, saveToken } from '@/lib/useAuth'
import Header from '@/components/Header'
import TabStrip from '@/components/TabStrip'
import MatchList from '@/components/MatchList'
import AdBanner from '@/components/AdBanner'
import Footer from '@/components/Footer'

function HomeContent() {
  const { tabs, ui } = useConfig()
  const { auth, refresh } = useAuth()
  const isPremium = auth?.is_premium === true
  const router = useRouter()
  const searchParams = useSearchParams()

  const defaultTab = tabs.find(t => t.slug === 'hesgoal-live')?.slug || ui?.defaultTab || tabs[0]?.slug || 'hesgoal-live'
  const activeTab = searchParams.get('tab') || defaultTab

  // Handle ?activate=TOKEN in URL — save token then clean URL
  useEffect(() => {
    const token = searchParams.get('activate')
    if (token) {
      saveToken(token)
      refresh()
      router.replace(`/?tab=${defaultTab}`, { scroll: false })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Once config loads, write the default tab into the URL if nothing is set yet
  useEffect(() => {
    if (!searchParams.get('tab') && !searchParams.get('activate') && tabs.length > 0) {
      router.replace(`/?tab=${defaultTab}`, { scroll: false })
    }
  }, [defaultTab]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = useCallback((slug) => {
    // replace so tab switches don't pollute the back-stack
    router.replace(`/?tab=${encodeURIComponent(slug)}`, { scroll: false })
  }, [router])

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <TabStrip tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
      {!isPremium && <AdBanner page="home" slot="home_top" style={{ padding: '8px 16px 0' }} />}
      <main>
        <MatchList key={activeTab} tab={activeTab} />
      </main>
      {!isPremium && <AdBanner page="home" slot="home_bottom" style={{ padding: '0 16px 8px' }} />}
      <Footer />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}
