# コード解説: VSM Generator

## 全体像

純粋関数のドメイン層 (`src/domain`) と、React の UI 層 (`src/components`) を分け、
状態は `useReducer` で 1 か所 (`src/store`) にまとめている。
ドメイン層は DOM に依存しないので、Vitest で red/green のユニットテストが書きやすい。

```mermaid
flowchart LR
  subgraph domain["src/domain (純粋ロジック)"]
    T["types.ts<br/>ProcessStep / ValueStream / Metrics"]
    M["metrics.ts<br/>calcMetrics / stepWaitRatio"]
    W["waste.ts<br/>detectWaste (⚡判定)"]
    F["futureState.ts<br/>currentState / applyScenario"]
    L["layout.ts<br/>layoutValueStream (SVG 座標)"]
    S["sample.ts<br/>初期サンプル"]
  end
  subgraph store["src/store"]
    R["reducer.ts<br/>Action / reducer"]
    St["storage.ts<br/>serialize / deserialize / localStorage"]
    H["useValueStream.ts<br/>useReducer + 自動保存"]
    D["download.ts"]
  end
  subgraph ui["src/components"]
    Hd["Header"]
    Sm["SummaryPanel"]
    Vs["VsmDiagram (SVG)"]
    Ed["StepEditor"]
  end
  A["App.tsx"]
  T --> M --> W
  T --> F
  T --> L
  S --> R
  R --> H
  St --> H
  A --> H
  A --> Hd & Sm & Vs & Ed
  F --> A
  M --> A
  L --> Vs
  W --> Vs & Ed
  St --> Hd
  D --> Hd & A
```

## データの流れ

ユーザの操作は全て `dispatch(Action)` を通り、reducer が新しい `ValueStream` を返す。
`App` はそこから Current / Future の 2 系統の工程列を派生させ、それぞれ指標を計算する。

```mermaid
sequenceDiagram
  participant U as ユーザ
  participant E as StepEditor
  participant R as reducer
  participant A as App
  participant F as futureState
  participant M as metrics
  participant V as VsmDiagram

  U->>E: 省略にチェック
  E->>R: dispatch({type:'toggleSkip', id})
  R-->>A: 新しい ValueStream
  A->>F: currentState(vs) / applyScenario(vs)
  F-->>A: current[] / future[]
  A->>M: calcMetrics(current) / calcMetrics(future)
  M-->>A: Metrics ×2 → SummaryPanel
  A->>V: steps = view に応じて current or future
  V->>V: layoutValueStream → SVG
  A->>A: useEffect → saveToStorage(vs)
```

## データモデル

```mermaid
classDiagram
  class ValueStream {
    title: string
    unit: 'h' | 'd'
    steps: ProcessStep[]
    thresholds: Thresholds
  }
  class ProcessStep {
    id: string
    name: string
    owner?: string
    processTime: number
    leadTime: number
    waitBefore: number
    percentCA: number
    note?: string
    skipped: boolean
    waitReductionPct: number
  }
  class Thresholds {
    waitRatio: number
    percentCA: number
  }
  class Metrics {
    totalLeadTime
    totalProcessTime
    activityRatio
    rolledPercentCA
    stepCount
  }
  ValueStream "1" --> "*" ProcessStep
  ValueStream --> Thresholds
  ProcessStep ..> Metrics : calcMetrics
```

`skipped` と `waitReductionPct` は Future State 専用の設定で、Current State の計算では無視する (`currentState` が 0 / false に戻す)。

## 指標の計算 (metrics.ts)

1 工程が占める経過時間は「前工程からの待ち + 工程内 LT」。

```mermaid
flowchart LR
  A["前工程 終了"] -->|"waitBefore"| B["工程 開始"]
  B -->|"leadTime (PT + 工程内の待ち)"| C["工程 終了"]
```

| 指標 | 式 | 境界 |
|---|---|---|
| totalLeadTime | Σ (waitBefore + leadTime) | |
| totalProcessTime | Σ processTime | |
| activityRatio | totalProcessTime / totalLeadTime | 分母 0 のとき 0 |
| rolledPercentCA | Π (percentCA / 100) × 100 | 工程なしのとき 100 |
| stepWaitRatio (工程単位) | 1 - PT / LT | LT 0 のとき 0 |

## ⚡ 判定 (waste.ts)

```mermaid
flowchart TD
  S["ProcessStep"] --> Q1{"stepWaitRatio ≥ thresholds.waitRatio ?"}
  Q1 -->|yes| W["{kind:'wait'}"]
  S --> Q2{"percentCA < thresholds.percentCA ?"}
  Q2 -->|yes| Qy["{kind:'quality'}"]
  W & Qy --> R["Waste[] (0〜2 件)"]
```

「以上」と「未満」の境界はテストで固定している (`waste.test.ts`)。

## Future State (futureState.ts)

```mermaid
flowchart LR
  I["steps"] --> F{"skipped ?"}
  F -->|yes| X["除外"]
  F -->|no| K["keep = 1 - waitReductionPct/100"]
  K --> O["waitBefore × keep<br/>leadTime = PT + (LT - PT) × keep"]
```

PT は変えず、待ち (工程前の待ちと工程内の待ち) だけを短縮する。
LT < PT という不正入力でも `Math.max(0, LT - PT)` で LT が PT を下回らないようにしている。

## SVG レイアウト (layout.ts)

工程は横一列なので、ライブラリを使わず座標を計算している。

```mermaid
flowchart LR
  subgraph row["上段 (y = marginY)"]
    CI["顧客 (入口)<br/>customerW"] --- W0["waitW"] --- B0["工程 0<br/>boxW"] --- W1["waitW"] --- B1["工程 1"] --- Wn["..."] --- CO["顧客 (出口)"]
  end
```

- `x(i) = marginX + customerW + waitW + i × stepPitch` (stepPitch = boxW + waitW)
- 幅は `n × stepPitch` に比例して伸びる (テストで `l5.width - l1.width === 4 × stepPitch` を保証)
- 下段のタイムラインは、全経過時間を `n × stepPitch` の幅にスケールし、
  工程ごとに「待ち区間 (上段)」→「PT 区間 (下段)」を連続して並べる

```mermaid
flowchart LR
  T0["待ち 3"] --> P0["PT 2"] --> T1["待ち 10"] --> P1["PT 3"] --> T2["..."]
```

## 永続化 (storage.ts)

`deserialize` は JSON を検証しつつ、欠けている項目を `createStep` のデフォルトで補う。
これにより古い保存データやユーザが手書きした JSON でも読める。
形が違う (steps が配列でない、unit が h/d 以外など) 場合は `null` を返し、UI 側でエラー表示する。

## テスト方針

| ファイル | 内容 |
|---|---|
| `domain/metrics.test.ts` | 0 件 / 1 件 / 複数件 / %C&A=0 / LT 合計 0 / skipped 除外 |
| `domain/waste.test.ts` | しきい値ちょうど・未満・両方該当 |
| `domain/futureState.test.ts` | 省略除外、待ち短縮の計算、不正入力、丸め |
| `domain/layout.test.ts` | 0 件 / 1 件 / 5 件の単調増加、幅の比例、タイムラインの連続性 |
| `store/reducer.test.ts` | 各 Action、並べ替えの境界、イミュータブル性 |
| `store/storage.test.ts` | serialize 往復、不正 JSON、欠損補完、localStorage |
| `App.test.tsx` | 描画、追加、省略で Future が変わる、しきい値変更でバッジが変わる |

全て「テストを書いて失敗を確認 → 実装 → 成功」の順で進めた。
