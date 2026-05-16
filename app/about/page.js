export const metadata = {
  title: 'About | ကျွန်ုပ်တို့အကြောင်း',
  description: 'About ThaeGyiKoneThuLay — Free live football and sports streaming for Myanmar fans. Watch Premier League, La Liga, Champions League and more.',
}

export default function AboutPage() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'ThaeGyiKoneThuLay'

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A', color: '#fff' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px' }}>

        <a href="/" style={{ color: '#00FF87', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
          ← Back / နောက်သို့
        </a>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚽</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            {siteName}
          </h1>
          <p style={{ fontSize: 18, color: '#00FF87', fontWeight: 600, marginBottom: 8 }}>
            တိုက်ရိုက်ကြည့်ရှုမှု အခမဲ့
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Free Live Sports Streaming for Everyone
          </p>
        </div>

        {/* What we are */}
        <div style={{ background: '#141824', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', padding: '28px 28px', marginBottom: 24 }}>
          <h2 style={{ color: '#00FF87', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            ကျွန်ုပ်တို့အကြောင်း — About Us
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.8, marginBottom: 12 }}>
            <strong style={{ color: '#fff' }}>{siteName}</strong> သည် မြန်မာ စပိုက်ပရိသတ်များအတွက် အခမဲ့ တိုက်ရိုက် ဘောလုံး နှင့် အားကစား ကြည့်ရှုခွင့် ပေးသော ဝဘ်ဆိုဒ်တစ်ခု ဖြစ်ပါသည်။
          </p>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.8 }}>
            {siteName} is a free live sports streaming platform dedicated to Myanmar sports fans. We aggregate live match schedules and streams from around the world so you never miss a game — whether it's the Premier League, Champions League, La Liga, Bundesliga, or local Southeast Asian competitions.
          </p>
        </div>

        {/* What we offer */}
        <div style={{ background: '#141824', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', padding: '28px 28px', marginBottom: 24 }}>
          <h2 style={{ color: '#00FF87', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
            ကျွန်ုပ်တို့ ပေးသောဝန်ဆောင်မှုများ — What We Offer
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { icon: '🔴', en: 'Live Match Streaming',   mm: 'တိုက်ရိုက် ပွဲများ ကြည့်ရှုခွင့်' },
              { icon: '📅', en: 'Match Schedule',         mm: 'ပွဲစဉ်များ ၊ အချိန်ဇယားများ' },
              { icon: '🏆', en: 'All Major Leagues',      mm: 'ကြီးမားသော လိဂ်များအားလုံး' },
              { icon: '📱', en: 'Mobile Friendly',        mm: 'မိုဘိုင်းဖုန်းနှင့် သင့်တော်သည်' },
              { icon: '🌏', en: 'Southeast Asia Focus',   mm: 'အရှေ့တောင်အာရှ ပရိသတ်' },
              { icon: '⚡', en: 'Multiple Servers',        mm: 'ဆာဗာများစွာ ရရှိနိုင်သည်' },
            ].map(({ icon, en, mm }) => (
              <div key={en} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{en}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{mm}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sports we cover */}
        <div style={{ background: '#141824', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', padding: '28px 28px', marginBottom: 24 }}>
          <h2 style={{ color: '#00FF87', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            ကြည့်ရှုနိုင်သော ပြိုင်ပွဲများ — Competitions We Cover
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League', '⭐ Champions League', '🇪🇸 La Liga',
              '🇩🇪 Bundesliga', '🇮🇹 Serie A', '🇫🇷 Ligue 1',
              '🌍 World Cup', '🇪🇺 Euro', '🏆 FA Cup',
              '🇹🇭 Thai League', '🏆 AFF Championship', '🇲🇲 Myanmar National League',
              '🇨🇳 Chinese Super League', '🇯🇵 J-League', '🇸🇦 Saudi Pro League',
            ].map((league) => (
              <span key={league} style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 13,
                background: 'rgba(0,255,135,0.07)', color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(0,255,135,0.1)',
              }}>
                {league}
              </span>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ background: 'rgba(245,158,11,0.05)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.15)', padding: '20px 22px', marginBottom: 24 }}>
          <h3 style={{ color: '#f59e0b', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>⚠️ Disclaimer / သတိပေးချက်</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7 }}>
            {siteName} does not host any video content. All streams are provided by third-party sources. We are not responsible for the content, availability, or legality of external streams. For official broadcasts, please use your local licensed broadcaster.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>
            {siteName} သည် မည်သည့် ဗီဒီယို အကြောင်းအရာကိုမျှ မသိမ်းဆည်းပါ။ Streaming များအားလုံးသည် တတိယပါတီ အရင်းအမြစ်များမှ ဖြစ်ပါသည်။
          </p>
        </div>

        {/* Contact + Links */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/privacy" style={{
            padding: '10px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none',
          }}>
            🔒 Privacy Policy
          </a>
          <a href="/" style={{
            padding: '10px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: 'rgba(0,255,135,0.1)', color: '#00FF87',
            border: '1px solid rgba(0,255,135,0.2)', textDecoration: 'none',
          }}>
            ⚽ Watch Live Now
          </a>
        </div>

      </div>
    </div>
  )
}
