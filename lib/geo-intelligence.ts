// CAREN - Geographic Intelligence
// Impossible-travel detection and jurisdiction risk on a world projection.
// Author: Alisher Beisembekov

export interface GeoPoint {
  city: string
  country: string
  countryCode: string
  lat: number
  lon: number
  riskTier: 'low' | 'medium' | 'high' | 'prohibited'
}

export interface TravelEvent {
  id: string
  accountId: string
  accountName: string
  from: GeoPoint
  to: GeoPoint
  departedAt: Date
  arrivedAt: Date
  distanceKm: number
  elapsedMinutes: number
  impliedSpeedKmh: number
  verdict: 'impossible' | 'implausible' | 'plausible'
  /** Set when a VPN or proxy explains the jump without physical travel. */
  proxyDetected: boolean
  narrative: { en: string; ru: string }
}

export interface JurisdictionExposure {
  point: GeoPoint
  transactionCount: number
  volume: number
  flaggedCount: number
  riskScore: number
}

/** Commercial aviation cruise speed — the ceiling for plausible travel. */
const MAX_COMMERCIAL_SPEED_KMH = 950

export const CITIES: GeoPoint[] = [
  { city: 'New York', country: 'United States', countryCode: 'US', lat: 40.71, lon: -74.01, riskTier: 'low' },
  { city: 'London', country: 'United Kingdom', countryCode: 'GB', lat: 51.51, lon: -0.13, riskTier: 'low' },
  { city: 'Frankfurt', country: 'Germany', countryCode: 'DE', lat: 50.11, lon: 8.68, riskTier: 'low' },
  { city: 'Singapore', country: 'Singapore', countryCode: 'SG', lat: 1.35, lon: 103.82, riskTier: 'low' },
  { city: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.68, lon: 139.69, riskTier: 'low' },
  { city: 'Warsaw', country: 'Poland', countryCode: 'PL', lat: 52.23, lon: 21.01, riskTier: 'low' },
  { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', lat: 25.2, lon: 55.27, riskTier: 'medium' },
  { city: 'Istanbul', country: 'Türkiye', countryCode: 'TR', lat: 41.01, lon: 28.98, riskTier: 'medium' },
  { city: 'Valletta', country: 'Malta', countryCode: 'MT', lat: 35.9, lon: 14.51, riskTier: 'medium' },
  { city: 'Limassol', country: 'Cyprus', countryCode: 'CY', lat: 34.71, lon: 33.02, riskTier: 'medium' },
  { city: 'Panama City', country: 'Panama', countryCode: 'PA', lat: 8.98, lon: -79.52, riskTier: 'high' },
  { city: 'George Town', country: 'Cayman Islands', countryCode: 'KY', lat: 19.29, lon: -81.38, riskTier: 'high' },
  { city: 'Victoria', country: 'Seychelles', countryCode: 'SC', lat: -4.62, lon: 55.45, riskTier: 'high' },
  { city: 'Belize City', country: 'Belize', countryCode: 'BZ', lat: 17.5, lon: -88.2, riskTier: 'high' },
  { city: 'Yangon', country: 'Myanmar', countryCode: 'MM', lat: 16.87, lon: 96.2, riskTier: 'prohibited' },
  { city: 'Tehran', country: 'Iran', countryCode: 'IR', lat: 35.69, lon: 51.39, riskTier: 'prohibited' },
]

export const RISK_TIER_LABELS: Record<GeoPoint['riskTier'], { en: string; ru: string; color: string }> = {
  low: { en: 'Low risk', ru: 'Низкий риск', color: '#10b981' },
  medium: { en: 'Medium risk', ru: 'Средний риск', color: '#f59e0b' },
  high: { en: 'High risk', ru: 'Высокий риск', color: '#f97316' },
  prohibited: { en: 'Prohibited', ru: 'Запрещённая', color: '#ef4444' },
}

const ACCOUNT_NAMES = [
  'M. Rodriguez', 'S. Chen', 'D. Okafor', 'L. Petrova', 'J. Almeida',
  'K. Yamamoto', 'R. Volkov', 'N. Haddad', 'T. Andersson', 'P. Sharma',
]

/** Great-circle distance via the haversine formula. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Equirectangular projection into a 0-1 box for SVG rendering. */
export function projectToUnit(point: GeoPoint): { x: number; y: number } {
  return {
    x: (point.lon + 180) / 360,
    y: (90 - point.lat) / 180,
  }
}

function buildNarrative(
  from: GeoPoint,
  to: GeoPoint,
  distanceKm: number,
  elapsedMinutes: number,
  speed: number,
  verdict: TravelEvent['verdict'],
  proxyDetected: boolean
): { en: string; ru: string } {
  const dist = Math.round(distanceKm).toLocaleString()
  const mins = Math.round(elapsedMinutes)
  const spd = Math.round(speed).toLocaleString()

  if (verdict === 'plausible') {
    return {
      en: `${dist} km between ${from.city} and ${to.city} across ${mins} minutes implies ${spd} km/h — consistent with a scheduled commercial flight. No action needed beyond routine logging.`,
      ru: `${dist} км между городами ${from.city} и ${to.city} за ${mins} мин. дают ${spd} км/ч — это согласуется с регулярным коммерческим рейсом. Действий, кроме обычного логирования, не требуется.`,
    }
  }

  if (proxyDetected) {
    return {
      en: `The ${dist} km jump from ${from.city} to ${to.city} in ${mins} minutes would require ${spd} km/h, which is physically impossible. However, the ${to.city} session carries datacentre ASN characteristics, so this is almost certainly VPN or proxy egress rather than relocation.\n\nThat distinction matters for the response: proxy use is a policy question, not a fraud finding. Blocking on geography alone here would penalise a customer who may simply be using a privacy tool.`,
      ru: `Скачок в ${dist} км из города ${from.city} в ${to.city} за ${mins} мин. потребовал бы ${spd} км/ч, что физически невозможно. Однако сессия в ${to.city} имеет признаки ASN дата-центра, поэтому речь почти наверняка идёт о выходе через VPN или прокси, а не о перемещении.\n\nЭто различие важно для реакции: использование прокси — вопрос политики, а не вывод о мошенничестве. Блокировка только по географии здесь наказала бы клиента, который, возможно, просто пользуется инструментом приватности.`,
    }
  }

  return {
    en: `Authentication from ${from.city} and then ${to.city} — ${dist} km apart — separated by only ${mins} minutes. The implied speed of ${spd} km/h exceeds commercial aviation by a wide margin, and no proxy or datacentre signature was present on either session.\n\nWith proxy use ruled out, the most economical explanation is that two different people held valid credentials for this account at the same time. That is credential compromise, not travel.`,
    ru: `Аутентификация из города ${from.city}, а затем из ${to.city} — расстояние ${dist} км — с разрывом всего ${mins} мин. Подразумеваемая скорость ${spd} км/ч значительно превышает возможности коммерческой авиации, при этом ни одна из сессий не имела признаков прокси или дата-центра.\n\nПоскольку использование прокси исключено, наиболее экономное объяснение состоит в том, что два разных человека одновременно располагали действующими учётными данными этого счёта. Это компрометация учётных данных, а не поездка.`,
  }
}

export function generateTravelEvent(forceImpossible?: boolean): TravelEvent {
  const from = CITIES[Math.floor(Math.random() * CITIES.length)]
  let to = CITIES[Math.floor(Math.random() * CITIES.length)]
  while (to.city === from.city) {
    to = CITIES[Math.floor(Math.random() * CITIES.length)]
  }

  const distanceKm = haversineKm(from, to)
  const impossible = forceImpossible ?? Math.random() < 0.45

  // Impossible events compress the gap; plausible ones allow real flight time.
  const elapsedMinutes = impossible
    ? Math.random() * 70 + 8
    : (distanceKm / 780) * 60 + Math.random() * 180 + 60

  const impliedSpeedKmh = distanceKm / (elapsedMinutes / 60)

  const verdict: TravelEvent['verdict'] =
    impliedSpeedKmh > MAX_COMMERCIAL_SPEED_KMH * 1.4 ? 'impossible'
    : impliedSpeedKmh > MAX_COMMERCIAL_SPEED_KMH ? 'implausible'
    : 'plausible'

  const proxyDetected = verdict !== 'plausible' && Math.random() < 0.42
  const arrivedAt = new Date(Date.now() - Math.floor(Math.random() * 36) * 3600000)

  return {
    id: `GEO-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    accountId: `ACC-${Math.floor(Math.random() * 900000 + 100000)}`,
    accountName: ACCOUNT_NAMES[Math.floor(Math.random() * ACCOUNT_NAMES.length)],
    from,
    to,
    departedAt: new Date(arrivedAt.getTime() - elapsedMinutes * 60000),
    arrivedAt,
    distanceKm,
    elapsedMinutes,
    impliedSpeedKmh,
    verdict,
    proxyDetected,
    narrative: buildNarrative(from, to, distanceKm, elapsedMinutes, impliedSpeedKmh, verdict, proxyDetected),
  }
}

export function generateTravelEvents(count: number = 16): TravelEvent[] {
  return Array.from({ length: count }, () => generateTravelEvent()).sort(
    (a, b) => b.impliedSpeedKmh - a.impliedSpeedKmh
  )
}

export function generateJurisdictionExposure(): JurisdictionExposure[] {
  return CITIES.map(point => {
    const riskWeight = { low: 0.2, medium: 0.5, high: 0.8, prohibited: 1 }[point.riskTier]
    const transactionCount = Math.floor(Math.random() * 9000) + 200

    return {
      point,
      transactionCount,
      volume: Math.floor(transactionCount * (Math.random() * 320 + 60)),
      flaggedCount: Math.floor(transactionCount * riskWeight * (Math.random() * 0.06 + 0.01)),
      riskScore: riskWeight * 100 * (0.7 + Math.random() * 0.3),
    }
  }).sort((a, b) => b.riskScore - a.riskScore)
}

export function summarizeGeo(events: TravelEvent[], exposure: JurisdictionExposure[]) {
  return {
    totalEvents: events.length,
    impossible: events.filter(e => e.verdict === 'impossible').length,
    proxyExplained: events.filter(e => e.proxyDetected).length,
    // Impossible travel with no proxy signature is the genuinely alarming subset.
    credentialCompromise: events.filter(e => e.verdict === 'impossible' && !e.proxyDetected).length,
    prohibitedJurisdictions: exposure.filter(e => e.point.riskTier === 'prohibited').length,
    highRiskVolume: exposure
      .filter(e => e.point.riskTier === 'high' || e.point.riskTier === 'prohibited')
      .reduce((sum, e) => sum + e.volume, 0),
  }
}
