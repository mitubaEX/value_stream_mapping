import type { ProcessStep, ValueStream } from './types'

const round2 = (n: number) => Math.round(n * 100) / 100

/** Current State: Future State 用の設定を無視した工程列 */
export function currentState(vs: ValueStream): ProcessStep[] {
  return vs.steps.map((s) => ({ ...s, skipped: false, waitReductionPct: 0 }))
}

/** Future State: 省略と待ち短縮を適用した工程列 */
export function applyScenario(vs: ValueStream): ProcessStep[] {
  return vs.steps
    .filter((s) => !s.skipped)
    .map((s) => {
      const keep = 1 - Math.min(100, Math.max(0, s.waitReductionPct)) / 100
      const innerWait = Math.max(0, s.leadTime - s.processTime)
      return {
        ...s,
        waitBefore: round2(s.waitBefore * keep),
        leadTime: round2(s.processTime + innerWait * keep),
        skipped: false,
        waitReductionPct: 0,
      }
    })
}
