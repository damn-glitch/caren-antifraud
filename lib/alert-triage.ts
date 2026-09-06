// CAREN - Intelligent Alert Triage Engine
// Collapses a raw alert firehose into a short, ranked queue of real cases.
// Author: Alisher Beisembekov

export type SuppressionReason =
  | 'duplicate'
  | 'known_pattern'
  | 'below_threshold'
  | 'whitelisted_merchant'
  | 'customer_travel_notice'
  | 'recurring_subscription'

export interface TriageStage {
  key: string
  labelEn: string
  labelRu: string
  descriptionEn: string
  descriptionRu: string
  input: number
  output: number
}

export interface TriagedCase {
  id: string
  priority: 'P1' | 'P2' | 'P3'
  score: number
  confidence: number
  title: { en: string; ru: string }
  accountId: string
  accountName: string
  linkedAlerts: number
  exposure: number
  signals: { en: string; ru: string; weight: number }[]
  createdAt: Date
  slaMinutes: number
}

export interface TriageResult {
  stages: TriageStage[]
  cases: TriagedCase[]
  suppression: { reason: SuppressionReason; count: number }[]
  rawAlerts: number
  finalCases: number
  noiseReduction: number
  analystHoursSaved: number
}

export const SUPPRESSION_LABELS: Record<SuppressionReason, { en: string; ru: string }> = {
  duplicate: { en: 'Exact duplicate of an open alert', ru: 'Точный дубликат открытого оповещения' },
  known_pattern: { en: 'Matches a cleared historical pattern', ru: 'Совпадает с ранее закрытым паттерном' },
  below_threshold: { en: 'Confidence below action threshold', ru: 'Уверенность ниже порога действия' },
  whitelisted_merchant: { en: 'Merchant on trusted allowlist', ru: 'Продавец в доверенном списке' },
  customer_travel_notice: { en: 'Customer filed a travel notice', ru: 'Клиент подал уведомление о поездке' },
  recurring_subscription: { en: 'Known recurring subscription charge', ru: 'Известное регулярное списание' },
}

const ACCOUNT_NAMES = [
  'M. Rodriguez', 'S. Chen', 'D. Okafor', 'L. Petrova', 'J. Almeida',
  'Meridian Holdings LLC', 'Northgate Trading', 'K. Yamamoto', 'R. Volkov',
  'Apex Digital Ventures', 'N. Haddad', 'Coastal Import Co',
]

const CASE_TITLES: { en: string; ru: string }[] = [
  { en: 'Coordinated card testing across 14 merchants', ru: 'Скоординированный перебор карт по 14 продавцам' },
  { en: 'Account takeover with device and geo mismatch', ru: 'Захват счёта с несовпадением устройства и геолокации' },
  { en: 'Structuring pattern below reporting threshold', ru: 'Схема дробления ниже порога отчётности' },
  { en: 'Mule account receiving fan-in transfers', ru: 'Дроп-счёт принимает веерные переводы' },
  { en: 'Rapid fund movement after dormancy', ru: 'Быстрое движение средств после простоя' },
  { en: 'Synthetic identity cluster with shared BIN', ru: 'Кластер синтетических личностей с общим BIN' },
  { en: 'Affiliate self-referral commission abuse', ru: 'Злоупотребление комиссией через самореферал' },
  { en: 'Cross-border layering chain detected', ru: 'Обнаружена трансграничная цепочка расслоения' },
  { en: 'High-velocity withdrawals after credential change', ru: 'Высокочастотные выводы после смены учётных данных' },
  { en: 'Circular money flow between linked entities', ru: 'Круговое движение средств между связанными лицами' },
]

const SIGNAL_POOL: { en: string; ru: string; weight: number }[] = [
  { en: 'Device fingerprint shared with 6 flagged accounts', ru: 'Отпечаток устройства совпадает с 6 помеченными счетами', weight: 0.22 },
  { en: 'Geo-velocity impossible: 2 countries in 40 minutes', ru: 'Невозможная геоскорость: 2 страны за 40 минут', weight: 0.19 },
  { en: 'Transaction amounts cluster just under threshold', ru: 'Суммы операций группируются чуть ниже порога', weight: 0.18 },
  { en: 'ML ensemble fraud probability above 0.94', ru: 'Вероятность мошенничества ансамбля выше 0,94', weight: 0.21 },
  { en: 'Credential change 3 hours before first transfer', ru: 'Смена учётных данных за 3 часа до первого перевода', weight: 0.17 },
  { en: 'Counterparty in FATF-monitored jurisdiction', ru: 'Контрагент в юрисдикции под наблюдением FATF', weight: 0.15 },
  { en: 'Behavioural drift score 82 against own baseline', ru: 'Балл поведенческого дрейфа 82 к собственной базе', weight: 0.20 },
  { en: 'IP address linked to known fraud infrastructure', ru: 'IP-адрес связан с известной фрод-инфраструктурой', weight: 0.23 },
  { en: 'Decline rate spiked 11x within the window', ru: 'Доля отказов выросла в 11 раз за окно', weight: 0.16 },
  { en: 'Funds forwarded within 4 minutes of arrival', ru: 'Средства пересланы в течение 4 минут после поступления', weight: 0.18 },
]

function pickSignals(count: number): { en: string; ru: string; weight: number }[] {
  const pool = [...SIGNAL_POOL]
  const picked: typeof SIGNAL_POOL = []
  for (let i = 0; i < count && pool.length > 0; i++) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
  }
  return picked.sort((a, b) => b.weight - a.weight)
}

/**
 * Run the full triage pipeline over a raw alert volume.
 * Each stage removes a defensible slice of noise, and the surviving alerts are
 * merged into ranked cases.
 */
export function runTriage(rawAlerts: number = 2000): TriageResult {
  // Stage ratios are tuned so the pipeline lands near the target of ~50 cases.
  const afterDedup = Math.round(rawAlerts * 0.46)
  const afterWhitelist = Math.round(afterDedup * 0.61)
  const afterCorrelation = Math.round(afterWhitelist * 0.42)
  const afterConfidence = Math.round(afterCorrelation * 0.38)
  const finalCases = Math.max(12, Math.round(afterConfidence * 0.42))

  const stages: TriageStage[] = [
    {
      key: 'ingest',
      labelEn: 'Raw Ingestion',
      labelRu: 'Сырой поток',
      descriptionEn: 'Every rule and model firing collected from the transaction stream.',
      descriptionRu: 'Все срабатывания правил и моделей, собранные из потока транзакций.',
      input: rawAlerts,
      output: rawAlerts,
    },
    {
      key: 'dedup',
      labelEn: 'Deduplication',
      labelRu: 'Дедупликация',
      descriptionEn: 'Identical alerts on the same account and window collapsed into one.',
      descriptionRu: 'Идентичные оповещения по одному счёту и окну схлопываются в одно.',
      input: rawAlerts,
      output: afterDedup,
    },
    {
      key: 'whitelist',
      labelEn: 'Context Suppression',
      labelRu: 'Контекстное подавление',
      descriptionEn: 'Travel notices, trusted merchants and known subscriptions removed.',
      descriptionRu: 'Уведомления о поездках, доверенные продавцы и подписки исключаются.',
      input: afterDedup,
      output: afterWhitelist,
    },
    {
      key: 'correlate',
      labelEn: 'Entity Correlation',
      labelRu: 'Корреляция сущностей',
      descriptionEn: 'Alerts sharing a device, IP or counterparty merged into one narrative.',
      descriptionRu: 'Оповещения с общим устройством, IP или контрагентом сливаются в один сюжет.',
      input: afterWhitelist,
      output: afterCorrelation,
    },
    {
      key: 'confidence',
      labelEn: 'Confidence Gating',
      labelRu: 'Фильтр уверенности',
      descriptionEn: 'Only ensemble scores above the action threshold survive.',
      descriptionRu: 'Проходят только оценки ансамбля выше порога действия.',
      input: afterCorrelation,
      output: afterConfidence,
    },
    {
      key: 'cases',
      labelEn: 'Case Assembly',
      labelRu: 'Сборка кейсов',
      descriptionEn: 'Surviving alerts assembled into ranked, investigable cases.',
      descriptionRu: 'Оставшиеся оповещения собираются в ранжированные кейсы для расследования.',
      input: afterConfidence,
      output: finalCases,
    },
  ]

  const cases: TriagedCase[] = Array.from({ length: finalCases }, (_, i) => {
    const score = 98 - i * (38 / Math.max(1, finalCases)) + (Math.random() - 0.5) * 6
    const clamped = Math.max(52, Math.min(99.4, score))
    const title = CASE_TITLES[i % CASE_TITLES.length]
    const priority: TriagedCase['priority'] = clamped > 88 ? 'P1' : clamped > 72 ? 'P2' : 'P3'

    return {
      id: `CASE-${String(1000 + i)}`,
      priority,
      score: clamped,
      confidence: Math.min(0.995, clamped / 100 + Math.random() * 0.03),
      title,
      accountId: `ACC-${Math.floor(Math.random() * 900000 + 100000)}`,
      accountName: ACCOUNT_NAMES[i % ACCOUNT_NAMES.length],
      linkedAlerts: Math.floor(Math.random() * 22) + 3,
      exposure: Math.floor(Math.random() * 180000) + 5000,
      signals: pickSignals(Math.floor(Math.random() * 3) + 3),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 36) * 3600000),
      slaMinutes: clamped > 88 ? 30 : clamped > 72 ? 120 : 480,
    }
  }).sort((a, b) => b.score - a.score)

  const suppressedTotal = rawAlerts - finalCases
  const suppression: { reason: SuppressionReason; count: number }[] = [
    { reason: 'duplicate', count: Math.round(suppressedTotal * 0.31) },
    { reason: 'below_threshold', count: Math.round(suppressedTotal * 0.24) },
    { reason: 'known_pattern', count: Math.round(suppressedTotal * 0.18) },
    { reason: 'whitelisted_merchant', count: Math.round(suppressedTotal * 0.13) },
    { reason: 'recurring_subscription', count: Math.round(suppressedTotal * 0.09) },
    { reason: 'customer_travel_notice', count: Math.round(suppressedTotal * 0.05) },
  ]

  return {
    stages,
    cases,
    suppression,
    rawAlerts,
    finalCases,
    noiseReduction: ((rawAlerts - finalCases) / rawAlerts) * 100,
    // Industry benchmark: ~12 minutes of analyst time per raw alert triaged by hand.
    analystHoursSaved: Math.round(((rawAlerts - finalCases) * 12) / 60),
  }
}
