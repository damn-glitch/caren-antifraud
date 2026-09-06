// CAREN - Immutable Audit Trail
// Tamper-evident record of every decision, with hash chaining for integrity.
// Author: Alisher Beisembekov

export type AuditAction =
  | 'case_opened' | 'case_closed' | 'case_escalated'
  | 'transaction_blocked' | 'transaction_approved'
  | 'account_frozen' | 'account_unfrozen'
  | 'rule_modified' | 'threshold_changed'
  | 'model_deployed' | 'model_rollback'
  | 'sar_filed' | 'screening_cleared'
  | 'data_exported' | 'permission_granted'

export type ActorType = 'analyst' | 'system' | 'model' | 'api_client'

export interface AuditEntry {
  id: string
  sequence: number
  action: AuditAction
  actorType: ActorType
  actor: string
  subject: string
  at: Date
  detail: { en: string; ru: string }
  before?: string
  after?: string
  ipAddress: string
  /** SHA-style digest of this entry plus the previous hash. */
  hash: string
  previousHash: string
  verified: boolean
}

export const ACTION_META: Record<AuditAction, { en: string; ru: string; severity: 'info' | 'notice' | 'critical' }> = {
  case_opened: { en: 'Case opened', ru: 'Кейс открыт', severity: 'info' },
  case_closed: { en: 'Case closed', ru: 'Кейс закрыт', severity: 'notice' },
  case_escalated: { en: 'Case escalated', ru: 'Кейс эскалирован', severity: 'notice' },
  transaction_blocked: { en: 'Transaction blocked', ru: 'Операция заблокирована', severity: 'notice' },
  transaction_approved: { en: 'Transaction approved', ru: 'Операция одобрена', severity: 'info' },
  account_frozen: { en: 'Account frozen', ru: 'Счёт заморожен', severity: 'critical' },
  account_unfrozen: { en: 'Account unfrozen', ru: 'Счёт разморожен', severity: 'critical' },
  rule_modified: { en: 'Rule modified', ru: 'Правило изменено', severity: 'critical' },
  threshold_changed: { en: 'Threshold changed', ru: 'Порог изменён', severity: 'critical' },
  model_deployed: { en: 'Model deployed', ru: 'Модель развёрнута', severity: 'critical' },
  model_rollback: { en: 'Model rolled back', ru: 'Откат модели', severity: 'critical' },
  sar_filed: { en: 'SAR filed', ru: 'СПО подано', severity: 'critical' },
  screening_cleared: { en: 'Screening hit cleared', ru: 'Совпадение скрининга закрыто', severity: 'notice' },
  data_exported: { en: 'Data exported', ru: 'Данные экспортированы', severity: 'critical' },
  permission_granted: { en: 'Permission granted', ru: 'Права выданы', severity: 'critical' },
}

export const ACTOR_LABELS: Record<ActorType, { en: string; ru: string }> = {
  analyst: { en: 'Analyst', ru: 'Аналитик' },
  system: { en: 'System', ru: 'Система' },
  model: { en: 'Model', ru: 'Модель' },
  api_client: { en: 'API client', ru: 'API-клиент' },
}

const ANALYSTS = ['Alisher Beisembekov', 'Sarah Mitchell', 'Marcus Chen', 'Emily Rodriguez', 'Lisa Anderson']
const SYSTEM_ACTORS = ['CAREN Engine', 'Triage Pipeline', 'Screening Service']
const MODEL_ACTORS = ['RandomForest v2.4.1', 'XGBoost v3.1.0']

const DETAIL_TEMPLATES: Record<AuditAction, (subject: string) => { en: string; ru: string; before?: string; after?: string }> = {
  case_opened: s => ({
    en: `Investigation case opened for ${s} following ensemble score above the action threshold.`,
    ru: `Открыт кейс расследования по ${s} после превышения порога действия оценкой ансамбля.`,
  }),
  case_closed: s => ({
    en: `Case ${s} closed as false positive with discriminator evidence attached.`,
    ru: `Кейс ${s} закрыт как ложное срабатывание с приложением доказательств расхождения.`,
  }),
  case_escalated: s => ({
    en: `Case ${s} escalated to level two after evidence proved inconclusive.`,
    ru: `Кейс ${s} эскалирован на второй уровень после неубедительных доказательств.`,
  }),
  transaction_blocked: s => ({
    en: `Transaction ${s} blocked automatically at ensemble probability 0.94.`,
    ru: `Операция ${s} автоматически заблокирована при вероятности ансамбля 0,94.`,
  }),
  transaction_approved: s => ({
    en: `Transaction ${s} auto-approved; all approval factors above threshold.`,
    ru: `Операция ${s} автоматически одобрена; все факторы одобрения выше порога.`,
  }),
  account_frozen: s => ({
    en: `Outbound transfers frozen on ${s} pending compliance review.`,
    ru: `Исходящие переводы по ${s} заморожены до проверки комплаенса.`,
    before: 'active',
    after: 'frozen',
  }),
  account_unfrozen: s => ({
    en: `Freeze lifted on ${s} after customer verification on a trusted channel.`,
    ru: `Заморозка с ${s} снята после подтверждения клиента по доверенному каналу.`,
    before: 'frozen',
    after: 'active',
  }),
  rule_modified: s => ({
    en: `Detection rule ${s} modified; simulation projected a 12% precision gain.`,
    ru: `Правило обнаружения ${s} изменено; симуляция спрогнозировала рост precision на 12%.`,
    before: 'velocity_1h > 24',
    after: 'velocity_1h > 18',
  }),
  threshold_changed: s => ({
    en: `Auto-block threshold on ${s} adjusted following the weekly calibration review.`,
    ru: `Порог автоблокировки для ${s} скорректирован по итогам еженедельной калибровки.`,
    before: '0.90',
    after: '0.94',
  }),
  model_deployed: s => ({
    en: `Model ${s} promoted to champion with 85% traffic allocation.`,
    ru: `Модель ${s} назначена чемпионом с распределением 85% трафика.`,
    before: 'challenger',
    after: 'champion',
  }),
  model_rollback: s => ({
    en: `Model ${s} rolled back after concept drift breached the PSI ceiling.`,
    ru: `Выполнен откат модели ${s} после превышения дрейфом концепции потолка PSI.`,
    before: 'v3.1.0',
    after: 'v2.4.1',
  }),
  sar_filed: s => ({
    en: `Suspicious Activity Report filed for ${s} under FATF R.10.`,
    ru: `Сообщение о подозрительной операции по ${s} подано согласно FATF R.10.`,
  }),
  screening_cleared: s => ({
    en: `Sanctions hit on ${s} cleared: date of birth and nationality both diverge.`,
    ru: `Санкционное совпадение по ${s} закрыто: дата рождения и гражданство расходятся.`,
  }),
  data_exported: s => ({
    en: `Case data for ${s} exported to CSV by an authorised analyst.`,
    ru: `Данные кейса ${s} экспортированы в CSV авторизованным аналитиком.`,
  }),
  permission_granted: s => ({
    en: `Elevated review permission granted on ${s} for the current shift only.`,
    ru: `Расширенные права проверки по ${s} выданы только на текущую смену.`,
  }),
}

/**
 * Deterministic non-cryptographic digest.
 * Real deployments would use SHA-256; this keeps the demo dependency-free
 * while preserving the chaining property that makes tampering visible.
 */
function digest(input: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193

  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0
  }

  return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).slice(0, 16)
}

export function generateAuditTrail(count: number = 40): AuditEntry[] {
  const actions = Object.keys(ACTION_META) as AuditAction[]
  const entries: AuditEntry[] = []
  let previousHash = '0000000000000000'

  for (let i = 0; i < count; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)]

    // Automated decisions come from a model or the engine; everything else is
    // mostly analyst-driven, with a slice of API-client traffic.
    const actorRoll = Math.random()
    const actorType: ActorType =
      action === 'transaction_blocked' || action === 'transaction_approved'
        ? actorRoll > 0.5 ? 'model' : 'system'
        : actorRoll > 0.35 ? 'analyst'
        : actorRoll > 0.15 ? 'system'
        : 'api_client'

    const actor =
      actorType === 'analyst' ? ANALYSTS[Math.floor(Math.random() * ANALYSTS.length)]
      : actorType === 'model' ? MODEL_ACTORS[Math.floor(Math.random() * MODEL_ACTORS.length)]
      : actorType === 'api_client' ? 'partner-api-v2'
      : SYSTEM_ACTORS[Math.floor(Math.random() * SYSTEM_ACTORS.length)]

    const subject = action.startsWith('case')
      ? `CASE-${Math.floor(Math.random() * 9000 + 1000)}`
      : action.startsWith('transaction')
        ? `TXN-${Math.floor(Math.random() * 900000 + 100000)}`
        : action.startsWith('model')
          ? MODEL_ACTORS[Math.floor(Math.random() * MODEL_ACTORS.length)]
          : action.startsWith('rule') || action.startsWith('threshold')
            ? `RULE-${Math.floor(Math.random() * 900 + 100)}`
            : `ACC-${Math.floor(Math.random() * 900000 + 100000)}`

    const template = DETAIL_TEMPLATES[action](subject)
    const at = new Date(Date.now() - (count - i) * Math.floor(Math.random() * 40 + 8) * 60000)

    const payload = `${i}|${action}|${actor}|${subject}|${at.toISOString()}|${previousHash}`
    const hash = digest(payload)

    entries.push({
      id: `AUD-${String(10000 + i)}`,
      sequence: i + 1,
      action,
      actorType,
      actor,
      subject,
      at,
      detail: { en: template.en, ru: template.ru },
      before: template.before,
      after: template.after,
      ipAddress: `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
      hash,
      previousHash,
      verified: true,
    })

    previousHash = hash
  }

  return entries.reverse()
}

/** Re-derive every hash to prove the chain has not been altered. */
export function verifyChain(entries: AuditEntry[]): { valid: boolean; brokenAt?: number } {
  const ordered = [...entries].sort((a, b) => a.sequence - b.sequence)
  let previousHash = '0000000000000000'

  for (const entry of ordered) {
    const payload = `${entry.sequence - 1}|${entry.action}|${entry.actor}|${entry.subject}|${entry.at.toISOString()}|${previousHash}`
    if (digest(payload) !== entry.hash) {
      return { valid: false, brokenAt: entry.sequence }
    }
    previousHash = entry.hash
  }

  return { valid: true }
}

export function summarizeAudit(entries: AuditEntry[]) {
  return {
    total: entries.length,
    critical: entries.filter(e => ACTION_META[e.action].severity === 'critical').length,
    byAnalyst: entries.filter(e => e.actorType === 'analyst').length,
    byModel: entries.filter(e => e.actorType === 'model').length,
    bySystem: entries.filter(e => e.actorType === 'system').length,
    uniqueActors: new Set(entries.map(e => e.actor)).size,
  }
}
