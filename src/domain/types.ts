export type TimeUnit = 'h' | 'd'

export type ProcessStep = {
  id: string
  name: string
  owner?: string
  /** 実作業時間 */
  processTime: number
  /** 経過時間 (processTime を含む) */
  leadTime: number
  /** 前工程からこの工程が始まるまでの待ち時間 */
  waitBefore: number
  /** 一発で正しく完了する率 0..100 */
  percentCA: number
  note?: string
  /** Future State: この工程を省略する */
  skipped: boolean
  /** Future State: 待ち時間(waitBefore と leadTime 内の待ち)を何 % 削減するか 0..100 */
  waitReductionPct: number
}

export type Thresholds = {
  /** 工程内の待ち比率 (1 - PT/LT) がこれ以上なら ⚡ */
  waitRatio: number
  /** %C&A がこれ未満なら ⚡ */
  percentCA: number
}

export type ValueStream = {
  title: string
  unit: TimeUnit
  steps: ProcessStep[]
  thresholds: Thresholds
}

export type Metrics = {
  totalLeadTime: number
  totalProcessTime: number
  /** Σ PT / Σ LT。LT が 0 のときは 0 */
  activityRatio: number
  /** Π %C&A を 0..100 で。工程が無いときは 100 */
  rolledPercentCA: number
  stepCount: number
}

export function createStep(partial: Partial<ProcessStep> & { name: string }): ProcessStep {
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name,
    owner: partial.owner,
    processTime: partial.processTime ?? 0,
    leadTime: partial.leadTime ?? 0,
    waitBefore: partial.waitBefore ?? 0,
    percentCA: partial.percentCA ?? 100,
    note: partial.note,
    skipped: partial.skipped ?? false,
    waitReductionPct: partial.waitReductionPct ?? 0,
  }
}

export const defaultThresholds: Thresholds = { waitRatio: 0.7, percentCA: 70 }
