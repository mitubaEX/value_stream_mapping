import { describe, it, expect } from 'vitest'
import { createStep, type Thresholds } from './types'
import { detectWaste } from './waste'

const th: Thresholds = { waitRatio: 0.7, percentCA: 70 }
const step = (over: Partial<Parameters<typeof createStep>[0]> = {}) =>
  createStep({ id: 'x', name: 's', processTime: 5, leadTime: 5, waitBefore: 0, percentCA: 100, ...over })

describe('detectWaste', () => {
  it('問題なしなら空配列', () => {
    expect(detectWaste(step(), th)).toEqual([])
  })

  it('待ち比率がしきい値ちょうどなら該当 (以上)', () => {
    // PT 3 / LT 10 → 待ち比率 0.7
    const r = detectWaste(step({ processTime: 3, leadTime: 10 }), th)
    expect(r.map((w) => w.kind)).toEqual(['wait'])
  })

  it('待ち比率がしきい値未満なら非該当', () => {
    const r = detectWaste(step({ processTime: 4, leadTime: 10 }), th)
    expect(r).toEqual([])
  })

  it('%C&A がしきい値未満なら該当、ちょうどなら非該当', () => {
    expect(detectWaste(step({ percentCA: 69 }), th).map((w) => w.kind)).toEqual(['quality'])
    expect(detectWaste(step({ percentCA: 70 }), th)).toEqual([])
  })

  it('両方該当なら 2 件で、それぞれ説明文を持つ', () => {
    const r = detectWaste(step({ processTime: 1, leadTime: 10, percentCA: 30 }), th)
    expect(r.map((w) => w.kind)).toEqual(['wait', 'quality'])
    for (const w of r) expect(w.message.length).toBeGreaterThan(0)
  })
})
