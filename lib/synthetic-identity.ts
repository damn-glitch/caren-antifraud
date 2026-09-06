// CAREN - Synthetic Identity Detection
// Finds fabricated identities assembled from real and invented fragments —
// the fraud type that passes KYC because no single victim reports it.
// Author: Alisher Beisembekov

export type SyntheticSignal =
  | 'thin_file'
  | 'ssn_age_mismatch'
  | 'credit_ramp'
  | 'address_cluster'
  | 'shared_phone'
  | 'authorized_user_piggyback'
  | 'no_digital_footprint'
  | 'velocity_applications'
  | 'document_template_reuse'

export interface SyntheticIdentity {
  id: string
  applicantName: string
  accountId: string
  syntheticScore: number
  verdict: 'confirmed_synthetic' | 'probable_synthetic' | 'inconclusive' | 'likely_genuine'
  signals: SyntheticSignal[]
  fileAgeMonths: number
  creditLimitGrowth: number
  linkedApplications: number
  clusterId?: string
  clusterSize?: number
  narrative: { en: string; ru: string }
  detectedAt: Date
  estimatedLoss: number
}

export const SIGNAL_META: Record<
  SyntheticSignal,
  { en: string; ru: string; descEn: string; descRu: string; weight: number }
> = {
  thin_file: {
    en: 'Thin credit file',
    ru: 'Тонкое кредитное досье',
    descEn: 'Credit history shorter than 24 months despite an applicant age above 30.',
    descRu: 'Кредитная история короче 24 месяцев при возрасте заявителя старше 30 лет.',
    weight: 0.14,
  },
  ssn_age_mismatch: {
    en: 'Identifier issued after claimed birth year',
    ru: 'Идентификатор выдан позже заявленного года рождения',
    descEn: 'National identifier issuance date is inconsistent with the declared date of birth.',
    descRu: 'Дата выдачи национального идентификатора не согласуется с заявленной датой рождения.',
    weight: 0.22,
  },
  credit_ramp: {
    en: 'Rapid credit build-up',
    ru: 'Быстрое наращивание кредита',
    descEn: 'Credit limits grew faster than legitimate accounts of the same file age.',
    descRu: 'Кредитные лимиты росли быстрее, чем у добросовестных счетов того же возраста досье.',
    weight: 0.18,
  },
  address_cluster: {
    en: 'Address shared across applicants',
    ru: 'Адрес общий для нескольких заявителей',
    descEn: 'Residential address links multiple unrelated applications within a short window.',
    descRu: 'Адрес проживания связывает несколько несвязанных заявок в коротком окне.',
    weight: 0.16,
  },
  shared_phone: {
    en: 'Phone reused across identities',
    ru: 'Телефон повторяется у разных личностей',
    descEn: 'Contact number appears on applications with different names and birth dates.',
    descRu: 'Контактный номер встречается в заявках с разными именами и датами рождения.',
    weight: 0.15,
  },
  authorized_user_piggyback: {
    en: 'Authorised-user piggybacking',
    ru: 'Пиггибекинг через авторизованного пользователя',
    descEn: 'Identity was added as an authorised user on aged accounts to inherit their history.',
    descRu: 'Личность добавлена авторизованным пользователем к старым счетам, чтобы унаследовать их историю.',
    weight: 0.13,
  },
  no_digital_footprint: {
    en: 'No digital footprint',
    ru: 'Отсутствие цифрового следа',
    descEn: 'No email history, social presence or device history predating the application.',
    descRu: 'Нет истории email, присутствия в сети или истории устройства до подачи заявки.',
    weight: 0.12,
  },
  velocity_applications: {
    en: 'Application velocity',
    ru: 'Скорость подачи заявок',
    descEn: 'Multiple credit applications submitted across institutions within days.',
    descRu: 'Несколько кредитных заявок поданы в разные организации в течение нескольких дней.',
    weight: 0.17,
  },
  document_template_reuse: {
    en: 'Document template reuse',
    ru: 'Повторное использование шаблона документа',
    descEn: 'Uploaded identity document shares pixel-level artefacts with other submissions.',
    descRu: 'Загруженный документ содержит пиксельные артефакты, общие с другими заявками.',
    weight: 0.24,
  },
}

const APPLICANT_NAMES = [
  'Jordan Ellis', 'Casey Morgan', 'Riley Bennett', 'Avery Sinclair',
  'Quinn Harper', 'Rowan Fletcher', 'Sage Whitmore', 'Emery Caldwell',
  'Blake Thornton', 'Devon Ashby', 'Harper Lang', 'Skyler Reyes',
]

function buildNarrative(
  signals: SyntheticSignal[],
  score: number,
  clusterSize: number | undefined,
  fileAge: number
): { en: string; ru: string } {
  const hasDoc = signals.includes('document_template_reuse')
  const hasCluster = clusterSize !== undefined && clusterSize > 1

  if (score < 35) {
    return {
      en: `This profile behaves like a genuine thin-file applicant. The ${fileAge}-month credit history is short, but it is accompanied by a consistent digital footprint, a unique address and no application-velocity pattern. Short history alone is a poverty signal far more often than a fraud signal, and treating it as suspicious is how institutions lock out legitimate young or immigrant customers.`,
      ru: `Профиль ведёт себя как добросовестный заявитель с тонким досье. Кредитная история в ${fileAge} мес. коротка, но сопровождается устойчивым цифровым следом, уникальным адресом и отсутствием всплеска заявок. Короткая история сама по себе гораздо чаще указывает на низкий доход, чем на мошенничество, и трактовка её как подозрительной — типичная причина отказов добросовестным молодым клиентам и мигрантам.`,
    }
  }

  if (score < 60) {
    return {
      en: `Several markers overlap, but none is conclusive. The file is ${fileAge} months old with credit limits that grew faster than peer accounts, and the digital footprint starts abruptly at application time. That combination fits a synthetic build — and it equally fits someone who recently arrived in the country and opened everything at once. Recommend document re-verification before any adverse action.`,
      ru: `Несколько маркеров пересекаются, но ни один не является решающим. Досье возрастом ${fileAge} мес. с лимитами, росшими быстрее, чем у сопоставимых счетов, и цифровой след начинается резко в момент подачи заявки. Такая комбинация соответствует построению синтетической личности — и в равной мере соответствует человеку, недавно приехавшему в страну и открывшему всё сразу. Рекомендуется повторная проверка документов до любых неблагоприятных действий.`,
    }
  }

  const clusterLine = hasCluster
    ? {
        en: ` The identity also sits inside a cluster of ${clusterSize} applications sharing an address and phone pattern, which moves this from an individual case to an organised one.`,
        ru: ` Личность также входит в кластер из ${clusterSize} заявок с общим адресом и схемой телефонов, что переводит случай из индивидуального в организованный.`,
      }
    : { en: '', ru: '' }

  const docLine = hasDoc
    ? {
        en: ` The submitted identity document carries pixel-level compression artefacts identical to other applications, indicating a shared forgery template rather than independent fabrication.`,
        ru: ` Представленный документ содержит пиксельные артефакты сжатия, идентичные другим заявкам, что указывает на общий шаблон подделки, а не на независимое изготовление.`,
      }
    : { en: '', ru: '' }

  return {
    en: `This is a constructed identity rather than a compromised one. The national identifier's issuance window post-dates the declared birth year — an inconsistency that cannot arise from clerical error. Credit limits climbed ${(Math.random() * 400 + 200).toFixed(0)}% in ${fileAge} months while no pre-application digital footprint exists at all.${docLine.en}${clusterLine.en}\n\nThe practical consequence is that there is no victim to notify: nobody's identity was stolen, so nobody will report it. Losses surface only at bust-out, which is why these accounts should be flagged before the limit is fully drawn.`,
    ru: `Это сконструированная личность, а не скомпрометированная. Окно выдачи национального идентификатора приходится на период позже заявленного года рождения — несоответствие, которое не может возникнуть из-за канцелярской ошибки. Кредитные лимиты выросли на ${(Math.random() * 400 + 200).toFixed(0)}% за ${fileAge} мес., при этом цифровой след до подачи заявки отсутствует полностью.${docLine.ru}${clusterLine.ru}\n\nПрактическое следствие: уведомлять некого — ничья личность не была украдена, поэтому никто не заявит о краже. Убытки проявляются только в момент вывода средств, поэтому такие счета следует помечать до полной выборки лимита.`,
  }
}

export function generateSyntheticIdentity(): SyntheticIdentity {
  const allSignals = Object.keys(SIGNAL_META) as SyntheticSignal[]
  const signalCount = Math.floor(Math.random() * 5) + 2

  const pool = [...allSignals]
  const signals: SyntheticSignal[] = []
  for (let i = 0; i < signalCount; i++) {
    signals.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
  }

  // Score is the weighted sum of fired signals, normalised to 0-100.
  const rawScore = signals.reduce((sum, s) => sum + SIGNAL_META[s].weight, 0)
  const syntheticScore = Math.min(99, rawScore * 100 * (0.85 + Math.random() * 0.4))

  const verdict: SyntheticIdentity['verdict'] =
    syntheticScore > 78 ? 'confirmed_synthetic'
    : syntheticScore > 58 ? 'probable_synthetic'
    : syntheticScore > 35 ? 'inconclusive'
    : 'likely_genuine'

  const inCluster = signals.includes('address_cluster') || signals.includes('shared_phone')
  const clusterSize = inCluster ? Math.floor(Math.random() * 12) + 3 : undefined
  const fileAgeMonths = Math.floor(Math.random() * 30) + 4

  return {
    id: `SYN-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    applicantName: APPLICANT_NAMES[Math.floor(Math.random() * APPLICANT_NAMES.length)],
    accountId: `ACC-${Math.floor(Math.random() * 900000 + 100000)}`,
    syntheticScore,
    verdict,
    signals,
    fileAgeMonths,
    creditLimitGrowth: Math.random() * 500 + 40,
    linkedApplications: Math.floor(Math.random() * 8) + 1,
    clusterId: inCluster ? `CLU-${Math.floor(Math.random() * 900 + 100)}` : undefined,
    clusterSize,
    narrative: buildNarrative(signals, syntheticScore, clusterSize, fileAgeMonths),
    detectedAt: new Date(Date.now() - Math.floor(Math.random() * 96) * 3600000),
    estimatedLoss: Math.floor(Math.random() * 85000) + 4000,
  }
}

export function generateSyntheticIdentities(count: number = 20): SyntheticIdentity[] {
  return Array.from({ length: count }, () => generateSyntheticIdentity()).sort(
    (a, b) => b.syntheticScore - a.syntheticScore
  )
}

export function summarizeSynthetic(identities: SyntheticIdentity[]) {
  const clusters = new Set(
    identities.map(i => i.clusterId).filter((c): c is string => Boolean(c))
  )

  return {
    total: identities.length,
    confirmed: identities.filter(i => i.verdict === 'confirmed_synthetic').length,
    probable: identities.filter(i => i.verdict === 'probable_synthetic').length,
    clusters: clusters.size,
    exposureAtRisk: identities
      .filter(i => i.verdict === 'confirmed_synthetic' || i.verdict === 'probable_synthetic')
      .reduce((sum, i) => sum + i.estimatedLoss, 0),
    avgScore: identities.reduce((sum, i) => sum + i.syntheticScore, 0) / (identities.length || 1),
  }
}
