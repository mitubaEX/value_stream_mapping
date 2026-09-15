import type { ProcessStep } from './types'

export const LAYOUT = {
  marginX: 30,
  marginY: 30,
  customerW: 110,
  customerH: 64,
  boxW: 150,
  boxH: 118,
  waitW: 80,
  /** 工程 1 つあたりの横ピッチ (boxW + waitW) */
  stepPitch: 230,
  timelineGap: 70,
  ladderH: 36,
  bottomPad: 60,
} as const

export type Rect = { x: number; y: number; w: number; h: number }
export type Segment = { x: number; w: number; label: string }

export type NodeLayout = Rect & {
  step: ProcessStep
  wait: Rect & { label: string }
  timeline: { wait: Segment; pt: Segment }
}

export type VsmLayout = {
  width: number
  height: number
  customerIn: Rect
  customerOut: Rect
  nodes: NodeLayout[]
  timelineY: number
  ladderH: number
}

export const fmt = (n: number): string => String(Math.round(n * 100) / 100)

export function layoutValueStream(steps: ProcessStep[]): VsmLayout {
  const L = LAYOUT
  const n = steps.length
  const boxY = L.marginY
  const base = L.marginX + L.customerW + L.waitW
  const timelineY = boxY + L.boxH + L.timelineGap
  const width = L.marginX * 2 + L.customerW * 2 + L.waitW + n * L.stepPitch
  const height = timelineY + L.ladderH + L.bottomPad

  const customerY = boxY + (L.boxH - L.customerH) / 2
  const customerIn: Rect = { x: L.marginX, y: customerY, w: L.customerW, h: L.customerH }
  const customerOut: Rect = { x: base + n * L.stepPitch, y: customerY, w: L.customerW, h: L.customerH }

  const totalElapsed = steps.reduce((acc, s) => acc + s.waitBefore + s.leadTime, 0)
  const availableW = n * L.stepPitch
  const scale = totalElapsed > 0 ? availableW / totalElapsed : 0

  let cursor = base - L.waitW
  const nodes: NodeLayout[] = steps.map((step, i) => {
    const x = base + i * L.stepPitch
    const innerWait = Math.max(0, step.leadTime - step.processTime)
    const waitTotal = step.waitBefore + innerWait
    const waitSeg: Segment = { x: cursor, w: waitTotal * scale, label: fmt(waitTotal) }
    cursor += waitSeg.w
    const ptSeg: Segment = { x: cursor, w: step.processTime * scale, label: fmt(step.processTime) }
    cursor += ptSeg.w
    return {
      step,
      x,
      y: boxY,
      w: L.boxW,
      h: L.boxH,
      wait: { x: x - L.waitW, y: boxY, w: L.waitW, h: L.boxH, label: fmt(step.waitBefore) },
      timeline: { wait: waitSeg, pt: ptSeg },
    }
  })

  return { width, height, customerIn, customerOut, nodes, timelineY, ladderH: L.ladderH }
}
