import type { Metrics, ProcessStep } from './types'

/** 計算対象の工程 (skipped を除く) */
export function activeSteps(steps: ProcessStep[]): ProcessStep[] {
  return steps.filter((s) => !s.skipped)
}

/** 1 工程が占める経過時間 (前工程からの待ち + 工程内の経過時間) */
export function stepElapsed(step: ProcessStep): number {
  return step.waitBefore + step.leadTime
}

/** 工程内の待ち比率 1 - PT/LT。LT が 0 のときは 0 */
export function stepWaitRatio(step: ProcessStep): number {
  if (step.leadTime <= 0) return 0
  return Math.max(0, 1 - step.processTime / step.leadTime)
}

export function calcMetrics(steps: ProcessStep[]): Metrics {
  const active = activeSteps(steps)
  const totalLeadTime = active.reduce((acc, s) => acc + stepElapsed(s), 0)
  const totalProcessTime = active.reduce((acc, s) => acc + s.processTime, 0)
  const activityRatio = totalLeadTime > 0 ? totalProcessTime / totalLeadTime : 0
  const rolledPercentCA = active.reduce((acc, s) => acc * (s.percentCA / 100), 1) * 100
  return {
    totalLeadTime,
    totalProcessTime,
    activityRatio,
    rolledPercentCA,
    stepCount: active.length,
  }
}
