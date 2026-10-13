import type { EquipmentCategory } from '../data/types'

/* Студийные силуэты техники вместо фото (до загрузки реальных фотографий). */
const bodies: Record<EquipmentCategory, React.ReactNode> = {
  excavator: (
    <g>
      <rect x="70" y="128" width="130" height="22" rx="11" fill="var(--art-wheel)" />
      <circle cx="84" cy="139" r="7" fill="var(--art-bg-1)" /><circle cx="186" cy="139" r="7" fill="var(--art-bg-1)" />
      <rect x="82" y="96" width="104" height="30" rx="4" fill="var(--art-body)" />
      <rect x="140" y="68" width="40" height="30" rx="4" fill="var(--art-body)" />
      <rect x="146" y="74" width="28" height="16" rx="2" fill="var(--art-glass)" />
      <path d="M100 100 L60 52 L36 70" stroke="var(--art-detail)" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M28 66 l20 6 -6 24 -22 -6z" fill="var(--art-wheel)" />
    </g>
  ),
  crane: (
    <g>
      <rect x="40" y="112" width="170" height="24" rx="4" fill="var(--art-body)" />
      <rect x="178" y="88" width="34" height="26" rx="4" fill="var(--art-body)" />
      <rect x="184" y="93" width="22" height="12" rx="2" fill="var(--art-glass)" />
      {[60, 92, 150, 190].map((x) => <circle key={x} cx={x} cy="142" r="11" fill="var(--art-wheel)" />)}
      <path d="M80 110 L196 30" stroke="var(--art-detail)" strokeWidth="9" strokeLinecap="round" />
      <path d="M196 30 L196 70" stroke="var(--art-wheel)" strokeWidth="2" />
      <path d="M190 70 h12 l-6 10z" fill="var(--art-wheel)" />
    </g>
  ),
  loader: (
    <g>
      <circle cx="80" cy="132" r="20" fill="var(--art-wheel)" /><circle cx="170" cy="132" r="20" fill="var(--art-wheel)" />
      <circle cx="80" cy="132" r="8" fill="var(--art-bg-1)" /><circle cx="170" cy="132" r="8" fill="var(--art-bg-1)" />
      <rect x="70" y="92" width="120" height="30" rx="6" fill="var(--art-body)" />
      <rect x="132" y="56" width="44" height="38" rx="4" fill="var(--art-body)" />
      <rect x="138" y="62" width="32" height="20" rx="2" fill="var(--art-glass)" />
      <path d="M80 100 L44 118" stroke="var(--art-detail)" strokeWidth="9" strokeLinecap="round" />
      <path d="M24 104 h26 l-4 28 h-26z" fill="var(--art-wheel)" />
    </g>
  ),
  dumptruck: (
    <g>
      <path d="M48 70 h110 l10 52 h-120z" fill="var(--art-body)" />
      <rect x="168" y="78" width="44" height="44" rx="5" fill="var(--art-detail)" />
      <rect x="176" y="84" width="28" height="16" rx="2" fill="var(--art-glass)" />
      <rect x="44" y="120" width="170" height="10" rx="2" fill="var(--art-wheel)" />
      {[70, 100, 190].map((x) => <circle key={x} cx={x} cy="138" r="13" fill="var(--art-wheel)" />)}
    </g>
  ),
  bulldozer: (
    <g>
      <rect x="70" y="122" width="130" height="26" rx="13" fill="var(--art-wheel)" />
      <rect x="80" y="90" width="110" height="32" rx="4" fill="var(--art-body)" />
      <rect x="110" y="58" width="50" height="34" rx="4" fill="var(--art-body)" />
      <rect x="116" y="64" width="38" height="18" rx="2" fill="var(--art-glass)" />
      <path d="M40 80 q-8 30 0 66 h18 v-66z" fill="var(--art-detail)" />
      <path d="M58 112 L84 108" stroke="var(--art-wheel)" strokeWidth="6" />
    </g>
  ),
  manipulator: (
    <g>
      <rect x="40" y="104" width="130" height="18" rx="3" fill="var(--art-detail)" />
      <rect x="168" y="78" width="44" height="44" rx="5" fill="var(--art-body)" />
      <rect x="176" y="84" width="28" height="16" rx="2" fill="var(--art-glass)" />
      <rect x="44" y="120" width="170" height="10" rx="2" fill="var(--art-wheel)" />
      {[70, 100, 190].map((x) => <circle key={x} cx={x} cy="138" r="13" fill="var(--art-wheel)" />)}
      <path d="M150 104 L150 60 L70 44" stroke="var(--art-detail)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M70 44 v26" stroke="var(--art-wheel)" strokeWidth="2" /><rect x="58" y="70" width="24" height="16" fill="var(--art-bg-1)" />
    </g>
  ),
  aerial: (
    <g>
      <rect x="40" y="110" width="130" height="14" rx="3" fill="var(--art-detail)" />
      <rect x="168" y="84" width="40" height="40" rx="5" fill="var(--art-body)" />
      <rect x="175" y="90" width="26" height="14" rx="2" fill="var(--art-glass)" />
      {[72, 186].map((x) => <circle key={x} cx={x} cy="132" r="13" fill="var(--art-wheel)" />)}
      <path d="M90 110 L130 60 L70 26" stroke="var(--art-detail)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="50" y="14" width="34" height="18" rx="2" fill="var(--art-wheel)" />
    </g>
  ),
}

export function EquipmentArt({ category, label }: { category: EquipmentCategory; label?: string }) {
  return (
    <div className="eq-img" role="img" aria-label={label ?? 'Фото техники'}>
      <svg viewBox="0 0 240 180" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`bg-${category}`} cx="50%" cy="38%" r="75%">
            <stop offset="0%" stopColor="var(--art-bg-1)" />
            <stop offset="100%" stopColor="var(--art-bg-2)" />
          </radialGradient>
          <radialGradient id={`sh-${category}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--art-shadow)" />
            <stop offset="100%" stopColor="var(--art-shadow)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="240" height="180" fill={`url(#bg-${category})`} />
        <line x1="0" y1="152.5" x2="240" y2="152.5" stroke="var(--art-detail)" strokeOpacity=".18" />
        <ellipse cx="125" cy="152" rx="96" ry="6" fill={`url(#sh-${category})`} />
        <g className="eq-grid">{Array.from({ length: 13 }, (_, i) => <line key={'v' + i} x1={i * 20} y1="0" x2={i * 20} y2="152" />)}{Array.from({ length: 8 }, (_, i) => <line key={'h' + i} x1="0" y1={i * 20} x2="240" y2={i * 20} />)}</g>
        <g className="eq-line" transform="translate(12 6) scale(.92)">{bodies[category]}</g>
      </svg>
    </div>
  )
}
