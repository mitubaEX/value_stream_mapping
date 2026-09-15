import type { Metrics, TimeUnit } from '../domain/types'
import { fmt } from '../domain/layout'

type Props = { current: Metrics; future: Metrics; unit: TimeUnit }

const pct = (n: number) => `${Math.round(n * 1000) / 10}%`

export function SummaryPanel({ current, future, unit }: Props) {
  const u = unit === 'd' ? '日' : 'h'
  const rows: { label: string; cur: string; fut: string; better: boolean; same: boolean; hint: string }[] = [
    {
      label: 'Total Lead Time',
      cur: `${fmt(current.totalLeadTime)}${u}`,
      fut: `${fmt(future.totalLeadTime)}${u}`,
      better: future.totalLeadTime < current.totalLeadTime,
      same: future.totalLeadTime === current.totalLeadTime,
      hint: '入口から出口までの経過時間',
    },
    {
      label: 'Total Process Time',
      cur: `${fmt(current.totalProcessTime)}${u}`,
      fut: `${fmt(future.totalProcessTime)}${u}`,
      better: future.totalProcessTime < current.totalProcessTime,
      same: future.totalProcessTime === current.totalProcessTime,
      hint: '実際に手を動かした時間',
    },
    {
      label: 'Activity Ratio',
      cur: pct(current.activityRatio),
      fut: pct(future.activityRatio),
      better: future.activityRatio > current.activityRatio,
      same: future.activityRatio === current.activityRatio,
      hint: 'PT / LT。低いほど待ちが多い',
    },
    {
      label: 'Rolled %C&A',
      cur: pct(current.rolledPercentCA / 100),
      fut: pct(future.rolledPercentCA / 100),
      better: future.rolledPercentCA > current.rolledPercentCA,
      same: future.rolledPercentCA === current.rolledPercentCA,
      hint: '手戻りなしで通る確率',
    },
    {
      label: '工程数',
      cur: String(current.stepCount),
      fut: String(future.stepCount),
      better: future.stepCount < current.stepCount,
      same: future.stepCount === current.stepCount,
      hint: '',
    },
  ]
  return (
    <section className="summary" aria-label="サマリ">
      {rows.map((r) => (
        <div className="summary-card" key={r.label} title={r.hint}>
          <div className="summary-label">{r.label}</div>
          <div className="summary-values">
            <span className="summary-cur">{r.cur}</span>
            <span className="summary-arrow">→</span>
            <span className={`summary-fut ${r.same ? '' : r.better ? 'better' : 'worse'}`}>{r.fut}</span>
          </div>
          <div className="summary-hint">Current → Future</div>
        </div>
      ))}
    </section>
  )
}
