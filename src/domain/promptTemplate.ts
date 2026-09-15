import type { TimeUnit } from './types'

/** プロンプトに埋め込む例。deserialize できることをテストで保証している */
export const PROMPT_EXAMPLE_JSON = `{
  "title": "経費精算フロー",
  "unit": "d",
  "thresholds": { "waitRatio": 0.7, "percentCA": 70 },
  "steps": [
    { "name": "申請書作成", "owner": "申請者", "waitBefore": 0, "processTime": 0.2, "leadTime": 1, "percentCA": 60, "note": "領収書の貼り忘れが多い" },
    { "name": "上長承認", "owner": "上長", "waitBefore": 3, "processTime": 0.1, "leadTime": 2, "percentCA": 95, "note": "週 1 回まとめて承認" },
    { "name": "経理チェック", "owner": "経理", "waitBefore": 2, "processTime": 0.5, "leadTime": 3, "percentCA": 70, "note": "勘定科目の差し戻しが多い" },
    { "name": "振込", "owner": "経理", "waitBefore": 5, "processTime": 0.1, "leadTime": 1, "percentCA": 100, "note": "月 2 回の振込日待ち" }
  ]
}`

export type PromptOptions = {
  unit: TimeUnit
  title: string
  /** ユーザが対象の業務を一言で書く欄 (空なら AI が質問する) */
  description?: string
}

export function buildPrompt({ unit, title, description }: PromptOptions): string {
  const u = unit === 'd' ? '日' : '時間'
  const target = description?.trim()
    ? `対象の業務: ${description.trim()}`
    : '対象の業務: (ここに業務の流れを書く。分からない部分は私に質問してから JSON を出力してください)'
  return `あなたは Lean の Value Stream Mapping (VSM) の専門家です。
以下の業務の流れを VSM 用のデータにして、指定の JSON 形式で出力してください。

${target}

## 出力形式 (この JSON 形式のみを出力。前後の説明文やコードフェンスは不要)

{
  "title": "${title || '業務名'}",
  "unit": "${unit}",
  "thresholds": { "waitRatio": 0.7, "percentCA": 70 },
  "steps": [
    {
      "name": "工程名 (短く)",
      "owner": "担当者・役割",
      "waitBefore": 前工程が終わってからこの工程に着手するまでの待ち時間 (${u}),
      "processTime": 実際に手を動かしている時間 (${u}),
      "leadTime": 着手してから完了するまでの経過時間 (${u})。processTime を含む,
      "percentCA": 次工程がそのまま使える割合 0〜100,
      "note": "無駄や手戻りの原因、改善アイデア (任意)"
    }
  ]
}

## ルール
- "unit" は "${unit}" のまま。時間の値はすべて ${u} 単位の数値 (小数可)
- "leadTime" は必ず "processTime" 以上にする (待ちが無い工程は同じ値)
- "waitBefore" は最初の工程では 0 にする
- "percentCA" は 0〜100 の数値。不明なら 80〜90 程度を仮置きし、"note" に「仮」と書く
- 工程は 4〜10 個程度。作業する人や場所が変わるところで区切る
- 実態が分からない数値は現実的な仮の値を入れ、"note" に「要確認」と書く
- 出力は JSON のみ。説明文やコードフェンスを付けない

## 出力例 (別の業務での例)

${PROMPT_EXAMPLE_JSON}
`
}

/** AI の回答から JSON 部分だけを取り出す (コードフェンスや前後の文章を除去) */
export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fenced ? fenced[1] : text
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end < start) return ''
  return body.slice(start, end + 1).trim()
}
