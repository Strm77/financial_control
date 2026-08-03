import './BarChart.css'

export interface BarChartSeries {
  key: string
  label: string
  color: string
}

export interface BarChartDatum {
  label: string
  values: Record<string, number>
}

interface BarChartProps {
  series: BarChartSeries[]
  data: BarChartDatum[]
  formatValue?: (value: number) => string
}

export function BarChart({ series, data, formatValue }: BarChartProps) {
  const max = Math.max(1, ...data.flatMap((datum) => series.map((s) => datum.values[s.key] ?? 0)))
  const format = formatValue ?? ((value: number) => String(value))

  return (
    <div className="bar-chart">
      <div className="bar-chart__plot">
        {data.map((datum) => (
          <div className="bar-chart__group" key={datum.label}>
            <div className="bar-chart__bars">
              {series.map((s) => {
                const value = datum.values[s.key] ?? 0
                const heightPct = Math.max(1, (value / max) * 100)
                return (
                  <div
                    key={s.key}
                    className="bar-chart__bar"
                    style={{ height: `${heightPct}%`, background: s.color }}
                    title={`${s.label} — ${datum.label}: ${format(value)}`}
                  />
                )
              })}
            </div>
            <span className="bar-chart__label">{datum.label}</span>
          </div>
        ))}
      </div>
      <div className="bar-chart__legend">
        {series.map((s) => (
          <span className="bar-chart__legend-item" key={s.key}>
            <span className="bar-chart__legend-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
