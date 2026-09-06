// CAREN - Regulatory Radar
// Tracks regulatory change, assesses impact on the monitoring estate, and
// proposes concrete rule adjustments so nothing arrives as a surprise.
// Author: Alisher Beisembekov

export type Jurisdiction = 'EU' | 'US' | 'UK' | 'UAE' | 'SG' | 'GLOBAL'
export type ChangeStatus = 'proposed' | 'adopted' | 'in_force' | 'sunset'
export type ImpactLevel = 'none' | 'low' | 'moderate' | 'high' | 'critical'

export interface RuleAdjustment {
  id: string
  ruleName: string
  currentValue: string
  proposedValue: string
  rationale: { en: string; ru: string }
  autoApplicable: boolean
}

export interface RegulatoryChange {
  id: string
  reference: string
  title: { en: string; ru: string }
  jurisdiction: Jurisdiction
  status: ChangeStatus
  publishedAt: Date
  effectiveAt: Date
  daysUntilEffective: number
  impact: ImpactLevel
  summary: { en: string; ru: string }
  affectedControls: { en: string; ru: string }[]
  suggestedAdjustments: RuleAdjustment[]
  readinessPct: number
  source: string
}

export const JURISDICTION_LABELS: Record<Jurisdiction, { en: string; ru: string }> = {
  EU: { en: 'European Union', ru: 'Европейский союз' },
  US: { en: 'United States', ru: 'США' },
  UK: { en: 'United Kingdom', ru: 'Великобритания' },
  UAE: { en: 'United Arab Emirates', ru: 'ОАЭ' },
  SG: { en: 'Singapore', ru: 'Сингапур' },
  GLOBAL: { en: 'Global / FATF', ru: 'Глобально / FATF' },
}

export const STATUS_LABELS: Record<ChangeStatus, { en: string; ru: string }> = {
  proposed: { en: 'Proposed', ru: 'Предложено' },
  adopted: { en: 'Adopted', ru: 'Принято' },
  in_force: { en: 'In Force', ru: 'Действует' },
  sunset: { en: 'Sunsetting', ru: 'Прекращает действие' },
}

export const IMPACT_LABELS: Record<ImpactLevel, { en: string; ru: string }> = {
  none: { en: 'No Impact', ru: 'Без влияния' },
  low: { en: 'Low', ru: 'Низкое' },
  moderate: { en: 'Moderate', ru: 'Умеренное' },
  high: { en: 'High', ru: 'Высокое' },
  critical: { en: 'Critical', ru: 'Критическое' },
}

/**
 * Curated regulatory corpus. Each entry pairs the legal change with the
 * specific control it touches and the parameter change it implies — the step
 * compliance teams normally do by hand.
 */
const REGULATORY_CORPUS: Omit<RegulatoryChange, 'id' | 'daysUntilEffective'>[] = [
  {
    reference: 'EU 2024/1624 (AMLR)',
    title: {
      en: 'EU Anti-Money Laundering Regulation — single rulebook',
      ru: 'Регламент ЕС по ПОД/ФТ — единый свод правил',
    },
    jurisdiction: 'EU',
    status: 'adopted',
    publishedAt: new Date('2026-02-14'),
    effectiveAt: new Date('2026-11-10'),
    impact: 'critical',
    summary: {
      en: 'Harmonises AML obligations across member states and lowers the cash payment ceiling to €10,000. Introduces mandatory beneficial-ownership verification at 25% and enhanced due diligence for all high-net-worth relationships.',
      ru: 'Гармонизирует обязательства по ПОД/ФТ между странами-членами и снижает предельную сумму наличных расчётов до €10 000. Вводит обязательную проверку бенефициарного владения при доле 25% и усиленную проверку для всех отношений с крупным капиталом.',
    },
    affectedControls: [
      { en: 'Cash transaction threshold monitoring', ru: 'Мониторинг порога наличных операций' },
      { en: 'Beneficial ownership verification', ru: 'Проверка бенефициарного владения' },
      { en: 'Enhanced due diligence triggers', ru: 'Триггеры усиленной проверки' },
    ],
    suggestedAdjustments: [
      {
        id: 'ADJ-EU-1',
        ruleName: 'CASH_THRESHOLD_EUR',
        currentValue: '€15,000',
        proposedValue: '€10,000',
        rationale: {
          en: 'AMLR Article 59 caps cash payments at €10,000 across all member states, superseding the national €15,000 limit currently configured.',
          ru: 'Статья 59 AMLR ограничивает наличные расчёты суммой €10 000 во всех странах-членах, заменяя действующий национальный лимит €15 000.',
        },
        autoApplicable: true,
      },
      {
        id: 'ADJ-EU-2',
        ruleName: 'UBO_VERIFICATION_PCT',
        currentValue: '30%',
        proposedValue: '25%',
        rationale: {
          en: 'Ownership threshold for beneficial-owner identification drops to 25%, widening the set of entities requiring verification.',
          ru: 'Порог доли владения для идентификации бенефициара снижается до 25%, расширяя круг лиц, подлежащих проверке.',
        },
        autoApplicable: true,
      },
    ],
    readinessPct: 62,
    source: 'EUR-Lex',
  },
  {
    reference: 'FATF R.16 (Travel Rule)',
    title: {
      en: 'Revised Travel Rule thresholds for virtual assets',
      ru: 'Пересмотренные пороги правила travel rule для виртуальных активов',
    },
    jurisdiction: 'GLOBAL',
    status: 'in_force',
    publishedAt: new Date('2026-01-08'),
    effectiveAt: new Date('2026-06-30'),
    impact: 'high',
    summary: {
      en: 'Originator and beneficiary information must accompany virtual-asset transfers above USD 1,000, down from USD 3,000. Unhosted wallet transfers now require additional risk assessment.',
      ru: 'Информация об отправителе и получателе должна сопровождать переводы виртуальных активов свыше 1 000 долл. США вместо прежних 3 000. Переводы на некастодиальные кошельки теперь требуют дополнительной оценки риска.',
    },
    affectedControls: [
      { en: 'Virtual asset transfer screening', ru: 'Скрининг переводов виртуальных активов' },
      { en: 'Counterparty data completeness checks', ru: 'Проверка полноты данных контрагента' },
    ],
    suggestedAdjustments: [
      {
        id: 'ADJ-FATF-1',
        ruleName: 'VASP_TRAVEL_RULE_USD',
        currentValue: '$3,000',
        proposedValue: '$1,000',
        rationale: {
          en: 'Lowering the threshold triples the volume of transfers requiring originator data; expect a proportional rise in incomplete-data exceptions.',
          ru: 'Снижение порога втрое увеличивает объём переводов, требующих данных отправителя; ожидается пропорциональный рост исключений по неполноте данных.',
        },
        autoApplicable: true,
      },
    ],
    readinessPct: 88,
    source: 'FATF',
  },
  {
    reference: 'FinCEN 2026-A003',
    title: {
      en: 'Advisory on money mule recruitment via social platforms',
      ru: 'Рекомендация по вербовке дроп-счетов через социальные платформы',
    },
    jurisdiction: 'US',
    status: 'in_force',
    publishedAt: new Date('2026-04-22'),
    effectiveAt: new Date('2026-04-22'),
    impact: 'moderate',
    summary: {
      en: 'Identifies red flags for mule accounts recruited online: rapid pass-through of funds, account age under 90 days, and beneficiary lists that grow faster than transaction history would justify.',
      ru: 'Определяет индикаторы дроп-счетов, завербованных онлайн: быстрый транзит средств, возраст счёта менее 90 дней и списки получателей, растущие быстрее, чем это оправдано историей операций.',
    },
    affectedControls: [
      { en: 'Pass-through velocity detection', ru: 'Обнаружение скорости транзита' },
      { en: 'New account monitoring window', ru: 'Окно наблюдения за новыми счетами' },
    ],
    suggestedAdjustments: [
      {
        id: 'ADJ-FIN-1',
        ruleName: 'PASSTHROUGH_DWELL_MINUTES',
        currentValue: '60 min',
        proposedValue: '15 min',
        rationale: {
          en: 'Advisory cites median dwell times under 15 minutes for confirmed mule accounts; the current 60-minute window misses most of them.',
          ru: 'В рекомендации указано медианное время удержания средств менее 15 минут для подтверждённых дроп-счетов; текущее окно в 60 минут пропускает большинство из них.',
        },
        autoApplicable: true,
      },
      {
        id: 'ADJ-FIN-2',
        ruleName: 'NEW_ACCOUNT_WATCH_DAYS',
        currentValue: '30 days',
        proposedValue: '90 days',
        rationale: {
          en: 'Extending the enhanced-monitoring window to 90 days aligns with the advisory’s account-age red flag.',
          ru: 'Продление окна усиленного мониторинга до 90 дней соответствует индикатору возраста счёта из рекомендации.',
        },
        autoApplicable: false,
      },
    ],
    readinessPct: 45,
    source: 'FinCEN',
  },
  {
    reference: 'PSD3 / PSR (COM 2023/367)',
    title: {
      en: 'Payment Services Regulation — fraud liability shift',
      ru: 'Регламент о платёжных услугах — перенос ответственности за мошенничество',
    },
    jurisdiction: 'EU',
    status: 'proposed',
    publishedAt: new Date('2026-03-05'),
    effectiveAt: new Date('2027-01-15'),
    impact: 'high',
    summary: {
      en: 'Extends refund obligations to authorised push payment fraud where the payer was manipulated. Requires IBAN-name matching for all credit transfers before execution.',
      ru: 'Расширяет обязательства по возмещению на мошенничество с авторизованными переводами, когда плательщик был введён в заблуждение. Требует сверки IBAN и имени получателя для всех кредитовых переводов до их исполнения.',
    },
    affectedControls: [
      { en: 'IBAN-name matching service', ru: 'Сервис сверки IBAN и имени' },
      { en: 'APP fraud detection model', ru: 'Модель выявления мошенничества с авторизованными переводами' },
    ],
    suggestedAdjustments: [
      {
        id: 'ADJ-PSD3-1',
        ruleName: 'IBAN_NAME_MATCH_ENFORCE',
        currentValue: 'advisory',
        proposedValue: 'blocking',
        rationale: {
          en: 'Under PSR the institution absorbs the loss when a mismatch is not surfaced, so advisory-only matching becomes a direct liability.',
          ru: 'Согласно PSR организация несёт убыток, если несовпадение не было показано, поэтому режим «только предупреждение» становится прямой ответственностью.',
        },
        autoApplicable: false,
      },
    ],
    readinessPct: 28,
    source: 'European Commission',
  },
  {
    reference: 'MAS Notice 626 (Amendment 3)',
    title: {
      en: 'Enhanced screening for cross-border wire transfers',
      ru: 'Усиленный скрининг трансграничных банковских переводов',
    },
    jurisdiction: 'SG',
    status: 'adopted',
    publishedAt: new Date('2026-05-18'),
    effectiveAt: new Date('2026-12-01'),
    impact: 'moderate',
    summary: {
      en: 'Requires real-time sanctions screening on both originator and all intermediary parties, not just the immediate counterparty. Screening latency must not exceed 500ms.',
      ru: 'Требует скрининга санкционных списков в реальном времени как для отправителя, так и для всех промежуточных участников, а не только непосредственного контрагента. Задержка скрининга не должна превышать 500 мс.',
    },
    affectedControls: [
      { en: 'Sanctions screening coverage', ru: 'Охват санкционного скрининга' },
      { en: 'Screening latency SLA', ru: 'SLA по задержке скрининга' },
    ],
    suggestedAdjustments: [
      {
        id: 'ADJ-MAS-1',
        ruleName: 'SCREENING_SCOPE',
        currentValue: 'direct_counterparty',
        proposedValue: 'full_chain',
        rationale: {
          en: 'Intermediary screening roughly doubles list-check volume; current p99 latency of 310ms leaves adequate headroom under the 500ms cap.',
          ru: 'Скрининг посредников примерно удваивает объём проверок по спискам; текущая задержка p99 в 310 мс оставляет достаточный запас относительно лимита в 500 мс.',
        },
        autoApplicable: true,
      },
    ],
    readinessPct: 71,
    source: 'Monetary Authority of Singapore',
  },
  {
    reference: 'UK JMLSG Part II (rev. 2026)',
    title: {
      en: 'Revised guidance on politically exposed persons',
      ru: 'Пересмотренное руководство по публичным должностным лицам',
    },
    jurisdiction: 'UK',
    status: 'in_force',
    publishedAt: new Date('2026-06-02'),
    effectiveAt: new Date('2026-09-01'),
    impact: 'low',
    summary: {
      en: 'Clarifies that domestic PEPs should start at a lower inherent risk rating than foreign PEPs unless other factors apply, reducing unnecessary enhanced due diligence.',
      ru: 'Разъясняет, что внутренние публичные должностные лица должны получать более низкий исходный рейтинг риска, чем иностранные, если нет иных факторов, что снижает избыточную усиленную проверку.',
    },
    affectedControls: [
      { en: 'PEP risk rating logic', ru: 'Логика рейтинга риска ПДЛ' },
    ],
    suggestedAdjustments: [
      {
        id: 'ADJ-UK-1',
        ruleName: 'DOMESTIC_PEP_BASE_RISK',
        currentValue: 'high',
        proposedValue: 'medium',
        rationale: {
          en: 'Reduces enhanced due diligence volume by an estimated 40% on domestic PEPs without weakening the foreign-PEP posture.',
          ru: 'Снижает объём усиленной проверки по внутренним ПДЛ примерно на 40%, не ослабляя контроль по иностранным ПДЛ.',
        },
        autoApplicable: true,
      },
    ],
    readinessPct: 94,
    source: 'JMLSG',
  },
  {
    reference: 'CBUAE Circular 2026/07',
    title: {
      en: 'Trade-based money laundering controls',
      ru: 'Контроль отмывания через торговые операции',
    },
    jurisdiction: 'UAE',
    status: 'adopted',
    publishedAt: new Date('2026-07-11'),
    effectiveAt: new Date('2027-02-01'),
    impact: 'high',
    summary: {
      en: 'Mandates price-deviation analysis on trade finance instruments. Invoices deviating more than 20% from market reference prices require documented justification before settlement.',
      ru: 'Обязывает проводить анализ ценовых отклонений по инструментам торгового финансирования. Счета с отклонением более 20% от рыночных справочных цен требуют документального обоснования до расчётов.',
    },
    affectedControls: [
      { en: 'Trade finance price screening', ru: 'Ценовой скрининг торгового финансирования' },
      { en: 'Invoice documentation workflow', ru: 'Процесс документирования счетов' },
    ],
    suggestedAdjustments: [
      {
        id: 'ADJ-UAE-1',
        ruleName: 'TRADE_PRICE_DEVIATION_PCT',
        currentValue: 'not configured',
        proposedValue: '20%',
        rationale: {
          en: 'No price-deviation control exists today; this is a net-new detector requiring a market reference price feed.',
          ru: 'Контроль ценовых отклонений сейчас отсутствует; это принципиально новый детектор, требующий подключения источника рыночных справочных цен.',
        },
        autoApplicable: false,
      },
    ],
    readinessPct: 15,
    source: 'Central Bank of the UAE',
  },
  {
    reference: 'EBA/GL/2026/04',
    title: {
      en: 'Guidelines on ML/TF risk factors for crypto asset service providers',
      ru: 'Руководство по факторам риска ОД/ФТ для провайдеров криптоактивов',
    },
    jurisdiction: 'EU',
    status: 'in_force',
    publishedAt: new Date('2026-08-14'),
    effectiveAt: new Date('2026-10-01'),
    impact: 'moderate',
    summary: {
      en: 'Sets out risk factors specific to crypto asset services, including privacy-coin exposure, mixer proximity and self-hosted wallet interaction scoring.',
      ru: 'Определяет факторы риска, специфичные для криптоактивов, включая экспозицию в анонимных монетах, близость к миксерам и оценку взаимодействия с некастодиальными кошельками.',
    },
    affectedControls: [
      { en: 'Crypto counterparty risk scoring', ru: 'Оценка риска криптоконтрагентов' },
      { en: 'Mixer proximity detection', ru: 'Обнаружение близости к миксерам' },
    ],
    suggestedAdjustments: [
      {
        id: 'ADJ-EBA-1',
        ruleName: 'MIXER_HOP_DISTANCE',
        currentValue: '1 hop',
        proposedValue: '3 hops',
        rationale: {
          en: 'Guidelines treat funds within three hops of a mixer as elevated risk; single-hop tracing misses layered obfuscation.',
          ru: 'Руководство относит средства в пределах трёх переходов от миксера к повышенному риску; отслеживание на один переход пропускает многослойное сокрытие.',
        },
        autoApplicable: true,
      },
    ],
    readinessPct: 57,
    source: 'European Banking Authority',
  },
]

export function generateRegulatoryChanges(): RegulatoryChange[] {
  const now = Date.now()

  return REGULATORY_CORPUS.map((entry, i) => ({
    ...entry,
    id: `REG-${String(1000 + i)}`,
    daysUntilEffective: Math.round((entry.effectiveAt.getTime() - now) / 86400000),
  })).sort((a, b) => a.daysUntilEffective - b.daysUntilEffective)
}

export function summarizeRegulatory(changes: RegulatoryChange[]) {
  const pending = changes.filter(c => c.daysUntilEffective > 0)
  const adjustments = changes.flatMap(c => c.suggestedAdjustments)

  return {
    tracked: changes.length,
    pending: pending.length,
    highImpact: changes.filter(c => c.impact === 'high' || c.impact === 'critical').length,
    avgReadiness:
      changes.reduce((sum, c) => sum + c.readinessPct, 0) / (changes.length || 1),
    suggestedAdjustments: adjustments.length,
    autoApplicable: adjustments.filter(a => a.autoApplicable).length,
    // The nearest deadline is what a compliance lead actually plans around.
    nextDeadlineDays: pending.length > 0
      ? Math.min(...pending.map(c => c.daysUntilEffective))
      : 0,
  }
}
