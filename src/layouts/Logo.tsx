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

/* Знак и надпись в одной системе координат: «ГИПЕРОК» начинается по верху слона, подпись стоит по его низу,
   ширина названия и подписи одинаковая (textLength растягивает межбуквенный интервал). */
const MARK = 40
const GAP = 10
const W = 176

export function Logo({ inverted, to = '/' }: { inverted?: boolean; to?: string }) {
  return (
    <Link to={to} className={`logo ${inverted ? 'inv' : ''}`} aria-label="Гиперок — на главную">
      <svg className="logo-svg" viewBox={`0 0 ${MARK + GAP + W} ${MARK}`} width={MARK + GAP + W} height={MARK} aria-hidden>
        <svg x="0" y="0" width={MARK} height={MARK} viewBox={MARK_VIEWBOX} className="logo-mark">
          <path d={MARK_PATH} fill="currentColor" fillRule="evenodd" />
        </svg>
        <text x={MARK + GAP} y="24.6" textLength={W} lengthAdjust="spacing" className="logo-name">ГИПЕРОК</text>
        <text x={MARK + GAP} y="39.6" textLength={W} lengthAdjust="spacing" className="logo-sub">АРЕНДА СПЕЦТЕХНИКИ И ГРУЗОПЕРЕВОЗКИ</text>
      </svg>
    </Link>
  )
}
