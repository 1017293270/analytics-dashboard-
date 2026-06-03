import { requestJson } from '../api/bigScreenApi'
import { isComponentData, type DataAdapter } from './dataAdapter.types'

export const mockDataAdapter: DataAdapter = {
  async query(binding) {
    const data = await requestJson<unknown>('/api/big-screens/data/query', {
      method: 'POST',
      body: JSON.stringify({
        sourceType: 'mock',
        query: binding.query,
      }),
    })

    if (!isComponentData(data)) {
      throw new Error('Invalid component data')
    }

    return data
  },
}
