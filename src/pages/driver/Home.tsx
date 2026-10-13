import { useNavigate } from 'react-router-dom'
import { AlertTriangle, BellOff, CalendarClock, CheckCheck, ChevronRight, Clock, FileWarning, Fuel, GraduationCap, MapPin, Play, ShieldCheck, Wrench } from 'lucide-react'
import { EquipmentArt, num, StatusBadge } from '../../ui'
import { eqAdmission, me, myEq, todayShift, week, type Notice } from '../../data/driver'
import { site } from '../../data/mock'
import { Group, Row } from './kit'
import { dur, nowIso, shiftTimes, useDriver, useNow } from './store'

const noticeIcon: Record<Notice['kind'], React.ReactNode> = {
  to: <Wrench />, brief: <GraduationCap />, doc: <FileWarning />, shift: <CalendarClock />, request: <CheckCheck />,
}
const noticeTone: Record<Notice['kind'], 'warn' | 'info' | 'bad' | 'accent' | 'ok'> = { to: 'warn', brief: 'info', doc: 'bad', shift: 'accent', request: 'ok' }
export const ago = (iso: string) => {
  const d = new Date(iso)
  const today = iso.startsWith('2026-10-13')
  return today ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export default function HomeScreen() {
  const nav = useNavigate()
  const { session, notices, setNotices, briefings, docs, addRequest, nextNum, toast, requests } = useDriver()
  const now = useNow()
  const t = shiftTimes(session, now)
  const dt = new Date('2026-10-13T12:00:00')
  const weekday = dt.toLocaleDateString('ru-RU', { weekday: 'long' })
  const dayLabel = dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

  const pendingBrief = briefings.filter((b) => b.status !== 'Пройден')
  const overdueBrief = briefings.filter((b) => b.status === 'Просрочен')
  const expDocs = docs.filter((d) => d.status === 'Истекает' || d.status === 'Просрочен')
  const admitted = overdueBrief.length === 0 && !docs.some((d) => d.status === 'Просрочен')
  const unread = notices.filter((n) => !n.read)
  const fuelPending = requests.some((r) => r.type === 'Заправка' && r.status === 'Отправлена')

  const needFuel = () => {
    if (fuelPending) { toast('Заявка на заправку уже у менеджера', 'warn'); return }
    addRequest({ id: `q${Date.now()}`, num: nextNum(), type: 'Заправка', createdAt: nowIso(), status: 'Отправлена', eqId: myEq.id, comment: `Объект: ${todayShift.site.name}`, media: [], history: [{ status: 'Отправлена', at: nowIso() }] })
    toast('Заявка отправлена менеджеру')
  }
  const open = (n: Notice) => {
    setNotices((s) => s.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    if (n.to) nav(n.to)
  }

  return (
    <div className="drv-pad stack">
      <div className="drv-date">
        <div>
          <div className="drv-date-wd">{weekday}</div>
          <div className="drv-date-d">{dayLabel}</div>
        </div>
        <div className="drv-week" aria-label="Неделя">
          {week.map((d) => {
            const n = new Date(d.date + 'T12:00:00')
            return (
              <button key={d.date} type="button" onClick={() => nav('/driver/shifts')} className={`drv-week-d ${d.date === '2026-10-13' ? 'on' : ''} ${d.status === 'Выходной' ? 'off' : ''}`}>
                <small>{n.toLocaleDateString('ru-RU', { weekday: 'short' })}</small>{n.getDate()}
              </button>
            )
          })}
        </div>
      </div>

      {/* Сегодняшняя смена */}
      <section className="drv-hero">
        <div className="row-between">
          <span className="drv-hero-tag">Сегодня · {todayShift.kind} · {todayShift.orderNo}</span>
          <span className={`drv-hero-state ${session.phase}`}>
            {session.phase === 'active' ? (session.state === 'paused' ? 'Пауза' : session.state === 'repair' ? 'Ремонт' : 'Идёт') : session.phase === 'done' ? 'Завершена' : 'Не начата'}
          </span>
        </div>
        <h2>{todayShift.site.name}</h2>
        <div className="drv-hero-meta">
          <span><MapPin />{todayShift.site.address}</span>
          <span><Clock />{todayShift.start}–{todayShift.end} · {todayShift.client}</span>
        </div>
        <p className="drv-hero-task">{todayShift.task}</p>
        {session.phase === 'active' && session.startedAt && (
          <div className="drv-hero-timer"><span className="mono">{dur(t.work)}</span><small>в работе · пауза {dur(t.pause, false)}</small></div>
        )}
        {session.phase === 'done' && (
          <div className="drv-hero-timer"><span className="mono">{dur(t.work, false)}</span><small>отработано · ремонт {dur(t.repair, false)}</small></div>
        )}
        <button className="drv-big" onClick={() => nav('/driver/shift')} disabled={session.phase === 'done'}>
          <Play />
          {session.phase === 'idle' ? 'Начать смену' : session.phase === 'active' ? (session.startedAt ? 'Открыть смену' : 'Продолжить приём техники') : 'Смена закрыта'}
        </button>
        <div className="drv-hero-sub">Приём техники → путевой лист → смена → сдача</div>
      </section>

      <div className="drv-quick">
        <button type="button" onClick={() => nav('/driver/requests', { state: { create: 'ТО' } })}><Wrench /><span>Заявка на ТО</span></button>
        <button type="button" onClick={needFuel} className={fuelPending ? 'sent' : ''}><Fuel /><span>{fuelPending ? 'Заправка запрошена' : 'Нужна заправка'}</span></button>
        <button type="button" onClick={() => nav('/driver/requests', { state: { create: 'Ремонт' } })}><AlertTriangle /><span>Поломка</span></button>
      </div>

      {/* Техника */}
      <Group title="Назначенная техника" flush>
        <button type="button" className="drv-eqcard" onClick={() => nav('/driver/equipment')}>
          <div className="drv-eqcard-img"><EquipmentArt seed={myEq.id} category={myEq.category} label={myEq.title} /></div>
          <div className="drv-eqcard-main">
            <b>{myEq.title}</b>
            <span className="mono">{myEq.plate}</span>
            <span className="drv-row-sub">{num(myEq.motoHours)} м/ч · {eqAdmission.nextService} через {eqAdmission.nextServiceIn} м/ч</span>
            <StatusBadge status="Допущен" />
          </div>
          <ChevronRight className="drv-chev" />
        </button>
      </Group>

      {/* Допуск */}
      <Group title="Статус допуска">
        <Row icon={<ShieldCheck />} tone={admitted ? 'ok' : 'bad'} title={admitted ? 'Допущен к работе' : 'Допуск ограничен'} sub={`${me.position} · ${me.license}`} right={<StatusBadge status={admitted ? 'Допущен' : 'Просрочен'} />} chevron={false} />
        {expDocs.map((d) => (
          <Row key={d.id} icon={<FileWarning />} tone="warn" title={d.title} sub={`Действует до ${new Date(d.until).toLocaleDateString('ru-RU')}`} onClick={() => nav('/driver/profile', { state: { tab: 'docs' } })} />
        ))}
        {pendingBrief.length > 0 && (
          <Row icon={<GraduationCap />} tone={overdueBrief.length ? 'bad' : 'info'} title={`Инструктажи: ${pendingBrief.length} к прохождению`} sub={overdueBrief.length ? `Просрочено: ${overdueBrief.length}` : 'Назначены механиком и менеджером'} onClick={() => nav('/driver/profile', { state: { tab: 'brief' } })} />
        )}
      </Group>

      {/* Уведомления */}
      <Group title="Уведомления" action={<button className="drv-link-btn" onClick={() => nav('/driver/notifications')}>Все</button>}>
        {unread.length === 0 && <Row icon={<BellOff />} title="Новых уведомлений нет" chevron={false} />}
        {unread.slice(0, 3).map((n) => (
          <Row key={n.id} icon={noticeIcon[n.kind]} tone={noticeTone[n.kind]} title={n.title} sub={n.text} right={<span className="drv-time">{ago(n.at)}</span>} onClick={() => open(n)} />
        ))}
      </Group>

      <Group title="Дальше по графику">
        {week.filter((d) => d.date > '2026-10-13' && d.siteId).slice(0, 2).map((d) => (
          <Row key={d.date} icon={<CalendarClock />} title={`${new Date(d.date + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })} · ${d.start}–${d.end}`} sub={site(d.siteId)?.name} onClick={() => nav('/driver/shifts')} />
        ))}
      </Group>
    </div>
  )
}

export function Notifications() {
  const nav = useNavigate()
  const { notices, setNotices, toast } = useDriver()
  return (
    <div className="drv-pad stack">
      <div className="row-between">
        <span className="muted">{notices.filter((n) => !n.read).length} непрочитанных</span>
        <button className="drv-link-btn" onClick={() => { setNotices((s) => s.map((n) => ({ ...n, read: true }))); toast('Все уведомления прочитаны') }}>Прочитать все</button>
      </div>
      <Group>
        {notices.map((n) => (
          <Row key={n.id} icon={noticeIcon[n.kind]} tone={n.read ? undefined : noticeTone[n.kind]}
            title={<span className={n.read ? 'dim' : ''}>{n.title}</span>} sub={n.text} right={<span className="drv-time">{ago(n.at)}</span>}
            onClick={() => { setNotices((s) => s.map((x) => (x.id === n.id ? { ...x, read: true } : x))); if (n.to) nav(n.to) }} />
        ))}
      </Group>
      <p className="muted drv-note">Уведомления дублируются в Telegram-бот Гиперок (демо).</p>
    </div>
  )
}
