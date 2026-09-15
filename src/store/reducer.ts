import { createStep, type ProcessStep, type Thresholds, type TimeUnit, type ValueStream } from '../domain/types'
import { sampleValueStream } from '../domain/sample'

export type Action =
  | { type: 'addStep' }
  | { type: 'updateStep'; id: string; patch: Partial<ProcessStep> }
  | { type: 'removeStep'; id: string }
  | { type: 'moveStep'; id: string; dir: -1 | 1 }
  | { type: 'toggleSkip'; id: string }
  | { type: 'setTitle'; title: string }
  | { type: 'setUnit'; unit: TimeUnit }
  | { type: 'setThresholds'; thresholds: Thresholds }
  | { type: 'load'; value: ValueStream }
  | { type: 'reset' }

export function initialValueStream(): ValueStream {
  return sampleValueStream()
}

export function reducer(state: ValueStream, action: Action): ValueStream {
  switch (action.type) {
    case 'addStep':
      return { ...state, steps: [...state.steps, createStep({ name: `工程 ${state.steps.length + 1}` })] }
    case 'updateStep':
      return {
        ...state,
        steps: state.steps.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s)),
      }
    case 'removeStep':
      return { ...state, steps: state.steps.filter((s) => s.id !== action.id) }
    case 'moveStep': {
      const i = state.steps.findIndex((s) => s.id === action.id)
      const j = i + action.dir
      if (i < 0 || j < 0 || j >= state.steps.length) return state
      const steps = [...state.steps]
      ;[steps[i], steps[j]] = [steps[j], steps[i]]
      return { ...state, steps }
    }
    case 'toggleSkip':
      return {
        ...state,
        steps: state.steps.map((s) => (s.id === action.id ? { ...s, skipped: !s.skipped } : s)),
      }
    case 'setTitle':
      return { ...state, title: action.title }
    case 'setUnit':
      return { ...state, unit: action.unit }
    case 'setThresholds':
      return { ...state, thresholds: action.thresholds }
    case 'load':
      return action.value
    case 'reset':
      return initialValueStream()
  }
}
