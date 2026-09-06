// CAREN - Sanctions, PEP and Watchlist Screening
// Fuzzy name matching against restricted-party lists with adjudication support.
// Author: Alisher Beisembekov

export type ListType = 'ofac_sdn' | 'eu_consolidated' | 'un_1267' | 'uk_hmt' | 'pep' | 'adverse_media' | 'internal'
export type MatchDecision = 'pending' | 'true_match' | 'false_positive' | 'escalated'
export type MatchAlgorithm = 'exact' | 'phonetic' | 'levenshtein' | 'token_set' | 'transliteration'

export interface ScreeningHit {
  id: string
  subjectName: string
  subjectId: string
  matchedName: string
  listType: ListType
  listEntryId: string
  score: number
  algorithm: MatchAlgorithm
  decision: MatchDecision
  screenedAt: Date
  latencyMs: number
  discriminators: { field: { en: string; ru: string }; subject: string; listEntry: string; matches: boolean }[]
  aiAssessment: { en: string; ru: string }
  recommendedDecision: Exclude<MatchDecision, 'pending'>
  country: string
  program?: string
}

export const LIST_LABELS: Record<ListType, { en: string; ru: string; authority: string }> = {
  ofac_sdn: { en: 'OFAC SDN', ru: 'OFAC SDN', authority: 'US Treasury' },
  eu_consolidated: { en: 'EU Consolidated', ru: 'Сводный список ЕС', authority: 'European Commission' },
  un_1267: { en: 'UN 1267', ru: 'ООН 1267', authority: 'UN Security Council' },
  uk_hmt: { en: 'UK HMT', ru: 'UK HMT', authority: 'HM Treasury' },
  pep: { en: 'PEP Register', ru: 'Реестр ПДЛ', authority: 'Commercial Provider' },
  adverse_media: { en: 'Adverse Media', ru: 'Негативные публикации', authority: 'Media Screening' },
  internal: { en: 'Internal Blocklist', ru: 'Внутренний стоп-лист', authority: 'CAREN' },
}

export const ALGORITHM_LABELS: Record<MatchAlgorithm, { en: string; ru: string }> = {
  exact: { en: 'Exact match', ru: 'Точное совпадение' },
  phonetic: { en: 'Phonetic (Soundex)', ru: 'Фонетическое (Soundex)' },
  levenshtein: { en: 'Edit distance', ru: 'Расстояние редактирования' },
  token_set: { en: 'Token set ratio', ru: 'Совпадение по токенам' },
  transliteration: { en: 'Transliteration', ru: 'Транслитерация' },
}

export const DECISION_LABELS: Record<MatchDecision, { en: string; ru: string }> = {
  pending: { en: 'Pending Review', ru: 'Ожидает проверки' },
  true_match: { en: 'True Match', ru: 'Истинное совпадение' },
  false_positive: { en: 'False Positive', ru: 'Ложное срабатывание' },
  escalated: { en: 'Escalated', ru: 'Эскалировано' },
}

const SUBJECT_NAMES = [
  'Aleksandr Volkov', 'Maria Santos', 'Chen Wei', 'Ahmed Al-Rashid',
  'Dmitri Petrov', 'Fatima Nasser', 'Viktor Ivanov', 'Elena Kuznetsova',
  'Omar Haddad', 'Li Zhang', 'Sergei Morozov', 'Yusuf Karim',
]

const LIST_NAMES = [
  'Aleksandr VOLKOV', 'Alexander VOLKOFF', 'Maria SANTOS-RIVERA',
  'CHEN Wei Ming', 'Ahmad AL RASHID', 'Dmitriy PETROV',
  'Fatimah NASIR', 'Victor IVANOW', 'Yelena KUZNETSOVA',
  'Umar HADDAD', 'LI Zhang Wei', 'Sergey MOROZOV', 'Yousef KAREEM',
]

const COUNTRIES = ['RU', 'SY', 'IR', 'KP', 'BY', 'MM', 'VE', 'CU', 'AE', 'CN', 'BR', 'ES']

const PROGRAMS = ['UKRAINE-EO14024', 'SDGT', 'NPWMD', 'CYBER2', 'IRAN-HR', 'DPRK3']

/**
 * Discriminators are the fields an analyst actually uses to clear a hit:
 * if the name matches but date of birth and nationality do not, it is noise.
 */
function buildDiscriminators(isTrueMatch: boolean) {
  const dobSubject = `19${60 + Math.floor(Math.random() * 30)}-0${1 + Math.floor(Math.random() * 8)}-1${Math.floor(Math.random() * 9)}`
  const dobList = isTrueMatch
    ? dobSubject
    : `19${60 + Math.floor(Math.random() * 30)}-1${Math.floor(Math.random() * 2)}-0${1 + Math.floor(Math.random() * 8)}`

  const natSubject = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)]
  const natList = isTrueMatch ? natSubject : COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)]

  const passportSubject = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9000000 + 1000000)}`
  const passportList = isTrueMatch ? passportSubject : 'not available'

  return [
    {
      field: { en: 'Date of birth', ru: 'Дата рождения' },
      subject: dobSubject,
      listEntry: dobList,
      matches: dobSubject === dobList,
    },
    {
      field: { en: 'Nationality', ru: 'Гражданство' },
      subject: natSubject,
      listEntry: natList,
      matches: natSubject === natList,
    },
    {
      field: { en: 'Passport / ID', ru: 'Паспорт / ID' },
      subject: passportSubject,
      listEntry: passportList,
      matches: passportSubject === passportList,
    },
  ]
}

function buildAssessment(
  score: number,
  discriminators: ReturnType<typeof buildDiscriminators>,
  isTrueMatch: boolean
): { en: string; ru: string } {
  const matchCount = discriminators.filter(d => d.matches).length

  if (isTrueMatch) {
    return {
      en: `Name similarity of ${score.toFixed(1)}% is corroborated by ${matchCount} of 3 secondary identifiers, including an exact date-of-birth match. Independent agreement across name, birth date and nationality is not a coincidence pattern — recommend treating as a true match and blocking the relationship pending compliance sign-off.`,
      ru: `Сходство имени ${score.toFixed(1)}% подтверждается совпадением ${matchCount} из 3 дополнительных идентификаторов, включая точное совпадение даты рождения. Независимое согласие по имени, дате рождения и гражданству не является случайным совпадением — рекомендуется считать истинным совпадением и блокировать отношения до решения комплаенса.`,
    }
  }

  if (matchCount === 0) {
    return {
      en: `Despite ${score.toFixed(1)}% name similarity, every secondary identifier diverges: different birth year, different nationality, and no passport on the list entry. This is the signature of a common-name collision rather than a genuine hit. Recommend clearing as a false positive with the discriminator evidence attached to the audit record.`,
      ru: `Несмотря на сходство имени ${score.toFixed(1)}%, все дополнительные идентификаторы расходятся: другой год рождения, другое гражданство, паспорт в записи списка отсутствует. Это характерная картина коллизии распространённых имён, а не подлинного совпадения. Рекомендуется закрыть как ложное срабатывание, приложив доказательства расхождений к записи аудита.`,
    }
  }

  return {
    en: `Name similarity of ${score.toFixed(1)}% with ${matchCount} of 3 secondary identifiers agreeing. The evidence is genuinely mixed: enough alignment that clearing it outright would be careless, not enough to justify blocking a customer relationship. Recommend escalation to a level-two reviewer with source-document retrieval.`,
    ru: `Сходство имени ${score.toFixed(1)}% при совпадении ${matchCount} из 3 дополнительных идентификаторов. Свидетельства действительно неоднозначны: совпадений достаточно, чтобы закрывать без проверки было неосмотрительно, но недостаточно, чтобы блокировать отношения с клиентом. Рекомендуется эскалация проверяющему второго уровня с запросом первичных документов.`,
  }
}

export function generateScreeningHit(forceDecision?: MatchDecision): ScreeningHit {
  const lists = Object.keys(LIST_LABELS) as ListType[]
  const algorithms = Object.keys(ALGORITHM_LABELS) as MatchAlgorithm[]

  // Real screening estates are dominated by false positives; mirror that.
  const roll = Math.random()
  const isTrueMatch = roll > 0.86
  const isAmbiguous = !isTrueMatch && roll > 0.62

  const score = isTrueMatch
    ? 92 + Math.random() * 8
    : isAmbiguous
      ? 78 + Math.random() * 12
      : 68 + Math.random() * 14

  const discriminators = buildDiscriminators(isTrueMatch)
  const listType = lists[Math.floor(Math.random() * lists.length)]

  const recommendedDecision: Exclude<MatchDecision, 'pending'> = isTrueMatch
    ? 'true_match'
    : isAmbiguous
      ? 'escalated'
      : 'false_positive'

  return {
    id: `SCR-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    subjectName: SUBJECT_NAMES[Math.floor(Math.random() * SUBJECT_NAMES.length)],
    subjectId: `ACC-${Math.floor(Math.random() * 900000 + 100000)}`,
    matchedName: LIST_NAMES[Math.floor(Math.random() * LIST_NAMES.length)],
    listType,
    listEntryId: `${listType.toUpperCase()}-${Math.floor(Math.random() * 90000 + 10000)}`,
    score,
    algorithm: algorithms[Math.floor(Math.random() * algorithms.length)],
    decision: forceDecision ?? 'pending',
    screenedAt: new Date(Date.now() - Math.floor(Math.random() * 48) * 3600000),
    latencyMs: Math.floor(Math.random() * 280) + 40,
    discriminators,
    aiAssessment: buildAssessment(score, discriminators, isTrueMatch),
    recommendedDecision,
    country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
    program: listType === 'ofac_sdn' ? PROGRAMS[Math.floor(Math.random() * PROGRAMS.length)] : undefined,
  }
}

export function generateScreeningHits(count: number = 30): ScreeningHit[] {
  return Array.from({ length: count }, () => generateScreeningHit()).sort(
    (a, b) => b.score - a.score
  )
}

export function summarizeScreening(hits: ScreeningHit[]) {
  const pending = hits.filter(h => h.decision === 'pending')
  const recommendedFP = hits.filter(h => h.recommendedDecision === 'false_positive')

  return {
    total: hits.length,
    pending: pending.length,
    trueMatches: hits.filter(h => h.recommendedDecision === 'true_match').length,
    falsePositives: recommendedFP.length,
    escalated: hits.filter(h => h.recommendedDecision === 'escalated').length,
    // The headline number: share of the queue AI can clear without a human.
    autoClearablePct: (recommendedFP.length / (hits.length || 1)) * 100,
    avgLatencyMs: hits.reduce((sum, h) => sum + h.latencyMs, 0) / (hits.length || 1),
  }
}
