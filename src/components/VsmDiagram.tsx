import { useMemo } from 'react'
import { layoutValueStream, fmt, type NodeLayout } from '../domain/layout'
import { detectWaste } from '../domain/waste'
import type { ProcessStep, Thresholds, TimeUnit } from '../domain/types'
import { stepWaitRatio } from '../domain/metrics'

type Props = {
  steps: ProcessStep[]
  thresholds: Thresholds
  unit: TimeUnit
  title: string
  svgRef?: React.Ref<SVGSVGElement>
}

const unitLabel = (u: TimeUnit) => (u === 'd' ? '日' : '時間')

export function VsmDiagram({ steps, thresholds, unit, title, svgRef }: Props) {
  const layout = useMemo(() => layoutValueStream(steps), [steps])
  const u = unitLabel(unit)
  const { customerIn, customerOut, nodes, timelineY, ladderH } = layout

  return (
    <svg
      ref={svgRef}
      className="vsm-svg"
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${title} の Value Stream Map`}
      style={{ fontFamily: '-apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif', fontSize: 12 }}
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#57606a" />
        </marker>
      </defs>
      <rect width={layout.width} height={layout.height} fill="#ffffff" />

      <Customer x={customerIn.x} y={customerIn.y} w={customerIn.w} h={customerIn.h} label="顧客" sub="要求" />
      <Customer x={customerOut.x} y={customerOut.y} w={customerOut.w} h={customerOut.h} label="顧客" sub="価値" />

      {nodes.length === 0 && (
        <text x={layout.width / 2} y={customerIn.y + customerIn.h / 2} textAnchor="middle" fill="#8c959f">
          工程を追加してください
        </text>
      )}

      {nodes.map((n, i) => {
        const prevRight = i === 0 ? customerIn.x + customerIn.w : nodes[i - 1].x + nodes[i - 1].w
        const midY = n.y + n.h / 2
        return (
          <g key={n.step.id}>
            {/* 前工程からの矢印 */}
            <line x1={prevRight} y1={midY} x2={n.x} y2={midY} stroke="#57606a" strokeWidth={1.5} markerEnd="url(#arrow)" />
            {/* 待ち (▲) */}
            {n.step.waitBefore > 0 && (
              <g>
                <polygon
                  points={`${n.wait.x + n.wait.w / 2 - 14},${midY - 22} ${n.wait.x + n.wait.w / 2 + 14},${midY - 22} ${n.wait.x + n.wait.w / 2},${midY - 4}`}
                  fill="#fff8c5"
                  stroke="#9a6700"
                />
                <text x={n.wait.x + n.wait.w / 2} y={midY - 28} textAnchor="middle" fill="#9a6700" fontSize={11}>
                  待ち {fmt(n.step.waitBefore)}{u}
                </text>
              </g>
            )}
            <ProcessBox node={n} thresholds={thresholds} unit={u} />
          </g>
        )
      })}

      {nodes.length > 0 && (
        <line
          x1={nodes[nodes.length - 1].x + nodes[nodes.length - 1].w}
          y1={customerIn.y + customerIn.h / 2}
          x2={customerOut.x}
          y2={customerIn.y + customerIn.h / 2}
          stroke="#57606a"
          strokeWidth={1.5}
          markerEnd="url(#arrow)"
        />
      )}

      <Timeline nodes={nodes} y={timelineY} h={ladderH} unit={u} />
    </svg>
  )
}

function Customer({ x, y, w, h, label, sub }: { x: number; y: number; w: number; h: number; label: string; sub: string }) {
  return (
    <g>
      <path
        d={`M ${x} ${y + 18} L ${x + w / 2} ${y} L ${x + w} ${y + 18} L ${x + w} ${y + h} L ${x} ${y + h} Z`}
        fill="#f6f8fa"
        stroke="#57606a"
      />
      <text x={x + w / 2} y={y + 40} textAnchor="middle" fontWeight={600}>{label}</text>
      <text x={x + w / 2} y={y + 56} textAnchor="middle" fill="#57606a" fontSize={11}>{sub}</text>
    </g>
  )
}

function ProcessBox({ node, thresholds, unit }: { node: NodeLayout; thresholds: Thresholds; unit: string }) {
  const { step, x, y, w, h } = node
  const wastes = detectWaste(step, thresholds)
  const flagged = wastes.length > 0
  const rows: [string, string][] = [
    ['PT', `${fmt(step.processTime)}${unit}`],
    ['LT', `${fmt(step.leadTime)}${unit}`],
    ['%C&A', `${fmt(step.percentCA)}%`],
    ['待ち率', `${Math.round(stepWaitRatio(step) * 100)}%`],
  ]
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#ffffff" stroke={flagged ? '#bf3989' : '#0969da'} strokeWidth={flagged ? 2.5 : 1.5} />
      <rect x={x} y={y} width={w} height={26} rx={6} fill={flagged ? '#ffeef8' : '#ddf4ff'} />
      <rect x={x} y={y + 20} width={w} height={6} fill={flagged ? '#ffeef8' : '#ddf4ff'} />
      <text x={x + w / 2} y={y + 17} textAnchor="middle" fontWeight={600}>{step.name}</text>
      {step.owner && (
        <text x={x + w / 2} y={y + 40} textAnchor="middle" fill="#57606a" fontSize={11}>{step.owner}</text>
      )}
      {rows.map(([k, v], i) => (
        <g key={k}>
          <text x={x + 10} y={y + 60 + i * 15} fill="#57606a" fontSize={11}>{k}</text>
          <text x={x + w - 10} y={y + 60 + i * 15} textAnchor="end" fontSize={11}>{v}</text>
        </g>
      ))}
      {flagged && (
        <g>
          <title>{wastes.map((w) => w.message).join('\n')}</title>
          <circle cx={x + w - 4} cy={y + 4} r={13} fill="#fff8c5" stroke="#bf3989" strokeWidth={1.5} />
          <text x={x + w - 4} y={y + 9} textAnchor="middle" fontSize={14}>⚡</text>
        </g>
      )}
    </g>
  )
}

function Timeline({ nodes, y, h, unit }: { nodes: NodeLayout[]; y: number; h: number; unit: string }) {
  if (nodes.length === 0) return null
  const top = y
  const bottom = y + h
  const path: string[] = []
  nodes.forEach((n, i) => {
    const { wait, pt } = n.timeline
    if (i === 0) path.push(`M ${wait.x} ${top}`)
    path.push(`L ${wait.x + wait.w} ${top}`)
    path.push(`L ${pt.x} ${bottom}`)
    path.push(`L ${pt.x + pt.w} ${bottom}`)
    path.push(`L ${pt.x + pt.w} ${top}`)
  })
  const startX = nodes[0].timeline.wait.x
  return (
    <g>
      <text x={startX} y={y - 34} fill="#57606a" fontSize={11}>タイムライン (上段: 待ち / 下段: 実作業)</text>
      <path d={path.join(' ')} fill="none" stroke="#1f2328" strokeWidth={1.5} />
      {nodes.map((n) => (
        <g key={n.step.id}>
          {n.timeline.wait.w > 0 && (
            <text x={n.timeline.wait.x + n.timeline.wait.w / 2} y={top - 5} textAnchor="middle" fill="#9a6700" fontSize={11}>
              {n.timeline.wait.label}{unit}
            </text>
          )}
          {n.timeline.pt.w > 0 && (
            <text x={n.timeline.pt.x + n.timeline.pt.w / 2} y={bottom + 15} textAnchor="middle" fill="#0969da" fontSize={11}>
              {n.timeline.pt.label}{unit}
            </text>
          )}
        </g>
      ))}
    </g>
  )
}
