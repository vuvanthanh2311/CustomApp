import { useQuery } from '@tanstack/react-query'
import { fetchFacebookInsights } from '../lib/api'
import { useFiltersStore } from '../store/filters'
import { FiltersBar } from './FiltersBar'
import { FacebookAdsHeatmap } from './FacebookAdsHeatmap'

export function Dashboard() {
  const { channels, dateRange, userAccessToken, adsDimension } = useFiltersStore()

  const fbAdsQuery = useQuery({
    queryKey: ['fb-ads', { dateRange, userAccessToken, adsDimension }],
    queryFn: async () => {
      return await fetchFacebookInsights({ metric: 'reach', period: 'day', dateRange, userAccessToken, type: 'ads', adsDimension })
    },
    enabled: channels.includes('facebook_ads') && Boolean(userAccessToken),
  })

  const sheetQuery = useQuery({
    queryKey: ['sheet'],
    queryFn: () => fetchSheet(),
    enabled: channels.includes('google_sheets'),
  })

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <h1 className="text-2xl font-semibold">CMO Dashboard</h1>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <FiltersBar />

        {channels.includes('facebook_ads') && (
          <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium">Facebook Ads (Heatmap)</h2>
              {fbAdsQuery.isLoading && <span className="text-sm text-neutral-400">Đang tải...</span>}
            </div>
            <FacebookAdsHeatmap data={fbAdsQuery.data} error={fbAdsQuery.error as Error | null} dimension={adsDimension} />
          </section>
        )}
      </main>
    </div>
  )
}


