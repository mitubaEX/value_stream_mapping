import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PromptPanel } from './PromptPanel'
import { sampleValueStream } from '../domain/sample'
import { serialize } from '../store/storage'

describe('PromptPanel', () => {
  it('開くとプロンプトが表示され、コピーできる', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<PromptPanel unit="d" title="t" onLoad={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /AI にデータを作らせる/ }))
    expect((screen.getByLabelText('AI に渡すプロンプト') as HTMLTextAreaElement).value).toContain('JSON のみ')
    fireEvent.click(screen.getByRole('button', { name: /プロンプトをコピー/ }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining('"steps"')))
    expect(await screen.findByText(/コピーしました/)).toBeInTheDocument()
  })

  it('AI の回答を貼り付けて読み込める (フェンス付きでも可)', () => {
    const onLoad = vi.fn()
    render(<PromptPanel unit="d" title="t" onLoad={onLoad} defaultOpen />)
    const ta = screen.getByLabelText('AI の回答を貼り付け')
    fireEvent.change(ta, { target: { value: '```json\n' + serialize(sampleValueStream()) + '\n```' } })
    fireEvent.click(screen.getByRole('button', { name: /貼り付けた JSON を読み込む/ }))
    expect(onLoad).toHaveBeenCalledTimes(1)
    expect(onLoad.mock.calls[0][0].steps).toHaveLength(6)
  })

  it('不正な JSON はエラー表示して読み込まない', () => {
    const onLoad = vi.fn()
    render(<PromptPanel unit="d" title="t" onLoad={onLoad} defaultOpen />)
    fireEvent.change(screen.getByLabelText('AI の回答を貼り付け'), { target: { value: '{"title": 1}' } })
    fireEvent.click(screen.getByRole('button', { name: /貼り付けた JSON を読み込む/ }))
    expect(onLoad).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/形式/)
  })
})
