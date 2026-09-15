# VSM Generator

Value Stream Mapping (バリューストリームマップ) をブラウザで生成する web アプリ。
工程を表に入力すると VSM 図 (SVG) と Lean の指標を自動生成し、
「省略」「待ち削減」で Future State をシミュレーションして Current State と比較できる。

## 起動

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # vitest
npm run build    # dist/
```

## 使い方

1. 工程表で工程を追加し、工程名 / 担当 / 待ち / PT / LT / %C&A を入力する
2. 上部の VSM 図とサマリがリアルタイムに更新される
3. 待ち率や %C&A がしきい値を超えた工程には ⚡ (Kaizen Burst) が付く。しきい値はヘッダで変更できる
4. 「省略」にチェック、または「待ち削減 %」を動かすと Future State ができる。図の Current / Future タブで切替
5. JSON 保存 / 読込、SVG 出力ができる。データはブラウザ (localStorage) に自動保存される

## 用語

| 用語 | 意味 |
|---|---|
| PT (Process Time) | 実際に手を動かしている時間 |
| LT (Lead Time) | 工程内の経過時間 (PT + 工程内の待ち) |
| 待ち | 前工程が終わってからこの工程が始まるまでの時間 |
| %C&A | Percent Complete & Accurate。後工程から見て手戻りなく受け取れる割合 |
| Total Lead Time | Σ (待ち + LT) |
| Activity Ratio | Σ PT / Total Lead Time。低いほど待ちが多い |
| Rolled %C&A | Π %C&A。最初から最後まで手戻りなしで通る確率 |

公開 URL: https://value-stream-mapping.mituba.workers.dev

詳しい構造は [docs/code-explanation.md](docs/code-explanation.md) を参照。

## デプロイ (Cloudflare Workers 静的アセット)

```sh
npx wrangler login   # 初回のみ
npm run deploy       # build → wrangler deploy
```
