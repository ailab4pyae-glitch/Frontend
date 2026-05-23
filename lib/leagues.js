// ─── League name translation (Vietnamese + Chinese → English) ─────────────────

const TRANSLATIONS = [
  // Vietnamese (SOCO)
  ['ngoại hạng anh',          'Premier League'],
  ['giải ngoại hạng anh',     'Premier League'],
  ['anh',                     'Premier League'],
  ['tây ban nha',             'La Liga'],
  ['la liga',                 'La Liga'],
  ['đức',                     'Bundesliga'],
  ['bundesliga',              'Bundesliga'],
  ['ý',                       'Serie A'],
  ['serie a',                 'Serie A'],
  ['pháp',                    'Ligue 1'],
  ['ligue 1',                 'Ligue 1'],
  ['champions league',        'Champions League'],
  ['cúp c1',                  'Champions League'],
  ['liga champions',          'Champions League'],
  ['europa league',           'Europa League'],
  ['cúp c2',                  'Europa League'],
  ['conference league',       'Conference League'],
  ['world cup',               'World Cup'],
  ['euro ',                   'Euro'],
  ['copa america',            'Copa America'],
  ['fa cup',                  'FA Cup'],
  ['carabao',                 'League Cup'],
  ['copa del rey',            'Copa del Rey'],
  ['dfb',                     'DFB Pokal'],
  ['coppa italia',            'Coppa Italia'],
  ['coupe de france',         'Coupe de France'],
  ['mls',                     'MLS'],
  ['brasileirao',             'Brasileirão'],
  ['eredivisie',              'Eredivisie'],
  ['premier league scotland', 'Scottish Premier'],
  ['saudi',                   'Saudi Pro League'],
  ['qatar',                   'Qatar Stars League'],
  ['thai league',             'Thai League'],

  // Chinese (China Live)
  ['英超',  'Premier League'],
  ['西甲',  'La Liga'],
  ['德甲',  'Bundesliga'],
  ['意甲',  'Serie A'],
  ['法甲',  'Ligue 1'],
  ['荷甲',  'Eredivisie'],
  ['葡超',  'Primeira Liga'],
  ['欧冠',  'Champions League'],
  ['欧联',  'Europa League'],
  ['欧会',  'Conference League'],
  ['世界杯', 'World Cup'],
  ['欧洲杯', 'Euro'],
  ['美洲杯', 'Copa America'],
  ['足总杯', 'FA Cup'],
  ['联赛杯', 'League Cup'],
  ['国王杯', 'Copa del Rey'],
  ['德国杯', 'DFB Pokal'],
  ['意大利杯', 'Coppa Italia'],
  ['法国杯', 'Coupe de France'],
  ['苏超',  'Scottish Premier'],
  ['俄超',  'Russian Premier'],
  ['土超',  'Turkish Süper Lig'],
  ['美职联', 'MLS'],
  ['中超',  'Chinese Super League'],
  ['日职联', 'J-League'],
  ['韩职联', 'K-League'],
  ['澳超',  'A-League'],
  ['沙特联', 'Saudi Pro League'],
  ['女超',  'WSL'],
  ['德女',  'Women Bundesliga'],
  ['英冠',  'Championship'],
  ['英甲',  'League One'],
  ['英乙',  'League Two'],

  // Vietnamese (more)
  ['giải hạng nhất',          'First Division'],
  ['azadegan',                 'Azadegan League'],
  ['v.league',                 'V.League'],
  ['vleague',                  'V.League'],
  ['cup quốc gia',             'Vietnam Cup'],
  ['sea games',                'SEA Games'],
  ['aff',                      'AFF Championship'],
  ['asean',                    'ASEAN Cup'],
  ['giải vô địch',             'Championship'],
  ['hạng nhì',                 'Second Division'],

  // Iranian
  ['persian gulf',             'Persian Gulf Pro League'],
  ['hazfi',                    'Hazfi Cup'],

  // Chinese (more)
  ['中甲',   'China League One'],
  ['中乙',   'China League Two'],
  ['足协杯',  'Chinese FA Cup'],
  ['超级杯',  'Chinese Super Cup'],
  ['亚冠',   'AFC Champions League'],
  ['亚联',   'AFC Cup'],
  ['女子',   'Women League'],
  ['预备队',  'Reserve League'],
  ['U21',    'U21 League'],
  ['U18',    'U18 League'],
  ['友谊',   'Friendly'],
  ['联赛杯',  'League Cup'],

  // Myanmar
  ['မြန်မာ', 'Myanmar National League'],
]

export const translateLeague = (raw) => {
  if (!raw) return ''
  const lower = raw.toLowerCase().trim()
  for (const [key, english] of TRANSLATIONS) {
    if (lower.includes(key.toLowerCase())) return english
  }
  return raw  // return as-is if no match found
}

// ─── Fame / priority ranking ──────────────────────────────────────────────────
// Lower number = more famous = shown first

const FAME = [
  // Big 5 leagues
  ['premier league',      1],
  ['la liga',             2],
  ['serie a',             3],
  ['bundesliga',          4],
  ['ligue 1',             5],
  // European competitions
  ['champions league',    6],
  ['europa league',       7],
  ['conference league',   8],
  // Other internationals
  ['world cup',           9],
  ['euro',                10],
  ['copa america',        11],
  // Domestic cups
  ['fa cup',              12],
  ['copa del rey',        13],
  ['league cup',          14],
  ['carabao',             14],
  ['dfb pokal',           15],
  ['coppa italia',        16],
  ['coupe de france',     17],
  // Other top leagues
  ['eredivisie',          18],
  ['primeira liga',       19],
  ['championship',        20],
  ['mls',                 21],
  ['saudi',               22],
  ['brasileirao',         23],
  ['chinese super',       30],
  ['j-league',            31],
  ['k-league',            32],
  ['thai league',         33],
]

export const leagueFame = (english) => {
  if (!english) return 99
  const l = english.toLowerCase().trim()
  for (const [key, rank] of FAME) {
    // "premier league" must be an exact/full match — not a substring of "Thai Premier League"
    if (key === 'premier league') {
      if (l === 'premier league' || l === 'english premier league') return rank
      continue
    }
    if (l.includes(key)) return rank
  }
  return 50
}

// ─── League icons ─────────────────────────────────────────────────────────────

const ICONS = [
  ['champions league', '⭐'],
  ['premier league',   '🏴󠁧󠁢󠁥󠁮󠁧󠁿'],
  ['la liga',          '🇪🇸'],
  ['bundesliga',       '🇩🇪'],
  ['serie a',          '🇮🇹'],
  ['ligue 1',          '🇫🇷'],
  ['eredivisie',       '🇳🇱'],
  ['primeira liga',    '🇵🇹'],
  ['world cup',        '🌍'],
  ['euro',             '🇪🇺'],
  ['copa america',     '🌎'],
  ['fa cup',           '🏆'],
  ['copa del rey',     '🏆'],
  ['carabao',          '🏆'],
  ['league cup',       '🏆'],
  ['dfb',              '🏆'],
  ['coppa',            '🏆'],
  ['mls',              '🇺🇸'],
  ['saudi',            '🇸🇦'],
  ['chinese',         '🇨🇳'],
  ['j-league',         '🇯🇵'],
  ['k-league',         '🇰🇷'],
  ['thai',             '🇹🇭'],
  ['myanmar',          '🇲🇲'],
  ['brasileirao',      '🇧🇷'],
]

export const leagueIcon = (english) => {
  if (!english) return '⚽'
  const l = english.toLowerCase()
  for (const [key, icon] of ICONS) {
    if (l.includes(key)) return icon
  }
  return '⚽'
}
