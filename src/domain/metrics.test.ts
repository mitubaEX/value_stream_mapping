import { describe, it, expect } from 'vitest'
import { createStep } from './types'
import { calcMetrics } from './metrics'

const step = (over: Partial<Parameters<typeof createStep>[0]> = {}) =>
  createStep({ name: 's', processTime: 1, leadTime: 2, waitBefore: 0, percentCA: 100, ...over })

describe('calcMetrics', () => {
  it('工程 0 件では全て 0、Rolled %C&A は 100', () => {
    expect(calcMetrics([])).toEqual({
      totalLeadTime: 0,
      totalProcessTime: 0,
      activityRatio: 0,
      rolledPercentCA: 100,
      stepCount: 0,
    })
  })

  it('1 件: LT = waitBefore + leadTime、PT = processTime', () => {
    const m = calcMetrics([step({ processTime: 2, leadTime: 5, waitBefore: 3, percentCA: 80 })])
    expect(m.totalLeadTime).toBe(8)
    expect(m.totalProcessTime).toBe(2)
    expect(m.activityRatio).toBeCloseTo(0.25)
    expect(m.rolledPercentCA).toBeCloseTo(80)
    expect(m.stepCount).toBe(1)
  })

  it('複数件: 合計と Rolled %C&A の積', () => {
    const m = calcMetrics([
      step({ processTime: 2, leadTime: 5, waitBefore: 0, percentCA: 80 }),
      step({ processTime: 3, leadTime: 10, waitBefore: 7, percentCA: 50 }),
    ])
    expect(m.totalLeadTime).toBe(22)
    expect(m.totalProcessTime).toBe(5)
    expect(m.activityRatio).toBeCloseTo(5 / 22)
    expect(m.rolledPercentCA).toBeCloseTo(40)
  })

  it('%C&A = 0 の工程があれば Rolled は 0', () => {
    const m = calcMetrics([step({ percentCA: 0 }), step({ percentCA: 90 })])
    expect(m.rolledPercentCA).toBe(0)
  })

  it('LT 合計 0 なら activityRatio は 0 (NaN にしない)', () => {
    const m = calcMetrics([step({ processTime: 0, leadTime: 0, waitBefore: 0 })])
    expect(m.activityRatio).toBe(0)
  })

  it('skipped の工程は計算対象外', () => {
    const m = calcMetrics([
      step({ processTime: 2, leadTime: 5, waitBefore: 1, percentCA: 50 }),
      step({ processTime: 9, leadTime: 9, waitBefore: 9, percentCA: 10, skipped: true }),
    ])
    expect(m.totalLeadTime).toBe(6)
    expect(m.totalProcessTime).toBe(2)
    expect(m.rolledPercentCA).toBeCloseTo(50)
    expect(m.stepCount).toBe(1)
  })
})
