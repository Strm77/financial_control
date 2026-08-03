import './DonutChart.css'

export interface DonutChartSlice {
  key: string
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  slices: DonutChartSlice[]
  formatValue?: (value: number) => string
  emptyLabel?: string
}

export function DonutChart({ slices, formatValue, emptyLabel = 'Sem dados no período' }: DonutChartProps) {
  const format = formatValue ?? ((value: number) => String(value))
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  let cumulative = 0
  const stops = slices
    .filter((slice) => slice.value > 0)
    .map((slice) => {
      const start = total > 0 ? (cumulative / total) * 100 : 0
      cumulative += slice.value
      const end = total > 0 ? (cumulative / total) * 100 : 0
      return `${slice.color} ${start}% ${end}%`
    })

  const gradient = stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : undefined

  return (
    <div className="donut-chart">
      <div className="donut-chart__ring" style={gradient ? { background: gradient } : undefined}>
        <div className="donut-chart__hole">
          <span className="donut-chart__total mono">{format(total)}</span>
          <span className="donut-chart__total-label">Total</span>
        </div>
      </div>
      {total === 0 ? (
        <p className="donut-chart__empty">{emptyLabel}</p>
      ) : (
        <ul className="donut-chart__legend">
          {slices
            .filter((slice) => slice.value > 0)
            .map((slice) => (
              <li key={slice.key} className="donut-chart__legend-item">
                <span className="donut-chart__legend-dot" style={{ background: slice.color }} />
                <span className="donut-chart__legend-label">{slice.label}</span>
                <span className="donut-chart__legend-value mono">{format(slice.value)}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
