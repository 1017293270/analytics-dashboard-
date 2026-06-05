export type MockDataResult =
  | { kind: 'metric'; value: number; label: string; trend: number }
  | { kind: 'time-series'; rows: Array<{ date: string; count: number }> }
  | { kind: 'category'; rows: Array<{ category: string; value: number }> }
  | { kind: 'table'; columns: string[]; rows: Array<Record<string, string | number>> }

type MockQuery = { dimensions?: string[]; metrics?: string[]; limit?: number }

const metricData: Record<string, { value: number; label: string; trend: number }> = {
  requests: { value: 128430, label: 'Total Q&A Requests', trend: 12.8 },
  autonomous_resolutions: { value: 76240, label: 'Autonomous Resolutions', trend: 9.4 },
  revenue: { value: 842000, label: 'Revenue This Month', trend: 8.6 },
  pipeline: { value: 3120000, label: 'Qualified Pipeline', trend: 5.1 },
  satisfaction: { value: 94, label: 'Customer Satisfaction', trend: 3.4 },
  first_response: { value: 87, label: 'First Response SLA', trend: 4.8 },
  freshness: { value: 97, label: 'Fresh Sources', trend: 2.1 },
  incidents: { value: 6, label: 'Open Incidents', trend: -3.2 },
}

const timeSeriesData: Record<string, Array<{ date: string; count: number }>> = {
  resolved_questions: [
    { date: '2026-06-01', count: 42 },
    { date: '2026-06-02', count: 48 },
    { date: '2026-06-03', count: 57 },
    { date: '2026-06-04', count: 63 },
  ],
  revenue_trend: [
    { date: '2026-06-01', count: 126 },
    { date: '2026-06-02', count: 138 },
    { date: '2026-06-03', count: 152 },
    { date: '2026-06-04', count: 168 },
  ],
  response_trend: [
    { date: '2026-06-01', count: 81 },
    { date: '2026-06-02', count: 84 },
    { date: '2026-06-03', count: 86 },
    { date: '2026-06-04', count: 87 },
  ],
  freshness_trend: [
    { date: '2026-06-01', count: 91 },
    { date: '2026-06-02', count: 93 },
    { date: '2026-06-03', count: 95 },
    { date: '2026-06-04', count: 97 },
  ],
}

const categoryData: Record<string, Array<{ category: string; value: number }>> = {
  workload_mix: [
    { category: 'SQL', value: 38 },
    { category: 'Q&A', value: 26 },
    { category: 'Report', value: 18 },
    { category: 'Alert', value: 14 },
  ],
  channel_revenue: [
    { category: 'Direct', value: 42 },
    { category: 'Partner', value: 28 },
    { category: 'Expansion', value: 18 },
    { category: 'Self Serve', value: 12 },
  ],
  pipeline_stage: [
    { category: 'Lead', value: 96 },
    { category: 'Qualified', value: 64 },
    { category: 'Proposal', value: 38 },
    { category: 'Contract', value: 21 },
  ],
  service_quality: [
    { category: 'Accuracy', value: 92 },
    { category: 'Speed', value: 87 },
    { category: 'Empathy', value: 90 },
    { category: 'Coverage', value: 84 },
    { category: 'Handoff', value: 78 },
  ],
  contact_channel: [
    { category: 'Chat', value: 46 },
    { category: 'Email', value: 27 },
    { category: 'Voice', value: 19 },
    { category: 'Portal', value: 8 },
  ],
  source_errors: [
    { category: 'CRM', value: 12 },
    { category: 'Billing', value: 8 },
    { category: 'Warehouse', value: 5 },
    { category: 'Support', value: 3 },
  ],
  platform_health: [
    { category: 'Freshness', value: 97 },
    { category: 'Latency', value: 88 },
    { category: 'Completeness', value: 91 },
    { category: 'Accuracy', value: 94 },
    { category: 'Coverage', value: 86 },
  ],
  quality_remediation: [
    { category: 'Detected', value: 44 },
    { category: 'Triaged', value: 31 },
    { category: 'Assigned', value: 22 },
    { category: 'Resolved', value: 16 },
  ],
}

const tableData: Record<string, MockDataResult & { kind: 'table' }> = {
  ai_queue: {
    kind: 'table',
    columns: ['name', 'count', 'owner'],
    rows: [
      { name: 'Pending questions', count: 12, owner: 'Data team' },
      { name: 'Resolved questions', count: 86, owner: 'AI ops' },
      { name: 'Needs review', count: 7, owner: 'Quality' },
    ],
  },
  account_health: {
    kind: 'table',
    columns: ['account', 'arr', 'risk'],
    rows: [
      { account: 'Northwind', arr: 184000, risk: 'Low' },
      { account: 'Contoso', arr: 136000, risk: 'Medium' },
      { account: 'Fabrikam', arr: 98000, risk: 'Low' },
      { account: 'Tailspin', arr: 74000, risk: 'High' },
    ],
  },
  service_queue: {
    kind: 'table',
    columns: ['queue', 'open', 'sla'],
    rows: [
      { queue: 'Billing', open: 18, sla: '92%' },
      { queue: 'Enterprise', open: 11, sla: '88%' },
      { queue: 'Integrations', open: 9, sla: '84%' },
      { queue: 'Bug triage', open: 6, sla: '79%' },
    ],
  },
  data_jobs: {
    kind: 'table',
    columns: ['pipeline', 'status', 'lag'],
    rows: [
      { pipeline: 'Revenue mart', status: 'Healthy', lag: '8m' },
      { pipeline: 'Support facts', status: 'Delayed', lag: '32m' },
      { pipeline: 'Usage events', status: 'Healthy', lag: '5m' },
      { pipeline: 'Quality checks', status: 'Review', lag: '18m' },
    ],
  },
}

function firstMetric(metrics: string[] | undefined): string {
  return metrics?.[0] ?? 'requests'
}

export function getMockData(query: MockQuery): MockDataResult {
  const dimensions = query.dimensions ?? []
  const metric = firstMetric(query.metrics)

  if (dimensions.includes('date')) {
    return {
      kind: 'time-series',
      rows: timeSeriesData[metric] ?? timeSeriesData.resolved_questions,
    }
  }

  if (dimensions.includes('category')) {
    return {
      kind: 'category',
      rows: categoryData[metric] ?? categoryData.workload_mix,
    }
  }

  if (dimensions.includes('table')) {
    const table = tableData[metric] ?? tableData.ai_queue
    const limit = query.limit ?? table.rows.length

    return {
      ...table,
      rows: table.rows.slice(0, limit),
    }
  }

  return { kind: 'metric', ...(metricData[metric] ?? metricData.requests) }
}
