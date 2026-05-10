'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { fetcher, apiUrl } from '@/lib/api'
import Header from '@/components/Header'
import TabStrip from '@/components/TabStrip'
import MatchList from '@/components/MatchList'
import BottomNav from '@/components/BottomNav'

export default function Home() {
  const [activeTab, setActiveTab] = useState('main-live')

  const { data: tabs } = useSWR(apiUrl.tabs(), fetcher, {
    revalidateOnFocus: false,
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A' }}>
      <Header />
      <TabStrip tabs={tabs || []} activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        <MatchList key={activeTab} tab={activeTab} />
      </main>
      <BottomNav />
    </div>
  )
}
