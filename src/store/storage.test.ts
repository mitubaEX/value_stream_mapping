import { describe, it, expect, beforeEach } from 'vitest'
import { sampleValueStream } from '../domain/sample'
import { serialize, deserialize, saveToStorage, loadFromStorage, STORAGE_KEY } from './storage'

describe('serialize / deserialize', () => {
  it('往復で同じ内容になる', () => {
    const vs = sampleValueStream()
    expect(deserialize(serialize(vs))).toEqual(vs)
  })

  it('不正 JSON は null', () => {
    expect(deserialize('{oops')).toBeNull()
  })

  it('steps が配列でないなど形が違えば null', () => {
    expect(deserialize(JSON.stringify({ title: 'x', unit: 'd', steps: 'no' }))).toBeNull()
    expect(deserialize(JSON.stringify({ title: 'x', unit: 'week', steps: [] }))).toBeNull()
  })

  it('古いデータで欠けている項目はデフォルトで補う', () => {
    const json = JSON.stringify({
      title: 'old',
      unit: 'h',
      steps: [{ id: 'a', name: 'A', processTime: 1, leadTime: 2 }],
    })
    const vs = deserialize(json)!
    expect(vs.thresholds).toEqual({ waitRatio: 0.7, percentCA: 70 })
    expect(vs.steps[0]).toMatchObject({ waitBefore: 0, percentCA: 100, skipped: false, waitReductionPct: 0 })
  })
})

describe('localStorage', () => {
  beforeEach(() => localStorage.clear())

  it('保存して読み込める', () => {
    const vs = sampleValueStream()
    saveToStorage(vs)
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    expect(loadFromStorage()).toEqual(vs)
  })

  it('何もなければ null', () => {
    expect(loadFromStorage()).toBeNull()
  })
})
