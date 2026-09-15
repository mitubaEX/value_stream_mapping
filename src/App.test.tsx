import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import App from './App'
import { STORAGE_KEY } from './store/storage'

beforeEach(() => localStorage.clear())

describe('App', () => {
  it('サンプルデータでサマリ・図・工程表が表示される', () => {
    render(<App />)
    expect(screen.getByLabelText('タイトル')).toHaveValue('機能開発フロー (サンプル)')
    expect(screen.getByText('Total Lead Time')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Value Stream Map/ })).toBeInTheDocument()
    expect(screen.getAllByLabelText(/工程 \d+ の名前/)).toHaveLength(6)
  })

  it('工程を追加すると行が増え、localStorage に保存される', () => {
    render(<App />)
    fireEvent.click(screen.getByText('＋ 工程を追加'))
    expect(screen.getAllByLabelText(/工程 \d+ の名前/)).toHaveLength(7)
    expect(localStorage.getItem(STORAGE_KEY)).toContain('工程 7')
  })

  it('省略にチェックすると Future の工程数が減り、Future 表示に切り替えられる', () => {
    render(<App />)
    const card = screen.getByText('工程数').closest<HTMLElement>('.summary-card')!
    expect(within(card).getByText('6', { selector: '.summary-fut' })).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('工程 4 を省略'))
    expect(within(card).getByText('5', { selector: '.summary-fut' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Future/ }))
    expect(screen.getByText('Future State')).toBeInTheDocument()
  })

  it('⚡ しきい値を変えるとバッジが変わる', () => {
    render(<App />)
    const before = document.querySelectorAll('.badge.quality').length
    // %C&A しきい値を 100 にすると全工程が品質 ⚡
    const th = screen.getByLabelText(/%C&A </)
    fireEvent.change(th, { target: { value: '100' } })
    expect(document.querySelectorAll('.badge.quality').length).toBeGreaterThan(before)
  })
})
