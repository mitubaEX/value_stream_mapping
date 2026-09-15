import { useRef } from 'react'
import type { Thresholds, TimeUnit, ValueStream } from '../domain/types'
import type { Action } from '../store/reducer'
import { serialize, deserialize } from '../store/storage'
import { download, safeName } from '../store/download'

type Props = {
  vs: ValueStream
  dispatch: React.Dispatch<Action>
  onExportSvg: () => void
}

export function Header({ vs, dispatch, onExportSvg }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const parsed = deserialize(await f.text())
    if (!parsed) {
      window.alert('JSON の形式が正しくありません')
      return
    }
    dispatch({ type: 'load', value: parsed })
  }

  const setTh = (patch: Partial<Thresholds>) =>
    dispatch({ type: 'setThresholds', thresholds: { ...vs.thresholds, ...patch } })

  return (
    <header className="header">
      <div className="header-row">
        <input
          className="title-input"
          aria-label="タイトル"
          value={vs.title}
          onChange={(e) => dispatch({ type: 'setTitle', title: e.target.value })}
        />
        <label>
          単位
          <select value={vs.unit} onChange={(e) => dispatch({ type: 'setUnit', unit: e.target.value as TimeUnit })}>
            <option value="d">日</option>
            <option value="h">時間</option>
          </select>
        </label>
      </div>
      <div className="header-row">
        <label title="工程内の待ち比率 (1 - PT/LT) がこれ以上なら ⚡">
          ⚡ 待ち率 ≥
          <input
            type="number" min={0} max={100} step={5}
            value={Math.round(vs.thresholds.waitRatio * 100)}
            onChange={(e) => setTh({ waitRatio: Math.min(100, Math.max(0, Number(e.target.value))) / 100 })}
          />%
        </label>
        <label title="%C&A がこれ未満なら ⚡">
          ⚡ %C&A &lt;
          <input
            type="number" min={0} max={100} step={5}
            value={vs.thresholds.percentCA}
            onChange={(e) => setTh({ percentCA: Math.min(100, Math.max(0, Number(e.target.value))) })}
          />%
        </label>
        <span className="spacer" />
        <button type="button" onClick={() => fileRef.current?.click()}>JSON 読込</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
        <button type="button" onClick={() => download(`${safeName(vs.title)}.json`, serialize(vs), 'application/json')}>JSON 保存</button>
        <button type="button" onClick={onExportSvg}>SVG 出力</button>
        <button
          type="button"
          className="danger"
          onClick={() => {
            if (window.confirm('サンプルデータに戻します。よろしいですか?')) dispatch({ type: 'reset' })
          }}
        >
          リセット
        </button>
      </div>
    </header>
  )
}
