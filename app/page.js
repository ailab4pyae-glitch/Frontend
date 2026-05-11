'use client'
import { useState, useEffect } from 'react'
import { useConfig } from '@/lib/config'
import Header from '@/components/Header'
import TabStrip from '@/components/TabStrip'
import MatchList from '@/components/MatchList'
import BottomNav from '@/components/BottomNav'

export default function Home() {
  const { tabs, ui } = useConfig()

  // Derive the default tab from backend config; fall back to first tab or 'main-live'
  const defaultTab = ui?.defaultTab || tabs[0]?.slug || 'main-live'
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Once config loads, sync activeTab if the user hasn't manually switched yet
  useEffect(() => {
    if (tabs.length > 0 && activeTab === 'main-live') {
      setActiveTab(defaultTab)
    }
  }, [defaultTab]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', background: ui?.bgColor || '#0A0E1A' }}>
      <Header />
      <TabStrip tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        <MatchList key={activeTab} tab={activeTab} />
      </main>
      <BottomNav />
    </div>
  )
}
