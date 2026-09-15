import { useState } from 'react'
import type { TimeUnit, ValueStream } from '../domain/types'
import { buildPrompt, extractJson } from '../domain/promptTemplate'
import { deserialize } from '../store/storage'

type Props = {
  unit: TimeUnit
  title: string
  onLoad: (vs: ValueStream) => void
  defaultOpen?: boolean
}

export function PromptPanel({ unit, title, onLoad, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [description, setDescription] = useState('')
  const [copied, setCopied] = useState(false)
  const [pasted, setPasted] = useState('')
  const [error, setError] = useState('')

  const prompt = buildPrompt({ unit, title, description })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('クリップボードにコピーできませんでした。テキストを選択してコピーしてください')
    }
  }

  const load = () => {
    const json = extractJson(pasted)
    const vs = json ? deserialize(json) : null
    if (!vs) {
      setError('JSON の形式が正しくありません。AI の回答全体をそのまま貼り付けてください')
      return
    }
    setError('')
    setPasted('')
    onLoad(vs)
  }

  return (
    <section className="prompt-panel" aria-label="AI にデータを作らせる">
      <button type="button" className="prompt-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} AI にデータを作らせる
      </button>
      {open && (
        <div className="prompt-body">
          <ol className="prompt-steps">
            <li>対象の業務を一言で書く (空でも可。その場合 AI が質問してくれます)</li>
            <li>「プロンプトをコピー」して ChatGPT / Claude などに貼り付ける</li>
            <li>AI の回答をそのまま下の欄に貼り付けて「読み込む」</li>
          </ol>
          <label className="prompt-desc">
            対象の業務
            <input
              value={description}
              placeholder="例: 新機能のリリースまでの流れ、採用面接の流れ、経費精算"
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className="prompt-row">
            <textarea aria-label="AI に渡すプロンプト" readOnly value={prompt} rows={10} onFocus={(e) => e.target.select()} />
            <div className="prompt-actions">
              <button type="button" onClick={copy}>プロンプトをコピー</button>
              {copied && <span className="prompt-ok">コピーしました</span>}
            </div>
          </div>
          <div className="prompt-row">
            <textarea
              aria-label="AI の回答を貼り付け"
              placeholder="AI の回答 (JSON) をここに貼り付け。前後の説明文や ```json が付いていてもそのままで OK"
              value={pasted}
              rows={6}
              onChange={(e) => setPasted(e.target.value)}
            />
            <div className="prompt-actions">
              <button type="button" disabled={!pasted.trim()} onClick={load}>貼り付けた JSON を読み込む</button>
              {error && <span className="prompt-error" role="alert">{error}</span>}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
