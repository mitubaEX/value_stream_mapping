import { describe, it, expect } from 'vitest'
import { buildPrompt, extractJson, PROMPT_EXAMPLE_JSON } from './promptTemplate'
import { deserialize } from '../store/storage'

describe('buildPrompt', () => {
  it('JSON の全フィールド名と制約を含む', () => {
    const p = buildPrompt({ unit: 'd', title: 'テスト' })
    for (const k of ['title', 'unit', 'steps', 'thresholds', 'name', 'owner', 'processTime', 'leadTime', 'waitBefore', 'percentCA', 'note']) {
      expect(p).toContain(`"${k}"`)
    }
    expect(p).toMatch(/"leadTime" は必ず "processTime" 以上/)
    expect(p).toMatch(/JSON のみ/)
  })

  it('単位と対象の説明が反映される', () => {
    expect(buildPrompt({ unit: 'h', title: 'x' })).toContain('"unit": "h"')
    expect(buildPrompt({ unit: 'd', title: 'x' })).toContain('"unit": "d"')
    expect(buildPrompt({ unit: 'd', title: 'x', description: '採用面接の流れ' })).toContain('採用面接の流れ')
  })

  it('プロンプト内の例 JSON はそのまま読み込める', () => {
    const vs = deserialize(PROMPT_EXAMPLE_JSON)
    expect(vs).not.toBeNull()
    expect(vs!.steps.length).toBeGreaterThan(0)
    expect(buildPrompt({ unit: 'd', title: 'x' })).toContain(PROMPT_EXAMPLE_JSON)
  })
})

describe('extractJson', () => {
  it('素の JSON はそのまま', () => {
    expect(extractJson('{"a":1}')).toBe('{"a":1}')
  })
  it('```json フェンスや前後の文章を取り除く', () => {
    const text = 'はい、こちらです。\n```json\n{"a": 1}\n```\n以上です。'
    expect(extractJson(text)).toBe('{"a": 1}')
  })
  it('フェンスなしで前後に文章がある場合も最初の { から最後の } を取る', () => {
    expect(extractJson('結果: {"a":{"b":2}} です')).toBe('{"a":{"b":2}}')
  })
  it('JSON らしきものがなければ空文字', () => {
    expect(extractJson('なし')).toBe('')
  })
})
