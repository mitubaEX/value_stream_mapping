import { describe, it, expect } from 'vitest'
import { createStep, type ValueStream, defaultThresholds } from './types'
import { applyScenario, currentState } from './futureState'
import { calcMetrics } from './metrics'

const vs = (): ValueStream => ({
  title: 't',
  unit: 'd',
  thresholds: defaultThresholds,
  steps: [
    createStep({ id: 'a', name: 'A', processTime: 2, leadTime: 5, waitBefore: 3, percentCA: 80 }),
    createStep({
      id: 'b', name: 'B', processTime: 3, leadTime: 10, waitBefore: 7, percentCA: 50,
      skipped: true, waitReductionPct: 50,
    }),
    createStep({
      id: 'c', name: 'C', processTime: 1, leadTime: 9, waitBefore: 4, percentCA: 90,
      waitReductionPct: 50,
    }),
  ],
})

describe('currentState', () => {
  it('skipped と waitReductionPct を無視した工程列を返す', () => {
    const steps = currentState(vs())
    expect(steps.every((s) => !s.skipped && s.waitReductionPct === 0)).toBe(true)
    expect(calcMetrics(steps).totalLeadTime).toBe(3 + 5 + 7 + 10 + 4 + 9)
  })
})

describe('applyScenario', () => {
  it('skipped の工程は除外される', () => {
    const steps = applyScenario(vs())
    expect(steps.map((s) => s.id)).toEqual(['a', 'c'])
  })

  it('待ち短縮は waitBefore と (leadTime - processTime) の両方に効き、processTime は変えない', () => {
    const c = applyScenario(vs()).find((s) => s.id === 'c')!
    expect(c.waitBefore).toBe(2)          // 4 * 0.5
    expect(c.processTime).toBe(1)
    expect(c.leadTime).toBe(1 + 8 * 0.5)  // PT + 待ち 8 の半分
  })

  it('短縮 0% の工程は変わらない', () => {
    const a = applyScenario(vs()).find((s) => s.id === 'a')!
    expect(a).toMatchObject({ waitBefore: 3, leadTime: 5, processTime: 2 })
  })

  it('leadTime < processTime の不正入力でも leadTime は processTime を下回らない', () => {
    const v = vs()
    v.steps = [createStep({ id: 'z', name: 'Z', processTime: 5, leadTime: 3, waitBefore: 0, waitReductionPct: 100 })]
    const z = applyScenario(v)[0]
    expect(z.leadTime).toBe(5)
  })

  it('小数は 0.01 単位に丸める', () => {
    const v = vs()
    v.steps = [createStep({ id: 'z', name: 'Z', processTime: 0, leadTime: 1, waitBefore: 1, waitReductionPct: 33 })]
    const z = applyScenario(v)[0]
    expect(z.waitBefore).toBe(0.67)
    expect(z.leadTime).toBe(0.67)
  })
})
