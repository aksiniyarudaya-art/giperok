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

export function Logo({ inverted, to = '/', sub = true }: { inverted?: boolean; to?: string; sub?: boolean }) {
  return (
    <Link to={to} className={`logo ${inverted ? 'inv' : ''}`} aria-label="Гиперок — на главную">
      <BrandMark size={34} className="logo-mark" />
      <span className="logo-text">
        <b>ГИПЕРОК</b>
        {sub && <small>аренда спецтехники</small>}
      </span>
    </Link>
  )
}
