export type MockDataResult =
  | { kind: 'metric'; value: number; label: string; trend: number }
  | { kind: 'time-series'; rows: Array<{ date: string; count: number }> }
  | { kind: 'category'; rows: Array<{ category: string; value: number }> }
  | { kind: 'table'; columns: string[]; rows: Array<Record<string, string | number>> }

export function getMockData(query: { dimensions?: string[]; metrics?: string[] }): MockDataResult {
  const dimensions = query.dimensions ?? []
  if (dimensions.includes('date')) {
    return {
      kind: 'time-series',
      rows: [
        { date: '2026-06-01', count: 4 },
        { date: '2026-06-02', count: 3 },
        { date: '2026-06-03', count: 3 },
      ],
    }
  }
  if (dimensions.includes('category')) {
    return {
      kind: 'category',
      rows: [
        { category: 'SQL', value: 38 },
        { category: 'Q&A', value: 26 },
        { category: 'Report', value: 18 },
      ],
    }
  }
  if (dimensions.includes('table')) {
    return {
      kind: 'table',
      columns: ['name', 'count', 'owner'],
      rows: [
        { name: 'Pending questions', count: 12, owner: 'Data team' },
        { name: 'Resolved questions', count: 86, owner: 'AI ops' },
      ],
    }
  }
  return { kind: 'metric', value: 128430, label: 'Total Q&A Requests', trend: 12.8 }
}
