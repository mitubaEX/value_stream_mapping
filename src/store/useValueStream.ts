import { useEffect, useReducer } from 'react'
import { reducer, initialValueStream, type Action } from './reducer'
import { loadFromStorage, saveToStorage } from './storage'
import type { ValueStream } from '../domain/types'

export function useValueStream(): [ValueStream, React.Dispatch<Action>] {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadFromStorage() ?? initialValueStream())
  useEffect(() => {
    saveToStorage(state)
  }, [state])
  return [state, dispatch]
}
