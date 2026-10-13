import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu, Moon, Sun, X } from 'lucide-react'
import { Avatar } from '../ui'
import { Logo } from './Logo'
import './shell.css'

export type NavItem = { to: string; label: string; icon: ReactNode; badge?: number; end?: boolean }
export type NavGroup = { title?: string; items: NavItem[] }

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches))
  return (
    <button className="btn btn-ghost btn-icon btn-sm" aria-label="Сменить тему" onClick={() => {
      const next = dark ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      try { localStorage.setItem('theme', next) } catch { /* без сохранения */ }
      setDark(!dark)
    }}>{dark ? <Sun /> : <Moon />}</button>
  )
}

export function Shell({ groups, area, user, userRole, top }: { groups: NavGroup[]; area: string; user: string; userRole: string; top?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()
  const all = groups.flatMap((g) => g.items)
  const current = all.filter((i) => loc.pathname.startsWith(i.to)).sort((a, b) => b.to.length - a.to.length)[0]

  return (
    <div className="shell">
      <aside className={`side ${open ? 'open' : ''}`}>
        <div className="side-top">
          <Logo />
          <button className="btn btn-ghost btn-icon btn-sm side-close" onClick={() => setOpen(false)} aria-label="Закрыть меню"><X /></button>
        </div>
        <div className="side-area">{area}</div>
        <nav className="side-nav">
          {groups.map((g, gi) => (
            <div key={gi} className="side-group">
              {g.title && <div className="side-title">{g.title}</div>}
              {g.items.map((i) => (
                <NavLink key={i.to} to={i.to} end={i.end} onClick={() => setOpen(false)} className={({ isActive }) => `side-link ${isActive ? 'on' : ''}`}>
                  {i.icon}<span>{i.label}</span>{i.badge ? <em>{i.badge}</em> : null}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-user">
          <Avatar name={user} size="sm" />
          <div className="grow"><div className="side-user-name">{user}</div><div className="side-user-role">{userRole}</div></div>
          <button className="btn btn-ghost btn-icon btn-sm" aria-label="Выйти" onClick={() => nav('/login')}><LogOut /></button>
        </div>
      </aside>
      {open && <div className="side-scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="btn btn-ghost btn-icon burger" onClick={() => setOpen(true)} aria-label="Открыть меню"><Menu /></button>
          <div className="topbar-title">{current?.label ?? area}</div>
          <div className="row" style={{ gap: 6 }}>
            {top}
            <ThemeToggle />
            <button className="btn btn-ghost btn-icon btn-sm" aria-label="Уведомления" style={{ position: 'relative' }}><Bell /><span className="dot" /></button>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  )
}
