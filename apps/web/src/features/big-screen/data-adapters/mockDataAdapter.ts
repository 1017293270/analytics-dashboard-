import { requestJson } from '../api/bigScreenApi'
import { bigScreenText } from '../i18n/zh-CN'
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
      throw new Error(bigScreenText.common.errors.invalidComponentData)
    }

    return data
  },
}
