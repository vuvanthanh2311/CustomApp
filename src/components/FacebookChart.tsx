import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts'

type Props = {
  data: any
  error: Error | null
}

function normalize(data: any): Array<{ date: string; name: string; value: number }> {
  const rows: Array<{ date: string; name: string; value: number }> = []
  if (!data) return rows
  for (const [metricName, payload] of Object.entries<any>(data)) {
    // New aggregated shape from server when using user token: { items: [{ name, data }] }
    const items = Array.isArray(payload?.items) ? payload.items : []
    if (items.length > 0) {
      for (const item of items) {
        // Handle both Page insights and Ads insights
        const pageValues = item?.data?.data?.[0]?.values || item?.data?.[0]?.values
        if (Array.isArray(pageValues)) {
          for (const point of pageValues) {
            rows.push({
              date: point.end_time ?? point.date ?? '',
              name: String(item?.name || metricName),
              value: Number(point.value ?? 0),
            })
          }
          continue
        }

        const adsRows = Array.isArray(item?.data?.data) ? item.data.data : []
        if (adsRows.length > 0 && (adsRows[0].reach !== undefined || adsRows[0].date_start)) {
          for (const r of adsRows) {
            rows.push({
              date: r.date_stop || r.date_start || '',
              name: String(item?.name || metricName),
              value: Number(r.reach ?? 0),
            })
          }
          continue
        }
      }
      continue
    }

    // Legacy single-page shape
    const insights = payload?.data?.[0]?.values || []
    for (const point of insights) {
      rows.push({ date: point.end_time ?? point.date ?? '', name: String(metricName), value: Number(point.value ?? 0) })
    }
  }
  return rows
}

export function FacebookChart({ data, error }: Props) {
  if (error) {
    return <div className="text-sm text-red-400">Lỗi: {error.message}</div>
  }
  const rows = normalize(data)
  const groupedByDate: Record<string, Record<string, number>> = {}
  for (const r of rows) {
    groupedByDate[r.date] = groupedByDate[r.date] || {}
    groupedByDate[r.date][r.name] = r.value
  }
  const dataset = Object.entries(groupedByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date, ...vals }))

  const metricKeys = Array.from(new Set(rows.map((r) => r.name)))

  return (
    <div style={{ width: '100%', height: 360 }}>
      <ResponsiveContainer>
        <LineChart data={dataset} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
          <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
          <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937' }} />
          <Legend />
          {metricKeys.map((key, idx) => (
            <Line key={key} type="monotone" dataKey={key} stroke={["#60A5FA", "#34D399", "#F472B6", "#FBBF24"][idx % 4]} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}


