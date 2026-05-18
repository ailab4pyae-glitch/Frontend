'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/auth'

const input = (extra = {}) => ({
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '9px 12px',
  color: '#fff', fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
  ...extra,
})

const Section = ({ title, children }) => (
  <div style={{
    background: '#141824', borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.07)',
    padding: '20px 22px', marginBottom: 20,
  }}>
    <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 18px' }}>
      {title}
    </h3>
    {children}
  </div>
)

const Toggle = ({ label, checked, onChange, description }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <div>
      <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{label}</div>
      {description && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{description}</div>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none',
        background: checked ? '#00FF87' : 'rgba(255,255,255,0.12)',
        cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background .2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, borderRadius: '50%',
        width: 18, height: 18, background: checked ? '#0A0E1A' : 'rgba(255,255,255,0.5)',
        left: checked ? 23 : 3, transition: 'left .2s',
      }} />
    </button>
  </div>
)

const DEFAULT_ADS = {
  master_enabled: false,
  pages: { home: true, watch: true },
  networks: {
    adsense:      { enabled: false, publisher_id: '', auto_ads: true, slots: { home_top: '', home_bottom: '', watch_below: '' } },
    propellerads: { enabled: false, popunder_zone: '', push_zone: '' },
    adsterra:     { enabled: false, banner_key: '', social_bar_key: '' },
    monetag:      { enabled: false, zone_id: '' },
  },
}

export default function ConfigPage() {
  const [features, setFeatures] = useState(null)
  const [ui, setUi]             = useState(null)
  const [ads, setAds]           = useState(null)
  const [tabs, setTabs]         = useState([])
  const [saving, setSaving]     = useState({})
  const [saved, setSaved]       = useState({})
  const [error, setError]       = useState('')

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/config'),
      adminFetch('/api/admin/tabs'),
    ]).then(([cfg, tabData]) => {
      setFeatures({ ...(cfg?.features?.value || {}) })
      setUi({ ...(cfg?.ui?.value || {}) })
      const savedAds = cfg?.ads?.value || {}
      setAds({
        master_enabled: savedAds.master_enabled ?? DEFAULT_ADS.master_enabled,
        pages:    { ...DEFAULT_ADS.pages,    ...(savedAds.pages    || {}) },
        networks: {
          adsense:      { ...DEFAULT_ADS.networks.adsense,      ...(savedAds.networks?.adsense      || {}), slots: { ...DEFAULT_ADS.networks.adsense.slots,      ...(savedAds.networks?.adsense?.slots      || {}) } },
          propellerads: { ...DEFAULT_ADS.networks.propellerads, ...(savedAds.networks?.propellerads || {}) },
          adsterra:     { ...DEFAULT_ADS.networks.adsterra,     ...(savedAds.networks?.adsterra     || {}) },
          monetag:      { ...DEFAULT_ADS.networks.monetag,      ...(savedAds.networks?.monetag      || {}) },
        },
      })
      setTabs(tabData || [])
    }).catch((e) => setError(e.message))
  }, [])

  const saveKey = async (key, value) => {
    setSaving((s) => ({ ...s, [key]: true }))
    try {
      await adminFetch(`/api/admin/config/${key}`, { method: 'PUT', body: JSON.stringify({ value }) })
      setSaved((s) => ({ ...s, [key]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 2000)
    } catch (e) { setError(e.message) }
    finally { setSaving((s) => ({ ...s, [key]: false })) }
  }

  const saveTab = async (id, patch) => {
    setSaving((s) => ({ ...s, [id]: true }))
    try {
      await adminFetch(`/api/admin/tabs/${id}`, { method: 'PUT', body: JSON.stringify(patch) })
      setTabs((ts) => ts.map((t) => t.id === id ? { ...t, ...patch } : t))
      setSaved((s) => ({ ...s, [id]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [id]: false })), 2000)
    } catch (e) { setError(e.message) }
    finally { setSaving((s) => ({ ...s, [id]: false })) }
  }

  const SaveBtn = ({ k }) => (
    <button
      onClick={() => k.startsWith('tab-') ? null : saveKey(k === 'feat' ? 'features' : 'ui', k === 'feat' ? features : ui)}
      disabled={saving[k]}
      style={{
        border: 'none', borderRadius: 8, padding: '9px 20px',
        background: saved[k] ? 'rgba(0,255,135,0.2)' : '#00FF87',
        color: saved[k] ? '#00FF87' : '#0A0E1A',
        fontWeight: 700, fontSize: 13, cursor: 'pointer',
      }}
    >
      {saving[k] ? 'Saving…' : saved[k] ? '✓ Saved' : 'Save'}
    </button>
  )

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 24px' }}>Config</h2>

      {error && (
        <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#ff6b6b', marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Feature flags */}
      <Section title="Feature Flags">
        {features === null
          ? <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading…</div>
          : <>
            {[
              { key: 'multiSourceBadge', label: 'Multi-Source Badge', desc: 'Gold MULTI badge when 2+ sources cover the same match' },
              { key: 'tvPage',           label: 'TV Page',            desc: 'Show the TV tab in bottom navigation' },
              { key: 'searchBar',        label: 'Search Bar',         desc: 'Show the search button in the header' },
              { key: 'highlights',       label: 'Highlights',         desc: 'Show the Highlights tab in bottom navigation' },
              { key: 'adminPanel',       label: 'Admin Panel Link',   desc: 'Show admin panel link in settings' },
            ].map(({ key, label, desc }) => (
              <Toggle
                key={key}
                label={label}
                description={desc}
                checked={!!features[key]}
                onChange={(v) => setFeatures((f) => ({ ...f, [key]: v }))}
              />
            ))}
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <SaveBtn k="feat" />
            </div>
          </>
        }
      </Section>

      {/* UI Settings */}
      <Section title="UI Settings">
        {ui === null
          ? <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading…</div>
          : <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {[
                { key: 'appName',      label: 'App Name',          type: 'text',  ph: 'StreamZone' },
                { key: 'defaultTab',   label: 'Default Tab Slug',  type: 'text',  ph: 'main-live' },
                { key: 'accentColor',  label: 'Accent Color',      type: 'color' },
                { key: 'bgColor',      label: 'Background Color',  type: 'color' },
              ].map(({ key, label, type, ph }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    {label}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {type === 'color' && (
                      <input type="color" value={ui[key] || '#00FF87'}
                        onChange={(e) => setUi((u) => ({ ...u, [key]: e.target.value }))}
                        style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                      />
                    )}
                    <input
                      type="text"
                      value={ui[key] || ''}
                      onChange={(e) => setUi((u) => ({ ...u, [key]: e.target.value }))}
                      placeholder={ph}
                      style={input({ flex: 1 })}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Social Links */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                Telegram
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Channel — shown in header as "Join Telegram" */}
                <div style={{ background: 'rgba(0,136,204,0.06)', border: '1px solid rgba(0,136,204,0.15)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#29b6f6', fontWeight: 700, marginBottom: 10 }}>
                    📢 Channel — shown in header (news &amp; updates)
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Channel URL</label>
                      <input type="url" value={ui.telegramUrl || ''}
                        onChange={(e) => setUi((u) => ({ ...u, telegramUrl: e.target.value }))}
                        placeholder="https://t.me/yourchannel"
                        style={input({ fontFamily: 'monospace', fontSize: 13 })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Button Label</label>
                      <input type="text" value={ui.telegramLabel || ''}
                        onChange={(e) => setUi((u) => ({ ...u, telegramLabel: e.target.value }))}
                        placeholder="Join Telegram"
                        style={input({ fontSize: 13 })} />
                    </div>
                  </div>
                </div>

                {/* Bot — used for Subscribe button on match cards */}
                <div style={{ background: 'rgba(0,255,135,0.04)', border: '1px solid rgba(0,255,135,0.12)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#00FF87', fontWeight: 700, marginBottom: 10 }}>
                    🤖 Bot — shown on match cards (subscription &amp; payment)
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Bot URL</label>
                    <input type="url" value={ui.telegramBotUrl || ''}
                      onChange={(e) => setUi((u) => ({ ...u, telegramBotUrl: e.target.value }))}
                      placeholder="https://t.me/yourbot"
                      style={input({ fontFamily: 'monospace', fontSize: 13 })} />
                  </div>
                </div>

              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <SaveBtn k="ui" />
            </div>
          </>
        }
      </Section>

      {/* Ads Management */}
      <Section title="Ads Management">
        {ads === null
          ? <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading…</div>
          : <>
            {/* Master switch */}
            <Toggle
              label="Master Ads Switch"
              description="Turn OFF to hide all ads sitewide instantly"
              checked={!!ads.master_enabled}
              onChange={(v) => setAds((a) => ({ ...a, master_enabled: v }))}
            />

            {/* Pages */}
            <div style={{ margin: '16px 0 8px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Show Ads On</div>
              <div style={{ display: 'flex', gap: 16 }}>
                {[{ key: 'home', label: 'Home page' }, { key: 'watch', label: 'Watch page' }].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!ads.pages?.[key]}
                      onChange={(e) => setAds((a) => ({ ...a, pages: { ...a.pages, [key]: e.target.checked } }))}
                      style={{ width: 16, height: 16, accentColor: '#00FF87', cursor: 'pointer' }}
                    />
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />

            {/* Google AdSense */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🔵</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>Google AdSense</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Highest CPM</span>
                </div>
                <Toggle label="" checked={!!ads.networks?.adsense?.enabled}
                  onChange={(v) => setAds((a) => ({ ...a, networks: { ...a.networks, adsense: { ...a.networks.adsense, enabled: v } } }))}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 24 }}>
                {[
                  { key: 'publisher_id', label: 'Publisher ID', ph: 'ca-pub-XXXXXXXXXXXXXXXX' },
                ].map(({ key, label, ph }) => (
                  <div key={key}>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>{label}</label>
                    <input type="text" placeholder={ph} value={ads.networks?.adsense?.[key] || ''}
                      onChange={(e) => setAds((a) => ({ ...a, networks: { ...a.networks, adsense: { ...a.networks.adsense, [key]: e.target.value } } }))}
                      style={input({ fontFamily: 'monospace', fontSize: 12 })}
                    />
                  </div>
                ))}
                <Toggle label="Auto Ads (recommended)" description="Google places ads automatically — no slot IDs needed"
                  checked={!!ads.networks?.adsense?.auto_ads}
                  onChange={(v) => setAds((a) => ({ ...a, networks: { ...a.networks, adsense: { ...a.networks.adsense, auto_ads: v } } }))}
                />
                {!ads.networks?.adsense?.auto_ads && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    {[
                      { key: 'home_top',    label: 'Home top slot ID' },
                      { key: 'home_bottom', label: 'Home bottom slot ID' },
                      { key: 'watch_below', label: 'Watch page slot ID' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 3 }}>{label}</label>
                        <input type="text" placeholder="1234567890" value={ads.networks?.adsense?.slots?.[key] || ''}
                          onChange={(e) => setAds((a) => ({ ...a, networks: { ...a.networks, adsense: { ...a.networks.adsense, slots: { ...a.networks.adsense.slots, [key]: e.target.value } } } }))}
                          style={input({ fontFamily: 'monospace', fontSize: 12 })}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* PropellerAds */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🟠</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>PropellerAds</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Best for streaming</span>
                </div>
                <Toggle label="" checked={!!ads.networks?.propellerads?.enabled}
                  onChange={(v) => setAds((a) => ({ ...a, networks: { ...a.networks, propellerads: { ...a.networks.propellerads, enabled: v } } }))}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 24 }}>
                {[
                  { key: 'popunder_zone', label: 'Onclick (Popunder) Zone ID', ph: 'Zone ID from PropellerAds' },
                  { key: 'push_zone',     label: 'Push Notification Zone ID',  ph: 'Zone ID from PropellerAds' },
                ].map(({ key, label, ph }) => (
                  <div key={key}>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>{label}</label>
                    <input type="text" placeholder={ph} value={ads.networks?.propellerads?.[key] || ''}
                      onChange={(e) => setAds((a) => ({ ...a, networks: { ...a.networks, propellerads: { ...a.networks.propellerads, [key]: e.target.value } } }))}
                      style={input({ fontFamily: 'monospace', fontSize: 12 })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Adsterra */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🟢</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>Adsterra</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Good SEA CPM</span>
                </div>
                <Toggle label="" checked={!!ads.networks?.adsterra?.enabled}
                  onChange={(v) => setAds((a) => ({ ...a, networks: { ...a.networks, adsterra: { ...a.networks.adsterra, enabled: v } } }))}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 24 }}>
                {[
                  { key: 'banner_key',      label: 'Banner Key',      ph: 'Adsterra banner key' },
                  { key: 'social_bar_key',  label: 'Social Bar Key',  ph: 'Adsterra social bar key' },
                ].map(({ key, label, ph }) => (
                  <div key={key}>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>{label}</label>
                    <input type="text" placeholder={ph} value={ads.networks?.adsterra?.[key] || ''}
                      onChange={(e) => setAds((a) => ({ ...a, networks: { ...a.networks, adsterra: { ...a.networks.adsterra, [key]: e.target.value } } }))}
                      style={input({ fontFamily: 'monospace', fontSize: 12 })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Monetag */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🟣</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>Monetag</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>In-page push</span>
                </div>
                <Toggle label="" checked={!!ads.networks?.monetag?.enabled}
                  onChange={(v) => setAds((a) => ({ ...a, networks: { ...a.networks, monetag: { ...a.networks.monetag, enabled: v } } }))}
                />
              </div>
              <div style={{ paddingLeft: 24 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>Zone ID</label>
                <input type="text" placeholder="Monetag zone ID" value={ads.networks?.monetag?.zone_id || ''}
                  onChange={(e) => setAds((a) => ({ ...a, networks: { ...a.networks, monetag: { ...a.networks.monetag, zone_id: e.target.value } } }))}
                  style={input({ fontFamily: 'monospace', fontSize: 12 })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => saveKey('ads', ads)} disabled={saving.ads} style={{
                border: 'none', borderRadius: 8, padding: '10px 24px',
                background: saved.ads ? 'rgba(0,255,135,0.2)' : '#00FF87',
                color: saved.ads ? '#00FF87' : '#0A0E1A',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                {saving.ads ? 'Saving…' : saved.ads ? '✓ Saved' : 'Save Ads Config'}
              </button>
            </div>
          </>
        }
      </Section>

      {/* Tab config */}
      <Section title="Tab Display">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tabs.map((tab) => (
            <div key={tab.id} style={{
              display: 'grid', gridTemplateColumns: '36px 1fr 100px 80px auto',
              gap: 10, alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <input
                type="text" value={tab.icon || ''} maxLength={4}
                onChange={(e) => setTabs((ts) => ts.map((t) => t.id === tab.id ? { ...t, icon: e.target.value } : t))}
                style={input({ textAlign: 'center', padding: '8px 4px' })}
              />
              <input
                type="text" value={tab.name || ''}
                onChange={(e) => setTabs((ts) => ts.map((t) => t.id === tab.id ? { ...t, name: e.target.value } : t))}
                style={input({})}
              />
              <input
                type="text" value={tab.color || ''}
                onChange={(e) => setTabs((ts) => ts.map((t) => t.id === tab.id ? { ...t, color: e.target.value } : t))}
                placeholder="#00FF87"
                style={input({})}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="color" value={tab.color || '#00FF87'}
                  onChange={(e) => setTabs((ts) => ts.map((t) => t.id === tab.id ? { ...t, color: e.target.value } : t))}
                  style={{ width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                />
                <Toggle
                  label="" checked={!!tab.is_active}
                  onChange={(v) => setTabs((ts) => ts.map((t) => t.id === tab.id ? { ...t, is_active: v } : t))}
                />
              </div>
              <button
                onClick={() => saveTab(tab.id, { name: tab.name, icon: tab.icon, color: tab.color, is_active: tab.is_active })}
                disabled={saving[tab.id]}
                style={{
                  border: 'none', borderRadius: 8, padding: '8px 14px',
                  background: saved[tab.id] ? 'rgba(0,255,135,0.15)' : 'rgba(0,255,135,0.1)',
                  color: '#00FF87', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                }}
              >
                {saving[tab.id] ? '…' : saved[tab.id] ? '✓' : 'Save'}
              </button>
            </div>
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 10 }}>
          Changes reflect in the frontend within 60 seconds (config cache TTL).
        </p>
      </Section>
    </div>
  )
}
