import { createStep, defaultThresholds, type ProcessStep, type ValueStream } from '../domain/types'

export const STORAGE_KEY = 'vsm-generator:v1'

export function serialize(vs: ValueStream): string {
  return JSON.stringify(vs, null, 2)
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function normalizeStep(raw: unknown): ProcessStep | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (typeof r.name !== 'string') return null
  return createStep({
    id: typeof r.id === 'string' ? r.id : undefined,
    name: r.name,
    owner: typeof r.owner === 'string' ? r.owner : undefined,
    processTime: isNum(r.processTime) ? r.processTime : 0,
    leadTime: isNum(r.leadTime) ? r.leadTime : 0,
    waitBefore: isNum(r.waitBefore) ? r.waitBefore : 0,
    percentCA: isNum(r.percentCA) ? r.percentCA : 100,
    note: typeof r.note === 'string' ? r.note : undefined,
    skipped: r.skipped === true,
    waitReductionPct: isNum(r.waitReductionPct) ? r.waitReductionPct : 0,
  })
}

export function deserialize(json: string): ValueStream | null {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return null
  }
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (typeof r.title !== 'string') return null
  if (r.unit !== 'h' && r.unit !== 'd') return null
  if (!Array.isArray(r.steps)) return null
  const steps: ProcessStep[] = []
  for (const s of r.steps) {
    const n = normalizeStep(s)
    if (!n) return null
    steps.push(n)
  }
  const th = (typeof r.thresholds === 'object' && r.thresholds !== null ? r.thresholds : {}) as Record<string, unknown>
  return {
    title: r.title,
    unit: r.unit,
    steps,
    thresholds: {
      waitRatio: isNum(th.waitRatio) ? th.waitRatio : defaultThresholds.waitRatio,
      percentCA: isNum(th.percentCA) ? th.percentCA : defaultThresholds.percentCA,
    },
  }
}

export function saveToStorage(vs: ValueStream): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(vs))
  } catch {
    /* private mode 等で失敗しても無視 */
  }
}

export function loadFromStorage(): ValueStream | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    return json ? deserialize(json) : null
  } catch {
    return null
  }
}
