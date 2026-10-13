import type { EquipmentCategory } from '../data/types'

/* Стилизованные силуэты техники вместо фото (до загрузки реальных фотографий). */
const bodies: Record<EquipmentCategory, React.ReactNode> = {
  excavator: (
    <g>
      <rect x="70" y="128" width="130" height="22" rx="11" fill="var(--ink)" />
      <circle cx="84" cy="139" r="7" fill="var(--line-strong)" /><circle cx="186" cy="139" r="7" fill="var(--line-strong)" />
      <rect x="82" y="96" width="104" height="30" rx="4" fill="var(--accent)" />
      <rect x="140" y="68" width="40" height="30" rx="4" fill="var(--accent)" />
      <rect x="146" y="74" width="28" height="16" rx="2" fill="var(--steel-soft)" />
      <path d="M100 100 L60 52 L36 70" stroke="var(--accent-strong)" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M28 66 l20 6 -6 24 -22 -6z" fill="var(--ink)" />
    </g>
  ),
  crane: (
    <g>
      <rect x="40" y="112" width="170" height="24" rx="4" fill="var(--accent)" />
      <rect x="178" y="88" width="34" height="26" rx="4" fill="var(--accent)" />
      <rect x="184" y="93" width="22" height="12" rx="2" fill="var(--steel-soft)" />
      {[60, 92, 150, 190].map((x) => <circle key={x} cx={x} cy="142" r="11" fill="var(--ink)" />)}
      <path d="M80 110 L196 30" stroke="var(--accent-strong)" strokeWidth="9" strokeLinecap="round" />
      <path d="M196 30 L196 70" stroke="var(--ink)" strokeWidth="2" />
      <path d="M190 70 h12 l-6 10z" fill="var(--ink)" />
    </g>
  ),
  loader: (
    <g>
      <circle cx="80" cy="132" r="20" fill="var(--ink)" /><circle cx="170" cy="132" r="20" fill="var(--ink)" />
      <circle cx="80" cy="132" r="8" fill="var(--line-strong)" /><circle cx="170" cy="132" r="8" fill="var(--line-strong)" />
      <rect x="70" y="92" width="120" height="30" rx="6" fill="var(--accent)" />
      <rect x="132" y="56" width="44" height="38" rx="4" fill="var(--accent)" />
      <rect x="138" y="62" width="32" height="20" rx="2" fill="var(--steel-soft)" />
      <path d="M80 100 L44 118" stroke="var(--accent-strong)" strokeWidth="9" strokeLinecap="round" />
      <path d="M24 104 h26 l-4 28 h-26z" fill="var(--ink)" />
    </g>
  ),
  dumptruck: (
    <g>
      <path d="M48 70 h110 l10 52 h-120z" fill="var(--accent)" />
      <rect x="168" y="78" width="44" height="44" rx="5" fill="var(--accent-strong)" />
      <rect x="176" y="84" width="28" height="16" rx="2" fill="var(--steel-soft)" />
      <rect x="44" y="120" width="170" height="10" rx="2" fill="var(--ink)" />
      {[70, 100, 190].map((x) => <circle key={x} cx={x} cy="138" r="13" fill="var(--ink)" />)}
    </g>
  ),
  bulldozer: (
    <g>
      <rect x="70" y="122" width="130" height="26" rx="13" fill="var(--ink)" />
      <rect x="80" y="90" width="110" height="32" rx="4" fill="var(--accent)" />
      <rect x="110" y="58" width="50" height="34" rx="4" fill="var(--accent)" />
      <rect x="116" y="64" width="38" height="18" rx="2" fill="var(--steel-soft)" />
      <path d="M40 80 q-8 30 0 66 h18 v-66z" fill="var(--ink-2)" />
      <path d="M58 112 L84 108" stroke="var(--ink)" strokeWidth="6" />
    </g>
  ),
  manipulator: (
    <g>
      <rect x="40" y="104" width="130" height="18" rx="3" fill="var(--steel)" />
      <rect x="168" y="78" width="44" height="44" rx="5" fill="var(--accent)" />
      <rect x="176" y="84" width="28" height="16" rx="2" fill="var(--steel-soft)" />
      <rect x="44" y="120" width="170" height="10" rx="2" fill="var(--ink)" />
      {[70, 100, 190].map((x) => <circle key={x} cx={x} cy="138" r="13" fill="var(--ink)" />)}
      <path d="M150 104 L150 60 L70 44" stroke="var(--accent-strong)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M70 44 v26" stroke="var(--ink)" strokeWidth="2" /><rect x="58" y="70" width="24" height="16" fill="var(--line-strong)" />
    </g>
  ),
  aerial: (
    <g>
      <rect x="40" y="110" width="130" height="14" rx="3" fill="var(--steel)" />
      <rect x="168" y="84" width="40" height="40" rx="5" fill="var(--accent)" />
      <rect x="175" y="90" width="26" height="14" rx="2" fill="var(--steel-soft)" />
      {[72, 186].map((x) => <circle key={x} cx={x} cy="132" r="13" fill="var(--ink)" />)}
      <path d="M90 110 L130 60 L70 26" stroke="var(--accent-strong)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="50" y="14" width="34" height="18" rx="2" fill="var(--ink)" />
    </g>
  ),
}

export function EquipmentArt({ category, label }: { category: EquipmentCategory; label?: string }) {
  return (
    <div className="eq-img" role="img" aria-label={label ?? 'Фото техники'}>
      <svg viewBox="0 0 240 180" preserveAspectRatio="xMidYMid meet">
        <rect width="240" height="180" fill="var(--surface-3)" />
        <path d="M0 150 H240 V180 H0z" fill="var(--line)" />
        {[30, 70, 110, 150, 190, 230].map((x) => (
          <path key={x} d={`M${x} 150 l-14 30`} stroke="var(--line-strong)" strokeWidth="1" />
        ))}
        {bodies[category]}
      </svg>
    </div>
  )
}
