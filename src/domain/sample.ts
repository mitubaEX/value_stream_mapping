import { createStep, defaultThresholds, type ValueStream } from './types'

/** 初期サンプル: ソフトウェア開発フロー */
export function sampleValueStream(): ValueStream {
  return {
    title: '機能開発フロー (サンプル)',
    unit: 'd',
    thresholds: { ...defaultThresholds },
    steps: [
      createStep({ id: 'req', name: '要件定義', owner: 'PdM', processTime: 2, leadTime: 5, waitBefore: 0, percentCA: 80 }),
      createStep({ id: 'design', name: '設計', owner: 'Tech Lead', processTime: 3, leadTime: 10, waitBefore: 3, percentCA: 70 }),
      createStep({ id: 'impl', name: '実装', owner: 'Dev', processTime: 5, leadTime: 8, waitBefore: 7, percentCA: 90 }),
      createStep({ id: 'review', name: 'レビュー', owner: 'Dev', processTime: 1, leadTime: 4, waitBefore: 2, percentCA: 60 }),
      createStep({ id: 'qa', name: 'QA', owner: 'QA', processTime: 2, leadTime: 6, waitBefore: 3, percentCA: 75 }),
      createStep({ id: 'release', name: 'リリース', owner: 'SRE', processTime: 0.5, leadTime: 1, waitBefore: 5, percentCA: 95 }),
    ],
  }
}
