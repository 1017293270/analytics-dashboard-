import { requestJson } from '../api/bigScreenApi'
import type { ComponentData, DataAdapter } from './dataAdapter.types'

export const mockDataAdapter: DataAdapter = {
  query(binding) {
    return requestJson<ComponentData>('/api/big-screens/data/query', {
      method: 'POST',
      body: JSON.stringify({
        sourceType: 'mock',
        query: binding.query,
      }),
    })
  },
}
