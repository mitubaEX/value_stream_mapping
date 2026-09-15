import { useState } from 'react'

type Term = {
  name: string
  short: string
  detail: string
  example: string
  reading?: string
}

/* 全用語で共通の例: 「設計」工程 = 待ち 3日, PT 3日, LT 10日, %C&A 70% */
const TERMS: Term[] = [
  {
    name: '工程',
    short: '仕事のひとつの段階。作業する人や場所が変わるところで区切る',
    detail: '「要件定義 → 設計 → 実装 → レビュー → QA → リリース」のように、1 本の流れを段階に分けたもの。細かすぎると図が読めなくなるので、5〜10 個程度に収めるのがコツ。',
    example: '「設計」という工程は、要件が決まってから設計書ができるまでの段階。',
  },
  {
    name: '待ち',
    short: '前の工程が終わってから、この工程が「始まる」までに何もされずに放置されている時間',
    detail: '「担当者が別の仕事で手一杯」「会議まで着手できない」「チケットが列に並んでいる」などで発生する。誰も手を動かしていないのに時間だけが過ぎる、いちばん見えにくい無駄。',
    example: '要件定義が終わったが、設計担当が忙しくて 3 日間手つかず → 待ち 3日。',
  },
  {
    name: 'PT (Process Time)',
    reading: 'プロセスタイム / 実作業時間',
    short: 'その工程で実際に手を動かしている時間の合計',
    detail: '中断や待ちを全部取り除いて、「集中してやったら何時間 (何日) かかるか」。価値を生んでいる時間なので、VSM では「価値付加時間」とも呼ぶ。',
    example: '設計書を書くのに実際に手を動かしたのは合計 3日 → PT 3日。',
  },
  {
    name: 'LT (Lead Time)',
    reading: 'リードタイム / 経過時間',
    short: 'その工程を「始めてから終わるまで」のカレンダー上の日数。PT も含む',
    detail: '着手してから完了するまでの時間。途中の中断、他の仕事との掛け持ち、返事待ちなどが全部入る。LT は必ず PT 以上になる。LT と PT の差が「工程の中で発生している待ち」。',
    example: '設計に着手してから設計書が完成するまで、途中で別件が入って 10日かかった → LT 10日。うち手を動かしたのは 3日 (PT) なので、7日は工程内の待ち。',
  },
  {
    name: '%C&A (Percent Complete & Accurate)',
    reading: 'パーセント シーアンドエー / 一発完了率',
    short: '次の工程の人が「そのまま使える」と受け取れる割合。100% なら手戻りゼロ',
    detail: '「設計書をもらったが、抜けがあって聞き直した」「仕様が曖昧で作り直した」といった手戻りの少なさを表す。次の工程の担当者に「受け取ったもののうち、直さずに使えたのは何割?」と聞くのが一番正確。',
    example: '設計書 10 本のうち 3 本は実装者が確認・修正しないと使えなかった → %C&A 70%。',
  },
  {
    name: '待ち率',
    short: '工程の中で、手を動かしていない時間の割合。1 − PT ÷ LT',
    detail: 'LT のうちどれだけが待ちなのかを 1 工程ごとに見る指標。高いほど「着手はしたが放置されがち」な工程。',
    example: '設計は PT 3日 / LT 10日 → 待ち率 = 1 − 3/10 = 70%。10 日のうち 7 日は寝かせている。',
  },
  {
    name: 'Total Lead Time',
    reading: '総リードタイム',
    short: '最初の工程が始まる前から最後の工程が終わるまでの全体の日数。「顧客が待つ時間」',
    detail: '全工程の (待ち + LT) を足したもの。顧客や依頼者から見ると、これが「頼んでから届くまでの時間」。VSM でいちばん減らしたい数字。',
    example: 'サンプルでは 6 工程の合計で 54日。つまり要求から価値が届くまで約 2 か月。',
  },
  {
    name: 'Total Process Time',
    reading: '総実作業時間',
    short: '全工程の PT の合計。「本当に必要な作業時間」',
    detail: '待ちを全部なくせたら理論上ここまで短くできる、という下限。Total Lead Time との差が「なくせる可能性のある時間」。',
    example: 'サンプルでは 13.5日。54日のうち手を動かしているのは 13.5日だけ。',
  },
  {
    name: 'Activity Ratio',
    reading: 'アクティビティ比率 / 稼働率',
    short: 'Total Process Time ÷ Total Lead Time。全体のうち価値を生んでいる時間の割合',
    detail: '多くの現場では 10〜25% 程度。つまり 8〜9 割は待ち。この数字が低いほど「もっと人を増やす」より「待ちを減らす」方が効く、という判断ができる。',
    example: 'サンプルは 13.5 ÷ 54 = 25%。4 日のうち 1 日しか進んでいない。',
  },
  {
    name: 'Rolled %C&A',
    reading: 'ロールド シーアンドエー / 累積一発完了率',
    short: '全工程の %C&A を掛け算したもの。最初から最後まで一度も手戻りせずに通る確率',
    detail: '1 工程ごとは 80% でも、6 工程あると 0.8 の 6 乗 ≒ 26% まで下がる。「各工程はそこそこ良いのに、全体では手戻りだらけ」を数字で見せる指標。',
    example: 'サンプルは 80% × 70% × 90% × 60% × 75% × 95% ≒ 21.5%。5 件に 4 件はどこかで手戻りしている。',
  },
  {
    name: '⚡ Kaizen Burst (改善バースト)',
    reading: 'カイゼンバースト',
    short: '「ここを直すべき」と目印を付けた工程。このアプリではしきい値を超えると自動で付く',
    detail: '本来は VSM を描きながら人が手で付ける印。このアプリでは「待ち率がしきい値以上」または「%C&A がしきい値未満」の工程に自動で付け、上のヘッダでしきい値を変えられる。',
    example: '設計 (待ち率 70%) とレビュー (%C&A 60%) に ⚡ が付く。',
  },
  {
    name: 'タイムライン (はしご)',
    short: '図の下にある階段状の線。上の段が「待ち」、下の段が「実作業 (PT)」',
    detail: '横幅が時間に比例するので、上の段が長いほど待ちが多い。ぱっと見て「ほとんど上の段」なら、作業の速さより待ちの解消が課題だと分かる。',
    example: '設計の区間は上段 10日 (待ち 3 + 工程内の待ち 7)、下段 3日 (PT)。',
  },
  {
    name: 'Current State (現状)',
    reading: 'カレントステート',
    short: '今の仕事の流れをそのまま描いた図。まずこれを正直に描く',
    detail: '理想ではなく実態を描くことが重要。「本当は 1 日で終わるはず」ではなく「実際に 10 日かかっている」と入れる。',
    example: '工程表に入力した値そのもの。',
  },
  {
    name: 'Future State (改善後)',
    reading: 'フューチャーステート',
    short: '「この工程をなくしたら」「待ちを減らしたら」を試した図。Current と比べて効果を見る',
    detail: 'このアプリでは工程表の「省略」と「待ち削減 %」で作る。サマリの「→」の右側が Future の値で、緑なら改善、赤なら悪化。',
    example: 'レビューを省略し、設計の待ちを 100% 減らすと Total Lead Time が 54日 → 38日。',
  },
  {
    name: '省略',
    short: 'Future State でその工程をなくす。「本当に必要か?」を試すスイッチ',
    detail: '指標の計算から外れる。「承認会議は必要か」「二重チェックは要るか」といった問いを数字で確かめられる。',
    example: 'レビューを省略 → Total Lead Time が 6日減る (待ち 2 + LT 4)。',
  },
  {
    name: '待ち削減 %',
    short: 'Future State でその工程の「待ち」と「工程内の待ち (LT − PT)」を何 % 減らすか',
    detail: 'PT は変えない (作業を速くするのではなく、放置をなくす想定)。「担当を専任にする」「着手の順番を決める」などの効果を試すのに使う。',
    example: '設計の待ち削減 50% → 待ち 3日→1.5日、LT 10日→6.5日 (PT 3 + 工程内待ち 7 の半分)。',
  },
]

export function Glossary({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="glossary" aria-label="用語解説">
      <button type="button" className="glossary-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} 用語解説 {open ? '' : '(初めての方はこちら)'}
      </button>
      {open && (
        <div className="glossary-body">
          <div className="glossary-intro">
            <h3>そもそも Value Stream Mapping (VSM) とは</h3>
            <p>
              「頼んでから届くまで」の仕事の流れを 1 本の線にして、<strong>どこで時間が消えているか</strong>を見つける手法です。
              役所の手続きを思い浮かべてください。書類を書くのは 10 分なのに、窓口の順番待ちや別の課への回送で半日かかる。
              この「書く 10 分」が PT、「半日」が Lead Time、差が「待ち」です。
              仕事の流れも同じで、多くの場合、時間の 8〜9 割は誰も手を動かしていない「待ち」です。
              VSM はそれを数字と図で見せて、「作業を速くする」より「待ちをなくす」方が効く場所を教えてくれます。
            </p>
            <p className="glossary-note">
              以下の例はすべてサンプルの「設計」工程 (待ち 3日 / PT 3日 / LT 10日 / %C&A 70%) を使っています。
            </p>
          </div>
          <dl className="glossary-list">
            {TERMS.map((t) => (
              <div className="glossary-item" key={t.name}>
                <dt>
                  {t.name}
                  {t.reading && <span className="glossary-reading">{t.reading}</span>}
                </dt>
                <dd>
                  <p className="glossary-short">{t.short}</p>
                  <p>{t.detail}</p>
                  <p className="glossary-example"><span>例:</span> {t.example}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}
