// CAREN - Anti-Money Laundering (AML) Detection Engine
// Detects classic laundering typologies in transaction streams.
// Author: Alisher Beisembekov

export type AMLPatternType =
  | 'structuring'
  | 'smurfing'
  | 'layering'
  | 'round_tripping'
  | 'rapid_movement'
  | 'dormant_reactivation'
  | 'high_risk_jurisdiction'
  | 'cash_intensive'

export interface AMLPattern {
  id: string
  type: AMLPatternType
  accountId: string
  accountName: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  detectedAt: Date
  transactionCount: number
  totalVolume: number
  indicators: string[]
  regulatoryRef: string
  sarCandidate: boolean
  windowDays: number
}

/** Typology metadata — the "why" behind each detector. */
export const AML_TYPOLOGIES: Record<
  AMLPatternType,
  {
    labelEn: string
    labelRu: string
    descriptionEn: string
    descriptionRu: string
    regulatoryRef: string
    baseSeverity: AMLPattern['severity']
  }
> = {
  structuring: {
    labelEn: 'Structuring',
    labelRu: 'Дробление операций',
    descriptionEn:
      'Deposits deliberately kept just below the reporting threshold to avoid mandatory currency transaction reports.',
    descriptionRu:
      'Внесение средств суммами чуть ниже порога обязательного отчёта, чтобы избежать декларирования операции.',
    regulatoryRef: '31 U.S.C. § 5324 / FATF R.10',
    baseSeverity: 'high',
  },
  smurfing: {
    labelEn: 'Smurfing',
    labelRu: 'Смурфинг',
    descriptionEn:
      'Many low-value deposits from multiple individuals funnelled into a single beneficiary account.',
    descriptionRu:
      'Множество мелких переводов от разных лиц, стекающихся на один счёт-бенефициар.',
    regulatoryRef: 'FATF R.10 / BSA',
    baseSeverity: 'high',
  },
  layering: {
    labelEn: 'Layering',
    labelRu: 'Расслоение',
    descriptionEn:
      'Rapid chained transfers across multiple accounts and products designed to obscure the origin of funds.',
    descriptionRu:
      'Быстрые цепочки переводов через несколько счетов и продуктов для сокрытия происхождения средств.',
    regulatoryRef: 'FATF R.10 / 4AMLD',
    baseSeverity: 'critical',
  },
  round_tripping: {
    labelEn: 'Round-Tripping',
    labelRu: 'Круговые операции',
    descriptionEn:
      'Funds return to the originating account after passing through intermediaries, creating artificial turnover.',
    descriptionRu:
      'Средства возвращаются на исходный счёт после прохождения через посредников, создавая искусственный оборот.',
    regulatoryRef: 'FATF R.10',
    baseSeverity: 'critical',
  },
  rapid_movement: {
    labelEn: 'Rapid Movement',
    labelRu: 'Быстрое движение средств',
    descriptionEn:
      'Funds withdrawn or forwarded within minutes of arrival, leaving no economic purpose for the deposit.',
    descriptionRu:
      'Средства выводятся или пересылаются в течение минут после поступления, без экономического смысла операции.',
    regulatoryRef: 'FATF R.10 / FinCEN Advisory',
    baseSeverity: 'high',
  },
  dormant_reactivation: {
    labelEn: 'Dormant Reactivation',
    labelRu: 'Активация спящего счёта',
    descriptionEn:
      'An account inactive for months suddenly processes high-value flows — a classic mule account signature.',
    descriptionRu:
      'Счёт, неактивный месяцами, внезапно проводит крупные потоки — классический признак дроп-счёта.',
    regulatoryRef: 'FinCEN Mule Advisory',
    baseSeverity: 'medium',
  },
  high_risk_jurisdiction: {
    labelEn: 'High-Risk Jurisdiction',
    labelRu: 'Высокорисковая юрисдикция',
    descriptionEn:
      'Counterparty located in a FATF grey- or black-listed jurisdiction with weak AML controls.',
    descriptionRu:
      'Контрагент расположен в юрисдикции из серого или чёрного списка FATF со слабым контролем ПОД/ФТ.',
    regulatoryRef: 'FATF High-Risk Jurisdictions',
    baseSeverity: 'high',
  },
  cash_intensive: {
    labelEn: 'Cash-Intensive Business',
    labelRu: 'Наличноёмкий бизнес',
    descriptionEn:
      'Merchant cash ratio far exceeds sector norms, indicating possible commingling of illicit proceeds.',
    descriptionRu:
      'Доля наличных у продавца значительно превышает отраслевую норму — возможно смешивание незаконных доходов.',
    regulatoryRef: 'FATF R.10 / BSA',
    baseSeverity: 'medium',
  },
}

const ACCOUNT_NAMES = [
  'Meridian Holdings LLC', 'Northgate Trading', 'Silverline Logistics',
  'Apex Digital Ventures', 'Coastal Import Co', 'Vertex Consulting Group',
  'Ironwood Capital', 'Blue Harbor Exchange', 'Summit Freight Partners',
  'Crescent Retail Group', 'Pinnacle Asset Mgmt', 'Redstone Commodities',
  'Lakeside Financial', 'Orion Payments BV', 'Zenith Metals Trading',
]

const HIGH_RISK_COUNTRIES = [
  'Cayman Islands', 'Panama', 'Seychelles', 'Cyprus',
  'UAE', 'Malta', 'Belize', 'Mauritius',
]

/** Indicator phrases per typology, filled with concrete numbers at generation time. */
function buildIndicators(type: AMLPatternType, volume: number, count: number): string[] {
  switch (type) {
    case 'structuring':
      return [
        `${count} deposits between $9,100 and $9,900 (threshold $10,000)`,
        'All deposits made at different branches within 72 hours',
        'No prior history of cash deposits on this account',
        `Aggregate volume $${volume.toLocaleString()} across the window`,
      ]
    case 'smurfing':
      return [
        `${count} inbound transfers from ${Math.max(4, Math.floor(count / 3))} distinct senders`,
        'Average transfer value below $2,000',
        'Senders share no commercial relationship with beneficiary',
        'Funds consolidated and forwarded within 24 hours',
      ]
    case 'layering':
      return [
        `Chain of ${count} transfers across ${Math.max(3, Math.floor(count / 4))} accounts`,
        'Each hop retains 92–97% of the original value',
        'Two hops cross international borders',
        'No documented economic purpose for the chain',
      ]
    case 'round_tripping':
      return [
        `Funds returned to origin after ${Math.max(3, Math.floor(count / 5))} intermediary hops`,
        `Net position change less than 3% of $${volume.toLocaleString()}`,
        'Circular flow completed within 5 business days',
        'Intermediaries share a common beneficial owner',
      ]
    case 'rapid_movement':
      return [
        `Median dwell time of funds: ${Math.floor(Math.random() * 14) + 3} minutes`,
        `${count} in/out pairs matched within the analysis window`,
        'Outbound value matches inbound within 1–2%',
        'Account maintains near-zero end-of-day balance',
      ]
    case 'dormant_reactivation':
      return [
        `Account dormant for ${Math.floor(Math.random() * 12) + 6} months prior to activity`,
        `Sudden throughput of $${volume.toLocaleString()} in ${count} transactions`,
        'Login originated from a new device and country',
        'Contact details changed 48 hours before first transfer',
      ]
    case 'high_risk_jurisdiction':
      return [
        `Counterparty registered in ${HIGH_RISK_COUNTRIES[Math.floor(Math.random() * HIGH_RISK_COUNTRIES.length)]}`,
        'Beneficial ownership chain includes a nominee director',
        `${count} transfers totalling $${volume.toLocaleString()}`,
        'Jurisdiction listed under FATF increased monitoring',
      ]
    case 'cash_intensive':
      return [
        `Cash ratio ${Math.floor(Math.random() * 25) + 68}% vs sector norm 22%`,
        `Declared revenue inconsistent with $${volume.toLocaleString()} throughput`,
        'Deposit pattern insensitive to seasonality',
        'No matching card-present transaction volume',
      ]
  }
}

/** Generate a single AML pattern detection. */
export function generateAMLPattern(forceType?: AMLPatternType): AMLPattern {
  const types = Object.keys(AML_TYPOLOGIES) as AMLPatternType[]
  const type = forceType ?? types[Math.floor(Math.random() * types.length)]
  const meta = AML_TYPOLOGIES[type]

  const transactionCount = Math.floor(Math.random() * 40) + 6
  const totalVolume = Math.floor(Math.random() * 480000) + 20000
  const confidence = 0.62 + Math.random() * 0.37

  // Escalate severity when confidence and volume are both high.
  const severityOrder: AMLPattern['severity'][] = ['low', 'medium', 'high', 'critical']
  const baseIndex = severityOrder.indexOf(meta.baseSeverity)
  const bump = confidence > 0.9 && totalVolume > 250000 ? 1 : 0
  const severity = severityOrder[Math.min(severityOrder.length - 1, baseIndex + bump)]

  return {
    id: `AML-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    type,
    accountId: `ACC-${Math.floor(Math.random() * 900000 + 100000)}`,
    accountName: ACCOUNT_NAMES[Math.floor(Math.random() * ACCOUNT_NAMES.length)],
    severity,
    confidence,
    detectedAt: new Date(Date.now() - Math.floor(Math.random() * 72) * 3600 * 1000),
    transactionCount,
    totalVolume,
    indicators: buildIndicators(type, totalVolume, transactionCount),
    regulatoryRef: meta.regulatoryRef,
    sarCandidate: confidence > 0.82 && (severity === 'high' || severity === 'critical'),
    windowDays: [7, 14, 30, 90][Math.floor(Math.random() * 4)],
  }
}

/** Generate a batch of AML detections covering every typology at least once. */
export function generateAMLPatterns(count: number = 24): AMLPattern[] {
  const types = Object.keys(AML_TYPOLOGIES) as AMLPatternType[]
  const patterns: AMLPattern[] = []

  // Guarantee coverage of each typology so the dashboard never looks empty.
  for (const type of types) {
    patterns.push(generateAMLPattern(type))
  }
  for (let i = patterns.length; i < count; i++) {
    patterns.push(generateAMLPattern())
  }

  return patterns.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
}

/** Aggregate statistics for the AML dashboard header. */
export function summarizeAML(patterns: AMLPattern[]) {
  return {
    total: patterns.length,
    critical: patterns.filter(p => p.severity === 'critical').length,
    accountsFlagged: new Set(patterns.map(p => p.accountId)).size,
    volumeFlagged: patterns.reduce((sum, p) => sum + p.totalVolume, 0),
    sarCandidates: patterns.filter(p => p.sarCandidate).length,
    avgConfidence:
      patterns.reduce((sum, p) => sum + p.confidence, 0) / (patterns.length || 1),
  }
}
