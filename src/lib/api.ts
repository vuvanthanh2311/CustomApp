import axios from 'axios'

export const api = axios.create({ baseURL: '/api' })

export type DateRange = { since?: string; until?: string }

export async function fetchFacebookInsights(args: {
  metric: string
  period?: 'day' | 'week' | 'days_28' | 'month' | 'lifetime'
  dateRange?: DateRange
  userAccessToken?: string
  type?: 'pages' | 'ads'
  adsDimension?: 'ad_id' | 'ad_name' | 'adset_id' | 'adset_name' | 'campaign_name'
}) {
  const params = new URLSearchParams()
  params.set('metric', args.metric)
  if (args.period) params.set('period', args.period)
  if (args.dateRange?.since) params.set('since', args.dateRange.since)
  if (args.dateRange?.until) params.set('until', args.dateRange.until)
  if (args.userAccessToken) params.set('user_access_token', args.userAccessToken)
  if (args.type) params.set('type', args.type)
  if (args.adsDimension) params.set('ads_dimension', args.adsDimension)
  const { data } = await api.get(`/facebook/insights?${params.toString()}`)
  return data as unknown
}

export async function fetchSheet(range?: string) {
  const qs = range ? `?range=${encodeURIComponent(range)}` : ''
  const { data } = await api.get(`/sheets/data${qs}`)
  return data as unknown
}


