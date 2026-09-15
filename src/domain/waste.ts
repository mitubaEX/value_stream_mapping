import { stepWaitRatio } from './metrics'
import type { ProcessStep, Thresholds } from './types'

export type WasteKind = 'wait' | 'quality'

export type Waste = {
  kind: WasteKind
  message: string
}

/** 工程 1 つに対する ⚡ (Kaizen Burst) 判定 */
export function detectWaste(step: ProcessStep, th: Thresholds): Waste[] {
  const result: Waste[] = []
  const ratio = stepWaitRatio(step)
  if (step.leadTime > 0 && ratio >= th.waitRatio) {
    result.push({
      kind: 'wait',
      message: `工程内の待ちが ${Math.round(ratio * 100)}% (しきい値 ${Math.round(th.waitRatio * 100)}%)`,
    })
  }
  if (step.percentCA < th.percentCA) {
    result.push({
      kind: 'quality',
      message: `%C&A が ${step.percentCA}% (しきい値 ${th.percentCA}%)`,
    })
  }
  return result
}
