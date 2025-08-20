
type AdsRow = {
	ad_id?: string
	ad_name?: string
	adset_id?: string
	adset_name?: string
	campaign_name?: string

	reach?: string | number
	impressions?: string | number
	clicks?: string | number
	spend?: string | number
	cpm?: string | number
	ctr?: string | number
	conversions?: any
	actions?: any
	date_start?: string
	date_stop?: string
	status?: string
}

type Props = {
	data: any
	error: Error | null
	dimension?: 'ad_id' | 'ad_name' | 'adset_id' | 'adset_name' | 'campaign_name'
}

function toNumber(value: unknown): number {
	if (value == null) return 0
	const n = Number(value)
	return Number.isFinite(n) ? n : 0
}

function heatBg(value: number, max: number): string {
	if (!max) return 'transparent'
	const ratio = Math.min(1, Math.max(0, value / max))
	const alpha = 0.12 + 0.38 * ratio
	return `rgba(96, 165, 250, ${alpha.toFixed(3)})` // sky tone overlay for dark bg
}

export function FacebookAdsHeatmap({ data, error, dimension = 'ad_id' }: Props) {
	if (error) {
		return <div className="text-sm text-red-400">Lỗi: {error.message}</div>
	}

	const items: Array<{ name: string; data?: { data?: AdsRow[] } }> = Array.isArray(data?.items) ? data.items : []
	const rows: AdsRow[] = []
	for (const item of items) {
		const ds = Array.isArray(item?.data?.data) ? item?.data?.data : []
		for (const r of ds) rows.push(r)
	}
	if (rows.length === 0) return <div className="text-sm text-neutral-400">Không có dữ liệu</div>

	// sort: ACTIVE first
	function isActiveStatus(status?: string): number {
		if (!status) return 0
		return String(status).toUpperCase() === 'ACTIVE' ? 1 : 0
	}
	const sortedRows = [...rows].sort((a, b) => isActiveStatus(b.status) - isActiveStatus(a.status))

	// compute maxima for heat coloring
	const maxReach = Math.max(...sortedRows.map((r) => toNumber(r.reach))) || 0
	const maxImpr = Math.max(...sortedRows.map((r) => toNumber(r.impressions))) || 0
	const maxClicks = Math.max(...sortedRows.map((r) => toNumber(r.clicks))) || 0
	const maxSpend = Math.max(...sortedRows.map((r) => toNumber(r.spend))) || 0
	const maxCpm = Math.max(...sortedRows.map((r) => toNumber(r.cpm))) || 0
	const maxCtr = Math.max(...sortedRows.map((r) => toNumber(r.ctr))) || 0
	const maxConv =
		Math.max(
			...sortedRows.map((r) => {
				if (Array.isArray(r.actions)) {
					const conv = r.actions.find(
						(a: any) => a?.action_type?.includes('offsite_conversion') || a?.action_type === 'purchase'
					)
					return toNumber(conv?.value)
				}
				if (typeof r.conversions === 'number') return r.conversions
				return 0
			})
		) || 0

	function convValue(r: AdsRow): number {
		if (Array.isArray(r.actions)) {
			const conv = r.actions.find(
				(a: any) => a?.action_type?.includes('offsite_conversion') || a?.action_type === 'purchase'
			)
			return toNumber(conv?.value)
		}
		if (typeof r.conversions === 'number') return r.conversions
		return 0
	}

	return (
		<div className="overflow-auto">
			<table className="w-full min-w-[1000px] table-auto border-collapse text-sm">
				<thead>
					<tr className="bg-neutral-800">
						<th className="sticky top-0 border-b border-neutral-700 px-3 py-2 text-left font-medium">status + {dimension}</th>
						<th className="sticky top-0 border-b border-neutral-700 px-3 py-2 text-left font-medium">reach</th>
						<th className="sticky top-0 border-b border-neutral-700 px-3 py-2 text-left font-medium">impressions</th>
						<th className="sticky top-0 border-b border-neutral-700 px-3 py-2 text-left font-medium">clicks</th>
						<th className="sticky top-0 border-b border-neutral-700 px-3 py-2 text-left font-medium">spend</th>
						<th className="sticky top-0 border-b border-neutral-700 px-3 py-2 text-left font-medium">date_start</th>
						<th className="sticky top-0 border-b border-neutral-700 px-3 py-2 text-left font-medium">date_stop</th>
						<th className="sticky top-0 border-b border-neutral-700 px-3 py-2 text-left font-medium">cpm</th>
						<th className="sticky top-0 border-b border-neutral-700 px-3 py-2 text-left font-medium">ctr</th>
						<th className="sticky top-0 border-b border-neutral-700 px-3 py-2 text-left font-medium">convert</th>
					</tr>
				</thead>
				<tbody>
					{sortedRows.map((r, idx) => {
						const reachN = toNumber(r.reach)
						const imprN = toNumber(r.impressions)
						const clicksN = toNumber(r.clicks)
						const spendN = toNumber(r.spend)
						const cpmN = toNumber(r.cpm)
						const ctrN = toNumber(r.ctr)
						const convN = convValue(r)
						return (
							<tr key={idx} className={idx % 2 === 0 ? 'bg-neutral-900/60' : ''}>
								<td className="border-b border-neutral-800 px-3 py-2">
									<span className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${String(r.status).includes('ACTIVE') ? 'bg-green-800/50 text-green-300' : 'bg-neutral-700 text-neutral-200'}`}>
										{String(r.status || '-')}
									</span>
									<span className="ml-2 opacity-80">{(r as any)[dimension] || '-'}</span>
								</td>
								<td className="border-b border-neutral-800 px-3 py-2 text-right" style={{ background: heatBg(reachN, maxReach) }}>{reachN.toLocaleString()}</td>
								<td className="border-b border-neutral-800 px-3 py-2 text-right" style={{ background: heatBg(imprN, maxImpr) }}>{imprN.toLocaleString()}</td>
								<td className="border-b border-neutral-800 px-3 py-2 text-right" style={{ background: heatBg(clicksN, maxClicks) }}>{clicksN.toLocaleString()}</td>
								<td className="border-b border-neutral-800 px-3 py-2 text-right" style={{ background: heatBg(spendN, maxSpend) }}>{spendN.toLocaleString()}</td>
								<td className="border-b border-neutral-800 px-3 py-2">{(r as any).entity_start || r.date_start}</td>
								<td className="border-b border-neutral-800 px-3 py-2">{(r as any).entity_end || r.date_stop}</td>
								<td className="border-b border-neutral-800 px-3 py-2 text-right" style={{ background: heatBg(cpmN, maxCpm) }}>{cpmN.toLocaleString()}</td>
								<td className="border-b border-neutral-800 px-3 py-2 text-right" style={{ background: heatBg(ctrN, maxCtr) }}>{ctrN.toLocaleString()}</td>
								<td className="border-b border-neutral-800 px-3 py-2 text-right" style={{ background: heatBg(convN, maxConv) }}>{convN.toLocaleString()}</td>
							</tr>
						)
					})}
				</tbody>
			</table>
		</div>
	)
}


