// CAREN - Investigation Copilot
// Assembles a complete, defensible case file: verdict, evidence, timeline, actions.
// Author: Alisher Beisembekov

export type Verdict = 'confirmed_fraud' | 'likely_fraud' | 'suspicious' | 'likely_legitimate'

export interface EvidenceItem {
  id: string
  category: 'device' | 'geo' | 'behavioral' | 'network' | 'transactional' | 'identity'
  titleEn: string
  titleRu: string
  detailEn: string
  detailRu: string
  strength: number
  source: string
}

export interface TimelineEvent {
  id: string
  offsetLabel: string
  timestamp: Date
  titleEn: string
  titleRu: string
  detailEn: string
  detailRu: string
  severity: 'info' | 'warning' | 'critical'
}

export interface RecommendedAction {
  id: string
  labelEn: string
  labelRu: string
  rationaleEn: string
  rationaleRu: string
  urgency: 'immediate' | 'today' | 'this_week'
}

export interface CaseFile {
  id: string
  subjectId: string
  subjectName: string
  verdict: Verdict
  confidence: number
  exposure: number
  summaryEn: string
  summaryRu: string
  keyFindingsEn: string[]
  keyFindingsRu: string[]
  evidence: EvidenceItem[]
  timeline: TimelineEvent[]
  actions: RecommendedAction[]
  relatedAccounts: { id: string; name: string; linkEn: string; linkRu: string; risk: number }[]
  generatedInSeconds: number
  manualEstimateMinutes: number
  createdAt: Date
}

export const VERDICT_META: Record<
  Verdict,
  { en: string; ru: string; color: string; badge: 'critical' | 'destructive' | 'warning' | 'success' }
> = {
  confirmed_fraud: { en: 'Confirmed Fraud', ru: 'Мошенничество подтверждено', color: '#ef4444', badge: 'critical' },
  likely_fraud: { en: 'Likely Fraud', ru: 'Вероятное мошенничество', color: '#f97316', badge: 'destructive' },
  suspicious: { en: 'Suspicious', ru: 'Подозрительно', color: '#f59e0b', badge: 'warning' },
  likely_legitimate: { en: 'Likely Legitimate', ru: 'Вероятно легитимно', color: '#10b981', badge: 'success' },
}

const EVIDENCE_POOL: Omit<EvidenceItem, 'id'>[] = [
  {
    category: 'device',
    titleEn: 'Device fingerprint reused across flagged accounts',
    titleRu: 'Отпечаток устройства повторяется на помеченных счетах',
    detailEn: 'Fingerprint DEV-8A3F21 authenticated 6 distinct accounts in 11 days, 4 of which are already under investigation.',
    detailRu: 'Отпечаток DEV-8A3F21 использовался для входа в 6 разных счетов за 11 дней, 4 из которых уже расследуются.',
    strength: 0.94,
    source: 'Device Intelligence',
  },
  {
    category: 'geo',
    titleEn: 'Impossible travel velocity',
    titleRu: 'Невозможная скорость перемещения',
    detailEn: 'Authenticated from Warsaw at 14:02 and from Dubai at 14:44 — a physically impossible transition.',
    detailRu: 'Вход из Варшавы в 14:02 и из Дубая в 14:44 — физически невозможный переход.',
    strength: 0.91,
    source: 'Geo Analytics',
  },
  {
    category: 'behavioral',
    titleEn: 'Behavioural profile break',
    titleRu: 'Разрыв поведенческого профиля',
    detailEn: 'Average transaction value rose 840% and night-hour activity rose from 4% to 61% of volume.',
    detailRu: 'Средняя сумма операции выросла на 840%, ночная активность — с 4% до 61% объёма.',
    strength: 0.88,
    source: 'Behavioral Engine',
  },
  {
    category: 'network',
    titleEn: 'IP linked to known fraud infrastructure',
    titleRu: 'IP связан с известной фрод-инфраструктурой',
    detailEn: 'Session IP 185.220.101.44 belongs to a hosting range previously tied to 3 dismantled rings.',
    detailRu: 'IP сессии 185.220.101.44 принадлежит хостинг-диапазону, ранее связанному с 3 ликвидированными сетями.',
    strength: 0.86,
    source: 'Network Threat Feed',
  },
  {
    category: 'transactional',
    titleEn: 'Fan-out withdrawal pattern',
    titleRu: 'Веерная схема вывода средств',
    detailEn: 'Inbound balance dispersed to 9 new beneficiaries within 22 minutes, each below the review threshold.',
    detailRu: 'Поступивший баланс распределён 9 новым получателям за 22 минуты, каждая сумма ниже порога проверки.',
    strength: 0.92,
    source: 'Transaction Graph',
  },
  {
    category: 'identity',
    titleEn: 'Credential change preceding activity',
    titleRu: 'Смена учётных данных перед активностью',
    detailEn: 'Phone number and email replaced 3 hours before the first high-value transfer; no step-up challenge was triggered.',
    detailRu: 'Телефон и email заменены за 3 часа до первого крупного перевода; усиленная проверка не сработала.',
    strength: 0.89,
    source: 'Identity Service',
  },
  {
    category: 'transactional',
    titleEn: 'Card testing sequence detected',
    titleRu: 'Обнаружена последовательность перебора карт',
    detailEn: '47 low-value authorisations across 14 merchants in 9 minutes, 41 of which declined.',
    detailRu: '47 мелких авторизаций у 14 продавцов за 9 минут, 41 из которых отклонена.',
    strength: 0.95,
    source: 'Transaction Graph',
  },
  {
    category: 'network',
    titleEn: 'Shared card BIN across cluster',
    titleRu: 'Общий BIN карты в кластере',
    detailEn: 'BIN 457173 issued to 18 accounts registered within the same 72-hour window.',
    detailRu: 'BIN 457173 выдан 18 счетам, зарегистрированным в одном 72-часовом окне.',
    strength: 0.83,
    source: 'Card Intelligence',
  },
]

const SUBJECT_NAMES = [
  'M. Rodriguez', 'S. Chen', 'D. Okafor', 'L. Petrova', 'J. Almeida',
  'Meridian Holdings LLC', 'Northgate Trading', 'K. Yamamoto', 'R. Volkov',
]

const RELATION_LABELS: { en: string; ru: string }[] = [
  { en: 'Shared device fingerprint', ru: 'Общий отпечаток устройства' },
  { en: 'Received funds within 10 minutes', ru: 'Получил средства в течение 10 минут' },
  { en: 'Same registration IP', ru: 'Тот же IP регистрации' },
  { en: 'Card issued from the same BIN', ru: 'Карта выпущена с того же BIN' },
  { en: 'Referred by the same affiliate', ru: 'Привлечён тем же аффилиатом' },
  { en: 'Matching beneficial owner', ru: 'Совпадающий бенефициарный владелец' },
]

function pickEvidence(count: number): EvidenceItem[] {
  const pool = [...EVIDENCE_POOL]
  const picked: EvidenceItem[] = []
  for (let i = 0; i < count && pool.length > 0; i++) {
    const item = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]
    picked.push({ ...item, id: `EV-${i}-${Math.random().toString(36).slice(2, 7)}` })
  }
  return picked.sort((a, b) => b.strength - a.strength)
}

function buildTimeline(): TimelineEvent[] {
  const now = Date.now()
  const raw: Omit<TimelineEvent, 'id' | 'timestamp' | 'offsetLabel'>[] = [
    {
      titleEn: 'New device enrolled',
      titleRu: 'Зарегистрировано новое устройство',
      detailEn: 'Unrecognised Android device added without step-up verification.',
      detailRu: 'Неизвестное Android-устройство добавлено без усиленной проверки.',
      severity: 'warning',
    },
    {
      titleEn: 'Contact details changed',
      titleRu: 'Изменены контактные данные',
      detailEn: 'Registered phone and recovery email both replaced within 4 minutes.',
      detailRu: 'Зарегистрированный телефон и резервный email заменены за 4 минуты.',
      severity: 'warning',
    },
    {
      titleEn: 'Session from flagged IP range',
      titleRu: 'Сессия из помеченного IP-диапазона',
      detailEn: 'Login originated from hosting infrastructure tied to prior fraud rings.',
      detailRu: 'Вход выполнен из хостинг-инфраструктуры, связанной с прошлыми фрод-сетями.',
      severity: 'critical',
    },
    {
      titleEn: 'Card testing burst',
      titleRu: 'Всплеск перебора карт',
      detailEn: '47 authorisations across 14 merchants; 41 declined by issuer.',
      detailRu: '47 авторизаций у 14 продавцов; 41 отклонена эмитентом.',
      severity: 'critical',
    },
    {
      titleEn: 'First high-value transfer',
      titleRu: 'Первый крупный перевод',
      detailEn: 'Transfer of $18,400 to a beneficiary created the same day.',
      detailRu: 'Перевод $18 400 получателю, созданному в тот же день.',
      severity: 'critical',
    },
    {
      titleEn: 'Fan-out dispersal',
      titleRu: 'Веерное распределение',
      detailEn: 'Balance split across 9 beneficiaries, each below the manual review threshold.',
      detailRu: 'Баланс разделён между 9 получателями, каждая сумма ниже порога ручной проверки.',
      severity: 'critical',
    },
    {
      titleEn: 'CAREN auto-block engaged',
      titleRu: 'Сработала автоблокировка CAREN',
      detailEn: 'Ensemble score crossed 0.94; outbound transfers halted pending review.',
      detailRu: 'Оценка ансамбля превысила 0,94; исходящие переводы остановлены до проверки.',
      severity: 'info',
    },
  ]

  // Events are spaced backwards from now so the newest sits at the bottom.
  const spacingMinutes = [2880, 1440, 720, 240, 180, 90, 15]
  return raw.map((event, i) => {
    const minutesAgo = spacingMinutes[i] ?? 10
    const hours = Math.floor(minutesAgo / 60)
    return {
      ...event,
      id: `TL-${i}`,
      timestamp: new Date(now - minutesAgo * 60000),
      offsetLabel: hours >= 24 ? `T-${Math.floor(hours / 24)}d` : hours >= 1 ? `T-${hours}h` : `T-${minutesAgo}m`,
    }
  })
}

function buildActions(verdict: Verdict): RecommendedAction[] {
  const base: RecommendedAction[] = [
    {
      id: 'ACT-freeze',
      labelEn: 'Freeze outbound transfers',
      labelRu: 'Заморозить исходящие переводы',
      rationaleEn: 'Dispersal is still in progress; freezing preserves recoverable balance.',
      rationaleRu: 'Распределение средств продолжается; заморозка сохраняет возвратный остаток.',
      urgency: 'immediate',
    },
    {
      id: 'ACT-sar',
      labelEn: 'File Suspicious Activity Report',
      labelRu: 'Подать сообщение о подозрительной операции',
      rationaleEn: 'Pattern meets the reporting standard under FATF R.10; the 30-day clock starts now.',
      rationaleRu: 'Схема соответствует критериям отчётности FATF R.10; 30-дневный срок начинается сейчас.',
      urgency: 'today',
    },
    {
      id: 'ACT-stepup',
      labelEn: 'Require step-up authentication',
      labelRu: 'Потребовать усиленную аутентификацию',
      rationaleEn: 'Credential changes went unchallenged — re-verify ownership before any release.',
      rationaleRu: 'Смена учётных данных прошла без проверки — подтвердите владение до разблокировки.',
      urgency: 'immediate',
    },
    {
      id: 'ACT-expand',
      labelEn: 'Expand investigation to linked accounts',
      labelRu: 'Расширить расследование на связанные счета',
      rationaleEn: 'Six accounts share the same device fingerprint and remain unreviewed.',
      rationaleRu: 'Шесть счетов имеют тот же отпечаток устройства и ещё не проверены.',
      urgency: 'today',
    },
    {
      id: 'ACT-contact',
      labelEn: 'Contact customer on verified channel',
      labelRu: 'Связаться с клиентом по проверенному каналу',
      rationaleEn: 'Use the pre-change phone number on file, not the newly registered one.',
      rationaleRu: 'Использовать номер телефона до изменения, а не вновь зарегистрированный.',
      urgency: 'today',
    },
    {
      id: 'ACT-monitor',
      labelEn: 'Place account under enhanced monitoring',
      labelRu: 'Поставить счёт на усиленный мониторинг',
      rationaleEn: 'Signals are elevated but not conclusive; a 30-day watch resolves the ambiguity.',
      rationaleRu: 'Сигналы повышены, но не окончательны; 30-дневное наблюдение снимет неопределённость.',
      urgency: 'this_week',
    },
  ]

  if (verdict === 'likely_legitimate') {
    return [base[5], base[4]]
  }
  if (verdict === 'suspicious') {
    return [base[2], base[5], base[4]]
  }
  return base.slice(0, 5)
}

function buildSummary(
  verdict: Verdict,
  name: string,
  exposure: number,
  evidenceCount: number
): { en: string; ru: string } {
  const money = `$${exposure.toLocaleString()}`

  if (verdict === 'likely_legitimate') {
    return {
      en: `Account ${name} triggered ${evidenceCount} correlated signals, but each resolves to a documented customer action. A travel notice explains the geographic spread, and the amount increase matches a declared salary change. Residual exposure of ${money} is within normal limits for this segment. Recommend closing with a 30-day monitoring tag rather than customer contact.`,
      ru: `Счёт ${name} вызвал ${evidenceCount} коррелированных сигнала, однако каждый объясняется задокументированным действием клиента. Уведомление о поездке объясняет географический разброс, а рост сумм совпадает с заявленным изменением зарплаты. Остаточный риск-объём ${money} находится в пределах нормы для сегмента. Рекомендуется закрыть кейс с 30-дневной меткой наблюдения без обращения к клиенту.`,
    }
  }

  if (verdict === 'suspicious') {
    return {
      en: `Account ${name} shows ${evidenceCount} independent risk signals that individually stay under action thresholds but converge on a coherent narrative. Behaviour departed from its own baseline nine days ago and has not returned. Exposure currently stands at ${money}. The evidence supports enhanced monitoring and step-up authentication, but does not yet meet the bar for account restriction.`,
      ru: `Счёт ${name} демонстрирует ${evidenceCount} независимых риск-сигнала, каждый из которых по отдельности не достигает порога действия, но вместе они складываются в связную картину. Поведение отклонилось от собственной базы девять дней назад и не вернулось к норме. Текущий риск-объём — ${money}. Доказательства обосновывают усиленный мониторинг и дополнительную аутентификацию, но пока недостаточны для ограничения счёта.`,
    }
  }

  const strengthEn = verdict === 'confirmed_fraud' ? 'conclusive' : 'strong'
  const strengthRu = verdict === 'confirmed_fraud' ? 'исчерпывающими' : 'весомыми'

  return {
    en: `Account ${name} presents ${evidenceCount} ${strengthEn} indicators of an account takeover progressing to fund dispersal. Contact details were replaced without a step-up challenge, followed within hours by a card-testing burst and a fan-out of ${money} across nine newly created beneficiaries — each deliberately sized below the manual review threshold. The device fingerprint is shared with six other accounts, four already under investigation, indicating this is one node of a larger ring rather than an isolated compromise. Immediate freeze and SAR filing are warranted.`,
    ru: `Счёт ${name} демонстрирует ${evidenceCount} ${strengthRu} признаков захвата счёта с последующим распылением средств. Контактные данные были заменены без усиленной проверки, а спустя часы последовали всплеск перебора карт и веерное распределение ${money} между девятью новыми получателями — каждая сумма намеренно ниже порога ручной проверки. Отпечаток устройства совпадает с шестью другими счетами, четыре из которых уже расследуются, что указывает на узел более крупной сети, а не изолированную компрометацию. Обоснованы немедленная заморозка и подача сообщения о подозрительной операции.`,
  }
}

function buildFindings(verdict: Verdict): { en: string[]; ru: string[] } {
  if (verdict === 'likely_legitimate') {
    return {
      en: [
        'All geographic anomalies are covered by a filed travel notice',
        'Amount increase corresponds to a verified income change',
        'Device and IP remain consistent with 90-day history',
        'No linkage to any account under active investigation',
      ],
      ru: [
        'Все географические аномалии покрыты поданным уведомлением о поездке',
        'Рост сумм соответствует подтверждённому изменению дохода',
        'Устройство и IP согласуются с 90-дневной историей',
        'Связи со счетами в активном расследовании отсутствуют',
      ],
    }
  }

  return {
    en: [
      'Credential change preceded the first transfer by 3 hours with no step-up challenge',
      'Card-testing burst: 47 authorisations across 14 merchants, 41 declined',
      'Funds dispersed to 9 beneficiaries, every amount below the review threshold',
      'Device fingerprint shared with 6 accounts — 4 already under investigation',
      'Session IP belongs to infrastructure tied to 3 previously dismantled rings',
    ],
    ru: [
      'Смена учётных данных за 3 часа до первого перевода без усиленной проверки',
      'Всплеск перебора карт: 47 авторизаций у 14 продавцов, 41 отклонена',
      'Средства распределены 9 получателям, каждая сумма ниже порога проверки',
      'Отпечаток устройства совпадает с 6 счетами — 4 уже расследуются',
      'IP сессии принадлежит инфраструктуре, связанной с 3 ликвидированными сетями',
    ],
  }
}

/** Generate a complete case file. */
export function generateCaseFile(forceVerdict?: Verdict): CaseFile {
  const verdicts: Verdict[] = ['confirmed_fraud', 'likely_fraud', 'likely_fraud', 'suspicious', 'likely_legitimate']
  const verdict = forceVerdict ?? verdicts[Math.floor(Math.random() * verdicts.length)]

  const evidenceCount = verdict === 'likely_legitimate' ? 3 : Math.floor(Math.random() * 3) + 5
  const evidence = pickEvidence(evidenceCount)
  const exposure = Math.floor(Math.random() * 180000) + 12000
  const name = SUBJECT_NAMES[Math.floor(Math.random() * SUBJECT_NAMES.length)]

  const summary = buildSummary(verdict, name, exposure, evidenceCount)
  const findings = buildFindings(verdict)

  const confidenceByVerdict: Record<Verdict, number> = {
    confirmed_fraud: 0.96,
    likely_fraud: 0.88,
    suspicious: 0.71,
    likely_legitimate: 0.82,
  }

  return {
    id: `CF-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    subjectId: `ACC-${Math.floor(Math.random() * 900000 + 100000)}`,
    subjectName: name,
    verdict,
    confidence: confidenceByVerdict[verdict] + (Math.random() - 0.5) * 0.05,
    exposure,
    summaryEn: summary.en,
    summaryRu: summary.ru,
    keyFindingsEn: findings.en,
    keyFindingsRu: findings.ru,
    evidence,
    timeline: buildTimeline(),
    actions: buildActions(verdict),
    relatedAccounts: Array.from({ length: Math.floor(Math.random() * 4) + 3 }, (_, i) => {
      const rel = RELATION_LABELS[i % RELATION_LABELS.length]
      return {
        id: `ACC-${Math.floor(Math.random() * 900000 + 100000)}`,
        name: SUBJECT_NAMES[(i + 2) % SUBJECT_NAMES.length],
        linkEn: rel.en,
        linkRu: rel.ru,
        risk: 40 + Math.random() * 58,
      }
    }),
    generatedInSeconds: 22 + Math.random() * 12,
    manualEstimateMinutes: 180 + Math.floor(Math.random() * 120),
    createdAt: new Date(),
  }
}

/** Progress stages shown while the copilot "thinks". */
export const INVESTIGATION_STAGES: { key: string; en: string; ru: string; ms: number }[] = [
  { key: 'history', en: 'Analyzing transaction history...', ru: 'Анализ истории транзакций...', ms: 900 },
  { key: 'timeline', en: 'Building event timeline...', ru: 'Построение хронологии событий...', ms: 800 },
  { key: 'correlate', en: 'Correlating related accounts...', ru: 'Корреляция связанных счетов...', ms: 900 },
  { key: 'evidence', en: 'Assembling evidence chain...', ru: 'Сборка цепочки доказательств...', ms: 700 },
  { key: 'summary', en: 'Generating case summary...', ru: 'Формирование сводки по делу...', ms: 800 },
]
