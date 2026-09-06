// CAREN - Fraud Ring Detection via Graph Intelligence
// Builds link-analysis graphs that expose coordinated fraud networks.
// Author: Alisher Beisembekov

export type NodeRole = 'orchestrator' | 'partner' | 'sub_affiliate' | 'mule' | 'client'

export type LinkType =
  | 'shared_device'
  | 'shared_ip'
  | 'shared_card_bin'
  | 'shared_address'
  | 'money_flow'
  | 'referral'

export interface RingNode {
  id: string
  label: string
  role: NodeRole
  riskScore: number
  transactionCount: number
  totalVolume: number
  /** Normalised layout position in [0,1] — precomputed so rendering stays deterministic. */
  x: number
  y: number
}

export interface RingEdge {
  source: string
  target: string
  type: LinkType
  strength: number
}

export interface FraudRing {
  id: string
  name: string
  detectedAt: Date
  lastActivity: Date
  status: 'monitoring' | 'escalated' | 'dismantled'
  confidence: number
  exposure: number
  nodes: RingNode[]
  edges: RingEdge[]
  detectionMethods: LinkType[]
  sharedAttributes: { type: LinkType; value: string; sharedBy: number }[]
  counts: {
    orchestrators: number
    partners: number
    subAffiliates: number
    mules: number
    clients: number
  }
}

export const LINK_LABELS: Record<LinkType, { en: string; ru: string }> = {
  shared_device: { en: 'Shared Device', ru: 'Общее устройство' },
  shared_ip: { en: 'Shared IP', ru: 'Общий IP' },
  shared_card_bin: { en: 'Shared Card BIN', ru: 'Общий BIN карты' },
  shared_address: { en: 'Shared Address', ru: 'Общий адрес' },
  money_flow: { en: 'Money Flow', ru: 'Движение средств' },
  referral: { en: 'Referral Link', ru: 'Реферальная связь' },
}

export const ROLE_LABELS: Record<NodeRole, { en: string; ru: string }> = {
  orchestrator: { en: 'Orchestrator', ru: 'Организатор' },
  partner: { en: 'Partner', ru: 'Партнёр' },
  sub_affiliate: { en: 'Sub-Affiliate', ru: 'Суб-аффилиат' },
  mule: { en: 'Money Mule', ru: 'Дроп-счёт' },
  client: { en: 'Referred Client', ru: 'Привлечённый клиент' },
}

export const ROLE_COLORS: Record<NodeRole, string> = {
  orchestrator: '#ef4444',
  partner: '#f59e0b',
  sub_affiliate: '#8b5cf6',
  mule: '#06b6d4',
  client: '#64748b',
}

const RING_NAMES = [
  'Operation Nightshade', 'Cluster Halberd', 'Network Vermillion',
  'Operation Tidewater', 'Cluster Obsidian', 'Network Falconry',
  'Operation Greyhound', 'Cluster Meridian',
]

const DEVICE_IDS = ['DEV-8A3F21', 'DEV-C90B47', 'DEV-1E5D93', 'DEV-77AC02']
const IP_ADDRS = ['185.220.101.44', '91.219.237.18', '45.153.160.7', '194.26.29.112']
const CARD_BINS = ['457173', '531842', '424242', '552461']
const ADDRESSES = ['14 Kestrel Row, Valletta', '88 Harbour St, Limassol', '3 Palm Court, Panama City']

/**
 * Lay nodes out in concentric rings by role so the graph reads as a hierarchy:
 * orchestrator at the centre, clients on the outer rim.
 */
function layoutNode(role: NodeRole, index: number, total: number): { x: number; y: number } {
  const radiusByRole: Record<NodeRole, number> = {
    orchestrator: 0,
    partner: 0.18,
    sub_affiliate: 0.32,
    mule: 0.42,
    client: 0.48,
  }
  const radius = radiusByRole[role]
  if (radius === 0) return { x: 0.5, y: 0.5 }

  // Golden-angle offset keeps rings from aligning into visual spokes.
  const angle = (index / Math.max(1, total)) * Math.PI * 2 + index * 0.618
  return {
    x: 0.5 + Math.cos(angle) * radius,
    y: 0.5 + Math.sin(angle) * radius,
  }
}

/** Build one fraud ring with a realistic role hierarchy and link structure. */
export function generateFraudRing(seedIndex: number = 0): FraudRing {
  const partnerCount = Math.floor(Math.random() * 5) + 3
  const subAffiliateCount = Math.floor(Math.random() * 14) + 8
  const muleCount = Math.floor(Math.random() * 6) + 3
  const clientCount = Math.floor(Math.random() * 40) + 25

  const nodes: RingNode[] = []
  const edges: RingEdge[] = []

  const orchestratorId = `N-ORC-${seedIndex}`
  nodes.push({
    id: orchestratorId,
    label: `Orchestrator ${seedIndex + 1}`,
    role: 'orchestrator',
    riskScore: 92 + Math.random() * 8,
    transactionCount: Math.floor(Math.random() * 400) + 200,
    totalVolume: Math.floor(Math.random() * 900000) + 400000,
    ...layoutNode('orchestrator', 0, 1),
  })

  const partnerIds: string[] = []
  for (let i = 0; i < partnerCount; i++) {
    const id = `N-PTR-${seedIndex}-${i}`
    partnerIds.push(id)
    nodes.push({
      id,
      label: `Partner ${i + 1}`,
      role: 'partner',
      riskScore: 72 + Math.random() * 22,
      transactionCount: Math.floor(Math.random() * 220) + 60,
      totalVolume: Math.floor(Math.random() * 320000) + 80000,
      ...layoutNode('partner', i, partnerCount),
    })
    edges.push({
      source: orchestratorId,
      target: id,
      type: 'money_flow',
      strength: 0.7 + Math.random() * 0.3,
    })
  }

  const subIds: string[] = []
  for (let i = 0; i < subAffiliateCount; i++) {
    const id = `N-SUB-${seedIndex}-${i}`
    subIds.push(id)
    nodes.push({
      id,
      label: `Sub-Affiliate ${i + 1}`,
      role: 'sub_affiliate',
      riskScore: 54 + Math.random() * 32,
      transactionCount: Math.floor(Math.random() * 120) + 20,
      totalVolume: Math.floor(Math.random() * 90000) + 15000,
      ...layoutNode('sub_affiliate', i, subAffiliateCount),
    })
    edges.push({
      source: partnerIds[i % partnerIds.length],
      target: id,
      type: 'referral',
      strength: 0.45 + Math.random() * 0.4,
    })
  }

  for (let i = 0; i < muleCount; i++) {
    const id = `N-MUL-${seedIndex}-${i}`
    nodes.push({
      id,
      label: `Mule ${i + 1}`,
      role: 'mule',
      riskScore: 80 + Math.random() * 18,
      transactionCount: Math.floor(Math.random() * 90) + 30,
      totalVolume: Math.floor(Math.random() * 140000) + 40000,
      ...layoutNode('mule', i, muleCount),
    })
    edges.push({
      source: subIds[i % subIds.length],
      target: id,
      type: 'shared_device',
      strength: 0.6 + Math.random() * 0.4,
    })
    // Mules funnel value back to the orchestrator — the circular flow signature.
    edges.push({
      source: id,
      target: orchestratorId,
      type: 'money_flow',
      strength: 0.55 + Math.random() * 0.4,
    })
  }

  // Only a representative sample of clients is drawn; the full count lives in `counts`.
  const drawnClients = Math.min(clientCount, 22)
  for (let i = 0; i < drawnClients; i++) {
    const id = `N-CLI-${seedIndex}-${i}`
    nodes.push({
      id,
      label: `Client ${i + 1}`,
      role: 'client',
      riskScore: 22 + Math.random() * 42,
      transactionCount: Math.floor(Math.random() * 30) + 3,
      totalVolume: Math.floor(Math.random() * 12000) + 500,
      ...layoutNode('client', i, drawnClients),
    })
    edges.push({
      source: subIds[i % subIds.length],
      target: id,
      type: i % 4 === 0 ? 'shared_ip' : 'referral',
      strength: 0.25 + Math.random() * 0.4,
    })
  }

  const detectionMethods: LinkType[] = ['shared_device', 'shared_ip', 'money_flow', 'referral']
  if (Math.random() > 0.5) detectionMethods.push('shared_card_bin')
  if (Math.random() > 0.6) detectionMethods.push('shared_address')

  const exposure = nodes.reduce((sum, n) => sum + n.totalVolume, 0)

  return {
    id: `RING-${Date.now()}-${seedIndex}`,
    name: RING_NAMES[seedIndex % RING_NAMES.length],
    detectedAt: new Date(Date.now() - Math.floor(Math.random() * 40 + 5) * 86400000),
    lastActivity: new Date(Date.now() - Math.floor(Math.random() * 48) * 3600000),
    status: (['monitoring', 'escalated', 'dismantled'] as const)[Math.floor(Math.random() * 3)],
    confidence: 0.78 + Math.random() * 0.21,
    exposure,
    nodes,
    edges,
    detectionMethods,
    sharedAttributes: [
      {
        type: 'shared_device',
        value: DEVICE_IDS[seedIndex % DEVICE_IDS.length],
        sharedBy: Math.floor(Math.random() * 9) + 4,
      },
      {
        type: 'shared_ip',
        value: IP_ADDRS[seedIndex % IP_ADDRS.length],
        sharedBy: Math.floor(Math.random() * 14) + 6,
      },
      {
        type: 'shared_card_bin',
        value: CARD_BINS[seedIndex % CARD_BINS.length],
        sharedBy: Math.floor(Math.random() * 20) + 8,
      },
      {
        type: 'shared_address',
        value: ADDRESSES[seedIndex % ADDRESSES.length],
        sharedBy: Math.floor(Math.random() * 5) + 2,
      },
    ],
    counts: {
      orchestrators: 1,
      partners: partnerCount,
      subAffiliates: subAffiliateCount,
      mules: muleCount,
      clients: clientCount,
    },
  }
}

export function generateFraudRings(count: number = 5): FraudRing[] {
  return Array.from({ length: count }, (_, i) => generateFraudRing(i)).sort(
    (a, b) => b.exposure - a.exposure
  )
}

export function summarizeRings(rings: FraudRing[]) {
  const accounts = rings.reduce(
    (sum, r) =>
      sum +
      r.counts.orchestrators +
      r.counts.partners +
      r.counts.subAffiliates +
      r.counts.mules +
      r.counts.clients,
    0
  )
  return {
    ringsDetected: rings.length,
    accountsInvolved: accounts,
    totalExposure: rings.reduce((sum, r) => sum + r.exposure, 0),
    avgRingSize: Math.round(accounts / (rings.length || 1)),
    escalated: rings.filter(r => r.status === 'escalated').length,
  }
}
