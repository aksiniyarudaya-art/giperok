import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, CalendarClock, CheckCircle2, ChevronLeft, ClipboardList, Download, Home, MessageCircle, Moon, MoreVertical, PlusSquare, Share, Smartphone, Sun, User } from 'lucide-react'
import { Avatar } from '../../ui'
import { me } from '../../data/driver'
import { DriverProvider, useDriver } from './store'
import HomeScreen, { Notifications } from './Home'
import Shifts, { EquipmentCard } from './Shifts'
import Requests from './Requests'
import Chats, { ChatThreadView } from './Chats'
import Profile, { BriefingRun } from './Profile'
import ShiftFlow from './ShiftFlow'
import './driver.css'

const tabs = [
  { to: '/driver', end: true, label: 'Главная', icon: Home },
  { to: '/driver/shifts', label: 'Смены', icon: CalendarClock },
  { to: '/driver/requests', label: 'Заявки', icon: ClipboardList },
  { to: '/driver/chats', label: 'Чаты', icon: MessageCircle },
  { to: '/driver/profile', label: 'Профиль', icon: User },
]

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches))
  const toggle = () => {
    const next = dark ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('theme', next) } catch { /* без сохранения */ }
    setDark(!dark)
  }
  return { dark, toggle }
}

type BIPEvent = Event & { prompt: () => Promise<void> }

export default function DriverApp() {
  return (
    <DriverProvider>
      <Frame />
    </DriverProvider>
  )
}

function Frame() {
  const [bip, setBip] = useState<BIPEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setBip(e as BIPEvent) }
    const done = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', h)
    window.addEventListener('appinstalled', done)
    return () => { window.removeEventListener('beforeinstallprompt', h); window.removeEventListener('appinstalled', done) }
  }, [])
  const standalone = typeof window !== 'undefined' && matchMedia('(display-mode: standalone)').matches

  return (
    <div className="drv-root">
      <aside className="drv-aside">
        <Link to="/" className="drv-aside-back"><ChevronLeft size={16} />На сайт СпецХаб</Link>
        <div className="eyebrow">Часть 3 · мобильное приложение</div>
        <h1>Приложение водителя</h1>
        <p className="drv-aside-lead">
          Водитель и машинист видят смены, рейсы и вахты, принимают технику с фото-фиксацией, оформляют цифровой путевой лист,
          отмечают ход смены с гео-меткой и отправляют заявки на ТО, ремонт, заправку и отпуск. Справа — интерфейс так, как он выглядит на телефоне.
        </p>
        <div className="drv-aside-card">
          <h4><Smartphone size={18} />Как установить на главный экран</h4>
          <ol>
            <li><b>iPhone (Safari):</b> откройте ссылку → <span className="drv-key"><Share size={14} />Поделиться</span> → <span className="drv-key"><PlusSquare size={14} />На экран «Домой»</span></li>
            <li><b>Android (Chrome):</b> <span className="drv-key"><MoreVertical size={14} />меню</span> → <span className="drv-key"><Download size={14} />Установить приложение</span></li>
          </ol>
          <p className="muted">Иконка «СпецХаб» появится рядом с другими приложениями и откроется сразу в кабинете водителя, без адресной строки.</p>
          {standalone || installed ? (
            <div className="alert alert-ok"><CheckCircle2 />Приложение установлено</div>
          ) : bip ? (
            <button className="btn btn-primary" onClick={() => bip.prompt().then(() => setBip(null))}><Download />Установить приложение</button>
          ) : (
            <div className="drv-link mono">{location.origin + location.pathname}#/driver</div>
          )}
        </div>
        <div className="drv-aside-meta">
          <span>Демо-пользователь: <b>{me.name}</b>, {me.position.toLowerCase()}</span>
          <span>Дата в демо: 13.10.2026</span>
        </div>
      </aside>
      <div className="drv-device">
        <div className="drv-phone">
          <Phone />
        </div>
      </div>
    </div>
  )
}

function Phone() {
  const loc = useLocation()
  const nav = useNavigate()
  const { dark, toggle } = useTheme()
  const { notices, toasts, threads, requests, briefings, session } = useDriver()
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => { scroller.current?.scrollTo(0, 0) }, [loc.pathname])

  const p = loc.pathname.replace(/\/+$/, '')
  const seg = p.split('/').slice(2)
  const isFlow = seg[0] === 'shift'
  const sub = (seg[0] === 'chats' && seg[1]) || seg[0] === 'equipment' || seg[0] === 'briefing' || seg[0] === 'notifications'
  const title =
    seg[0] === 'shifts' ? 'Смены и техника'
    : seg[0] === 'requests' ? 'Заявки'
    : seg[0] === 'chats' ? (seg[1] ? threads.find((t) => t.id === seg[1])?.title ?? 'Чат' : 'Чаты')
    : seg[0] === 'profile' ? 'Профиль'
    : seg[0] === 'equipment' ? 'Карточка техники'
    : seg[0] === 'briefing' ? 'Инструктаж'
    : seg[0] === 'notifications' ? 'Уведомления'
    : seg[0] === 'shift' ? (session.phase === 'done' ? 'Смена завершена' : 'Рабочая смена')
    : ''
  const unread = notices.filter((n) => !n.read).length
  const badges: Record<string, number> = {
    '/driver/requests': requests.filter((r) => r.status === 'Решение' && !r.archived).length,
    '/driver/chats': threads.reduce((a, t) => a + (t.unread ?? 0), 0),
    '/driver/profile': briefings.filter((b) => b.status !== 'Пройден').length,
  }

  return (
    <>
      <header className={`drv-top ${!seg[0] ? 'home' : ''}`}>
        {sub || isFlow ? (
          <button className="drv-iconbtn" onClick={() => {
            const fallback = isFlow ? '/driver' : seg[0] === 'chats' ? '/driver/chats' : seg[0] === 'equipment' ? '/driver/shifts' : seg[0] === 'briefing' ? '/driver/profile' : '/driver'
            if (!isFlow && (window.history.state?.idx ?? 0) > 0) nav(-1); else nav(fallback)
          }} aria-label="Назад"><ChevronLeft /></button>
        ) : !seg[0] ? (
          <Link to="/driver/profile" className="drv-top-me" aria-label="Профиль"><Avatar name={me.name} size="sm" /></Link>
        ) : null}
        <div className="drv-top-title">
          {!seg[0] ? (
            <>
              <span className="drv-top-hello">Добрый день,</span>
              <b>{me.name.split(' ')[1]} {me.name.split(' ')[2]}</b>
            </>
          ) : <b>{title}</b>}
        </div>
        {session.phase === 'active' && !isFlow && (
          <Link to="/driver/shift" className="drv-live" aria-label="Открыть текущую смену"><span />Смена</Link>
        )}
        <Link to="/driver/notifications" className="drv-iconbtn drv-bell" aria-label={`Уведомления: ${unread}`}>
          <Bell />{unread > 0 && <i>{unread}</i>}
        </Link>
        <button className="drv-iconbtn" onClick={toggle} aria-label={dark ? 'Светлая тема' : 'Тёмная тема'}>{dark ? <Sun /> : <Moon />}</button>
      </header>

      <main className="drv-scroll" ref={scroller}>
        <div key={seg.slice(0, 2).join('/')} className={`drv-screen ${sub ? 'push' : ''}`}>
          <Routes>
            <Route index element={<HomeScreen />} />
            <Route path="shifts" element={<Shifts />} />
            <Route path="equipment" element={<EquipmentCard />} />
            <Route path="requests" element={<Requests />} />
            <Route path="chats" element={<Chats />} />
            <Route path="chats/:id" element={<ChatThreadView />} />
            <Route path="profile" element={<Profile />} />
            <Route path="briefing/:id" element={<BriefingRun />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="shift" element={<ShiftFlow />} />
            <Route path="*" element={<Navigate to="/driver" replace />} />
          </Routes>
        </div>
      </main>

      {!isFlow && !(seg[0] === 'chats' && seg[1]) && (
        <nav className="drv-tabbar" aria-label="Разделы">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `drv-tab ${isActive ? 'on' : ''}`}>
              <span className="drv-tab-ic"><t.icon />{badges[t.to] ? <i>{badges[t.to]}</i> : null}</span>
              {t.label}
            </NavLink>
          ))}
        </nav>
      )}

      <div id="drv-layer" className="drv-layer" />

      <div className="drv-toasts" aria-live="polite" style={isFlow ? { bottom: 'calc(140px + var(--drv-safe-b))' } : seg[0] === 'chats' && seg[1] ? { bottom: 'calc(76px + var(--drv-safe-b))' } : undefined}>
        {toasts.map((t) => (
          <div key={t.id} className={`drv-toast ${t.tone}`}>{t.tone === 'warn' ? <AlertTriangle /> : <CheckCircle2 />}{t.msg}</div>
        ))}
      </div>
    </>
  )
}
