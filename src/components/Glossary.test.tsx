import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Glossary } from './Glossary'

describe('Glossary', () => {
  it('最初は閉じていて、ボタンで開閉できる', () => {
    render(<Glossary />)
    expect(screen.queryByText(/そもそも Value Stream Mapping/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /用語解説/ }))
    expect(screen.getByText(/そもそも Value Stream Mapping/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /用語解説/ }))
    expect(screen.queryByText(/そもそも Value Stream Mapping/)).not.toBeInTheDocument()
  })

  it('主要な用語がすべて説明されている', () => {
    render(<Glossary defaultOpen />)
    for (const term of ['待ち', 'PT', 'LT', '%C&A', '待ち率', 'Total Lead Time', 'Activity Ratio', 'Rolled %C&A', 'Kaizen Burst', 'Current State', 'Future State']) {
      expect(screen.getAllByText(new RegExp(term.replace(/[%&]/g, '\\$&'))).length).toBeGreaterThan(0)
    }
  })

  it('各用語に具体例がある', () => {
    render(<Glossary defaultOpen />)
    expect(screen.getAllByText(/例:/).length).toBeGreaterThanOrEqual(8)
  })
})
