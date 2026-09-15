import { useMemo, useRef, useState } from 'react'
import './App.css'
import { useValueStream } from './store/useValueStream'
import { calcMetrics } from './domain/metrics'
import { applyScenario, currentState } from './domain/futureState'
import { Header } from './components/Header'
import { download, safeName } from './store/download'
import { SummaryPanel } from './components/SummaryPanel'
import { VsmDiagram } from './components/VsmDiagram'
import { StepEditor } from './components/StepEditor'

type View = 'current' | 'future'

export default function App() {
  const [vs, dispatch] = useValueStream()
  const [view, setView] = useState<View>('current')
  const svgRef = useRef<SVGSVGElement>(null)

  const current = useMemo(() => currentState(vs), [vs])
  const future = useMemo(() => applyScenario(vs), [vs])
  const currentMetrics = useMemo(() => calcMetrics(current), [current])
  const futureMetrics = useMemo(() => calcMetrics(future), [future])
  const hasScenario = vs.steps.some((s) => s.skipped || s.waitReductionPct > 0)

  const exportSvg = () => {
    const svg = svgRef.current
    if (!svg) return
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + svg.outerHTML
    download(`${safeName(vs.title)}-${view}.svg`, xml, 'image/svg+xml')
  }

  return (
    <div className="app">
      <Header vs={vs} dispatch={dispatch} onExportSvg={exportSvg} />
      <SummaryPanel current={currentMetrics} future={futureMetrics} unit={vs.unit} />

      <section className="diagram" aria-label="VSM 図">
        <div className="diagram-head">
          <h2>{view === 'current' ? 'Current State' : 'Future State'}</h2>
          <div className="segmented" role="tablist">
            <button type="button" role="tab" aria-selected={view === 'current'} className={view === 'current' ? 'on' : ''} onClick={() => setView('current')}>
              Current
            </button>
            <button type="button" role="tab" aria-selected={view === 'future'} className={view === 'future' ? 'on' : ''} onClick={() => setView('future')}>
              Future{hasScenario ? ' ●' : ''}
            </button>
          </div>
          {!hasScenario && view === 'future' && (
            <span className="hint">工程表の「省略」「待ち削減 %」で Future State を作れます</span>
          )}
        </div>
        <div className="diagram-scroll">
          <VsmDiagram
            svgRef={svgRef}
            steps={view === 'current' ? current : future}
            thresholds={vs.thresholds}
            unit={vs.unit}
            title={vs.title}
          />
        </div>
      </section>

      <StepEditor steps={vs.steps} unit={vs.unit} thresholds={vs.thresholds} dispatch={dispatch} />

      <footer className="footer">
        PT = Process Time (実作業時間) / LT = Lead Time (工程内の経過時間) / %C&A = Percent Complete &amp; Accurate (一発完了率)。
        データはブラウザに自動保存されます。
      </footer>
    </div>
  )
}
