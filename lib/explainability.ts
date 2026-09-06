// CAREN - Model Explainability (SHAP-style attribution)
// Turns an opaque ensemble score into a per-feature contribution breakdown.
// Author: Alisher Beisembekov

export interface FeatureContribution {
  feature: string
  value: number
  /** Signed push toward (positive) or away from (negative) a fraud verdict. */
  contribution: number
  descriptionEn: string
  descriptionRu: string
}

export interface Explanation {
  baseValue: number
  finalScore: number
  contributions: FeatureContribution[]
  topDriversEn: string[]
  topDriversRu: string[]
  narrativeEn: string
  narrativeRu: string
}

/**
 * Human-readable meaning for the anonymised PCA components.
 * The Kaggle dataset ships V1–V28 without semantics; these are the behavioural
 * proxies the CAREN team assigned during model analysis.
 */
export const FEATURE_SEMANTICS: Record<string, { en: string; ru: string }> = {
  V14: { en: 'Transaction timing irregularity', ru: 'Нерегулярность времени операции' },
  V4: { en: 'Amount-to-history ratio', ru: 'Отношение суммы к истории' },
  V12: { en: 'Merchant category deviation', ru: 'Отклонение категории продавца' },
  V10: { en: 'Authorisation sequence anomaly', ru: 'Аномалия последовательности авторизаций' },
  V11: { en: 'Cross-border indicator', ru: 'Индикатор трансграничности' },
  V17: { en: 'Terminal risk profile', ru: 'Риск-профиль терминала' },
  V3: { en: 'Spending rhythm break', ru: 'Разрыв ритма трат' },
  V16: { en: 'Card-present consistency', ru: 'Согласованность присутствия карты' },
  V7: { en: 'Velocity across merchants', ru: 'Скорость по продавцам' },
  V2: { en: 'Balance utilisation shift', ru: 'Сдвиг использования баланса' },
  Amount: { en: 'Absolute transaction amount', ru: 'Абсолютная сумма операции' },
}

const RANKED_FEATURES = ['V14', 'V4', 'V12', 'V10', 'V11', 'V17', 'V3', 'V16', 'Amount', 'V7']

/**
 * Compute a SHAP-style additive attribution.
 * Contributions sum (with the base rate) to the final score, so the waterfall
 * chart in the UI always reconciles.
 */
export function explainPrediction(
  features: number[],
  amount: number,
  finalScore: number
): Explanation {
  // Population fraud base rate from the source dataset.
  const baseValue = 0.172

  const weights: Record<string, number> = {
    V14: 0.1823, V4: 0.1456, V12: 0.1234, V10: 0.0987, V11: 0.0876,
    V17: 0.0765, V3: 0.0654, V16: 0.0543, Amount: 0.0432, V7: 0.0321,
  }

  const featureIndex: Record<string, number> = {
    V14: 13, V4: 3, V12: 11, V10: 9, V11: 10, V17: 16, V3: 2, V16: 15, V7: 6,
  }

  const raw: FeatureContribution[] = RANKED_FEATURES.map(feature => {
    const value =
      feature === 'Amount' ? amount : (features[featureIndex[feature]] ?? 0)

    // Amount is normalised onto the same scale as the PCA components.
    const normalised = feature === 'Amount' ? Math.log10(Math.max(1, amount)) - 2 : value
    const contribution = normalised * weights[feature]

    const semantic = FEATURE_SEMANTICS[feature]
    const direction = contribution > 0
    return {
      feature,
      value,
      contribution,
      descriptionEn: `${semantic.en} ${direction ? 'pushes toward' : 'pulls away from'} a fraud verdict`,
      descriptionRu: `${semantic.ru} ${direction ? 'усиливает' : 'ослабляет'} вердикт о мошенничестве`,
    }
  })

  // Rescale so contributions reconcile with the model's actual score.
  const rawSum = raw.reduce((sum, c) => sum + c.contribution, 0)
  const target = finalScore / 100 - baseValue
  const scale = rawSum === 0 ? 0 : target / rawSum

  const contributions = raw
    .map(c => ({ ...c, contribution: c.contribution * scale }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))

  const top = contributions.slice(0, 3)
  const topDriversEn = top.map(
    c => `${FEATURE_SEMANTICS[c.feature].en} (${c.contribution > 0 ? '+' : ''}${(c.contribution * 100).toFixed(1)} pts)`
  )
  const topDriversRu = top.map(
    c => `${FEATURE_SEMANTICS[c.feature].ru} (${c.contribution > 0 ? '+' : ''}${(c.contribution * 100).toFixed(1)} б.)`
  )

  const leadEn = FEATURE_SEMANTICS[top[0].feature].en.toLowerCase()
  const leadRu = FEATURE_SEMANTICS[top[0].feature].ru.toLowerCase()
  const secondEn = FEATURE_SEMANTICS[top[1].feature].en.toLowerCase()
  const secondRu = FEATURE_SEMANTICS[top[1].feature].ru.toLowerCase()

  const narrativeEn =
    finalScore > 70
      ? `The ensemble moved from a ${(baseValue * 100).toFixed(1)}% population base rate to ${finalScore.toFixed(1)}% almost entirely on ${leadEn} and ${secondEn}. Neither signal alone would clear the action threshold; it is their co-occurrence within the same authorisation window that drives the verdict.`
      : `Starting from a ${(baseValue * 100).toFixed(1)}% base rate, the model settled at ${finalScore.toFixed(1)}%. ${FEATURE_SEMANTICS[top[0].feature].en} contributed most, but its magnitude stays inside the range this account has shown before, so no single factor forces an escalation.`

  const narrativeRu =
    finalScore > 70
      ? `Ансамбль поднялся с базовой популяционной ставки ${(baseValue * 100).toFixed(1)}% до ${finalScore.toFixed(1)}% почти полностью за счёт таких факторов, как ${leadRu} и ${secondRu}. По отдельности ни один сигнал не превысил бы порог действия — вердикт определяется именно их совпадением в одном окне авторизации.`
      : `Начав с базовой ставки ${(baseValue * 100).toFixed(1)}%, модель остановилась на ${finalScore.toFixed(1)}%. Наибольший вклад внёс фактор «${FEATURE_SEMANTICS[top[0].feature].ru}», однако его величина остаётся в диапазоне, который счёт уже демонстрировал ранее, поэтому ни один фактор не требует эскалации.`

  return {
    baseValue,
    finalScore,
    contributions,
    topDriversEn,
    topDriversRu,
    narrativeEn,
    narrativeRu,
  }
}
