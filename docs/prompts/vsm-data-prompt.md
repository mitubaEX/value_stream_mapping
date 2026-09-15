# VSM データ生成プロンプト (単位: 日)

以下をそのまま ChatGPT / Claude などに貼り付け、「対象の業務」の行を書き換えて送ってください。
回答の JSON はアプリの「AI の回答を貼り付け」欄、または「JSON 読込」で読み込めます。
時間を「時間」単位にしたい場合は `"unit": "d"` を `"unit": "h"` に、文中の「日」を「時間」に置き換えてください。

---

```text
あなたは Lean の Value Stream Mapping (VSM) の専門家です。
以下の業務の流れを VSM 用のデータにして、指定の JSON 形式で出力してください。

対象の業務: (ここに業務の流れを書く。分からない部分は私に質問してから JSON を出力してください)

## 出力形式 (この JSON 形式のみを出力。前後の説明文やコードフェンスは不要)

{
  "title": "業務名",
  "unit": "d",
  "thresholds": { "waitRatio": 0.7, "percentCA": 70 },
  "steps": [
    {
      "name": "工程名 (短く)",
      "owner": "担当者・役割",
      "waitBefore": 前工程が終わってからこの工程に着手するまでの待ち時間 (日),
      "processTime": 実際に手を動かしている時間 (日),
      "leadTime": 着手してから完了するまでの経過時間 (日)。processTime を含む,
      "percentCA": 次工程がそのまま使える割合 0〜100,
      "note": "無駄や手戻りの原因、改善アイデア (任意)"
    }
  ]
}

## ルール
- "unit" は "d" のまま。時間の値はすべて 日 単位の数値 (小数可)
- "leadTime" は必ず "processTime" 以上にする (待ちが無い工程は同じ値)
- "waitBefore" は最初の工程では 0 にする
- "percentCA" は 0〜100 の数値。不明なら 80〜90 程度を仮置きし、"note" に「仮」と書く
- 工程は 4〜10 個程度。作業する人や場所が変わるところで区切る
- 実態が分からない数値は現実的な仮の値を入れ、"note" に「要確認」と書く
- 出力は JSON のみ。説明文やコードフェンスを付けない

## 出力例 (別の業務での例)

{
  "title": "経費精算フロー",
  "unit": "d",
  "thresholds": { "waitRatio": 0.7, "percentCA": 70 },
  "steps": [
    { "name": "申請書作成", "owner": "申請者", "waitBefore": 0, "processTime": 0.2, "leadTime": 1, "percentCA": 60, "note": "領収書の貼り忘れが多い" },
    { "name": "上長承認", "owner": "上長", "waitBefore": 3, "processTime": 0.1, "leadTime": 2, "percentCA": 95, "note": "週 1 回まとめて承認" },
    { "name": "経理チェック", "owner": "経理", "waitBefore": 2, "processTime": 0.5, "leadTime": 3, "percentCA": 70, "note": "勘定科目の差し戻しが多い" },
    { "name": "振込", "owner": "経理", "waitBefore": 5, "processTime": 0.1, "leadTime": 1, "percentCA": 100, "note": "月 2 回の振込日待ち" }
  ]
}
```
