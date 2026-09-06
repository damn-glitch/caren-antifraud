// CAREN - Suspicious Activity Report Generator
// Drafts the regulatory narrative from case evidence in the structure
// examiners expect: who, what, when, where, why.
// Author: Alisher Beisembekov

export type SARStatus = 'draft' | 'under_review' | 'filed' | 'acknowledged'
export type FilingRegime = 'FinCEN' | 'NCA_UK' | 'FIU_EU' | 'AUSTRAC' | 'MAS_STRO'

export interface SARSection {
  key: string
  title: { en: string; ru: string }
  content: { en: string; ru: string }
  /** Word count contributes to the completeness score examiners look for. */
  wordCount: number
  required: boolean
}

export interface SARDraft {
  id: string
  caseId: string
  subjectName: string
  subjectId: string
  regime: FilingRegime
  status: SARStatus
  createdAt: Date
  deadline: Date
  daysRemaining: number
  totalAmount: number
  transactionCount: number
  suspiciousActivityTypes: { en: string; ru: string }[]
  sections: SARSection[]
  completenessPct: number
  generatedInSeconds: number
  manualEstimateHours: number
}

export const REGIME_META: Record<FilingRegime, { en: string; ru: string; authority: string; deadlineDays: number }> = {
  FinCEN: { en: 'FinCEN (US)', ru: 'FinCEN (США)', authority: 'US Treasury', deadlineDays: 30 },
  NCA_UK: { en: 'NCA (UK)', ru: 'NCA (Великобритания)', authority: 'National Crime Agency', deadlineDays: 0 },
  FIU_EU: { en: 'FIU (EU)', ru: 'ПФР (ЕС)', authority: 'Financial Intelligence Unit', deadlineDays: 30 },
  AUSTRAC: { en: 'AUSTRAC (AU)', ru: 'AUSTRAC (Австралия)', authority: 'AUSTRAC', deadlineDays: 3 },
  MAS_STRO: { en: 'STRO (SG)', ru: 'STRO (Сингапур)', authority: 'Suspicious Transaction Reporting Office', deadlineDays: 15 },
}

export const STATUS_META: Record<SARStatus, { en: string; ru: string; color: string }> = {
  draft: { en: 'Draft', ru: 'Черновик', color: '#64748b' },
  under_review: { en: 'Under review', ru: 'На проверке', color: '#f59e0b' },
  filed: { en: 'Filed', ru: 'Подано', color: '#06b6d4' },
  acknowledged: { en: 'Acknowledged', ru: 'Принято', color: '#10b981' },
}

const SUBJECTS = [
  'M. Rodriguez', 'Meridian Holdings LLC', 'S. Chen', 'Northgate Trading',
  'D. Okafor', 'Apex Digital Ventures', 'L. Petrova', 'Coastal Import Co',
]

const ACTIVITY_TYPES: { en: string; ru: string }[] = [
  { en: 'Structuring', ru: 'Дробление операций' },
  { en: 'Layering', ru: 'Расслоение' },
  { en: 'Account takeover', ru: 'Захват счёта' },
  { en: 'Money mule activity', ru: 'Деятельность дроп-счёта' },
  { en: 'Trade-based laundering', ru: 'Отмывание через торговые операции' },
  { en: 'Circular fund flow', ru: 'Круговое движение средств' },
]

function buildSections(
  subject: string,
  amount: number,
  txCount: number,
  activities: { en: string; ru: string }[]
): SARSection[] {
  const money = `$${amount.toLocaleString()}`
  const activityEn = activities.map(a => a.en.toLowerCase()).join(', ')
  const activityRu = activities.map(a => a.ru.toLowerCase()).join(', ')

  const sections: Omit<SARSection, 'wordCount'>[] = [
    {
      key: 'subject',
      title: { en: 'Subject information', ru: 'Сведения об объекте' },
      required: true,
      content: {
        en: `Subject ${subject} maintains a relationship established 14 months prior to the reported activity. Identification was verified to tier-3 standard at onboarding, with a government-issued document and address confirmation on file. The account was designated retail at opening and its declared purpose was personal banking. Declared occupation and stated income are inconsistent with the volume described below, and no source-of-funds documentation supports the change.`,
        ru: `Объект ${subject} состоит в отношениях с организацией, установленных за 14 месяцев до описываемой деятельности. При приёме на обслуживание идентификация подтверждена по третьему уровню: имеются государственный документ и подтверждение адреса. При открытии счёт отнесён к розничному сегменту, заявленная цель — личное банковское обслуживание. Заявленный род занятий и указанный доход не согласуются с объёмом операций, описанным ниже, и документы о происхождении средств отсутствуют.`,
      },
    },
    {
      key: 'activity',
      title: { en: 'Suspicious activity description', ru: 'Описание подозрительной деятельности' },
      required: true,
      content: {
        en: `Between the dates stated below, ${txCount} transactions totalling ${money} passed through the account in a pattern consistent with ${activityEn}. Individual transfer amounts clustered narrowly beneath the institution's manual-review threshold, with no single transaction exceeding it. Funds arriving in the account were forwarded to third parties within a median dwell time of eleven minutes, leaving no discernible economic purpose for the deposits themselves. Nine beneficiary accounts received funds; all nine were added to the account profile within the same 48-hour window in which the transfers occurred.`,
        ru: `В указанный ниже период через счёт прошли ${txCount} операций на общую сумму ${money} по схеме, соответствующей таким признакам, как ${activityRu}. Суммы отдельных переводов узко группировались чуть ниже установленного организацией порога ручной проверки, при этом ни одна операция его не превысила. Средства, поступавшие на счёт, направлялись третьим лицам с медианным временем удержания одиннадцать минут, что не оставляет различимой экономической цели у самих поступлений. Средства получили девять счетов-бенефициаров; все девять были добавлены в профиль счёта в том же 48-часовом окне, в котором совершались переводы.`,
      },
    },
    {
      key: 'basis',
      title: { en: 'Basis for suspicion', ru: 'Основания для подозрения' },
      required: true,
      content: {
        en: `The institution's transaction monitoring identified the pattern through automated detection. Suspicion rests on four independent observations rather than a single alert. First, transaction sizing beneath the reporting threshold occurred consistently across all ${txCount} transactions, a distribution that does not arise from ordinary commercial activity. Second, the device used to authorise the transfers is shared with six unrelated customer accounts. Third, contact details on the account were altered three hours before the first transfer, without the step-up verification the control framework requires. Fourth, funds ultimately returned to an account under common control, completing a circular flow with a net position change below three percent.`,
        ru: `Схема выявлена системой мониторинга операций организации в автоматическом режиме. Подозрение основано на четырёх независимых наблюдениях, а не на единичном оповещении. Во-первых, во всех ${txCount} операциях суммы последовательно устанавливались ниже порога отчётности — такое распределение не возникает при обычной коммерческой деятельности. Во-вторых, устройство, с которого авторизованы переводы, используется ещё шестью не связанными между собой клиентскими счетами. В-третьих, контактные данные счёта были изменены за три часа до первого перевода без усиленной проверки, предусмотренной системой контроля. В-четвёртых, средства в итоге вернулись на счёт под общим контролем, замкнув круговой поток с изменением чистой позиции менее трёх процентов.`,
      },
    },
    {
      key: 'timeline',
      title: { en: 'Chronology', ru: 'Хронология' },
      required: true,
      content: {
        en: `Day 1: new device enrolled without step-up verification. Day 1 +20 minutes: registered email and telephone number both replaced. Day 1 +3 hours: first transfer executed to a beneficiary created the same day. Days 1–3: remaining transfers executed, each sized beneath the review threshold. Day 3: funds traced returning to an account sharing beneficial ownership with the originator. Day 4: automated monitoring escalated the pattern and outbound transfers were suspended.`,
        ru: `День 1: зарегистрировано новое устройство без усиленной проверки. День 1 +20 минут: заменены зарегистрированные email и номер телефона. День 1 +3 часа: выполнен первый перевод получателю, созданному в тот же день. Дни 1–3: выполнены остальные переводы, каждый на сумму ниже порога проверки. День 3: прослежено возвращение средств на счёт, имеющий общего бенефициарного владельца с отправителем. День 4: система мониторинга эскалировала схему, исходящие переводы приостановлены.`,
      },
    },
    {
      key: 'action',
      title: { en: 'Institution action taken', ru: 'Принятые организацией меры' },
      required: true,
      content: {
        en: `Outbound transfers were suspended pending the outcome of this report. The customer relationship remains open and the customer has not been notified, consistent with tipping-off prohibitions. Supporting records — transaction logs, device telemetry, authentication events and the beneficiary list — have been retained and are available to the receiving authority on request. Related accounts sharing the identified device fingerprint have been placed under enhanced monitoring.`,
        ru: `Исходящие переводы приостановлены до получения результата по настоящему сообщению. Отношения с клиентом сохраняются, клиент не уведомлён в соответствии с запретом на разглашение. Подтверждающие материалы — журналы операций, телеметрия устройств, события аутентификации и перечень получателей — сохранены и предоставляются принимающему органу по запросу. Связанные счета с выявленным отпечатком устройства поставлены на усиленный мониторинг.`,
      },
    },
  ]

  return sections.map(s => ({
    ...s,
    wordCount: s.content.en.split(/\s+/).length,
  }))
}

export function generateSARDraft(): SARDraft {
  const regimes = Object.keys(REGIME_META) as FilingRegime[]
  const regime = regimes[Math.floor(Math.random() * regimes.length)]
  const deadlineDays = REGIME_META[regime].deadlineDays || 30

  const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]
  const totalAmount = Math.floor(Math.random() * 480000) + 24000
  const transactionCount = Math.floor(Math.random() * 40) + 9

  const pool = [...ACTIVITY_TYPES]
  const activityCount = Math.floor(Math.random() * 2) + 2
  const suspiciousActivityTypes = Array.from({ length: activityCount }, () =>
    pool.splice(Math.floor(Math.random() * pool.length), 1)[0]
  ).filter(Boolean)

  const sections = buildSections(subject, totalAmount, transactionCount, suspiciousActivityTypes)
  const createdAt = new Date(Date.now() - Math.floor(Math.random() * 12) * 86400000)
  const deadline = new Date(createdAt.getTime() + deadlineDays * 86400000)

  const statuses: SARStatus[] = ['draft', 'draft', 'under_review', 'filed', 'acknowledged']

  return {
    id: `SAR-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    caseId: `CASE-${Math.floor(Math.random() * 9000 + 1000)}`,
    subjectName: subject,
    subjectId: `ACC-${Math.floor(Math.random() * 900000 + 100000)}`,
    regime,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    createdAt,
    deadline,
    daysRemaining: Math.round((deadline.getTime() - Date.now()) / 86400000),
    totalAmount,
    transactionCount,
    suspiciousActivityTypes,
    sections,
    // Every required section is populated by the generator.
    completenessPct: 100,
    generatedInSeconds: 18 + Math.random() * 14,
    manualEstimateHours: 3 + Math.random() * 3,
  }
}

export function generateSARDrafts(count: number = 10): SARDraft[] {
  return Array.from({ length: count }, () => generateSARDraft()).sort(
    (a, b) => a.daysRemaining - b.daysRemaining
  )
}

export function summarizeSAR(drafts: SARDraft[]) {
  return {
    total: drafts.length,
    draft: drafts.filter(d => d.status === 'draft').length,
    filed: drafts.filter(d => d.status === 'filed' || d.status === 'acknowledged').length,
    // Anything inside a week needs a compliance officer looking at it today.
    dueWithin7Days: drafts.filter(d => d.daysRemaining <= 7 && d.status === 'draft').length,
    overdue: drafts.filter(d => d.daysRemaining < 0 && d.status === 'draft').length,
    totalReported: drafts.reduce((sum, d) => sum + d.totalAmount, 0),
    hoursSaved: drafts.reduce((sum, d) => sum + d.manualEstimateHours, 0),
  }
}
