import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertOctagon, AlertTriangle, ArrowRight, Bell, CalendarDays, Fuel, Handshake, Info, Plus, Truck, Users, Wallet, Wrench } from 'lucide-react'
import type { CrmPageProps } from './types'
import { isAdmin } from './types'
import { Avatar, BarChart, Donut, Field, Modal, PageHead, Progress, Stat, StatusBadge, dateShort, money, time, useToast } from '../../ui'
import { company, drivers, emp, eq, equipment, managers, orders, site } from '../../data/mock'
import { calendar, crmEqStatus, expenseItems, finMonths, fuelReqs, notices, toRequests, userByRole, type CalEvent } from '../../data/crm-a'
import './crm-a.css'

const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const FIRST_WD = 3 // 1 октября 2026 — четверг (0 = Пн)
const kinds: CalEvent['kind'][] = ['Аренда', 'ТО', 'Оплата', 'Документы', 'Встреча', 'Праздник']

export default function Dashboard({ role }: CrmPageProps) {
  const nav = useNavigate()
  const toast = useToast()
  const go = (p: string) => nav(`/crm/${role}/${p}`)
  const me = emp(userByRole[role])!
  const [events, setEvents] = useState(calendar)
  const [day, setDay] = useState(13)
  const [add, setAdd] = useState<CalEvent | null>(null)
  const [hidden, setHidden] = useState<string[]>([])

  const inWork = orders.filter((o) => o.status === 'В работе')
  const eqS = { trip: equipment.filter((e) => crmEqStatus(e) === 'В рейсе').length, idle: equipment.filter((e) => crmEqStatus(e) === 'Свободна').length, to: equipment.filter((e) => crmEqStatus(e) === 'ТО').length + toRequests.filter((t) => t.stage === 'В процессе').length }
  const drv = (s: string) => drivers.filter((d) => d.shiftState === s)
  const reqRent = orders.filter((o) => o.status === 'Новая' || o.status === 'На модерации').length
  const reqFuel = fuelReqs.filter((f) => f.status === 'Новая').length
  const reqTo = toRequests.filter((t) => t.stage === 'Заявка').length

  const live = orders.filter((o) => o.status !== 'Отменена')
  const inc = { total: live.reduce((a, o) => a + o.cost, 0), paid: 0, part: 0, debt: 0 }
  live.forEach((o) => { if (o.pay === 'Оплачено') inc.paid += o.cost; else if (o.pay === 'Частично') inc.part += o.cost; else inc.debt += o.cost })
  const debtExt = 50000 + 12400 // дебиторка прошлых периодов
  const incomeTotal = inc.total + 98000 + debtExt
  const exp = { total: expenseItems.reduce((a, x) => a + x.sum, 0) }
  const expBy = (s: string) => expenseItems.filter((x) => x.status === s).reduce((a, x) => a + x.sum, 0)
  const profit = incomeTotal - exp.total
  const margin = Math.round((profit / incomeTotal) * 100)
  const crit = notices.filter((n) => !hidden.includes(n.id))
  const dayEvents = events.filter((e) => e.day === day)

  return (
    <div className="stack">
      <PageHead title="Дашборд" sub={`Вторник, 13 октября 2026 · ${me.name.split(' ').slice(0, 2).join(' ')}`}
        actions={<><button className="btn btn-secondary" onClick={() => go('callcenter')}><Plus />Новая заявка</button><button className="btn btn-primary" onClick={() => go('equipment')}><Truck />Назначить технику</button></>} />

      <div className="ca-stats">
        <Stat icon={<Handshake />} label="Сделки в работе" value={inWork.length} delta={money(inWork.reduce((a, o) => a + o.cost, 0))} />
        <Stat icon={<Wallet />} label="Доход · октябрь" value={money(incomeTotal)} delta="+8% к сентябрю" trend="up" />
        <Stat icon={<Wallet />} label="Чистая прибыль" value={money(profit)} delta={`маржинальность ${margin}%`} trend="up" />
        <Stat icon={<AlertOctagon />} label="Критические события" value={crit.filter((n) => n.level === 'bad').length} delta="требуют решения сегодня" trend="down" />
      </div>

      <div className="ca-main">
        <div className="stack">
          <div className="card">
            <div className="card-head"><h3>Сделки в работе</h3><button className="btn btn-ghost btn-sm" onClick={() => go('tenants')}>Все заявки<ArrowRight /></button></div>
            <div className="ca-list">
              {inWork.slice(0, 6).map((o) => {
                const c = company(o.clientId)
                return (
                  <div key={o.id} className="ca-li click" onClick={() => go('tenants')}>
                    <span className="mono muted hide-mobile" style={{ fontSize: 12, width: 60 }}>{o.number}</span>
                    <div className="grow"><div className="t">{eq(o.equipmentId)?.title} → {site(o.siteId)?.name}</div><div className="s">{c?.name} · {emp(o.driverId)?.name.split(' ').slice(0, 2).join(' ')} · {dateShort(o.date)}, {o.start}</div></div>
                    {c?.critical && <span className="ca-flag hide-mobile"><AlertTriangle />долг</span>}
                    <span className="tnum" style={{ fontWeight: 600 }}>{money(o.cost)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid g2">
            <div className="card">
              <div className="card-head"><h3><Truck size={16} /> Техника</h3><button className="btn btn-ghost btn-sm" onClick={() => go('equipment')}>Парк<ArrowRight /></button></div>
              <Donut size={120} center={String(equipment.length)} parts={[
                { label: 'В рейсах', value: eqS.trip, color: 'var(--accent)' },
                { label: 'Простаивает', value: eqS.idle, color: 'var(--line-strong)' },
                { label: 'На ТО', value: eqS.to, color: 'var(--bad)' },
              ]} />
              <div className="row-between" style={{ fontSize: 13, marginTop: 12 }}><span className="muted">Загрузка парка</span><b className="tnum">{Math.round(eqS.trip / equipment.length * 100)}%</b></div>
              <Progress value={eqS.trip / equipment.length * 100} />
            </div>
            <div className="card">
              <div className="card-head"><h3><Users size={16} /> Водители</h3><button className="btn btn-ghost btn-sm" onClick={() => go('employees')}>Все<ArrowRight /></button></div>
              <div className="ca-split">
                {([['На смене', 'var(--ok)'], ['Не вышел', 'var(--bad)'], ['Замена', 'var(--warn)'], ['Выходной', 'var(--line-strong)']] as const).map(([s, c]) => (
                  <div key={s}><div className="n">{drv(s).length}</div><div className="l"><span className="dot" style={{ background: c }} />{s === 'Не вышел' ? 'Не вышли' : s === 'Выходной' ? 'Выходные' : s}</div></div>
                ))}
              </div>
              <div className="ca-list" style={{ marginTop: 8 }}>
                {[...drv('Не вышел'), ...drv('Замена')].map((d) => (
                  <div key={d.id} className="ca-li">
                    <Avatar name={d.name} size="sm" />
                    <div className="grow"><div className="t" style={{ fontSize: 13 }}>{d.name.split(' ').slice(0, 2).join(' ')}</div><div className="s">{d.position}</div></div>
                    <StatusBadge status={d.shiftState!} />
                    {d.shiftState === 'Не вышел' && <button className="btn btn-secondary btn-sm" onClick={() => toast('Замена назначена: Волков К. Д. · уведомление в Telegram')}>Замена</button>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Заявки</h3></div>
            <div className="ca-split">
              <button onClick={() => go('tenants')}><div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r)', padding: '12px' }}><div className="n">{reqRent}</div><div className="l"><Handshake size={14} />Аренда · новые и на модерации</div></div></button>
              <button onClick={() => go('fuel')}><div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r)', padding: '12px' }}><div className="n">{reqFuel}</div><div className="l"><Fuel size={14} />Заправка · новые</div></div></button>
              <button onClick={() => go('equipment')}><div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r)', padding: '12px' }}><div className="n">{reqTo}</div><div className="l"><Wrench size={14} />ТО · ждут решения</div></div></button>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Финансы · октябрь</h3><span className={`badge ${margin >= 25 ? 'badge-ok' : 'badge-warn'}`}>Маржинальность {margin}%</span></div>
            <div className="grid g2" style={{ gap: 20 }}>
              <div className="stack-sm">
                <div className="row-between"><span className="eyebrow">Доход</span><b className="tnum">{money(incomeTotal)}</b></div>
                <FinRow label="Оплачено" v={inc.paid + 98000} total={incomeTotal} tone="ok" />
                <FinRow label="Частично" v={inc.part} total={incomeTotal} />
                <FinRow label="Долг" v={inc.debt + debtExt} total={incomeTotal} tone="bad" />
              </div>
              <div className="stack-sm">
                <div className="row-between"><span className="eyebrow">Расход</span><b className="tnum">{money(exp.total)}</b></div>
                <FinRow label="Оплачено" v={expBy('Оплачено')} total={exp.total} tone="ok" />
                <FinRow label="Частично" v={expBy('Частично')} total={exp.total} />
                <FinRow label="Долг" v={expBy('Долг')} total={exp.total} tone="bad" />
              </div>
            </div>
            <div className="row-between" style={{ margin: '16px 0 4px', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r)' }}>
              <span>Чистая прибыль (доход − прямые расходы)</span><b className="tnum" style={{ fontSize: 18 }}>{money(profit)}</b>
            </div>
            <div className="row" style={{ fontSize: 12, gap: 14, marginTop: 10 }}><span className="row" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)' }} />Доход</span><span className="row" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--steel)' }} />Расход</span></div>
            <BarChart data={finMonths} height={170} format={(v) => `${Math.round(v / 1000)}к`} />
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head"><h3><Bell size={16} /> Уведомления</h3><span className="badge badge-bad">{crit.length}</span></div>
            <div className="stack-sm">
              {crit.map((n) => (
                <div key={n.id} className={`ca-notice ${n.level}`} onClick={() => go(n.to)} role="button" tabIndex={0}>
                  {n.level === 'info' ? <Info /> : <AlertTriangle />}
                  <div className="grow"><div className="t">{n.title}</div><div className="s">{n.text}</div><div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{dateShort(n.at)}, {time(n.at)}</div></div>
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setHidden([...hidden, n.id]); toast('Отмечено как прочитанное') }} aria-label="Скрыть">✓</button>
                </div>
              ))}
              {!crit.length && <div className="muted" style={{ fontSize: 14 }}>Все события обработаны</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3><CalendarDays size={16} /> Октябрь 2026</h3><button className="btn btn-secondary btn-sm" onClick={() => setAdd({ day, kind: 'Встреча', text: '' })}><Plus />Событие</button></div>
            <div className="ca-cal">
              {WD.map((w) => <div key={w} className="wd">{w}</div>)}
              {Array.from({ length: FIRST_WD }, (_, i) => <div key={`e${i}`} className="ca-day empty" />)}
              {Array.from({ length: 31 }, (_, i) => {
                const d = i + 1, wd = (FIRST_WD + i) % 7
                const ev = events.filter((e) => e.day === d)
                return (
                  <button key={d} className={`ca-day ${wd >= 5 ? 'we' : ''} ${d === 13 ? 'today' : ''} ${d === day ? 'sel' : ''}`} onClick={() => setDay(d)}>
                    <span className="d">{d}</span>
                    {ev.slice(0, 1).map((e, k) => <span key={k} className={`ca-ev k-${e.kind}`}>{e.text}</span>)}
                    {ev.length > 1 && <span className="ca-ev" style={{ color: 'var(--fg-3)' }}>+{ev.length - 1}</span>}
                    <span className="ca-dots">{ev.map((_, k) => <i key={k} />)}</span>
                  </button>
                )
              })}
            </div>
            <div className="stack-sm" style={{ marginTop: 14 }}>
              <span className="eyebrow">{day} октября</span>
              {dayEvents.length ? dayEvents.map((e, k) => (
                <div key={k} className="row" style={{ gap: 8, flexWrap: 'nowrap' }}><span className={`ca-ev k-${e.kind}`} style={{ flex: 'none' }}>{e.kind}</span><span style={{ fontSize: 14 }}>{e.text}</span></div>
              )) : <span className="muted" style={{ fontSize: 14 }}>Событий нет</span>}
            </div>
          </div>

          {isAdmin(role) && (
            <div className="card">
              <div className="card-head"><h3>Эффективность команды</h3><button className="btn btn-ghost btn-sm" onClick={() => go('motivation')}>KPI<ArrowRight /></button></div>
              <div className="ca-list">
                {managers.map((m) => {
                  const mo = orders.filter((o) => o.managerId === m.id && o.status !== 'Отменена')
                  return (
                    <div key={m.id} className="ca-li">
                      <Avatar name={m.name} size="sm" />
                      <div className="grow"><div className="t">{m.name.split(' ').slice(0, 2).join(' ')}</div><div className="s">{mo.length} сделок · {money(mo.reduce((a, o) => a + o.cost, 0))}</div><Progress value={m.kpi} tone={m.kpi >= 90 ? 'ok' : undefined} /></div>
                      <b className="tnum">{m.kpi}%</b>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {add && (
        <Modal title="Новое событие в календаре" onClose={() => setAdd(null)} footer={<>
          <button className="btn btn-ghost" onClick={() => setAdd(null)}>Отмена</button>
          <button className="btn btn-primary" disabled={!add.text} onClick={() => { setEvents([...events, add]); setDay(add.day); setAdd(null); toast('Событие добавлено') }}>Добавить</button>
        </>}>
          <div className="grid g2">
            <Field label="День октября" required><input className="input" type="number" min={1} max={31} value={add.day} onChange={(e) => setAdd({ ...add, day: Math.min(31, Math.max(1, Number(e.target.value))) })} /></Field>
            <Field label="Тип"><select className="select" value={add.kind} onChange={(e) => setAdd({ ...add, kind: e.target.value as CalEvent['kind'] })}>{kinds.map((k) => <option key={k}>{k}</option>)}</select></Field>
          </div>
          <Field label="Описание" required><input className="input" value={add.text} onChange={(e) => setAdd({ ...add, text: e.target.value })} placeholder="Например: визит на объект, оплата, ТО" /></Field>
        </Modal>
      )}
    </div>
  )
}

function FinRow({ label, v, total, tone }: { label: string; v: number; total: number; tone?: 'ok' | 'bad' }) {
  return (
    <div className="stack-sm" style={{ gap: 4 }}>
      <div className="row-between" style={{ fontSize: 13 }}><StatusBadge status={label} /><span className="tnum">{money(v)}</span></div>
      <Progress value={(v / total) * 100} tone={tone} />
    </div>
  )
}
