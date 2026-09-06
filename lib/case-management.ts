// CAREN - Case Management Workflow
// Kanban-style investigation pipeline with SLA tracking and workload balance.
// Author: Alisher Beisembekov

export type CaseStage = 'triage' | 'investigating' | 'pending_review' | 'escalated' | 'closed'
export type CasePriority = 'P1' | 'P2' | 'P3' | 'P4'
export type CaseOutcome = 'confirmed_fraud' | 'false_positive' | 'insufficient_evidence' | 'referred_to_le'

export interface CaseNote {
  id: string
  author: string
  at: Date
  text: { en: string; ru: string }
}

export interface InvestigationCase {
  id: string
  title: { en: string; ru: string }
  stage: CaseStage
  priority: CasePriority
  assignee: string
  assigneeInitials: string
  accountId: string
  exposure: number
  openedAt: Date
  slaMinutes: number
  minutesElapsed: number
  slaBreached: boolean
  /** Percentage of the SLA window consumed. */
  slaConsumedPct: number
  linkedAlerts: number
  evidenceCount: number
  outcome?: CaseOutcome
  notes: CaseNote[]
  tags: { en: string; ru: string }[]
}

export const STAGE_META: Record<CaseStage, { en: string; ru: string; color: string }> = {
  triage: { en: 'Triage', ru: 'Триаж', color: '#64748b' },
  investigating: { en: 'Investigating', ru: 'Расследование', color: '#8b5cf6' },
  pending_review: { en: 'Pending Review', ru: 'На проверке', color: '#06b6d4' },
  escalated: { en: 'Escalated', ru: 'Эскалировано', color: '#f59e0b' },
  closed: { en: 'Closed', ru: 'Закрыто', color: '#10b981' },
}

export const PRIORITY_META: Record<CasePriority, { en: string; ru: string; slaMinutes: number; color: string }> = {
  P1: { en: 'Critical', ru: 'Критический', slaMinutes: 30, color: '#ef4444' },
  P2: { en: 'High', ru: 'Высокий', slaMinutes: 120, color: '#f97316' },
  P3: { en: 'Medium', ru: 'Средний', slaMinutes: 480, color: '#f59e0b' },
  P4: { en: 'Low', ru: 'Низкий', slaMinutes: 1440, color: '#64748b' },
}

export const OUTCOME_META: Record<CaseOutcome, { en: string; ru: string }> = {
  confirmed_fraud: { en: 'Confirmed fraud', ru: 'Мошенничество подтверждено' },
  false_positive: { en: 'False positive', ru: 'Ложное срабатывание' },
  insufficient_evidence: { en: 'Insufficient evidence', ru: 'Недостаточно доказательств' },
  referred_to_le: { en: 'Referred to law enforcement', ru: 'Передано в правоохранительные органы' },
}

const ANALYSTS = [
  { name: 'Alisher Beisembekov', initials: 'AB' },
  { name: 'Sarah Mitchell', initials: 'SM' },
  { name: 'Marcus Chen', initials: 'MC' },
  { name: 'Emily Rodriguez', initials: 'ER' },
  { name: 'Lisa Anderson', initials: 'LA' },
  { name: 'David Okafor', initials: 'DO' },
]

const CASE_TITLES: { en: string; ru: string }[] = [
  { en: 'Account takeover with fan-out dispersal', ru: 'Захват счёта с веерным распределением' },
  { en: 'Card testing burst across 14 merchants', ru: 'Всплеск перебора карт у 14 продавцов' },
  { en: 'Structuring below reporting threshold', ru: 'Дробление ниже порога отчётности' },
  { en: 'Mule account receiving fan-in transfers', ru: 'Дроп-счёт принимает веерные переводы' },
  { en: 'Synthetic identity cluster, shared BIN', ru: 'Кластер синтетических личностей, общий BIN' },
  { en: 'Affiliate self-referral commission abuse', ru: 'Злоупотребление комиссией через самореферал' },
  { en: 'Cross-border layering chain', ru: 'Трансграничная цепочка расслоения' },
  { en: 'Impossible travel, no proxy signature', ru: 'Невозможное перемещение без признаков прокси' },
  { en: 'Dormant account reactivation', ru: 'Активация спящего счёта' },
  { en: 'Sanctions screening true match', ru: 'Истинное совпадение санкционного скрининга' },
  { en: 'Opposite trading between paired accounts', ru: 'Встречная торговля между парными счетами' },
  { en: 'Trade invoice price deviation', ru: 'Ценовое отклонение в торговом счёте' },
]

const TAG_POOL: { en: string; ru: string }[] = [
  { en: 'ATO', ru: 'Захват счёта' },
  { en: 'AML', ru: 'ПОД/ФТ' },
  { en: 'Ring-linked', ru: 'Связано с сетью' },
  { en: 'SAR candidate', ru: 'Кандидат на СПО' },
  { en: 'High value', ru: 'Крупная сумма' },
  { en: 'Repeat subject', ru: 'Повторный объект' },
  { en: 'Cross-border', ru: 'Трансграничное' },
]

const NOTE_TEXTS: { en: string; ru: string }[] = [
  {
    en: 'Pulled 90-day transaction history. Baseline break confirmed on four of six behavioural dimensions.',
    ru: 'Выгружена история операций за 90 дней. Разрыв базового профиля подтверждён по четырём из шести поведенческих измерений.',
  },
  {
    en: 'Device fingerprint matches two other open cases. Requesting a merge with CASE-1042.',
    ru: 'Отпечаток устройства совпадает с двумя другими открытыми кейсами. Запрошено объединение с CASE-1042.',
  },
  {
    en: 'Customer contacted on the pre-change phone number. Confirmed they did not authorise the transfers.',
    ru: 'С клиентом связались по номеру телефона до изменения. Подтвердил, что переводы не авторизовал.',
  },
  {
    en: 'Outbound transfers frozen. $312K retained pending compliance sign-off.',
    ru: 'Исходящие переводы заморожены. $312 тыс. удержаны до решения комплаенса.',
  },
  {
    en: 'Discriminators cleared the sanctions hit — different birth year and nationality. Closing as false positive.',
    ru: 'Расхождения сняли санкционное совпадение — другой год рождения и гражданство. Закрывается как ложное срабатывание.',
  },
  {
    en: 'Escalating to level two. Evidence supports suspicion but not yet a definitive determination.',
    ru: 'Эскалация на второй уровень. Доказательства подтверждают подозрение, но не дают окончательного вывода.',
  },
]

function buildNotes(count: number): CaseNote[] {
  const pool = [...NOTE_TEXTS]
  return Array.from({ length: Math.min(count, pool.length) }, (_, i) => {
    const analyst = ANALYSTS[Math.floor(Math.random() * ANALYSTS.length)]
    return {
      id: `NOTE-${i}-${Math.random().toString(36).slice(2, 6)}`,
      author: analyst.name,
      at: new Date(Date.now() - (count - i) * Math.floor(Math.random() * 180 + 30) * 60000),
      text: pool.splice(Math.floor(Math.random() * pool.length), 1)[0],
    }
  })
}

export function generateCase(forceStage?: CaseStage): InvestigationCase {
  const stages = Object.keys(STAGE_META) as CaseStage[]
  const stage = forceStage ?? stages[Math.floor(Math.random() * stages.length)]

  const priorities = Object.keys(PRIORITY_META) as CasePriority[]
  const priority = priorities[Math.floor(Math.random() * priorities.length)]
  const slaMinutes = PRIORITY_META[priority].slaMinutes

  // Closed cases can exceed SLA historically; open ones cluster nearer the window.
  const minutesElapsed = stage === 'closed'
    ? Math.floor(Math.random() * slaMinutes * 2)
    : Math.floor(Math.random() * slaMinutes * 1.35)

  const analyst = ANALYSTS[Math.floor(Math.random() * ANALYSTS.length)]
  const tagCount = Math.floor(Math.random() * 3) + 1
  const tagPool = [...TAG_POOL]

  return {
    id: `CASE-${Math.floor(Math.random() * 9000 + 1000)}`,
    title: CASE_TITLES[Math.floor(Math.random() * CASE_TITLES.length)],
    stage,
    priority,
    assignee: analyst.name,
    assigneeInitials: analyst.initials,
    accountId: `ACC-${Math.floor(Math.random() * 900000 + 100000)}`,
    exposure: Math.floor(Math.random() * 220000) + 3000,
    openedAt: new Date(Date.now() - minutesElapsed * 60000),
    slaMinutes,
    minutesElapsed,
    slaBreached: minutesElapsed > slaMinutes,
    slaConsumedPct: Math.min(100, (minutesElapsed / slaMinutes) * 100),
    linkedAlerts: Math.floor(Math.random() * 20) + 2,
    evidenceCount: Math.floor(Math.random() * 8) + 2,
    outcome: stage === 'closed'
      ? (Object.keys(OUTCOME_META) as CaseOutcome[])[Math.floor(Math.random() * 4)]
      : undefined,
    notes: buildNotes(Math.floor(Math.random() * 4) + 1),
    tags: Array.from({ length: tagCount }, () =>
      tagPool.splice(Math.floor(Math.random() * tagPool.length), 1)[0]
    ).filter(Boolean),
  }
}

export function generateCases(count: number = 26): InvestigationCase[] {
  const stages = Object.keys(STAGE_META) as CaseStage[]
  const cases: InvestigationCase[] = []

  // Guarantee every column has cards so the board never renders empty.
  for (const stage of stages) {
    for (let i = 0; i < 2; i++) cases.push(generateCase(stage))
  }
  for (let i = cases.length; i < count; i++) {
    cases.push(generateCase())
  }

  return cases
}

export function summarizeCases(cases: InvestigationCase[]) {
  const open = cases.filter(c => c.stage !== 'closed')
  const closed = cases.filter(c => c.stage === 'closed')

  return {
    total: cases.length,
    open: open.length,
    slaBreached: open.filter(c => c.slaBreached).length,
    atRisk: open.filter(c => !c.slaBreached && c.slaConsumedPct > 75).length,
    totalExposure: open.reduce((sum, c) => sum + c.exposure, 0),
    confirmedFraud: closed.filter(c => c.outcome === 'confirmed_fraud').length,
    avgResolutionMinutes:
      closed.reduce((sum, c) => sum + c.minutesElapsed, 0) / (closed.length || 1),
  }
}

/** Per-analyst workload, used to spot uneven distribution across the team. */
export function workloadByAssignee(cases: InvestigationCase[]) {
  const map = new Map<string, { name: string; initials: string; open: number; exposure: number; breached: number }>()

  for (const c of cases) {
    if (c.stage === 'closed') continue
    const existing = map.get(c.assignee) ?? {
      name: c.assignee,
      initials: c.assigneeInitials,
      open: 0,
      exposure: 0,
      breached: 0,
    }
    existing.open += 1
    existing.exposure += c.exposure
    if (c.slaBreached) existing.breached += 1
    map.set(c.assignee, existing)
  }

  return Array.from(map.values()).sort((a, b) => b.open - a.open)
}
