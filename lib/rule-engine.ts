// CAREN - Rule Engine & What-If Simulator
// Lets an analyst change a detection threshold and see the precision/recall
// trade-off before shipping it, instead of discovering it in production.
// Author: Alisher Beisembekov

export type FieldKey =
  | 'amount'
  | 'risk_score'
  | 'velocity_1h'
  | 'distinct_merchants_24h'
  | 'account_age_days'
  | 'night_activity_pct'
  | 'decline_rate_pct'
  | 'cross_border'
  | 'device_shared_count'
  | 'dwell_minutes'

export type Operator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between'
export type RuleAction = 'flag' | 'review' | 'block' | 'step_up' | 'monitor'

export interface Condition {
  id: string
  field: FieldKey
  operator: Operator
  value: number
  secondValue?: number
}

export interface DetectionRule {
  id: string
  name: { en: string; ru: string }
  enabled: boolean
  logic: 'all' | 'any'
  conditions: Condition[]
  action: RuleAction
  /** Live performance of the rule as currently configured. */
  stats: RuleStats
  createdBy: string
  updatedAt: Date
}

export interface RuleStats {
  triggersPerDay: number
  truePositives: number
  falsePositives: number
  precision: number
  recall: number
  f1: number
  analystMinutesPerDay: number
  exposureCaught: number
}

export interface SimulationResult {
  before: RuleStats
  after: RuleStats
  delta: {
    triggers: number
    precision: number
    recall: number
    analystMinutes: number
    exposureCaught: number
    missedFraud: number
  }
  verdict: 'improves' | 'degrades' | 'trade_off'
  narrative: { en: string; ru: string }
}

export const FIELD_META: Record<FieldKey, { en: string; ru: string; unit: string; min: number; max: number }> = {
  amount: { en: 'Transaction amount', ru: 'Сумма операции', unit: '$', min: 0, max: 20000 },
  risk_score: { en: 'Risk score', ru: 'Риск-скор', unit: '', min: 0, max: 100 },
  velocity_1h: { en: 'Transactions in 1h', ru: 'Операций за 1 ч', unit: '', min: 0, max: 60 },
  distinct_merchants_24h: { en: 'Distinct merchants 24h', ru: 'Уникальных продавцов за 24 ч', unit: '', min: 0, max: 40 },
  account_age_days: { en: 'Account age', ru: 'Возраст счёта', unit: 'd', min: 0, max: 3650 },
  night_activity_pct: { en: 'Night activity', ru: 'Ночная активность', unit: '%', min: 0, max: 100 },
  decline_rate_pct: { en: 'Decline rate', ru: 'Доля отказов', unit: '%', min: 0, max: 100 },
  cross_border: { en: 'Cross-border flag', ru: 'Признак трансграничности', unit: '', min: 0, max: 1 },
  device_shared_count: { en: 'Accounts sharing device', ru: 'Счетов с общим устройством', unit: '', min: 0, max: 30 },
  dwell_minutes: { en: 'Fund dwell time', ru: 'Время удержания средств', unit: 'min', min: 0, max: 1440 },
}

export const OPERATOR_LABELS: Record<Operator, { en: string; ru: string; symbol: string }> = {
  gt: { en: 'greater than', ru: 'больше', symbol: '>' },
  gte: { en: 'at least', ru: 'не менее', symbol: '≥' },
  lt: { en: 'less than', ru: 'меньше', symbol: '<' },
  lte: { en: 'at most', ru: 'не более', symbol: '≤' },
  eq: { en: 'equals', ru: 'равно', symbol: '=' },
  between: { en: 'between', ru: 'между', symbol: '↔' },
}

export const ACTION_META: Record<RuleAction, { en: string; ru: string; color: string }> = {
  flag: { en: 'Flag for review', ru: 'Пометить для проверки', color: '#f59e0b' },
  review: { en: 'Manual review', ru: 'Ручная проверка', color: '#06b6d4' },
  block: { en: 'Block transaction', ru: 'Заблокировать операцию', color: '#ef4444' },
  step_up: { en: 'Step-up authentication', ru: 'Усиленная аутентификация', color: '#8b5cf6' },
  monitor: { en: 'Monitor silently', ru: 'Тихое наблюдение', color: '#64748b' },
}

/**
 * Model rule performance from its conditions.
 * Tighter thresholds raise precision and cut recall — the core trade-off the
 * simulator exists to make visible.
 */
export function computeStats(conditions: Condition[], action: RuleAction): RuleStats {
  // Strictness: how far each threshold sits into its field's range.
  const strictness =
    conditions.reduce((sum, c) => {
      const meta = FIELD_META[c.field]
      const span = meta.max - meta.min || 1
      const normalised = (c.value - meta.min) / span
      // "less than" style operators invert the relationship.
      const directional = c.operator === 'lt' || c.operator === 'lte' ? 1 - normalised : normalised
      return sum + directional
    }, 0) / Math.max(1, conditions.length)

  const clamped = Math.max(0.02, Math.min(0.98, strictness))

  // Looser rules fire far more often.
  const triggersPerDay = Math.round(40 + (1 - clamped) ** 2 * 2600)

  // Precision rises with strictness, recall falls.
  const precision = Math.min(0.985, 0.28 + clamped * 0.68)
  const recall = Math.max(0.12, 0.97 - clamped * 0.74)
  const f1 = (2 * precision * recall) / (precision + recall)

  const truePositives = Math.round(triggersPerDay * precision)
  const falsePositives = triggersPerDay - truePositives

  // Blocking costs more analyst time per event than silent monitoring.
  const minutesPerEvent = { block: 14, review: 12, flag: 8, step_up: 4, monitor: 1 }[action]

  return {
    triggersPerDay,
    truePositives,
    falsePositives,
    precision,
    recall,
    f1,
    analystMinutesPerDay: triggersPerDay * minutesPerEvent,
    exposureCaught: Math.round(truePositives * (Math.random() * 900 + 1400)),
  }
}

function buildNarrative(
  before: RuleStats,
  after: RuleStats,
  verdict: SimulationResult['verdict']
): { en: string; ru: string } {
  const triggerDelta = after.triggersPerDay - before.triggersPerDay
  const precisionPts = (after.precision - before.precision) * 100
  const recallPts = (after.recall - before.recall) * 100
  const hoursDelta = (after.analystMinutesPerDay - before.analystMinutesPerDay) / 60
  const missedFraud = Math.max(0, before.truePositives - after.truePositives)

  if (verdict === 'improves') {
    return {
      en: `This change is strictly better. Daily triggers move by ${triggerDelta > 0 ? '+' : ''}${triggerDelta.toLocaleString()}, precision gains ${precisionPts.toFixed(1)} points, and recall holds within a point of where it was. Analyst load shifts by ${hoursDelta.toFixed(1)} hours per day.\n\nWhen precision rises without a meaningful recall cost, the old threshold was simply sitting in dead space — it was generating work without catching anything extra. Safe to ship.`,
      ru: `Это изменение однозначно лучше. Число ежедневных срабатываний меняется на ${triggerDelta > 0 ? '+' : ''}${triggerDelta.toLocaleString()}, precision растёт на ${precisionPts.toFixed(1)} п., а recall остаётся в пределах одного пункта от прежнего значения. Нагрузка аналитиков смещается на ${hoursDelta.toFixed(1)} ч в день.\n\nКогда precision растёт без заметной потери recall, прежний порог просто находился в «мёртвой зоне»: он создавал работу, не отлавливая ничего дополнительно. Можно внедрять.`,
    }
  }

  if (verdict === 'degrades') {
    return {
      en: `This change costs more than it returns. Precision moves ${precisionPts.toFixed(1)} points and recall ${recallPts.toFixed(1)} points, while analyst load changes by ${hoursDelta.toFixed(1)} hours per day. Approximately ${missedFraud} genuine fraud events per day would stop being caught.\n\nAt an average of $1,900 per confirmed case, that is roughly $${(missedFraud * 1900).toLocaleString()} of daily exposure traded for the operational saving. Not recommended unless the analyst constraint is binding.`,
      ru: `Это изменение обходится дороже, чем даёт. Precision смещается на ${precisionPts.toFixed(1)} п., recall — на ${recallPts.toFixed(1)} п., при этом нагрузка аналитиков меняется на ${hoursDelta.toFixed(1)} ч в день. Примерно ${missedFraud} реальных случаев мошенничества в день перестанут выявляться.\n\nПри средней сумме $1 900 на подтверждённый кейс это около $${(missedFraud * 1900).toLocaleString()} ежедневного риск-объёма, обмениваемого на операционную экономию. Не рекомендуется, если ограничение по аналитикам не является критическим.`,
    }
  }

  return {
    en: `This is a genuine trade-off rather than an improvement. Precision moves ${precisionPts.toFixed(1)} points while recall moves ${recallPts.toFixed(1)} points, and analyst load changes by ${hoursDelta.toFixed(1)} hours per day.\n\nWhich side to take depends on your current constraint. If the queue is the bottleneck, take the precision. If losses are the bottleneck, keep the recall. The simulator cannot make that call — it only makes the cost of each choice explicit.`,
    ru: `Это настоящий компромисс, а не улучшение. Precision смещается на ${precisionPts.toFixed(1)} п., recall — на ${recallPts.toFixed(1)} п., нагрузка аналитиков меняется на ${hoursDelta.toFixed(1)} ч в день.\n\nВыбор стороны зависит от текущего ограничения. Если узкое место — очередь, выбирайте precision. Если узкое место — потери, сохраняйте recall. Симулятор не может принять это решение, он лишь делает цену каждого варианта явной.`,
  }
}

export function simulate(
  original: Condition[],
  modified: Condition[],
  action: RuleAction
): SimulationResult {
  const before = computeStats(original, action)
  const after = computeStats(modified, action)

  const precisionDelta = after.precision - before.precision
  const recallDelta = after.recall - before.recall

  const verdict: SimulationResult['verdict'] =
    precisionDelta > 0.01 && recallDelta > -0.01 ? 'improves'
    : precisionDelta < -0.01 && recallDelta < 0.01 ? 'degrades'
    : 'trade_off'

  return {
    before,
    after,
    delta: {
      triggers: after.triggersPerDay - before.triggersPerDay,
      precision: precisionDelta,
      recall: recallDelta,
      analystMinutes: after.analystMinutesPerDay - before.analystMinutesPerDay,
      exposureCaught: after.exposureCaught - before.exposureCaught,
      missedFraud: Math.max(0, before.truePositives - after.truePositives),
    },
    verdict,
    narrative: buildNarrative(before, after, verdict),
  }
}

const RULE_TEMPLATES: {
  name: { en: string; ru: string }
  conditions: Omit<Condition, 'id'>[]
  action: RuleAction
}[] = [
  {
    name: { en: 'High-value cross-border transfer', ru: 'Крупный трансграничный перевод' },
    conditions: [
      { field: 'amount', operator: 'gt', value: 8000 },
      { field: 'cross_border', operator: 'eq', value: 1 },
    ],
    action: 'review',
  },
  {
    name: { en: 'Card testing burst', ru: 'Всплеск перебора карт' },
    conditions: [
      { field: 'velocity_1h', operator: 'gte', value: 18 },
      { field: 'decline_rate_pct', operator: 'gt', value: 65 },
    ],
    action: 'block',
  },
  {
    name: { en: 'Mule pass-through detection', ru: 'Выявление транзита через дроп-счёт' },
    conditions: [
      { field: 'dwell_minutes', operator: 'lt', value: 15 },
      { field: 'account_age_days', operator: 'lt', value: 90 },
    ],
    action: 'flag',
  },
  {
    name: { en: 'Shared device cluster', ru: 'Кластер общего устройства' },
    conditions: [{ field: 'device_shared_count', operator: 'gte', value: 5 }],
    action: 'step_up',
  },
  {
    name: { en: 'Night-shifted spending anomaly', ru: 'Аномалия ночных трат' },
    conditions: [
      { field: 'night_activity_pct', operator: 'gt', value: 55 },
      { field: 'risk_score', operator: 'gt', value: 60 },
    ],
    action: 'monitor',
  },
  {
    name: { en: 'Merchant fan-out', ru: 'Веер по продавцам' },
    conditions: [
      { field: 'distinct_merchants_24h', operator: 'gte', value: 12 },
      { field: 'amount', operator: 'lt', value: 400 },
    ],
    action: 'flag',
  },
]

export function generateRules(): DetectionRule[] {
  return RULE_TEMPLATES.map((tpl, i) => {
    const conditions: Condition[] = tpl.conditions.map((c, j) => ({
      ...c,
      id: `COND-${i}-${j}`,
    }))

    return {
      id: `RULE-${String(100 + i)}`,
      name: tpl.name,
      enabled: i !== RULE_TEMPLATES.length - 1,
      logic: conditions.length > 1 ? 'all' : 'any',
      conditions,
      action: tpl.action,
      stats: computeStats(conditions, tpl.action),
      createdBy: 'Alisher Beisembekov',
      updatedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
    }
  })
}
