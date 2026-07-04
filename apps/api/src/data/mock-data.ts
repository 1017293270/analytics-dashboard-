export type MockDataResult =
  | { kind: 'metric'; value: number; label: string; trend: number }
  | { kind: 'time-series'; rows: Array<{ date: string; count: number }> }
  | { kind: 'category'; rows: Array<{ category: string; value: number }> }
  | { kind: 'table'; columns: string[]; rows: Array<Record<string, string | number>> }

type MockQuery = { dimensions?: string[]; metrics?: string[]; limit?: number }

const metricData: Record<string, { value: number; label: string; trend: number }> = {
  school_device_online_rate: { value: 98.6, label: '设备在线率', trend: 1.2 },
  school_online_devices: { value: 642, label: '在线设备', trend: 2.6 },
  school_today_alarms: { value: 8, label: '今日告警', trend: -6.4 },
  school_unresolved_alarms: { value: 4, label: '未处理告警', trend: -12.5 },
  blackboard_active_rooms: { value: 36, label: '互动课堂', trend: 8.9 },
  application_launches_today: { value: 1286, label: '应用启动', trend: 16.8 },
  student_growth_index: { value: 91.8, label: '学生成长指数', trend: 3.1 },
  teacher_development_index: { value: 88.6, label: '教师发展指数', trend: 4.2 },
  teaching_activity_count: { value: 156, label: '课堂活动数', trend: 11.6 },
  repair_completion_rate: { value: 93.5, label: '维修完成率', trend: 5.8 },
  moral_activity_coverage: { value: 87.4, label: '德育活动覆盖率', trend: 6.2 },
  teacher_research_task_count: { value: 24, label: '教研任务', trend: 9.1 },
  teacher_research_tasks: { value: 24, label: '教研任务', trend: 9.1 },
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
  device_alarm_trend: [
    { date: '07-03', count: 11 },
    { date: '07-04', count: 9 },
    { date: '07-05', count: 7 },
    { date: '07-06', count: 10 },
    { date: '07-07', count: 6 },
    { date: '07-08', count: 8 },
    { date: '07-09', count: 4 },
  ],
  device_online_trend: [
    { date: '07-03', count: 97 },
    { date: '07-04', count: 98 },
    { date: '07-05', count: 98 },
    { date: '07-06', count: 99 },
    { date: '07-07', count: 98 },
    { date: '07-08', count: 99 },
    { date: '07-09', count: 99 },
  ],
  application_usage_trend: [
    { date: '07-03', count: 968 },
    { date: '07-04', count: 1024 },
    { date: '07-05', count: 1128 },
    { date: '07-06', count: 1186 },
    { date: '07-07', count: 1210 },
    { date: '07-08', count: 1248 },
    { date: '07-09', count: 1286 },
  ],
  student_activity_trend: [
    { date: '07-03', count: 62 },
    { date: '07-04', count: 68 },
    { date: '07-05', count: 74 },
    { date: '07-06', count: 79 },
    { date: '07-07', count: 83 },
    { date: '07-08', count: 86 },
    { date: '07-09', count: 91 },
  ],
  teacher_research_trend: [
    { date: '07-03', count: 14 },
    { date: '07-04', count: 16 },
    { date: '07-05', count: 18 },
    { date: '07-06', count: 17 },
    { date: '07-07', count: 21 },
    { date: '07-08', count: 22 },
    { date: '07-09', count: 24 },
  ],
  teaching_activity_trend: [
    { date: '07-03', count: 98 },
    { date: '07-04', count: 116 },
    { date: '07-05', count: 128 },
    { date: '07-06', count: 136 },
    { date: '07-07', count: 142 },
    { date: '07-08', count: 149 },
    { date: '07-09', count: 156 },
  ],
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
  device_type_status: [
    { category: '智慧黑板', value: 286 },
    { category: '交互平板', value: 218 },
    { category: '录播主机', value: 42 },
    { category: '班牌终端', value: 96 },
  ],
  alarm_level_distribution: [
    { category: '高优先级', value: 1 },
    { category: '中优先级', value: 3 },
    { category: '低优先级', value: 4 },
  ],
  application_platform_usage: [
    { category: '教学授课', value: 42 },
    { category: '设备运维', value: 24 },
    { category: '德育管理', value: 18 },
    { category: '教研发展', value: 16 },
  ],
  class_activity_rank: [
    { category: '三年级 2 班', value: 96 },
    { category: '五年级 1 班', value: 88 },
    { category: '初一 4 班', value: 82 },
    { category: '高二 3 班', value: 76 },
  ],
  student_growth_profile: [
    { category: '品德表现', value: 92 },
    { category: '体艺参与', value: 86 },
    { category: '学习习惯', value: 89 },
    { category: '心理健康', value: 91 },
    { category: '劳动实践', value: 84 },
  ],
  teacher_capability_profile: [
    { category: '课堂设计', value: 91 },
    { category: '数字应用', value: 88 },
    { category: '教研协作', value: 86 },
    { category: '作业评价', value: 84 },
    { category: '资源建设', value: 89 },
  ],
  repair_process_funnel: [
    { category: '已上报', value: 32 },
    { category: '已派单', value: 26 },
    { category: '处理中', value: 18 },
    { category: '已完成', value: 15 },
  ],
  teaching_activity_type_mix: [
    { category: '选词填空', value: 56 },
    { category: '判断对错', value: 48 },
    { category: '趣味选择', value: 52 },
  ],
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
  alarm_queue_education: {
    kind: 'table',
    columns: ['设备', '位置', '级别', '状态'],
    rows: [
      { 设备: 'HB-3F-021', 位置: '教学楼 3 楼 302 教室', 级别: '高', 状态: '未处理' },
      { 设备: 'DVR-1-201-01', 位置: '弱电间', 级别: '中', 状态: '处理中' },
      { 设备: 'ACC-1-001-01', 位置: '南门出入口', 级别: '低', 状态: '已处理' },
      { 设备: 'PAD-2F-118', 位置: '教学楼 2 楼 218 教室', 级别: '中', 状态: '待上门' },
    ],
  },
  device_repair_orders: {
    kind: 'table',
    columns: ['设备', '位置', '状态', '责任人'],
    rows: [
      { 设备: 'HB-3F-021', 位置: '教学楼 3 楼 302 教室', 状态: '处理中', 责任人: '王工' },
      { 设备: 'PAD-2F-118', 位置: '教学楼 2 楼 218 教室', 状态: '待上门', 责任人: '李工' },
      { 设备: 'OPS-5F-009', 位置: '综合楼 5 楼录播室', 状态: '已派单', 责任人: '赵工' },
      { 设备: 'NVR-1F-002', 位置: '弱电间', 状态: '已完成', 责任人: '王工' },
    ],
  },
  class_activity_detail: {
    kind: 'table',
    columns: ['班级', '活动', '参与率', '负责人'],
    rows: [
      { 班级: '三年级 2 班', 活动: '文明礼仪打卡', 参与率: '96%', 负责人: '陈老师' },
      { 班级: '五年级 1 班', 活动: '劳动实践周', 参与率: '92%', 负责人: '赵老师' },
      { 班级: '初一 4 班', 活动: '心理健康课堂', 参与率: '88%', 负责人: '王老师' },
      { 班级: '高二 3 班', 活动: '志愿服务', 参与率: '84%', 负责人: '李老师' },
    ],
  },
  teacher_research_task_detail: {
    kind: 'table',
    columns: ['教研组', '任务', '进度', '负责人'],
    rows: [
      { 教研组: '语文组', 任务: '智慧课堂同课异构', 进度: '进行中', 负责人: '周老师' },
      { 教研组: '数学组', 任务: '作业数据分析', 进度: '已完成', 负责人: '刘老师' },
      { 教研组: '英语组', 任务: '听说课堂资源共建', 进度: '进行中', 负责人: '黄老师' },
      { 教研组: '综合组', 任务: '跨学科项目设计', 进度: '待评审', 负责人: '宋老师' },
    ],
  },
  teacher_research_tasks: {
    kind: 'table',
    columns: ['教研组', '任务', '进度', '负责人'],
    rows: [
      { 教研组: '语文组', 任务: '智慧课堂同课异构', 进度: '进行中', 负责人: '周老师' },
      { 教研组: '数学组', 任务: '作业数据分析', 进度: '已完成', 负责人: '刘老师' },
      { 教研组: '英语组', 任务: '听说课堂资源共建', 进度: '进行中', 负责人: '黄老师' },
      { 教研组: '综合组', 任务: '跨学科项目设计', 进度: '待评审', 负责人: '宋老师' },
    ],
  },
  application_usage_detail: {
    kind: 'table',
    columns: ['应用', '端口', '今日启动', '状态'],
    rows: [
      { 应用: '智慧黑板', 端口: '网页端', 今日启动: 386, 状态: '正常' },
      { 应用: '移动巡检', 端口: '移动端', 今日启动: 218, 状态: '正常' },
      { 应用: '德育活动', 端口: '网页端', 今日启动: 176, 状态: '正常' },
      { 应用: '教研资源', 端口: '网页端', 今日启动: 164, 状态: '正常' },
    ],
  },
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
