type Props = {
  data: any
  error: Error | null
}

export function SheetTable({ data, error }: Props) {
  if (error) {
    return <div className="text-sm text-red-400">Lỗi: {error.message}</div>
  }
  const values: string[][] = data?.values || data?.data?.values || []
  if (!values?.length) {
    return <div className="text-sm text-neutral-400">Không có dữ liệu</div>
  }
  const [header, ...rows] = values

  return (
    <div className="overflow-auto">
      <table className="w-full min-w-max table-auto border-collapse text-sm">
        <thead>
          <tr className="bg-neutral-800">
            {header.map((h, i) => (
              <th key={i} className="sticky top-0 border-b border-neutral-700 px-3 py-2 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-neutral-900/60' : ''}>
              {r.map((c, ci) => (
                <td key={ci} className="border-b border-neutral-800 px-3 py-2">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


