/* Лёгкие SVG-графики без библиотек. Цвета берутся из токенов темы. */

export function BarChart({ data, height = 200, format = (v: number) => String(v), color = 'var(--accent)' }: { data: { label: string; value: number; value2?: number }[]; height?: number; format?: (v: number) => string; color?: string }) {
  const w = 600, h = height, padL = 44, padB = 26, padT = 12
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.value2 ?? 0)))
  const nice = Math.ceil(max / 4 / 10 ** Math.floor(Math.log10(max / 4))) * 10 ** Math.floor(Math.log10(max / 4)) * 4
  const ih = h - padB - padT, iw = w - padL - 8
  const bw = iw / data.length
  const ticks = [0, .25, .5, .75, 1].map((t) => t * nice)
  const y = (v: number) => padT + ih - (v / nice) * ih
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="График">
      {ticks.map((t) => (
        <g key={t}><line className="grid-line" x1={padL} x2={w - 8} y1={y(t)} y2={y(t)} /><text x={padL - 8} y={y(t) + 4} textAnchor="end">{format(t)}</text></g>
      ))}
      {data.map((d, i) => {
        const x = padL + i * bw
        const two = d.value2 !== undefined
        const bwi = two ? bw * .32 : bw * .56
        return (
          <g key={d.label}>
            <rect x={x + (bw - (two ? bwi * 2 + 4 : bwi)) / 2} y={y(d.value)} width={bwi} height={Math.max(0, padT + ih - y(d.value))} rx="3" fill={color} />
            {two && <rect x={x + (bw - (bwi * 2 + 4)) / 2 + bwi + 4} y={y(d.value2!)} width={bwi} height={Math.max(0, padT + ih - y(d.value2!))} rx="3" fill="var(--steel)" />}
            <text x={x + bw / 2} y={h - 8} textAnchor="middle">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function LineChart({ data, height = 180, format = (v: number) => String(v) }: { data: { label: string; value: number }[]; height?: number; format?: (v: number) => string }) {
  const w = 600, h = height, padL = 44, padB = 26, padT = 12
  const max = Math.max(1, ...data.map((d) => d.value)) * 1.15
  const ih = h - padB - padT, iw = w - padL - 12
  const x = (i: number) => padL + (i / Math.max(1, data.length - 1)) * iw
  const y = (v: number) => padT + ih - (v / max) * ih
  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ')
  const last = data[data.length - 1]
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="График">
      {[0, .5, 1].map((t) => <g key={t}><line className="grid-line" x1={padL} x2={w - 12} y1={y(t * max / 1.15)} y2={y(t * max / 1.15)} /><text x={padL - 8} y={y(t * max / 1.15) + 4} textAnchor="end">{format(t * max / 1.15)}</text></g>)}
      <polygon points={`${padL},${padT + ih} ${pts} ${x(data.length - 1)},${padT + ih}`} fill="var(--accent-soft)" />
      <polyline points={pts} fill="none" stroke="var(--accent-strong)" strokeWidth="2.5" strokeLinejoin="round" />
      {last && <circle cx={x(data.length - 1)} cy={y(last.value)} r="5" fill="var(--accent-strong)" stroke="var(--surface)" strokeWidth="2" />}
      {data.map((d, i) => <text key={d.label} x={x(i)} y={h - 8} textAnchor="middle">{d.label}</text>)}
    </svg>
  )
}

export function Donut({ parts, size = 140, center }: { parts: { label: string; value: number; color: string }[]; size?: number; center?: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1
  const r = 52, c = 2 * Math.PI * r
  let off = 0
  return (
    <div className="row" style={{ gap: 20, alignItems: 'center' }}>
      <svg viewBox="0 0 140 140" width={size} height={size} role="img" aria-label="Диаграмма">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="18" />
        {parts.map((p) => {
          const len = (p.value / total) * c
          const el = <circle key={p.label} cx="70" cy="70" r={r} fill="none" stroke={p.color} strokeWidth="18" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-off} transform="rotate(-90 70 70)" />
          off += len
          return el
        })}
        {center && <text x="70" y="76" textAnchor="middle" style={{ font: '600 20px var(--font-display)', fill: 'var(--fg)' }}>{center}</text>}
      </svg>
      <div className="stack-sm" style={{ fontSize: 13 }}>
        {parts.map((p) => (
          <div key={p.label} className="row" style={{ gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color }} />
            <span className="dim">{p.label}</span><b className="tnum">{p.value}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Sparkline({ values, width = 90, height = 28 }: { values: number[]; width?: number; height?: number }) {
  const max = Math.max(...values), min = Math.min(...values)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 3 - ((v - min) / (max - min || 1)) * (height - 6)}`).join(' ')
  return <svg width={width} height={height} aria-hidden><polyline points={pts} fill="none" stroke="var(--accent-strong)" strokeWidth="2" /></svg>
}
