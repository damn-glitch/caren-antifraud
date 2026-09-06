// CAREN - Threat Intelligence Feed
// External fraud signals correlated against the institution's own estate.
// Author: Alisher Beisembekov

export type ThreatCategory =
  | 'credential_dump'
  | 'card_shop_listing'
  | 'malware_campaign'
  | 'phishing_kit'
  | 'mule_recruitment'
  | 'bin_attack'
  | 'dark_market'
  | 'sim_swap'

export type ThreatSeverity = 'informational' | 'elevated' | 'high' | 'severe'

export interface ThreatIndicator {
  type: 'ip' | 'domain' | 'bin' | 'device' | 'email' | 'wallet'
  value: string
  /** Whether this indicator matched something inside the institution. */
  matchedInternally: boolean
}

export interface ThreatReport {
  id: string
  category: ThreatCategory
  severity: ThreatSeverity
  title: { en: string; ru: string }
  summary: { en: string; ru: string }
  publishedAt: Date
  source: string
  confidence: number
  indicators: ThreatIndicator[]
  /** Accounts in our estate touched by these indicators. */
  affectedAccounts: number
  exposureEstimate: number
  recommendedAction: { en: string; ru: string }
  actioned: boolean
}

export const CATEGORY_META: Record<ThreatCategory, { en: string; ru: string; icon: string }> = {
  credential_dump: { en: 'Credential dump', ru: 'Утечка учётных данных', icon: 'key' },
  card_shop_listing: { en: 'Card shop listing', ru: 'Листинг в кардшопе', icon: 'credit-card' },
  malware_campaign: { en: 'Malware campaign', ru: 'Кампания вредоносного ПО', icon: 'bug' },
  phishing_kit: { en: 'Phishing kit', ru: 'Фишинговый набор', icon: 'fish' },
  mule_recruitment: { en: 'Mule recruitment', ru: 'Вербовка дроп-счетов', icon: 'users' },
  bin_attack: { en: 'BIN attack', ru: 'Атака на BIN', icon: 'target' },
  dark_market: { en: 'Dark market activity', ru: 'Активность на теневом рынке', icon: 'store' },
  sim_swap: { en: 'SIM swap campaign', ru: 'Кампания подмены SIM', icon: 'smartphone' },
}

export const SEVERITY_META: Record<ThreatSeverity, { en: string; ru: string; color: string }> = {
  informational: { en: 'Informational', ru: 'Информационно', color: '#64748b' },
  elevated: { en: 'Elevated', ru: 'Повышенная', color: '#06b6d4' },
  high: { en: 'High', ru: 'Высокая', color: '#f59e0b' },
  severe: { en: 'Severe', ru: 'Критическая', color: '#ef4444' },
}

const SOURCES = [
  'Recorded Future', 'Flashpoint', 'Intel471', 'FS-ISAC',
  'Internal Honeypot', 'Visa Threat Intelligence', 'Mastercard Fraud Center',
]

const THREAT_TEMPLATES: {
  category: ThreatCategory
  title: { en: string; ru: string }
  summary: { en: string; ru: string }
  action: { en: string; ru: string }
}[] = [
  {
    category: 'credential_dump',
    title: {
      en: 'Combolist with 2.4M credentials posted to a closed forum',
      ru: 'Комболист на 2,4 млн учётных записей опубликован на закрытом форуме',
    },
    summary: {
      en: 'A credential combolist containing 2.4 million email and password pairs surfaced on a closed forum. Cross-referencing against our customer base found overlapping addresses, and the passwords are plaintext rather than hashed, so credential stuffing against our login endpoint should be expected within days.',
      ru: 'На закрытом форуме появился комболист из 2,4 млн пар email и паролей. Сверка с нашей клиентской базой выявила пересекающиеся адреса, при этом пароли представлены в открытом виде, а не в виде хешей, поэтому в ближайшие дни следует ожидать credential stuffing по нашей точке входа.',
    },
    action: {
      en: 'Force password reset on matched accounts and enable adaptive rate limiting on the login endpoint.',
      ru: 'Принудительно сбросить пароли на совпавших счетах и включить адаптивное ограничение частоты на точке входа.',
    },
  },
  {
    category: 'card_shop_listing',
    title: {
      en: 'Cards from BIN 457173 listed on a carding marketplace',
      ru: 'Карты с BIN 457173 выставлены на кардинг-площадке',
    },
    summary: {
      en: 'A batch of cards sharing our BIN 457173 appeared for sale with full track data and CVV, priced at $18 each. Full track data implies a point-of-sale compromise rather than an e-commerce skim, which narrows the likely breach point to a physical merchant.',
      ru: 'Партия карт с нашим BIN 457173 выставлена на продажу с полными данными дорожки и CVV по цене $18 за карту. Наличие полных данных дорожки указывает на компрометацию POS-терминала, а не на веб-скимминг, что сужает вероятную точку утечки до физического продавца.',
    },
    action: {
      en: 'Identify the common point of purchase across listed cards and reissue the affected range.',
      ru: 'Определить общую точку покупки по выставленным картам и перевыпустить затронутый диапазон.',
    },
  },
  {
    category: 'malware_campaign',
    title: {
      en: 'Banking trojan targeting mobile app overlays',
      ru: 'Банковский троян, использующий наложения в мобильном приложении',
    },
    summary: {
      en: 'A campaign distributing an Android banking trojan is targeting our mobile app with credential-harvesting overlays. The malware intercepts SMS one-time codes, which means SMS-based second factors give no protection against it.',
      ru: 'Кампания по распространению Android-трояна нацелена на наше мобильное приложение и использует наложения для перехвата учётных данных. Вредонос перехватывает одноразовые SMS-коды, поэтому SMS в качестве второго фактора не даёт защиты от него.',
    },
    action: {
      en: 'Promote app-based authentication over SMS and add overlay-detection to the mobile SDK.',
      ru: 'Продвигать аутентификацию в приложении вместо SMS и добавить обнаружение наложений в мобильный SDK.',
    },
  },
  {
    category: 'phishing_kit',
    title: {
      en: 'Phishing kit cloning our login page detected',
      ru: 'Обнаружен фишинговый набор, клонирующий нашу страницу входа',
    },
    summary: {
      en: 'A phishing kit replicating our login flow was found hosted across four domains registered within the same 48-hour window. The kit proxies credentials in real time, meaning it defeats one-time codes by relaying them immediately.',
      ru: 'Фишинговый набор, воспроизводящий наш процесс входа, обнаружен на четырёх доменах, зарегистрированных в одном 48-часовом окне. Набор проксирует учётные данные в реальном времени, то есть обходит одноразовые коды, немедленно их ретранслируя.',
    },
    action: {
      en: 'File takedown requests and add the domains to the outbound-link blocklist.',
      ru: 'Направить запросы на снятие доменов и внести их в стоп-лист исходящих ссылок.',
    },
  },
  {
    category: 'mule_recruitment',
    title: {
      en: 'Mule recruitment adverts naming our institution',
      ru: 'Объявления о вербовке дроп-счетов с упоминанием нашей организации',
    },
    summary: {
      en: 'Recruitment posts on messaging channels are specifically instructing recruits to open accounts with us, citing our onboarding as fast. The adverts promise a fixed fee per transfer, which is the classic mule arrangement.',
      ru: 'Вербовочные объявления в мессенджерах прямо предписывают открывать счета именно у нас, ссылаясь на быстрое прохождение онбординга. Объявления обещают фиксированную плату за перевод — классическая схема дроп-счетов.',
    },
    action: {
      en: 'Tighten new-account monitoring for the referenced onboarding path and review accounts opened since the advert date.',
      ru: 'Ужесточить мониторинг новых счетов по упомянутому пути онбординга и проверить счета, открытые с даты появления объявления.',
    },
  },
  {
    category: 'bin_attack',
    title: {
      en: 'Enumeration attack against our BIN range in progress',
      ru: 'Идёт атака перебора по нашему диапазону BIN',
    },
    summary: {
      en: 'Sequential card-number enumeration is being run against our BIN range through low-value authorisations at a small set of merchants. The attacker is validating numbers rather than extracting value, so the losses appear later once valid cards are resold.',
      ru: 'По нашему диапазону BIN выполняется последовательный перебор номеров карт через мелкие авторизации у небольшого набора продавцов. Атакующий проверяет валидность номеров, а не извлекает средства, поэтому убытки проявятся позже, когда действующие карты будут перепроданы.',
    },
    action: {
      en: 'Apply velocity limits per BIN prefix and notify the acquiring banks of the merchants involved.',
      ru: 'Применить лимиты частоты по префиксу BIN и уведомить банки-эквайеры задействованных продавцов.',
    },
  },
  {
    category: 'dark_market',
    title: {
      en: 'Account access listings referencing our platform',
      ru: 'Листинги доступа к счетам со ссылкой на нашу платформу',
    },
    summary: {
      en: 'Marketplace listings are offering verified account access on our platform, priced by account balance tier. Pricing by balance implies the sellers can see balances, which points to session hijacking rather than credential guessing.',
      ru: 'На теневой площадке предлагается доступ к верифицированным счетам нашей платформы с ценой, зависящей от уровня баланса. Ценообразование по балансу означает, что продавцы видят баланс, а это указывает на перехват сессий, а не на подбор учётных данных.',
    },
    action: {
      en: 'Rotate session tokens and audit session-fixation protections on the web client.',
      ru: 'Ротировать токены сессий и провести аудит защиты от фиксации сессии в веб-клиенте.',
    },
  },
  {
    category: 'sim_swap',
    title: {
      en: 'SIM swap campaign targeting high-balance customers',
      ru: 'Кампания подмены SIM против клиентов с крупным балансом',
    },
    summary: {
      en: 'A coordinated SIM swap campaign is targeting customers with balances above $50,000, using social engineering against carrier support desks. Port-out events preceded three confirmed account takeovers this month.',
      ru: 'Скоординированная кампания подмены SIM нацелена на клиентов с балансом свыше $50 000 и использует социальную инженерию против служб поддержки операторов. События переноса номера предшествовали трём подтверждённым захватам счетов в этом месяце.',
    },
    action: {
      en: 'Subscribe to carrier port-out notifications and require step-up on any transfer within 72 hours of a SIM change.',
      ru: 'Подписаться на уведомления операторов о переносе номера и требовать усиленную проверку при любом переводе в течение 72 ч после смены SIM.',
    },
  },
]

function buildIndicators(category: ThreatCategory): ThreatIndicator[] {
  const pools: Record<ThreatIndicator['type'], string[]> = {
    ip: ['185.220.101.44', '91.219.237.18', '45.153.160.7', '194.26.29.112'],
    domain: ['secure-login-verify.com', 'account-check-portal.net', 'auth-validate.co'],
    bin: ['457173', '531842', '424242', '552461'],
    device: ['DEV-8A3F21', 'DEV-C90B47', 'DEV-1E5D93'],
    email: ['recruit.finance@proton.me', 'quick.transfer@tuta.io'],
    wallet: ['bc1qxy2k...9dfz4', '0x7a3f...c21b'],
  }

  const typesByCategory: Record<ThreatCategory, ThreatIndicator['type'][]> = {
    credential_dump: ['email', 'ip'],
    card_shop_listing: ['bin'],
    malware_campaign: ['domain', 'device'],
    phishing_kit: ['domain', 'ip'],
    mule_recruitment: ['email', 'wallet'],
    bin_attack: ['bin', 'ip'],
    dark_market: ['wallet', 'domain'],
    sim_swap: ['ip', 'device'],
  }

  return typesByCategory[category].flatMap(type =>
    pools[type].slice(0, 2).map(value => ({
      type,
      value,
      matchedInternally: Math.random() > 0.45,
    }))
  )
}

export function generateThreatReport(index: number): ThreatReport {
  const tpl = THREAT_TEMPLATES[index % THREAT_TEMPLATES.length]
  const indicators = buildIndicators(tpl.category)
  const matched = indicators.filter(i => i.matchedInternally).length

  const severity: ThreatSeverity =
    matched >= 3 ? 'severe' : matched === 2 ? 'high' : matched === 1 ? 'elevated' : 'informational'

  return {
    id: `THR-${String(1000 + index)}`,
    category: tpl.category,
    severity,
    title: tpl.title,
    summary: tpl.summary,
    publishedAt: new Date(Date.now() - Math.floor(Math.random() * 168) * 3600000),
    source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
    confidence: 0.68 + Math.random() * 0.31,
    indicators,
    affectedAccounts: matched * Math.floor(Math.random() * 220 + 20),
    exposureEstimate: matched * Math.floor(Math.random() * 90000 + 15000),
    recommendedAction: tpl.action,
    actioned: Math.random() > 0.6,
  }
}

export function generateThreatReports(count: number = 12): ThreatReport[] {
  return Array.from({ length: count }, (_, i) => generateThreatReport(i)).sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  )
}

export function summarizeThreats(reports: ThreatReport[]) {
  return {
    total: reports.length,
    severe: reports.filter(r => r.severity === 'severe').length,
    unactioned: reports.filter(r => !r.actioned).length,
    matchedIndicators: reports.reduce(
      (sum, r) => sum + r.indicators.filter(i => i.matchedInternally).length,
      0
    ),
    affectedAccounts: reports.reduce((sum, r) => sum + r.affectedAccounts, 0),
    totalExposure: reports.reduce((sum, r) => sum + r.exposureEstimate, 0),
  }
}
