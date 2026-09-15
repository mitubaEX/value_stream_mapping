import type { ProcessStep, Thresholds, TimeUnit } from '../domain/types'
import type { Action } from '../store/reducer'
import { detectWaste } from '../domain/waste'

type Props = {
  steps: ProcessStep[]
  unit: TimeUnit
  thresholds: Thresholds
  dispatch: React.Dispatch<Action>
}

export function StepEditor({ steps, unit, thresholds, dispatch }: Props) {
  const u = unit === 'd' ? '日' : 'h'
  const num = (id: string, key: keyof ProcessStep, min = 0, max?: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = Number(e.target.value)
      if (!Number.isFinite(v)) v = 0
      if (v < min) v = min
      if (max !== undefined && v > max) v = max
      dispatch({ type: 'updateStep', id, patch: { [key]: v } })
    }
  return (
    <section className="editor" aria-label="工程エディタ">
      <div className="editor-head">
        <h2>工程</h2>
        <button type="button" onClick={() => dispatch({ type: 'addStep' })}>＋ 工程を追加</button>
      </div>
      <div className="table-wrap">
        <table className="steps">
          <thead>
            <tr>
              <th>#</th>
              <th>工程名</th>
              <th>担当</th>
              <th title="前工程からこの工程が始まるまでの待ち">待ち ({u})</th>
              <th title="実作業時間">PT ({u})</th>
              <th title="工程内の経過時間 (PT を含む)">LT ({u})</th>
              <th title="一発で正しく完了する率">%C&A</th>
              <th>⚡</th>
              <th className="future-col" title="Future State: この工程を省略">省略</th>
              <th className="future-col" title="Future State: 待ち時間を何 % 削減するか">待ち削減 %</th>
              <th>メモ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {steps.map((s, i) => {
              const wastes = detectWaste(s, thresholds)
              const ltWarn = s.leadTime < s.processTime
              return (
                <tr key={s.id} className={s.skipped ? 'skipped' : ''}>
                  <td>{i + 1}</td>
                  <td>
                    <input
                      aria-label={`工程 ${i + 1} の名前`}
                      value={s.name}
                      onChange={(e) => dispatch({ type: 'updateStep', id: s.id, patch: { name: e.target.value } })}
                    />
                  </td>
                  <td>
                    <input
                      className="narrow"
                      value={s.owner ?? ''}
                      onChange={(e) => dispatch({ type: 'updateStep', id: s.id, patch: { owner: e.target.value } })}
                    />
                  </td>
                  <td><input type="number" min={0} step={0.5} value={s.waitBefore} onChange={num(s.id, 'waitBefore')} /></td>
                  <td><input type="number" min={0} step={0.5} value={s.processTime} onChange={num(s.id, 'processTime')} /></td>
                  <td>
                    <input
                      type="number" min={0} step={0.5} value={s.leadTime}
                      className={ltWarn ? 'invalid' : ''}
                      title={ltWarn ? 'LT は PT 以上にしてください' : ''}
                      onChange={num(s.id, 'leadTime')}
                    />
                  </td>
                  <td><input type="number" min={0} max={100} step={5} value={s.percentCA} onChange={num(s.id, 'percentCA', 0, 100)} /></td>
                  <td className="waste-cell" title={wastes.map((w) => w.message).join('\n')}>
                    {wastes.map((w) => (
                      <span key={w.kind} className={`badge ${w.kind}`}>{w.kind === 'wait' ? '待ち' : '品質'}</span>
                    ))}
                  </td>
                  <td className="future-col center">
                    <input
                      type="checkbox"
                      aria-label={`工程 ${i + 1} を省略`}
                      checked={s.skipped}
                      onChange={() => dispatch({ type: 'toggleSkip', id: s.id })}
                    />
                  </td>
                  <td className="future-col">
                    <input
                      type="range" min={0} max={100} step={10} value={s.waitReductionPct}
                      disabled={s.skipped}
                      aria-label={`工程 ${i + 1} の待ち削減率`}
                      onChange={num(s.id, 'waitReductionPct', 0, 100)}
                    />
                    <span className="range-val">{s.waitReductionPct}%</span>
                  </td>
                  <td>
                    <input
                      value={s.note ?? ''}
                      placeholder="改善アイデアなど"
                      onChange={(e) => dispatch({ type: 'updateStep', id: s.id, patch: { note: e.target.value } })}
                    />
                  </td>
                  <td className="row-actions">
                    <button type="button" title="上へ" disabled={i === 0} onClick={() => dispatch({ type: 'moveStep', id: s.id, dir: -1 })}>↑</button>
                    <button type="button" title="下へ" disabled={i === steps.length - 1} onClick={() => dispatch({ type: 'moveStep', id: s.id, dir: 1 })}>↓</button>
                    <button type="button" title="削除" className="danger" onClick={() => dispatch({ type: 'removeStep', id: s.id })}>×</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
