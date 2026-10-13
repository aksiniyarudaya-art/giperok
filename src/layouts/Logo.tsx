import './shell.css'
import { Link } from 'react-router-dom'
import { MARK_PATH, MARK_VIEWBOX } from './brandMark'

export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox={MARK_VIEWBOX} height={size} width={size} className={className} aria-hidden>
      <path d={MARK_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  )
}

/* Название и подпись набраны одной ширины, как в брендбуке: textLength растягивает межбуквенный интервал. */
const W = 176

export function Logo({ inverted, to = '/', sub = true }: { inverted?: boolean; to?: string; sub?: boolean }) {
  return (
    <Link to={to} className={`logo ${inverted ? 'inv' : ''}`} aria-label="Гиперок — на главную">
      <BrandMark size={40} className="logo-mark" />
      <svg className="logo-word" viewBox={`0 0 ${W} ${sub ? 40 : 28}`} width={W} height={sub ? 40 : 28} aria-hidden>
        <text x="0" y="25" textLength={W} lengthAdjust="spacing" className="logo-name">ГИПЕРОК</text>
        {sub && <text x="0" y="38" textLength={W} lengthAdjust="spacing" className="logo-sub">АРЕНДА СПЕЦТЕХНИКИ И ГРУЗОПЕРЕВОЗКИ</text>}
      </svg>
    </Link>
  )
}
