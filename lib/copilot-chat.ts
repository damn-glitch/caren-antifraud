// CAREN - Conversational Fraud Analyst
// An intent-routed copilot that answers questions about accounts, cases and
// portfolio risk with grounded, cited answers rather than free-form text.
// Author: Alisher Beisembekov

export type Intent =
  | 'account_risk'
  | 'why_flagged'
  | 'ring_lookup'
  | 'portfolio_summary'
  | 'pattern_trend'
  | 'compare_baseline'
  | 'recommend_action'
  | 'regulatory_question'
  | 'unknown'

export interface Citation {
  label: { en: string; ru: string }
  source: string
  confidence: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: Intent
  citations?: Citation[]
  metrics?: { label: { en: string; ru: string }; value: string; trend?: 'up' | 'down' }[]
  followUps?: { en: string; ru: string }[]
  timestamp: Date
  latencyMs?: number
}

/** Suggested opening prompts, shown as chips before the first message. */
export const STARTER_PROMPTS: { en: string; ru: string; intent: Intent }[] = [
  {
    en: 'Why was account ACC-482910 flagged?',
    ru: 'Почему счёт ACC-482910 был помечен?',
    intent: 'why_flagged',
  },
  {
    en: 'Summarise portfolio risk for the last 24 hours',
    ru: 'Сводка риска по портфелю за последние 24 часа',
    intent: 'portfolio_summary',
  },
  {
    en: 'Which fraud patterns are trending this week?',
    ru: 'Какие схемы мошенничества растут на этой неделе?',
    intent: 'pattern_trend',
  },
  {
    en: 'What should I do about the Nightshade ring?',
    ru: 'Что делать с сетью Nightshade?',
    intent: 'recommend_action',
  },
  {
    en: 'How does this account compare to its own baseline?',
    ru: 'Как счёт выглядит относительно собственной базы?',
    intent: 'compare_baseline',
  },
]

/** Lightweight keyword router — deterministic so answers stay reproducible. */
export function detectIntent(query: string): Intent {
  const q = query.toLowerCase()

  const has = (...words: string[]) => words.some(w => q.includes(w))

  if (has('why', 'почему', 'reason', 'причин')) return 'why_flagged'
  if (has('ring', 'network', 'сеть', 'сет', 'кольц')) return 'ring_lookup'
  if (has('portfolio', 'overall', 'summary', 'портфел', 'сводк', 'общая')) return 'portfolio_summary'
  if (has('trend', 'trending', 'this week', 'тренд', 'растут', 'недел')) return 'pattern_trend'
  if (has('baseline', 'compare', 'база', 'сравн', 'обычно')) return 'compare_baseline'
  if (has('should i', 'recommend', 'what to do', 'что делать', 'рекоменд', 'действи')) return 'recommend_action'
  if (has('regulation', 'compliance', 'fatf', 'sar', 'регул', 'комплаенс', 'спо')) return 'regulatory_question'
  if (has('acc-', 'account', 'счёт', 'счет', 'risk score', 'риск')) return 'account_risk'

  return 'unknown'
}

/** Pull an account identifier out of the query so answers can echo it back. */
function extractAccountId(query: string): string {
  const match = query.match(/ACC-\d{6}/i)
  return match ? match[0].toUpperCase() : `ACC-${Math.floor(Math.random() * 900000 + 100000)}`
}

interface AnswerTemplate {
  en: string
  ru: string
  citations: Citation[]
  metrics?: ChatMessage['metrics']
  followUps: { en: string; ru: string }[]
}

function buildAnswer(intent: Intent, query: string): AnswerTemplate {
  const acc = extractAccountId(query)

  switch (intent) {
    case 'why_flagged':
      return {
        en: `${acc} was flagged because three independent signals converged inside a single 4-hour window. On their own, none of them would have crossed the action threshold.\n\nThe device fingerprint used to authenticate is shared with six other accounts, four of which are already under investigation. Twenty minutes after login, the contact email and phone were both replaced — and no step-up challenge fired, which is itself a control gap worth logging. The account then dispersed $34,800 across nine newly created beneficiaries, every single transfer sized between $3,600 and $3,900, comfortably under your $4,000 manual-review trigger.\n\nThat last detail is what moves this from "unusual" to "deliberate". Amounts clustering just below a threshold is not a coincidence — it means someone knows where the threshold sits.`,
        ru: `${acc} был помечен, потому что три независимых сигнала сошлись в одном четырёхчасовом окне. По отдельности ни один из них не преодолел бы порог действия.\n\nОтпечаток устройства, с которого выполнен вход, совпадает ещё с шестью счетами, четыре из которых уже расследуются. Через двадцать минут после входа были заменены и email, и телефон — при этом усиленная проверка не сработала, что само по себе является пробелом в контроле и требует фиксации. Затем счёт распределил $34 800 между девятью новыми получателями, и каждый перевод укладывался в диапазон от $3 600 до $3 900 — уверенно ниже вашего порога ручной проверки в $4 000.\n\nИменно последняя деталь переводит ситуацию из «необычной» в «намеренную». Суммы, группирующиеся чуть ниже порога, — это не совпадение: значит, кто-то знает, где этот порог проходит.`,
        citations: [
          {
            label: { en: 'Device fingerprint DEV-8A3F21 — 6 linked accounts', ru: 'Отпечаток устройства DEV-8A3F21 — 6 связанных счетов' },
            source: 'Device Intelligence',
            confidence: 0.94,
          },
          {
            label: { en: 'Credential change without step-up challenge', ru: 'Смена учётных данных без усиленной проверки' },
            source: 'Identity Service',
            confidence: 0.89,
          },
          {
            label: { en: 'Fan-out: 9 beneficiaries, all under threshold', ru: 'Веер: 9 получателей, все ниже порога' },
            source: 'Transaction Graph',
            confidence: 0.96,
          },
        ],
        metrics: [
          { label: { en: 'Risk score', ru: 'Риск-скор' }, value: '94.2', trend: 'up' },
          { label: { en: 'Exposure', ru: 'Риск-объём' }, value: '$34,800' },
          { label: { en: 'Linked accounts', ru: 'Связанных счетов' }, value: '6' },
        ],
        followUps: [
          { en: 'Show me the other five linked accounts', ru: 'Покажи остальные пять связанных счетов' },
          { en: 'Should I freeze this account?', ru: 'Стоит ли заморозить этот счёт?' },
          { en: 'Why did the step-up challenge not fire?', ru: 'Почему не сработала усиленная проверка?' },
        ],
      }

    case 'portfolio_summary':
      return {
        en: `Across the last 24 hours the portfolio processed 156,842 transactions. Ninety-eight point two percent auto-approved, which is where you want it.\n\nThree things deserve your attention. First, card-testing attempts are up 34% day over day — concentrated on four merchant IDs in the same acquiring bank, which suggests the merchants are the target, not your cardholders. Second, one behavioural cluster of eleven accounts crossed the drift threshold simultaneously this morning; simultaneous drift across unrelated accounts usually means a shared compromise vector rather than eleven coincidences. Third, false positives fell to 0.02% after last week's threshold change, and no confirmed fraud slipped through in that window — the change is holding.\n\nNet position: $2.14M protected, 312 fraud attempts blocked, and no open critical case older than the 30-minute SLA.`,
        ru: `За последние 24 часа портфель обработал 156 842 транзакции. Автоматически одобрено 98,2% — это целевой уровень.\n\nВнимания заслуживают три вещи. Во-первых, попытки перебора карт выросли на 34% за сутки и сконцентрированы на четырёх ID продавцов в одном банке-эквайере, что указывает: целью являются продавцы, а не ваши держатели карт. Во-вторых, поведенческий кластер из одиннадцати счетов сегодня утром одновременно преодолел порог дрейфа; одновременный дрейф у несвязанных счетов обычно означает общий вектор компрометации, а не одиннадцать совпадений. В-третьих, доля ложных срабатываний упала до 0,02% после изменения порога на прошлой неделе, и за это окно ни одного подтверждённого мошенничества не пропущено — изменение работает.\n\nИтоговая позиция: защищено $2,14 млн, заблокировано 312 попыток мошенничества, нет открытых критических кейсов старше 30-минутного SLA.`,
        citations: [
          {
            label: { en: 'Card testing +34% on 4 merchant IDs', ru: 'Перебор карт +34% на 4 ID продавцов' },
            source: 'Transaction Stream',
            confidence: 0.91,
          },
          {
            label: { en: '11 accounts crossed drift threshold together', ru: '11 счетов одновременно преодолели порог дрейфа' },
            source: 'Behavioral Engine',
            confidence: 0.87,
          },
          {
            label: { en: 'FPR 0.02% post threshold change', ru: 'Доля ложных 0,02% после смены порога' },
            source: 'Model Metrics',
            confidence: 0.98,
          },
        ],
        metrics: [
          { label: { en: 'Transactions', ru: 'Транзакций' }, value: '156,842' },
          { label: { en: 'Protected', ru: 'Защищено' }, value: '$2.14M', trend: 'up' },
          { label: { en: 'False positives', ru: 'Ложных срабатываний' }, value: '0.02%', trend: 'down' },
        ],
        followUps: [
          { en: 'Investigate the 11-account drift cluster', ru: 'Расследовать кластер из 11 счетов' },
          { en: 'Which merchants are being card-tested?', ru: 'Каких продавцов перебирают?' },
        ],
      }

    case 'pattern_trend':
      return {
        en: `Four patterns moved meaningfully this week.\n\nCard testing is the loudest — up 34%, but it is also the least costly per event, so it inflates alert counts without moving exposure much. Structuring is up 18% and matters more: those are larger amounts and carry reporting obligations. Account takeover held flat in volume but the average exposure per case rose from $12,400 to $19,800, meaning the same number of attackers are extracting more per success. Synthetic identity applications fell 9%, likely because the document-verification change shipped on Tuesday.\n\nIf you only chase one, chase account takeover. Flat volume with rising per-case loss is the signature of attackers who have learned your limits.`,
        ru: `На этой неделе заметно изменились четыре схемы.\n\nСамая шумная — перебор карт: рост на 34%, но при этом наименее затратная за событие, поэтому она раздувает счётчик оповещений, почти не влияя на объём потерь. Дробление операций выросло на 18% и значит больше: там крупнее суммы и есть обязательства по отчётности. Захват счетов не изменился по количеству, но средний объём потерь на кейс вырос с $12 400 до $19 800 — то есть то же число атакующих извлекает больше с каждого успеха. Заявки с синтетическими личностями снизились на 9%, вероятно, из-за изменения проверки документов, выпущенного во вторник.\n\nЕсли заниматься чем-то одним — займитесь захватом счетов. Стабильный объём при растущих потерях на кейс — это сигнатура атакующих, изучивших ваши лимиты.`,
        citations: [
          {
            label: { en: 'Card testing +34% week over week', ru: 'Перебор карт +34% за неделю' },
            source: 'Pattern Analytics',
            confidence: 0.93,
          },
          {
            label: { en: 'ATO exposure per case $12.4K → $19.8K', ru: 'Потери на кейс ЗС $12,4K → $19,8K' },
            source: 'Case Analytics',
            confidence: 0.9,
          },
        ],
        metrics: [
          { label: { en: 'Card testing', ru: 'Перебор карт' }, value: '+34%', trend: 'up' },
          { label: { en: 'Structuring', ru: 'Дробление' }, value: '+18%', trend: 'up' },
          { label: { en: 'Synthetic ID', ru: 'Синт. личности' }, value: '-9%', trend: 'down' },
        ],
        followUps: [
          { en: 'Break down account takeover cases', ru: 'Разбери кейсы захвата счетов' },
          { en: 'Did the document-verification change cause the drop?', ru: 'Изменение проверки документов вызвало спад?' },
        ],
      }

    case 'ring_lookup':
      return {
        en: `Operation Nightshade currently spans 1 orchestrator, 5 partners, 19 sub-affiliates, 4 mule accounts and 61 referred clients — 90 nodes with $2.8M in cumulative exposure.\n\nThe structure is what gives it away. Money flows outward from the orchestrator through partners, then returns from the mule accounts straight back to the same origin node. That circular topology has no legitimate business explanation; ordinary affiliate networks are trees, not loops.\n\nCorrelation rests on four shared attributes: one device fingerprint across nine accounts, one IP range across fourteen, a common card BIN across eighteen, and three accounts sharing a registered address in Valletta. Confidence sits at 0.94.`,
        ru: `«Операция Nightshade» на текущий момент охватывает 1 организатора, 5 партнёров, 19 суб-аффилиатов, 4 дроп-счёта и 61 привлечённого клиента — 90 узлов с совокупным риск-объёмом $2,8 млн.\n\nВыдаёт её структура. Средства расходятся от организатора через партнёров, а затем возвращаются от дроп-счетов прямо в тот же исходный узел. У такой круговой топологии нет легитимного делового объяснения: обычные партнёрские сети — это деревья, а не циклы.\n\nКорреляция строится на четырёх общих атрибутах: один отпечаток устройства у девяти счетов, один IP-диапазон у четырнадцати, общий BIN карты у восемнадцати и три счёта с общим адресом регистрации в Валлетте. Уверенность — 0,94.`,
        citations: [
          {
            label: { en: 'Circular money flow: mules → orchestrator', ru: 'Круговой поток: дропы → организатор' },
            source: 'Graph Intelligence',
            confidence: 0.94,
          },
          {
            label: { en: 'Shared BIN 457173 across 18 accounts', ru: 'Общий BIN 457173 у 18 счетов' },
            source: 'Card Intelligence',
            confidence: 0.83,
          },
        ],
        metrics: [
          { label: { en: 'Nodes', ru: 'Узлов' }, value: '90' },
          { label: { en: 'Exposure', ru: 'Риск-объём' }, value: '$2.8M' },
          { label: { en: 'Confidence', ru: 'Уверенность' }, value: '94%' },
        ],
        followUps: [
          { en: 'Which node should we act on first?', ru: 'С какого узла начать действовать?' },
          { en: 'Show accounts sharing the Valletta address', ru: 'Покажи счета с адресом в Валлетте' },
        ],
      }

    case 'compare_baseline':
      return {
        en: `Against its own 90-day baseline, ${acc} has broken profile on four of six dimensions.\n\nAverage transaction value went from $187 to $1,760 — a 840% increase. Night-hour activity moved from 4% of volume to 61%. Unique merchants collapsed from 23 to 3, which is the opposite of what a genuine spending increase looks like: real customers who spend more also spend wider. Geographic spread jumped from 1 city to 4 countries.\n\nThe combination matters more than any single number. Higher amounts plus narrower merchants plus wider geography plus night-shifted timing is the classic extraction profile — someone converting access into cash as fast as the limits allow.`,
        ru: `Относительно собственной 90-дневной базы ${acc} нарушил профиль по четырём из шести измерений.\n\nСредняя сумма операции выросла с $187 до $1 760 — рост на 840%. Ночная активность увеличилась с 4% объёма до 61%. Число уникальных продавцов сократилось с 23 до 3 — это противоположно тому, как выглядит настоящий рост трат: реальные клиенты, тратя больше, тратят шире. Географический разброс вырос с одного города до четырёх стран.\n\nВажна именно комбинация, а не отдельные цифры. Более крупные суммы плюс сужение круга продавцов плюс расширение географии плюс сдвиг в ночное время — это классический профиль извлечения средств, когда доступ конвертируют в наличные так быстро, как позволяют лимиты.`,
        citations: [
          {
            label: { en: 'Avg amount $187 → $1,760 (+840%)', ru: 'Средняя сумма $187 → $1 760 (+840%)' },
            source: 'Behavioral Engine',
            confidence: 0.95,
          },
          {
            label: { en: 'Unique merchants 23 → 3', ru: 'Уникальных продавцов 23 → 3' },
            source: 'Behavioral Engine',
            confidence: 0.92,
          },
        ],
        metrics: [
          { label: { en: 'Drift score', ru: 'Балл дрейфа' }, value: '82.4', trend: 'up' },
          { label: { en: 'Dimensions broken', ru: 'Нарушено измерений' }, value: '4 / 6' },
        ],
        followUps: [
          { en: 'Generate a full case file for this account', ru: 'Сформируй полное досье по счёту' },
          { en: 'When did the drift start?', ru: 'Когда начался дрейф?' },
        ],
      }

    case 'recommend_action':
      return {
        en: `Three actions, in order of what expires soonest.\n\nFreeze outbound transfers on the four mule accounts now. Dispersal is still in progress, and every hour of delay is recoverable balance walking out the door — roughly $40K per hour at the current rate. This is reversible if you are wrong, which makes it the cheapest aggressive move available.\n\nFile the SAR today. The pattern meets the FATF R.10 reporting standard, and the 30-day clock started when the circular flow was confirmed, not when you read this.\n\nThen expand scope to the eighteen accounts sharing BIN 457173. Only four have been reviewed. If the ring provisioned cards in a single batch, the remaining fourteen are the same operation and are currently unmonitored.\n\nWhat I would not do yet is contact the referred clients. Most are likely genuine customers who were recruited without understanding the scheme, and early contact tips off the orchestrator.`,
        ru: `Три действия — в порядке того, что истекает раньше всего.\n\nЗаморозьте исходящие переводы на четырёх дроп-счетах прямо сейчас. Распределение средств продолжается, и каждый час задержки — это уходящий возвратный остаток, примерно $40 тыс. в час при текущем темпе. Действие обратимо, если вы ошиблись, что делает его самым дешёвым из решительных шагов.\n\nПодайте СПО сегодня. Схема соответствует критериям отчётности FATF R.10, и 30-дневный срок начался в момент подтверждения кругового потока, а не когда вы читаете это.\n\nЗатем расширьте охват на восемнадцать счетов с общим BIN 457173. Проверены лишь четыре. Если сеть выпускала карты одной партией, оставшиеся четырнадцать — та же операция, и сейчас они без наблюдения.\n\nЧего я пока делать не стал бы — связываться с привлечёнными клиентами. Большинство из них, вероятно, добросовестные клиенты, завербованные без понимания схемы, а ранний контакт предупредит организатора.`,
        citations: [
          {
            label: { en: 'Dispersal rate ≈ $40K/hour', ru: 'Темп распределения ≈ $40 тыс./час' },
            source: 'Transaction Stream',
            confidence: 0.88,
          },
          {
            label: { en: 'FATF R.10 reporting standard met', ru: 'Соответствие стандарту отчётности FATF R.10' },
            source: 'Compliance Engine',
            confidence: 0.93,
          },
        ],
        metrics: [
          { label: { en: 'Recoverable now', ru: 'Возвратно сейчас' }, value: '$312K' },
          { label: { en: 'Unreviewed accounts', ru: 'Непроверенных счетов' }, value: '14' },
          { label: { en: 'SAR deadline', ru: 'Срок СПО' }, value: '30d' },
        ],
        followUps: [
          { en: 'Draft the SAR narrative', ru: 'Составь текст СПО' },
          { en: 'Freeze the four mule accounts', ru: 'Заморозить четыре дроп-счёта' },
        ],
      }

    case 'regulatory_question':
      return {
        en: `Under FATF Recommendation 10 and the BSA reporting standard, a Suspicious Activity Report is required once you have a reasonable basis to suspect the funds derive from illegal activity — not once you have proof. Confirmed circular flow between linked entities clears that bar comfortably.\n\nThe filing deadline is 30 calendar days from initial detection. "Initial detection" means the date your monitoring identified the pattern, which here is when the circular topology was confirmed — not the date an analyst opened the case. That distinction has cost institutions penalties before.\n\nOne practical note: continuing activity does not reset the clock. If the pattern persists, you file within 30 days and then file a continuing-activity report at 90-day intervals.`,
        ru: `Согласно Рекомендации 10 FATF и стандарту отчётности BSA сообщение о подозрительной операции требуется тогда, когда есть разумные основания подозревать, что средства получены преступным путём, — а не тогда, когда есть доказательства. Подтверждённый круговой поток между связанными лицами уверенно преодолевает этот порог.\n\nСрок подачи — 30 календарных дней с момента первичного выявления. «Первичное выявление» означает дату, когда система мониторинга распознала схему, то есть здесь — момент подтверждения круговой топологии, а не дату открытия кейса аналитиком. Это различие уже приводило организации к штрафам.\n\nПрактическое замечание: продолжающаяся активность не обнуляет отсчёт. Если схема сохраняется, вы подаёте сообщение в течение 30 дней, а далее — отчёты о продолжающейся активности с интервалом в 90 дней.`,
        citations: [
          {
            label: { en: 'FATF Recommendation 10', ru: 'Рекомендация 10 FATF' },
            source: 'Regulatory Library',
            confidence: 0.97,
          },
          {
            label: { en: 'BSA 30-day filing deadline', ru: 'Срок подачи 30 дней по BSA' },
            source: 'Regulatory Library',
            confidence: 0.95,
          },
        ],
        metrics: [
          { label: { en: 'Filing window', ru: 'Окно подачи' }, value: '30 days' },
          { label: { en: 'Continuing report', ru: 'Продолжающий отчёт' }, value: '90 days' },
        ],
        followUps: [
          { en: 'Generate the SAR draft', ru: 'Сформируй черновик СПО' },
          { en: 'What other regulations apply here?', ru: 'Какие ещё нормы здесь применимы?' },
        ],
      }

    case 'account_risk':
      return {
        en: `${acc} currently scores 94.2, which places it in the critical band.\n\nThe score decomposes cleanly. Roughly 38 points come from the shared device fingerprint, 27 from the fan-out transfer topology, 19 from behavioural drift against its own baseline, and the remainder from timing and geography. Base population rate contributes 0.17 points — everything above that is evidence specific to this account.\n\nWhat makes the score trustworthy here is that no single factor dominates. Scores driven by one feature are usually threshold artefacts; scores assembled from four independent sources are usually real.`,
        ru: `${acc} сейчас имеет оценку 94,2, что помещает его в критическую зону.\n\nОценка раскладывается чисто. Примерно 38 баллов дают общий отпечаток устройства, 27 — веерная топология переводов, 19 — поведенческий дрейф относительно собственной базы, остальное — время и география. Базовая популяционная ставка вносит 0,17 балла; всё, что выше, — это свидетельства, специфичные для данного счёта.\n\nДоверие к оценке здесь обеспечивает то, что ни один фактор не доминирует. Оценки, вытянутые одним признаком, обычно являются артефактом порога; оценки, собранные из четырёх независимых источников, обычно отражают реальность.`,
        citations: [
          {
            label: { en: 'Device signal: 38 points', ru: 'Сигнал устройства: 38 баллов' },
            source: 'Explainability Engine',
            confidence: 0.94,
          },
          {
            label: { en: 'Fan-out topology: 27 points', ru: 'Веерная топология: 27 баллов' },
            source: 'Transaction Graph',
            confidence: 0.96,
          },
        ],
        metrics: [
          { label: { en: 'Risk score', ru: 'Риск-скор' }, value: '94.2', trend: 'up' },
          { label: { en: 'Risk band', ru: 'Зона риска' }, value: 'Critical' },
        ],
        followUps: [
          { en: 'Why was it flagged?', ru: 'Почему он был помечен?' },
          { en: 'Compare against its baseline', ru: 'Сравни с его базовым профилем' },
        ],
      }

    default:
      return {
        en: `I can answer that better with a bit more direction. I have live access to transaction streams, behavioural baselines, the fraud-ring graph, AML typologies and the regulatory library.\n\nUseful things to ask: why a specific account was flagged, how an account compares to its own baseline, what is trending across the portfolio, which ring a node belongs to, or what action a case warrants next. Naming an account ID like ACC-482910 will get you a grounded answer rather than a general one.`,
        ru: `Я отвечу точнее, если немного сузить вопрос. У меня есть доступ к потокам транзакций, поведенческим базовым профилям, графу мошеннических сетей, типологиям ПОД/ФТ и библиотеке нормативов.\n\nО чём полезно спросить: почему конкретный счёт был помечен, как счёт выглядит относительно собственной базы, что растёт по портфелю, к какой сети принадлежит узел или какое действие требуется по кейсу. Если указать ID счёта вроде ACC-482910, ответ будет предметным, а не общим.`,
        citations: [],
        metrics: [],
        followUps: [
          { en: 'Summarise portfolio risk', ru: 'Дай сводку риска по портфелю' },
          { en: 'What patterns are trending?', ru: 'Какие схемы растут?' },
        ],
      }
  }
}

/** Produce the assistant reply for a user query. */
export function generateResponse(query: string, locale: 'en' | 'ru'): ChatMessage {
  const intent = detectIntent(query)
  const answer = buildAnswer(intent, query)

  return {
    id: `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role: 'assistant',
    content: locale === 'ru' ? answer.ru : answer.en,
    intent,
    citations: answer.citations,
    metrics: answer.metrics,
    followUps: answer.followUps,
    timestamp: new Date(),
    latencyMs: Math.floor(Math.random() * 900) + 380,
  }
}

/** Streaming simulation: split a reply into chunks for a typewriter effect. */
export function chunkContent(content: string, chunkSize: number = 3): string[] {
  const words = content.split(' ')
  const chunks: string[] = []
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '))
  }
  return chunks
}
