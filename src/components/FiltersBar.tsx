import { useFiltersStore } from '../store/filters'
import dayjs from 'dayjs'

export function FiltersBar() {
  const { channels, dateRange, userAccessToken, adsDimension, setChannels, setDateRange, setUserAccessToken, setAdsDimension } = useFiltersStore()

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex flex-col">
        <label className="mb-1 text-sm text-neutral-400">Kênh</label>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={channels.includes('facebook_ads')}
              onChange={(e) => setChannels(e.target.checked ? ['facebook_ads'] : [])}
            />
            <span className="capitalize">facebook ads</span>
          </label>
        </div>
      </div>

      {/* Removed FB Page metrics selector */}

      <div className="flex flex-col min-w-72 flex-1">
        <label className="mb-1 text-sm text-neutral-400">Facebook User Access Token</label>
        <input
          type="password"
          value={userAccessToken || ''}
          onChange={(e) => setUserAccessToken(e.target.value)}
          placeholder="Dán user access token"
          className="rounded border border-neutral-700 bg-neutral-800 p-2 text-sm"
        />
        <span className="mt-1 text-xs text-neutral-500">Dùng token người dùng để tự động lấy tất cả Trang bạn quản lý</span>
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-sm text-neutral-400">FB Ads cấp độ</label>
        <select
          value={adsDimension}
          onChange={(e) => setAdsDimension(e.target.value as any)}
          className="min-w-56 rounded border border-neutral-700 bg-neutral-800 p-2 text-sm"
        >
          <option value="ad_id">ad_id</option>
          <option value="ad_name">ad_name</option>
          <option value="adset_id">adset_id</option>
          <option value="adset_name">adset_name</option>
          <option value="campaign_name">campaign_name</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-sm text-neutral-400">Từ ngày</label>
        <input
          type="date"
          value={dateRange.since || ''}
          onChange={(e) => setDateRange({ ...dateRange, since: e.target.value })}
          max={dayjs().format('YYYY-MM-DD')}
          className="rounded border border-neutral-700 bg-neutral-800 p-2 text-sm"
        />
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-sm text-neutral-400">Đến ngày</label>
        <input
          type="date"
          value={dateRange.until || ''}
          onChange={(e) => setDateRange({ ...dateRange, until: e.target.value })}
          max={dayjs().format('YYYY-MM-DD')}
          className="rounded border border-neutral-700 bg-neutral-800 p-2 text-sm"
        />
      </div>

      <button
        onClick={() => setDateRange({ since: dayjs().subtract(7, 'day').format('YYYY-MM-DD'), until: dayjs().format('YYYY-MM-DD') })}
        className="ml-auto rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
      >
        7 ngày qua
      </button>
    </div>
  )
}


