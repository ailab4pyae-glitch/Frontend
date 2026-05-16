export const metadata = {
  title: 'Privacy Policy | ကိုယ်ရေးအချက်အလက် မူဝါဒ',
  description: 'Privacy Policy for our live sports streaming service. How we collect and use your data.',
}

const Section = ({ title, mm, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ color: '#00FF87', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
    {mm && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 10, fontStyle: 'italic' }}>{mm}</p>}
    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.8 }}>{children}</div>
  </div>
)

export default function PrivacyPage() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'ThaeGyiKoneThuLay'
  const domain   = process.env.NEXT_PUBLIC_SITE_URL  || 'https://yoursite.com'

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A', color: '#fff' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <a href="/" style={{ color: '#00FF87', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
            ← Back / နောက်သို့
          </a>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            Privacy Policy
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginBottom: 4 }}>
            ကိုယ်ရေးအချက်အလက် မူဝါဒ
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            Last updated / နောက်ဆုံးပြင်ဆင်သည့်ရက်: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Section title="1. Introduction / မိတ်ဆက်" mm="ဤဆိုဒ်သည် သင်၏ ကိုယ်ရေးအချက်အလက်ကို ကာကွယ်ရေးကို အလေးအနက်ထား၏။">
          <p>Welcome to <strong>{siteName}</strong> ({domain}). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and share information about you when you use our service.</p>
          <p style={{ marginTop: 8 }}>{siteName} မှ ကြိုဆိုပါသည်။ သင်၏ ကိုယ်ရေးအချက်အလက်ကို ကာကွယ်ရန် ကျွန်ုပ်တို့ ကတိကဝတ်ပြုပါသည်။</p>
        </Section>

        <Section title="2. Information We Collect / ကျွန်ုပ်တို့ စုဆောင်းသည့် အချက်အလက်များ" mm="သင်ဆိုဒ်ကို အသုံးပြုသောအခါ အချို့သော အချက်အလက်များ အလိုအလျောက် စုဆောင်းသည်။">
          <ul style={{ paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}><strong>Log Data:</strong> IP address, browser type, pages visited, time spent, referring URL.</li>
            <li style={{ marginBottom: 6 }}><strong>Cookies:</strong> We use cookies to remember your preferences (selected tab, server preference).</li>
            <li style={{ marginBottom: 6 }}><strong>Usage Data:</strong> Which matches you viewed, which servers you selected.</li>
            <li style={{ marginBottom: 6 }}><strong>Device Info:</strong> Device type, operating system, screen resolution.</li>
          </ul>
          <p style={{ marginTop: 10 }}>ကျွန်ုပ်တို့သည် IP လိပ်စာ၊ browser အမျိုးအစား၊ သင်ကြည့်ရှုသော စာမျက်နှာများနှင့် ကွတ်ကီးများ စုဆောင်းပါသည်။</p>
        </Section>

        <Section title="3. How We Use Your Information / အသုံးပြုပုံ" mm="သင်၏ အချက်အလက်ကို ဆိုဒ်ပိုကောင်းအောင် အသုံးပြုသည်။">
          <ul style={{ paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>To provide and improve our live sports streaming service</li>
            <li style={{ marginBottom: 6 }}>To remember your preferences and improve your experience</li>
            <li style={{ marginBottom: 6 }}>To analyze usage patterns and fix technical issues</li>
            <li style={{ marginBottom: 6 }}>To display relevant advertisements through our ad partners</li>
          </ul>
        </Section>

        <Section title="4. Advertising / ကြော်ငြာများ" mm="ကြော်ငြာများနှင့် ပတ်သက်သော အချက်အလက်">
          <p>We use the following advertising services. These third parties may use cookies and similar technologies to serve ads based on your browsing behavior:</p>
          <ul style={{ paddingLeft: 20, marginTop: 10 }}>
            <li style={{ marginBottom: 6 }}><strong>Google AdSense</strong> — Google may use cookies to serve ads. Learn more at <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener" style={{ color: '#00FF87' }}>Google Ad Policies</a>. You can opt out at <a href="https://adssettings.google.com" target="_blank" rel="noopener" style={{ color: '#00FF87' }}>Google Ad Settings</a>.</li>
            <li style={{ marginBottom: 6 }}><strong>PropellerAds</strong> — Uses cookies for ad targeting. See <a href="https://propellerads.com/privacy/" target="_blank" rel="noopener" style={{ color: '#00FF87' }}>PropellerAds Privacy Policy</a>.</li>
          </ul>
          <p style={{ marginTop: 10, padding: '12px 16px', background: 'rgba(0,255,135,0.05)', borderRadius: 8, border: '1px solid rgba(0,255,135,0.1)', fontSize: 13 }}>
            We participate in the Google AdSense program. Google uses the DoubleClick cookie to serve ads. You can disable interest-based advertising at <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener" style={{ color: '#00FF87' }}>www.aboutads.info</a>.
          </p>
          <p style={{ marginTop: 10 }}>ကျွန်ုပ်တို့ Google AdSense နှင့် PropellerAds ကြော်ငြာ ဝန်ဆောင်မှုများကို အသုံးပြုပါသည်။ ၎င်းတို့သည် ကွတ်ကီးများ အသုံးပြုနိုင်သည်။</p>
        </Section>

        <Section title="5. Cookies / ကွတ်ကီးများ" mm="ကွတ်ကီးများ အသုံးပြုပုံ">
          <p>We use cookies for the following purposes:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 6 }}><strong>Functional cookies:</strong> Remember your tab and server preferences</li>
            <li style={{ marginBottom: 6 }}><strong>Analytics cookies:</strong> Understand how visitors use our site</li>
            <li style={{ marginBottom: 6 }}><strong>Advertising cookies:</strong> Deliver relevant ads through our ad partners</li>
          </ul>
          <p style={{ marginTop: 10 }}>You can control cookies through your browser settings. Note that disabling cookies may affect site functionality.</p>
          <p style={{ marginTop: 8 }}>သင်၏ browser settings မှ ကွတ်ကီးများကို ထိန်းချုပ်နိုင်သည်။</p>
        </Section>

        <Section title="6. Third-Party Services / တတိယပါတီ ဝန်ဆောင်မှုများ">
          <p>Our service may contain links to third-party websites. We are not responsible for the privacy practices of those sites. Live stream content is provided by third-party sources and we do not control their privacy practices.</p>
          <p style={{ marginTop: 8 }}>ဆိုဒ်တွင် တတိယပါတီ ဆိုဒ်များသို့ လင့်ခ်များ ပါဝင်နိုင်သည်။ ထိုဆိုဒ်များ၏ မူဝါဒများအတွက် ကျွန်ုပ်တို့ တာဝန်မခံပါ။</p>
        </Section>

        <Section title="7. Data Security / ဒေတာ လုံခြုံရေး">
          <p>We implement appropriate security measures to protect your information. However, no method of transmission over the Internet is 100% secure.</p>
          <p style={{ marginTop: 8 }}>သင်၏ အချက်အလက်ကို ကာကွယ်ရန် လုံခြုံရေး အစီအမံများ ချမှတ်ထားသည်။</p>
        </Section>

        <Section title="8. Children's Privacy / ကလေးများ၏ ကိုယ်ရေးအချက်အလက်">
          <p>Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13.</p>
          <p style={{ marginTop: 8 }}>ဤဝန်ဆောင်မှုသည် အသက် ၁၃ နှစ်အောက် ကလေးများအတွက် မဟုတ်ပါ။</p>
        </Section>

        <Section title="9. Contact Us / ဆက်သွယ်ရန်">
          <p>If you have questions about this Privacy Policy, please contact us at:</p>
          <p style={{ marginTop: 8, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, fontFamily: 'monospace' }}>
            {siteName}<br />
            Website: {domain}<br />
          </p>
          <p style={{ marginTop: 8 }}>ဤမူဝါဒနှင့် ပတ်သက်၍ မေးမြန်းလိုပါက ကျွန်ုပ်တို့ထံ ဆက်သွယ်နိုင်သည်။</p>
        </Section>

      </div>
    </div>
  )
}
