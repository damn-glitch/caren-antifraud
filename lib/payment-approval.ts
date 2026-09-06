// CAREN - Payment Approval Automation
// Turns a manual withdrawal-approval queue into instant, explainable decisions.
// Author: Alisher Beisembekov

export type ApprovalDecision = 'auto_approved' | 'auto_declined' | 'manual_review' | 'pending'
export type PaymentMethod = 'bank_transfer' | 'card_payout' | 'e_wallet' | 'crypto' | 'wire'

export interface ApprovalFactor {
  key: string
  label: { en: string; ru: string }
  /** Positive values support approval; negative values oppose it. */
  contribution: number
  detail: { en: string; ru: string }
}

export interface PaymentRequest {
  id: string
  accountId: string
  accountName: string
  amount: number
  method: PaymentMethod
  requestedAt: Date
  decision: ApprovalDecision
  decisionLatencyMs: number
  approvalScore: number
  factors: ApprovalFactor[]
  reasoning: { en: string; ru: string }
  accountAgeDays: number
  lifetimeDeposits: number
  lifetimeWithdrawals: number
  firstWithdrawal: boolean
  kycTier: 1 | 2 | 3
  destinationRisk: 'low' | 'medium' | 'high'
}

export const METHOD_LABELS: Record<PaymentMethod, { en: string; ru: string }> = {
  bank_transfer: { en: 'Bank transfer', ru: 'Банковский перевод' },
  card_payout: { en: 'Card payout', ru: 'Выплата на карту' },
  e_wallet: { en: 'E-wallet', ru: 'Электронный кошелёк' },
  crypto: { en: 'Crypto withdrawal', ru: 'Вывод в криптовалюте' },
  wire: { en: 'Wire transfer', ru: 'Телеграфный перевод' },
}

export const DECISION_LABELS: Record<ApprovalDecision, { en: string; ru: string; color: string }> = {
  auto_approved: { en: 'Auto-approved', ru: 'Автоодобрено', color: '#10b981' },
  auto_declined: { en: 'Auto-declined', ru: 'Автоотклонено', color: '#ef4444' },
  manual_review: { en: 'Manual review', ru: 'Ручная проверка', color: '#f59e0b' },
  pending: { en: 'Pending', ru: 'В ожидании' , color: '#64748b' },
}

const ACCOUNT_NAMES = [
  'M. Rodriguez', 'S. Chen', 'D. Okafor', 'L. Petrova', 'J. Almeida',
  'K. Yamamoto', 'R. Volkov', 'N. Haddad', 'T. Andersson', 'P. Sharma',
  'E. Novak', 'C. Duarte', 'F. Belkacem', 'I. Kowalski',
]

interface FactorSeed {
  key: string
  label: { en: string; ru: string }
  detail: (ctx: FactorContext) => { en: string; ru: string }
  score: (ctx: FactorContext) => number
}

interface FactorContext {
  accountAgeDays: number
  amount: number
  lifetimeDeposits: number
  lifetimeWithdrawals: number
  firstWithdrawal: boolean
  kycTier: 1 | 2 | 3
  destinationRisk: 'low' | 'medium' | 'high'
  riskScore: number
}

const FACTOR_SEEDS: FactorSeed[] = [
  {
    key: 'account_tenure',
    label: { en: 'Account tenure', ru: 'Стаж счёта' },
    detail: ctx => ({
      en: `${ctx.accountAgeDays} days since registration${ctx.accountAgeDays < 60 ? ' — below the 60-day seasoning window' : ''}`,
      ru: `${ctx.accountAgeDays} дн. с момента регистрации${ctx.accountAgeDays < 60 ? ' — меньше 60-дневного окна выдержки' : ''}`,
    }),
    score: ctx => (ctx.accountAgeDays > 180 ? 22 : ctx.accountAgeDays > 60 ? 12 : -18),
  },
  {
    key: 'deposit_withdrawal_ratio',
    label: { en: 'Deposit / withdrawal balance', ru: 'Баланс пополнений и выводов' },
    detail: ctx => {
      const ratio = ctx.lifetimeWithdrawals / Math.max(1, ctx.lifetimeDeposits)
      return {
        en: `Withdrawn ${(ratio * 100).toFixed(0)}% of lifetime deposits`,
        ru: `Выведено ${(ratio * 100).toFixed(0)}% от суммы всех пополнений`,
      }
    },
    score: ctx => {
      const ratio = ctx.lifetimeWithdrawals / Math.max(1, ctx.lifetimeDeposits)
      return ratio > 0.95 ? -20 : ratio > 0.7 ? -6 : 16
    },
  },
  {
    key: 'kyc_tier',
    label: { en: 'KYC verification tier', ru: 'Уровень проверки KYC' },
    detail: ctx => ({
      en: `Tier ${ctx.kycTier} verification on file${ctx.kycTier < 2 ? ' — document verification incomplete' : ''}`,
      ru: `Подтверждён уровень ${ctx.kycTier}${ctx.kycTier < 2 ? ' — проверка документов не завершена' : ''}`,
    }),
    score: ctx => (ctx.kycTier === 3 ? 20 : ctx.kycTier === 2 ? 10 : -22),
  },
  {
    key: 'amount_vs_history',
    label: { en: 'Amount against history', ru: 'Сумма относительно истории' },
    detail: ctx => {
      const avg = ctx.lifetimeWithdrawals / Math.max(1, ctx.firstWithdrawal ? 1 : 8)
      const multiple = ctx.amount / Math.max(1, avg)
      return {
        en: ctx.firstWithdrawal
          ? 'First withdrawal on this account — no historical baseline'
          : `${multiple.toFixed(1)}× the account's average withdrawal`,
        ru: ctx.firstWithdrawal
          ? 'Первый вывод по счёту — историческая база отсутствует'
          : `${multiple.toFixed(1)}× от средней суммы вывода по счёту`,
      }
    },
    score: ctx => (ctx.firstWithdrawal ? -12 : ctx.amount > 12000 ? -14 : 14),
  },
  {
    key: 'destination_risk',
    label: { en: 'Destination risk', ru: 'Риск получателя' },
    detail: ctx => ({
      en: ctx.destinationRisk === 'high'
        ? 'Destination in a jurisdiction under increased monitoring'
        : ctx.destinationRisk === 'medium'
          ? 'Destination carries moderate jurisdiction risk'
          : 'Destination in a low-risk jurisdiction',
      ru: ctx.destinationRisk === 'high'
        ? 'Получатель в юрисдикции под усиленным наблюдением'
        : ctx.destinationRisk === 'medium'
          ? 'Получатель в юрисдикции с умеренным риском'
          : 'Получатель в юрисдикции с низким риском',
    }),
    score: ctx => (ctx.destinationRisk === 'high' ? -24 : ctx.destinationRisk === 'medium' ? -8 : 15),
  },
  {
    key: 'behavioural_signal',
    label: { en: 'Behavioural risk signal', ru: 'Поведенческий риск-сигнал' },
    detail: ctx => ({
      en: `Ensemble risk score ${ctx.riskScore.toFixed(1)} against the account's own baseline`,
      ru: `Риск-скор ансамбля ${ctx.riskScore.toFixed(1)} относительно собственной базы счёта`,
    }),
    score: ctx => (ctx.riskScore > 70 ? -28 : ctx.riskScore > 40 ? -10 : 18),
  },
]

function buildReasoning(
  decision: ApprovalDecision,
  factors: ApprovalFactor[],
  amount: number,
  latencyMs: number
): { en: string; ru: string } {
  const negatives = factors.filter(f => f.contribution < 0).sort((a, b) => a.contribution - b.contribution)
  const positives = factors.filter(f => f.contribution > 0).sort((a, b) => b.contribution - a.contribution)
  const money = `$${amount.toLocaleString()}`

  if (decision === 'auto_approved') {
    const top = positives.slice(0, 2).map(f => f.label.en.toLowerCase()).join(' and ')
    const topRu = positives.slice(0, 2).map(f => f.label.ru.toLowerCase()).join(' и ')
    return {
      en: `Approved in ${latencyMs}ms. The ${money} request is supported primarily by ${top}, with no factor scoring below the decline threshold.\n\nThis is the case automation exists for: every signal points the same direction, and routing it to a human would add hours of delay to a decision that was never in doubt.`,
      ru: `Одобрено за ${latencyMs} мс. Запрос на ${money} поддержан прежде всего такими факторами, как ${topRu}, при этом ни один показатель не опустился ниже порога отказа.\n\nИменно для таких случаев и существует автоматизация: все сигналы указывают в одну сторону, и передача запроса человеку добавила бы часы задержки к решению, которое не вызывало сомнений.`,
    }
  }

  if (decision === 'auto_declined') {
    const top = negatives[0]
    return {
      en: `Declined in ${latencyMs}ms. The dominant factor is ${top?.label.en.toLowerCase() ?? 'elevated risk'}: ${top?.detail.en ?? 'risk threshold exceeded'}.\n\nThe ${money} request combines ${negatives.length} independent negative signals. Auto-declining here is defensible precisely because the failure is not marginal — a single weak signal would have been routed to review instead.`,
      ru: `Отклонено за ${latencyMs} мс. Определяющий фактор — ${top?.label.ru.toLowerCase() ?? 'повышенный риск'}: ${top?.detail.ru ?? 'превышен порог риска'}.\n\nЗапрос на ${money} сочетает ${negatives.length} независимых негативных сигнала. Автоматический отказ здесь обоснован именно потому, что отклонение не является пограничным: единичный слабый сигнал был бы направлен на проверку.`,
    }
  }

  return {
    en: `Routed to manual review. The ${money} request scored inside the ambiguous band, with ${positives.length} supporting and ${negatives.length} opposing factors that do not resolve cleanly in either direction.\n\nThe deciding question a reviewer should answer is whether ${negatives[0]?.label.en.toLowerCase() ?? 'the flagged factor'} has a documented explanation. If it does, the remaining profile supports release.`,
    ru: `Направлено на ручную проверку. Запрос на ${money} попал в зону неопределённости: ${positives.length} поддерживающих и ${negatives.length} противодействующих факторов не дают однозначного результата ни в одну сторону.\n\nКлючевой вопрос для проверяющего — есть ли документальное объяснение фактору «${negatives[0]?.label.ru.toLowerCase() ?? 'помеченный фактор'}». Если объяснение есть, остальной профиль поддерживает выдачу средств.`,
  }
}

export function generatePaymentRequest(): PaymentRequest {
  const methods = Object.keys(METHOD_LABELS) as PaymentMethod[]
  const accountAgeDays = Math.floor(Math.random() * 900) + 3
  const amount = Math.floor(Math.random() * 24000) + 50
  const lifetimeDeposits = Math.floor(Math.random() * 180000) + amount
  const lifetimeWithdrawals = Math.floor(lifetimeDeposits * (Math.random() * 0.95))
  const firstWithdrawal = Math.random() < 0.18
  const kycTier = ([1, 2, 3] as const)[Math.floor(Math.random() * 3)]
  const destinationRisk = (['low', 'low', 'medium', 'high'] as const)[Math.floor(Math.random() * 4)]
  const riskScore = Math.random() * 100

  const ctx: FactorContext = {
    accountAgeDays,
    amount,
    lifetimeDeposits,
    lifetimeWithdrawals,
    firstWithdrawal,
    kycTier,
    destinationRisk,
    riskScore,
  }

  const factors: ApprovalFactor[] = FACTOR_SEEDS.map(seed => ({
    key: seed.key,
    label: seed.label,
    contribution: seed.score(ctx),
    detail: seed.detail(ctx),
  }))

  // Baseline 50 plus the summed factor contributions, clamped to 0-100.
  const approvalScore = Math.max(0, Math.min(100, 50 + factors.reduce((s, f) => s + f.contribution, 0)))

  const decision: ApprovalDecision =
    approvalScore >= 72 ? 'auto_approved'
    : approvalScore <= 28 ? 'auto_declined'
    : 'manual_review'

  const decisionLatencyMs = decision === 'manual_review'
    ? Math.floor(Math.random() * 60) + 20
    : Math.floor(Math.random() * 42) + 8

  return {
    id: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    accountId: `ACC-${Math.floor(Math.random() * 900000 + 100000)}`,
    accountName: ACCOUNT_NAMES[Math.floor(Math.random() * ACCOUNT_NAMES.length)],
    amount,
    method: methods[Math.floor(Math.random() * methods.length)],
    requestedAt: new Date(Date.now() - Math.floor(Math.random() * 240) * 60000),
    decision,
    decisionLatencyMs,
    approvalScore,
    factors: factors.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
    reasoning: buildReasoning(decision, factors, amount, decisionLatencyMs),
    accountAgeDays,
    lifetimeDeposits,
    lifetimeWithdrawals,
    firstWithdrawal,
    kycTier,
    destinationRisk,
  }
}

export function generatePaymentRequests(count: number = 28): PaymentRequest[] {
  return Array.from({ length: count }, () => generatePaymentRequest()).sort(
    (a, b) => b.requestedAt.getTime() - a.requestedAt.getTime()
  )
}

export function summarizePayments(requests: PaymentRequest[]) {
  const auto = requests.filter(r => r.decision === 'auto_approved' || r.decision === 'auto_declined')

  return {
    total: requests.length,
    autoApproved: requests.filter(r => r.decision === 'auto_approved').length,
    autoDeclined: requests.filter(r => r.decision === 'auto_declined').length,
    manualReview: requests.filter(r => r.decision === 'manual_review').length,
    // The headline operational metric for this module.
    automationRate: (auto.length / (requests.length || 1)) * 100,
    avgLatencyMs: requests.reduce((s, r) => s + r.decisionLatencyMs, 0) / (requests.length || 1),
    volumeApproved: requests
      .filter(r => r.decision === 'auto_approved')
      .reduce((s, r) => s + r.amount, 0),
    volumeBlocked: requests
      .filter(r => r.decision === 'auto_declined')
      .reduce((s, r) => s + r.amount, 0),
  }
}
