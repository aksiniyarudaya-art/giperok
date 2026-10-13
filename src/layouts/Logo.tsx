import './shell.css'
import { Link } from 'react-router-dom'

export function Logo({ inverted, to = '/' }: { inverted?: boolean; to?: string }) {
  return (
    <Link to={to} className={`logo ${inverted ? 'inv' : ''}`} aria-label="СпецХаб — на главную">
      <svg viewBox="0 0 64 64" width="30" height="30" aria-hidden>
        <rect width="64" height="64" rx="14" fill="var(--accent)" />
        <path d="M14 44h36v6H14zM18 40l10-22h8l-6 14h16l-4 8z" fill="#16191d" />
      </svg>
      <span>Спец<b>Хаб</b></span>
    </Link>
  )
}
