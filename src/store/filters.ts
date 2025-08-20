import { create } from 'zustand'

export type Channel = 'facebook_ads'

export type FiltersState = {
  channels: Channel[]
  metrics: string[]
  dateRange: { since?: string; until?: string }
  userAccessToken?: string
  adsDimension: 'ad_id' | 'ad_name' | 'adset_id' | 'adset_name' | 'campaign_name'
  setChannels: (channels: Channel[]) => void
  setMetrics: (metrics: string[]) => void
  setDateRange: (dateRange: { since?: string; until?: string }) => void
  setUserAccessToken: (token: string) => void
  setAdsDimension: (d: 'ad_id' | 'ad_name' | 'adset_id' | 'adset_name' | 'campaign_name') => void
}

export const useFiltersStore = create<FiltersState>((set) => ({
  channels: ['facebook_ads'],
  metrics: ['page_impressions', 'page_engaged_users'],
  dateRange: {},
  userAccessToken: '',
  adsDimension: 'ad_id',
  setChannels: (channels) => set({ channels }),
  setMetrics: (metrics) => set({ metrics }),
  setDateRange: (dateRange) => set({ dateRange }),
  setUserAccessToken: (token) => set({ userAccessToken: token }),
  setAdsDimension: (d) => set({ adsDimension: d }),
}))


