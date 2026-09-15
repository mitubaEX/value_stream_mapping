import { describe, it, expect } from 'vitest'
import { createStep, defaultThresholds, type ValueStream } from '../domain/types'
import { reducer, initialValueStream } from './reducer'

const base = (): ValueStream => ({
  title: 't',
  unit: 'd',
  thresholds: defaultThresholds,
  steps: [
    createStep({ id: 'a', name: 'A' }),
    createStep({ id: 'b', name: 'B' }),
    createStep({ id: 'c', name: 'C' }),
  ],
})

describe('reducer', () => {
  it('addStep は末尾に追加し、名前は連番になる', () => {
    const s = reducer(base(), { type: 'addStep' })
    expect(s.steps).toHaveLength(4)
    expect(s.steps[3].name).toBe('工程 4')
  })

  it('updateStep は id が一致する工程だけ更新する', () => {
    const s = reducer(base(), { type: 'updateStep', id: 'b', patch: { processTime: 9 } })
    expect(s.steps[1].processTime).toBe(9)
    expect(s.steps[0].processTime).toBe(0)
  })

  it('removeStep は id の工程を削除する', () => {
    const s = reducer(base(), { type: 'removeStep', id: 'b' })
    expect(s.steps.map((x) => x.id)).toEqual(['a', 'c'])
  })

  it('moveStep: 先頭を上へ / 末尾を下へは何もしない', () => {
    expect(reducer(base(), { type: 'moveStep', id: 'a', dir: -1 }).steps.map((x) => x.id)).toEqual(['a', 'b', 'c'])
    expect(reducer(base(), { type: 'moveStep', id: 'c', dir: 1 }).steps.map((x) => x.id)).toEqual(['a', 'b', 'c'])
  })

  it('moveStep: 中央を上下に動かせる', () => {
    expect(reducer(base(), { type: 'moveStep', id: 'b', dir: -1 }).steps.map((x) => x.id)).toEqual(['b', 'a', 'c'])
    expect(reducer(base(), { type: 'moveStep', id: 'b', dir: 1 }).steps.map((x) => x.id)).toEqual(['a', 'c', 'b'])
  })

  it('toggleSkip は skipped を反転する', () => {
    const s1 = reducer(base(), { type: 'toggleSkip', id: 'a' })
    expect(s1.steps[0].skipped).toBe(true)
    const s2 = reducer(s1, { type: 'toggleSkip', id: 'a' })
    expect(s2.steps[0].skipped).toBe(false)
  })

  it('setTitle / setUnit / setThresholds', () => {
    let s = reducer(base(), { type: 'setTitle', title: 'new' })
    s = reducer(s, { type: 'setUnit', unit: 'h' })
    s = reducer(s, { type: 'setThresholds', thresholds: { waitRatio: 0.5, percentCA: 90 } })
    expect(s.title).toBe('new')
    expect(s.unit).toBe('h')
    expect(s.thresholds).toEqual({ waitRatio: 0.5, percentCA: 90 })
  })

  it('load は丸ごと置き換え、reset は初期値に戻す', () => {
    const loaded = reducer(base(), { type: 'load', value: { ...base(), title: 'loaded', steps: [] } })
    expect(loaded.title).toBe('loaded')
    expect(loaded.steps).toEqual([])
    const r = reducer(loaded, { type: 'reset' })
    expect(r.title).toBe(initialValueStream().title)
    expect(r.steps.length).toBeGreaterThan(0)
  })

  it('reducer は元の state を変更しない', () => {
    const b = base()
    reducer(b, { type: 'updateStep', id: 'a', patch: { name: 'X' } })
    expect(b.steps[0].name).toBe('A')
  })
})
