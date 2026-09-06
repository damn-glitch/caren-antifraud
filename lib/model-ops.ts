// CAREN - Model Operations
// Production ML health: data drift, concept drift, fairness and champion/challenger.
// Author: Alisher Beisembekov

export type DriftType = 'data_drift' | 'concept_drift' | 'prediction_drift' | 'none'
export type ModelHealth = 'healthy' | 'degrading' | 'critical' | 'retraining'

export interface FeatureDrift {
  feature: string
  /** Population Stability Index — the industry standard drift measure. */
  psi: number
  baselineMean: number
  currentMean: number
  status: 'stable' | 'moderate' | 'significant'
}

export interface FairnessMetric {
  segment: { en: string; ru: string }
  approvalRate: number
  falsePositiveRate: number
  /** Ratio against the reference group; below 0.8 fails the four-fifths rule. */
  disparateImpact: number
  passes: boolean
}

export interface DeployedModel {
  id: string
  name: string
  version: string
  role: 'champion' | 'challenger' | 'shadow'
  health: ModelHealth
  deployedAt: Date
  trafficPct: number
  accuracy: number
  precision: number
  recall: number
  auc: number
  latencyP99Ms: number
  driftType: DriftType
  overallPsi: number
  featureDrift: FeatureDrift[]
  fairness: FairnessMetric[]
  predictionsPerDay: number
  narrative: { en: string; ru: string }
  retrainRecommended: boolean
  accuracyHistory: { day: number; accuracy: number; baseline: number }[]
}

export const HEALTH_META: Record<ModelHealth, { en: string; ru: string; color: string }> = {
  healthy: { en: 'Healthy', ru: 'В норме', color: '#10b981' },
  degrading: { en: 'Degrading', ru: 'Деградирует', color: '#f59e0b' },
  critical: { en: 'Critical', ru: 'Критично', color: '#ef4444' },
  retraining: { en: 'Retraining', ru: 'Переобучение', color: '#8b5cf6' },
}

export const DRIFT_META: Record<DriftType, { en: string; ru: string; descEn: string; descRu: string }> = {
  data_drift: {
    en: 'Data drift',
    ru: 'Дрейф данных',
    descEn: 'Input distribution has moved away from the training distribution.',
    descRu: 'Распределение входных данных отошло от обучающего распределения.',
  },
  concept_drift: {
    en: 'Concept drift',
    ru: 'Дрейф концепции',
    descEn: 'The relationship between features and fraud has changed — attackers adapted.',
    descRu: 'Связь между признаками и мошенничеством изменилась — атакующие адаптировались.',
  },
  prediction_drift: {
    en: 'Prediction drift',
    ru: 'Дрейф прогнозов',
    descEn: 'Output score distribution shifted without a matching input change.',
    descRu: 'Распределение выходных оценок сместилось без соответствующего изменения входных данных.',
  },
  none: {
    en: 'No drift',
    ru: 'Дрейф отсутствует',
    descEn: 'Input and output distributions remain within tolerance.',
    descRu: 'Распределения входа и выхода остаются в пределах допуска.',
  },
}

const MODEL_NAMES = [
  { name: 'Random Forest Ensemble', version: 'v2.4.1' },
  { name: 'XGBoost Gradient', version: 'v3.1.0' },
  { name: 'Logistic Baseline', version: 'v1.8.2' },
  { name: 'Deep Autoencoder', version: 'v0.9.4' },
  { name: 'Isolation Forest', version: 'v1.2.7' },
]

const FEATURES = ['V14', 'V4', 'V12', 'V10', 'V11', 'V17', 'V3', 'Amount']

const SEGMENTS: { en: string; ru: string }[] = [
  { en: 'Age 18–25', ru: 'Возраст 18–25' },
  { en: 'Age 26–45', ru: 'Возраст 26–45' },
  { en: 'Age 46+', ru: 'Возраст 46+' },
  { en: 'New customers', ru: 'Новые клиенты' },
  { en: 'Cross-border', ru: 'Трансграничные' },
]

function buildNarrative(
  driftType: DriftType,
  psi: number,
  health: ModelHealth,
  topFeature: FeatureDrift | undefined,
  fairnessFails: number
): { en: string; ru: string } {
  if (driftType === 'none' && fairnessFails === 0) {
    return {
      en: `Model is operating within tolerance. Overall PSI of ${psi.toFixed(3)} sits well below the 0.1 action threshold, and every demographic segment passes the four-fifths fairness test. No intervention needed this cycle.`,
      ru: `Модель работает в пределах допуска. Совокупный PSI ${psi.toFixed(3)} значительно ниже порога действия 0,1, и все демографические сегменты проходят тест «четырёх пятых» на справедливость. Вмешательство в этом цикле не требуется.`,
    }
  }

  if (fairnessFails > 0) {
    return {
      en: `Fairness review required. ${fairnessFails} segment${fairnessFails > 1 ? 's' : ''} fell below the 0.8 disparate-impact ratio, meaning the model declines those groups disproportionately relative to the reference population.\n\nThis matters independently of accuracy: a model can be statistically correct and still be unusable if its errors concentrate on one group. Recommend reweighting the training set before the next deployment rather than adjusting thresholds per segment, which creates its own compliance exposure.`,
      ru: `Требуется проверка справедливости. ${fairnessFails} сегмент${fairnessFails > 1 ? 'а' : ''} опустились ниже коэффициента диспропорционального воздействия 0,8, то есть модель отклоняет эти группы непропорционально по сравнению с эталонной популяцией.\n\nЭто важно независимо от точности: модель может быть статистически корректной и при этом непригодной, если её ошибки концентрируются на одной группе. Рекомендуется перевзвесить обучающую выборку перед следующим развёртыванием, а не корректировать пороги по сегментам — последнее само по себе создаёт комплаенс-риск.`,
    }
  }

  if (driftType === 'concept_drift') {
    return {
      en: `Concept drift detected — the most consequential kind. Input distributions look broadly normal, but the mapping from features to fraud outcomes has shifted, which means attackers have adapted to the current model rather than the data simply changing around it.\n\n${topFeature ? `${topFeature.feature} shows the clearest movement, with its mean going from ${topFeature.baselineMean.toFixed(2)} to ${topFeature.currentMean.toFixed(2)}. ` : ''}Threshold tuning will not fix this; the decision boundary itself is stale. Retraining on recent labelled data is the only durable response.`,
      ru: `Обнаружен дрейф концепции — наиболее значимый его вид. Распределения входных данных выглядят в целом нормально, однако отображение признаков в исходы мошенничества сместилось, а значит атакующие адаптировались именно к текущей модели, а не данные просто изменились вокруг неё.\n\n${topFeature ? `Наиболее явное движение показывает ${topFeature.feature}: среднее сместилось с ${topFeature.baselineMean.toFixed(2)} до ${topFeature.currentMean.toFixed(2)}. ` : ''}Настройка порогов это не исправит: устарела сама решающая граница. Единственный устойчивый ответ — переобучение на свежих размеченных данных.`,
    }
  }

  return {
    en: `Overall PSI has reached ${psi.toFixed(3)}, above the 0.1 monitoring threshold.${topFeature ? ` ${topFeature.feature} contributes most, moving from ${topFeature.baselineMean.toFixed(2)} to ${topFeature.currentMean.toFixed(2)}.` : ''}\n\nData drift at this level usually reflects a genuine change in transaction mix rather than model failure — a new merchant category, a seasonal shift, or a product launch. Worth confirming the cause before retraining: retraining on drifted-but-correct data bakes the drift in.`,
    ru: `Совокупный PSI достиг ${psi.toFixed(3)}, превысив порог мониторинга 0,1.${topFeature ? ` Наибольший вклад вносит ${topFeature.feature}, сместившись с ${topFeature.baselineMean.toFixed(2)} до ${topFeature.currentMean.toFixed(2)}.` : ''}\n\nДрейф данных такого уровня обычно отражает реальное изменение структуры операций, а не сбой модели: новая категория продавцов, сезонный сдвиг или запуск продукта. Стоит подтвердить причину до переобучения: переобучение на дрейфующих, но корректных данных закрепит этот дрейф.`,
  }
}

export function generateDeployedModel(index: number): DeployedModel {
  const meta = MODEL_NAMES[index % MODEL_NAMES.length]
  const role: DeployedModel['role'] = index === 0 ? 'champion' : index === 1 ? 'challenger' : 'shadow'

  const driftTypes: DriftType[] = ['none', 'none', 'data_drift', 'concept_drift', 'prediction_drift']
  const driftType = driftTypes[Math.floor(Math.random() * driftTypes.length)]

  const overallPsi = driftType === 'none'
    ? Math.random() * 0.07
    : driftType === 'concept_drift'
      ? Math.random() * 0.12 + 0.06
      : Math.random() * 0.22 + 0.11

  const featureDrift: FeatureDrift[] = FEATURES.map(feature => {
    const baselineMean = (Math.random() - 0.5) * 3
    const shift = driftType === 'none' ? Math.random() * 0.2 : Math.random() * 1.6
    const currentMean = baselineMean + (Math.random() > 0.5 ? shift : -shift)
    const psi = Math.abs(currentMean - baselineMean) * 0.14
    const status: FeatureDrift['status'] =
      psi > 0.2 ? 'significant' : psi > 0.1 ? 'moderate' : 'stable'

    return { feature, psi, baselineMean, currentMean, status }
  }).sort((a, b) => b.psi - a.psi)

  const fairness: FairnessMetric[] = SEGMENTS.map((segment, i) => {
    const approvalRate = 0.7 + Math.random() * 0.28
    // The first segment acts as the reference group at parity.
    const disparateImpact = i === 0 ? 1 : 0.66 + Math.random() * 0.42
    return {
      segment,
      approvalRate,
      falsePositiveRate: Math.random() * 0.05,
      disparateImpact,
      passes: disparateImpact >= 0.8,
    }
  })

  const fairnessFails = fairness.filter(f => !f.passes).length

  const health: ModelHealth =
    role === 'shadow' ? 'healthy'
    : overallPsi > 0.25 || fairnessFails > 1 ? 'critical'
    : overallPsi > 0.1 || fairnessFails > 0 ? 'degrading'
    : 'healthy'

  const baseAccuracy = 0.9994 - index * 0.008
  const accuracyHistory = Array.from({ length: 30 }, (_, day) => {
    const decay = driftType === 'none' ? 0 : (day / 29) * (overallPsi * 0.08)
    return {
      day: day + 1,
      accuracy: Math.max(0.9, baseAccuracy - decay + (Math.random() - 0.5) * 0.004),
      baseline: baseAccuracy,
    }
  })

  return {
    id: `MDL-${String(100 + index)}`,
    name: meta.name,
    version: meta.version,
    role,
    health,
    deployedAt: new Date(Date.now() - Math.floor(Math.random() * 180 + 10) * 86400000),
    trafficPct: role === 'champion' ? 85 : role === 'challenger' ? 15 : 0,
    accuracy: accuracyHistory[accuracyHistory.length - 1].accuracy,
    precision: 0.9412 - index * 0.02 - overallPsi * 0.2,
    recall: 0.8163 - index * 0.03 - overallPsi * 0.3,
    auc: 0.9821 - index * 0.01 - overallPsi * 0.1,
    latencyP99Ms: Math.floor(Math.random() * 40) + 18,
    driftType,
    overallPsi,
    featureDrift,
    fairness,
    predictionsPerDay: Math.floor(Math.random() * 90000) + 30000,
    narrative: buildNarrative(driftType, overallPsi, health, featureDrift[0], fairnessFails),
    retrainRecommended: health === 'critical' || driftType === 'concept_drift',
    accuracyHistory,
  }
}

export function generateDeployedModels(count: number = 5): DeployedModel[] {
  return Array.from({ length: count }, (_, i) => generateDeployedModel(i))
}

export function summarizeModelOps(models: DeployedModel[]) {
  return {
    total: models.length,
    healthy: models.filter(m => m.health === 'healthy').length,
    degrading: models.filter(m => m.health === 'degrading').length,
    critical: models.filter(m => m.health === 'critical').length,
    retrainNeeded: models.filter(m => m.retrainRecommended).length,
    fairnessFailures: models.reduce(
      (sum, m) => sum + m.fairness.filter(f => !f.passes).length,
      0
    ),
    avgPsi: models.reduce((sum, m) => sum + m.overallPsi, 0) / (models.length || 1),
    totalPredictions: models.reduce((sum, m) => sum + m.predictionsPerDay, 0),
  }
}
