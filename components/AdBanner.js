'use client'
import { useEffect, useRef } from 'react'
import { useConfig } from '@/lib/config'

const injectScript = (src, id, inline = false) => {
  if (typeof document === 'undefined') return
  if (document.getElementById(id)) return
  const s = document.createElement('script')
  s.id = id
  s.async = true
  if (inline) { s.innerHTML = src } else { s.src = src }
  document.head.appendChild(s)
}

export default function AdBanner({ page, slot, style }) {
  const { ads } = useConfig()
  const insRef  = useRef(null)
  const pushed  = useRef(false)

  const nets    = ads?.networks || {}
  const enabled = ads?.master_enabled && (!page || ads?.pages?.[page] !== false)

  // Inject all enabled network scripts once
  useEffect(() => {
    if (!enabled) return

    // Google AdSense
    if (nets.adsense?.enabled && nets.adsense?.publisher_id) {
      injectScript(
        `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${nets.adsense.publisher_id}`,
        'adsense-script'
      )
      if (nets.adsense.auto_ads) {
        injectScript(
          `(adsbygoogle=window.adsbygoogle||[]).push({google_ad_client:"${nets.adsense.publisher_id}",enable_page_level_ads:true});`,
          'adsense-autoads',
          true
        )
      }
    }

    // PropellerAds popunder
    if (nets.propellerads?.enabled && nets.propellerads?.popunder_zone) {
      injectScript(
        `https://a.realsrv.com/publisher-auto-push.js?id=${nets.propellerads.popunder_zone}`,
        'propeller-popunder'
      )
    }

    // PropellerAds push notification
    if (nets.propellerads?.enabled && nets.propellerads?.push_zone) {
      injectScript(
        `https://a.realsrv.com/push-notification.js?id=${nets.propellerads.push_zone}`,
        'propeller-push'
      )
    }

    // Monetag
    if (nets.monetag?.enabled && nets.monetag?.zone_id) {
      injectScript(
        `(function(d,z,s){s.src='https://'+d+'/400/'+z;try{(document.body||document.documentElement).appendChild(s)}catch(e){}})('thubanoa.com','${nets.monetag.zone_id}',document.createElement('script'));`,
        'monetag-script',
        true
      )
    }

    // Adsterra banner — inject imperatively instead of JSX <script> to avoid
    // React reconciler conflicts during navigation
    if (nets.adsterra?.enabled && nets.adsterra?.banner_key && slot?.includes('banner')) {
      injectScript(
        `atOptions={'key':'${nets.adsterra.banner_key}','format':'iframe','height':90,'width':728,'params':{}};`,
        `adsterra-options-${slot}`,
        true
      )
      injectScript(
        `//www.highperformanceformat.com/${nets.adsterra.banner_key}/invoke.js`,
        `adsterra-banner-${slot}`
      )
    }

    // Adsterra social bar
    if (nets.adsterra?.enabled && nets.adsterra?.social_bar_key && slot === 'social_bar') {
      injectScript(
        `//pl${nets.adsterra.social_bar_key}.effectiveratecpm.com/invoke.js`,
        'adsterra-socialbar'
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, JSON.stringify(nets), slot])

  // Manual AdSense unit (when auto_ads is OFF and slot is given)
  useEffect(() => {
    if (!enabled) return
    if (!nets.adsense?.enabled || nets.adsense?.auto_ads) return
    if (!slot || !nets.adsense?.slots?.[slot]) return
    if (pushed.current || !insRef.current) return
    try {
      // eslint-disable-next-line no-undef
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch (_) {}
  }, [enabled, slot, nets.adsense])

  if (!enabled) return null

  const showAdsenseUnit = nets.adsense?.enabled && !nets.adsense?.auto_ads && slot && nets.adsense?.slots?.[slot]

  return (
    <div style={{ textAlign: 'center', overflow: 'hidden', minHeight: showAdsenseUnit ? 90 : 0, ...style }}>
      {showAdsenseUnit && (
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={nets.adsense.publisher_id}
          data-ad-slot={nets.adsense.slots[slot]}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  )
}
