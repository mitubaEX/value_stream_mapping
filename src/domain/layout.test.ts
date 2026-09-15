import { describe, it, expect } from 'vitest'
import { createStep } from './types'
import { layoutValueStream, LAYOUT } from './layout'

const steps = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    createStep({ id: `s${i}`, name: `S${i}`, processTime: 1, leadTime: 3, waitBefore: 2 }),
  )

describe('layoutValueStream', () => {
  it('0 件でも幅・高さは正で、入口と出口ノードを持つ', () => {
    const l = layoutValueStream([])
    expect(l.width).toBeGreaterThan(0)
    expect(l.height).toBeGreaterThan(0)
    expect(l.nodes).toEqual([])
    expect(l.customerIn.x).toBeLessThan(l.customerOut.x)
  })

  it('1 件: ノードは入口と出口の間にある', () => {
    const l = layoutValueStream(steps(1))
    const n = l.nodes[0]
    expect(n.x).toBeGreaterThan(l.customerIn.x + l.customerIn.w)
    expect(n.x + n.w).toBeLessThan(l.customerOut.x)
  })

  it('5 件: x が単調増加し、幅は件数に比例して伸びる', () => {
    const l5 = layoutValueStream(steps(5))
    const xs = l5.nodes.map((n) => n.x)
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1])
    const l1 = layoutValueStream(steps(1))
    expect(l5.width - l1.width).toBe(4 * LAYOUT.stepPitch)
  })

  it('各ノードは待ち(▲)とタイムライン区間を持つ', () => {
    const l = layoutValueStream(steps(2))
    const n = l.nodes[1]
    expect(n.wait.x).toBeLessThan(n.x)
    expect(n.wait.label).toBe('2')
    // タイムライン: 待ち区間 (上段) と PT 区間 (下段) が連続している
    expect(n.timeline.wait.x).toBeLessThan(n.timeline.pt.x)
    expect(n.timeline.wait.x + n.timeline.wait.w).toBeCloseTo(n.timeline.pt.x)
    expect(n.timeline.wait.label).toBe('4') // waitBefore 2 + (LT 3 - PT 1)
    expect(n.timeline.pt.label).toBe('1')
  })

  it('タイムラインの幅は時間に比例する', () => {
    const l = layoutValueStream([
      createStep({ id: 'a', name: 'A', processTime: 2, leadTime: 2, waitBefore: 0 }),
      createStep({ id: 'b', name: 'B', processTime: 4, leadTime: 4, waitBefore: 0 }),
    ])
    expect(l.nodes[1].timeline.pt.w).toBeCloseTo(l.nodes[0].timeline.pt.w * 2)
    expect(l.nodes[0].timeline.wait.w).toBe(0)
  })
})
