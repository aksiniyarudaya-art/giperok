import { useState } from 'react'
import { AlertTriangle, Building2, CalendarClock, CheckCircle2, Lock, MapPin, Plus, ShieldAlert, Truck, Users, XCircle } from 'lucide-react'
import { Badge, DataTable, Drawer, Field, KV, Modal, PageHead, SearchInput, Stat, StatusBadge, Tabs, uid, useList, useToast, type Col } from '../../ui'
import { categoryOne, type Site } from '../../data/types'
import { companies, company, emp, eq, equipment, managers, orders, sites as seed } from '../../data/mock'
import { activeDrivers } from '../../data/crm-b'
import type { CrmPageProps } from './types'
import { AdminActions, Section, shortName } from './crm-b-ui'

type Incident = { text: string; resolved?: string }
type Assign = { equipmentId: string; driverId: string; from: string }
type SiteRow = Omit<Site, 'incidents'> & { incidents: Incident[]; assigned: Assign[]; managerId: string; blocked?: boolean }

const initial: SiteRow[] = seed.map((s, i) => ({
  ...s,
  incidents: s.incidents.map((t) => ({ text: t })),
  managerId: managers[i % managers.length].id,
  assigned: s.status === 'Архив' ? [] : orders.filter((o) => o.siteId === s.id && o.status === 'В работе').map((o) => ({ equipmentId: o.equipmentId, driverId: o.driverId, from: o.date })),
}))
const dn = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const workDays = (sch: string) => {
  if (sch.startsWith('Круглосуточно')) return [0, 1, 2, 3, 4, 5, 6]
  const m = sch.match(/(Пн|Вт|Ср|Чт|Пт|Сб|Вс)\s*[–-]\s*(Пн|Вт|Ср|Чт|Пт|Сб|Вс)/)
  if (!m) return []
  const a = dn.indexOf(m[1]), b = dn.indexOf(m[2])
  return dn.map((_, i) => i).filter((i) => i >= a && i <= b)
}
const tenants = companies.filter((c) => c.kind === 'tenant')
const blank = (): SiteRow => ({ id: uid('s'), name: '', address: '', clientId: tenants[0].id, general: '', contractors: [], contacts: '', schedule: 'Пн–Пт 08:00–18:00', limits: '', incidents: [], notes: '', status: 'Текущий', map: { x: 50, y: 50 }, assigned: [], managerId: managers[0].id })

export default function Sites({ role }: CrmPageProps) {
  const toast = useToast()
  const list = useList<SiteRow>(initial)
  const [tab, setTab] = useState<'Текущий' | 'Архив'>('Текущий')
  const [q, setQ] = useState('')
  const [client, setClient] = useState('')
  const [mgr, setMgr] = useState('')
  const [onlyInc, setOnlyInc] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [form, setForm] = useState<SiteRow | null>(null)

  const open = (s: SiteRow) => s.incidents.filter((i) => !i.resolved).length
  const rows = list.rows.filter((s) => s.status === tab).filter((s) => {
    const hay = `${s.name} ${s.address} ${s.general} ${s.contractors.join(' ')} ${company(s.clientId)?.name}`.toLowerCase()
    return (!q || hay.includes(q.toLowerCase())) && (!client || s.clientId === client) && (!mgr || s.managerId === mgr) && (!onlyInc || open(s) > 0)
  })
  const cur = list.rows.find((s) => s.id === openId) ?? null
  const cur_ = list.rows.filter((s) => s.status === 'Текущий')

  const cols: Col<SiteRow>[] = [
    { key: 'n', title: 'Объект', render: (s) => <div><div className="cb-cell-main">{s.name}{s.blocked && <span style={{ marginLeft: 6 }}><Badge tone="bad">Блок</Badge></span>}</div><div className="cb-cell-sub">{s.address}</div></div> },
    { key: 'c', title: 'Клиент', render: (s) => { const c = company(s.clientId); return <div><div>{c?.name}</div>{c?.critical && <Badge tone="bad">Критический долг</Badge>}</div> } },
    { key: 'g', title: 'Генподрядчик', hideMobile: true, render: (s) => <div><div>{s.general || '—'}</div>{s.contractors.length > 0 && <div className="cb-cell-sub">+ {s.contractors.length} подряд.</div>}</div> },
    { key: 'e', title: 'Техника', align: 'r', render: (s) => <b className="tnum">{s.assigned.length}</b> },
    { key: 'sch', title: 'График', hideMobile: true, render: (s) => <span className="dim" style={{ fontSize: 13 }}>{s.schedule}</span> },
    { key: 'm', title: 'Ответственный', hideMobile: true, render: (s) => shortName(emp(s.managerId)?.name ?? '—') },
    { key: 'i', title: 'Инциденты', render: (s) => (open(s) ? <Badge tone="bad">{open(s)} открыт.</Badge> : <span className="muted">—</span>) },
  ]

  return (
    <div className="cb-page">
      <PageHead title="Объекты" sub="Строительные площадки клиентов: ответственные, техника, график, ограничения и инциденты."
        actions={<button className="btn btn-primary" onClick={() => setForm(blank())}><Plus />Добавить объект</button>} />

      <div className="cb-stats">
        <Stat label="Текущие объекты" value={cur_.length} icon={<Building2 size={16} />} />
        <Stat label="Техника на объектах" value={cur_.reduce((a, s) => a + s.assigned.length, 0)} icon={<Truck size={16} />} />
        <Stat label="Открытые инциденты" value={cur_.reduce((a, s) => a + open(s), 0)} icon={<ShieldAlert size={16} />} trend="down" delta="требуют решения" />
        <Stat label="Клиенты с крит. долгом" value={cur_.filter((s) => company(s.clientId)?.critical).length} icon={<Lock size={16} />} delta="назначение техники заблокировано" />
      </div>

      <Tabs value={tab} onChange={setTab} items={[
        { id: 'Текущий', label: 'Текущие', count: list.rows.filter((s) => s.status === 'Текущий').length },
        { id: 'Архив', label: 'Архивные', count: list.rows.filter((s) => s.status === 'Архив').length },
      ]} />

      <div className="stack-sm">
        <div className="toolbar">
          <SearchInput value={q} onChange={setQ} placeholder="Название, адрес, подрядчик" />
          <select className="select" value={client} onChange={(e) => setClient(e.target.value)} aria-label="Клиент">
            <option value="">Все клиенты</option>{tenants.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="select" value={mgr} onChange={(e) => setMgr(e.target.value)} aria-label="Ответственный менеджер">
            <option value="">Все менеджеры</option>{managers.map((m) => <option key={m.id} value={m.id}>{shortName(m.name)}</option>)}
          </select>
        </div>
        <div className="cb-toolbar-checks"><label className="check"><input type="checkbox" checked={onlyInc} onChange={(e) => setOnlyInc(e.target.checked)} />Только с открытыми инцидентами</label></div>
      </div>

      <DataTable cols={cols} rows={rows} rowKey={(s) => s.id} onRow={(s) => setOpenId(s.id)} empty="Объекты не найдены" />

      {cur && <SiteCard s={cur} role={role} onClose={() => setOpenId(null)} onEdit={() => setForm(cur)}
        save={(s, msg) => { list.update(s); if (msg) toast(msg) }} />}
      {form && <SiteForm init={form} isNew={!list.rows.some((s) => s.id === form.id)} onClose={() => setForm(null)}
        onSave={(s) => { if (list.rows.some((x) => x.id === s.id)) { list.update(s); toast('Объект сохранён') } else { list.add(s); setTab('Текущий'); toast('Объект добавлен') } setForm(null) }} />}
    </div>
  )
}

function SiteCard({ s, role, onClose, onEdit, save }: { s: SiteRow; role: CrmPageProps['role']; onClose: () => void; onEdit: () => void; save: (s: SiteRow, m?: string) => void }) {
  const toast = useToast()
  const c = company(s.clientId)
  const [assign, setAssign] = useState(false)
  const [inc, setInc] = useState('')
  const [closeAsk, setCloseAsk] = useState(false)
  const [finOk, setFinOk] = useState(false)
  const locked = !!c?.critical && !finOk
  return (
    <Drawer title={s.name} sub={<span className="row" style={{ gap: 6 }}><StatusBadge status={s.status === 'Текущий' ? 'Текущий' : 'Архив'} />{s.blocked && <Badge tone="bad">Заблокирован</Badge>}</span>} onClose={onClose}
      footer={<>
        <button className="btn btn-secondary" onClick={onEdit}>Редактировать</button>
        {s.status === 'Текущий'
          ? <button className="btn btn-dark" onClick={() => setCloseAsk(true)}><XCircle />Закрыть объект</button>
          : <button className="btn btn-secondary" onClick={() => save({ ...s, status: 'Текущий' }, 'Объект возвращён в текущие')}>Вернуть в текущие</button>}
      </>}>
      {c?.critical && (
        <div className="alert alert-bad"><Lock /><div><b>Критический долг клиента.</b> Назначение техники на объект заблокировано до подтверждения финансового директора.
          {!finOk && <div style={{ marginTop: 8 }}><button className="btn btn-sm btn-secondary" onClick={() => { setFinOk(true); toast(`Запрос подтверждён финансовым директором (демо)`) }}>Запросить подтверждение фин. директора</button></div>}
          {finOk && <div style={{ marginTop: 6 }}><Badge tone="ok">Разовое назначение разрешено</Badge></div>}</div></div>
      )}
      <KV items={[
        ['Клиент (юрлицо)', <span>{c?.name}<div className="cb-cell-sub">УНП {c?.unp} · {c?.legalAddress}</div></span>],
        ['Генподрядчик', s.general || '—'],
        ['Подрядчики', s.contractors.length ? <div className="cb-chips">{s.contractors.map((x) => <span key={x} className="cb-chip">{x}</span>)}</div> : <span className="muted">нет</span>],
        ['Адрес', <span className="row" style={{ gap: 6 }}><MapPin size={14} />{s.address}</span>],
        ['Ответственные', <span>{s.contacts}<div className="cb-cell-sub">Менеджер: {emp(s.managerId)?.name}</div></span>],
        ['График', s.schedule],
        ['Ограничения', s.limits || <span className="muted">нет</span>],
        ['Примечания', s.notes || <span className="muted">—</span>],
      ]} />

      <Section title={`Техника на объекте (${s.assigned.length})`} icon={<Truck size={16} />}
        extra={s.status === 'Текущий' && <button className="btn btn-sm btn-primary" disabled={locked || s.blocked} onClick={() => setAssign(true)}><Users />Назначить ресурсы</button>}>
        {s.assigned.length ? <div className="cb-list">{s.assigned.map((a, i) => { const e = eq(a.equipmentId)!; return (
          <div key={i}><Truck /><div className="grow"><div className="cb-cell-main">{categoryOne[e.category]} {e.title} <span className="mono muted">{e.plate}</span></div><div className="cb-cell-sub">{emp(a.driverId)?.name} · с {a.from.split('-').reverse().slice(0, 2).join('.')}</div></div>
            <button className="btn btn-ghost btn-sm" onClick={() => save({ ...s, assigned: s.assigned.filter((_, k) => k !== i) }, 'Техника снята с объекта')}>Снять</button></div>
        ) })}</div> : <span className="muted" style={{ fontSize: 14 }}>Техника не назначена</span>}
      </Section>

      <Section title="Инциденты и конфликты" icon={<AlertTriangle size={16} />}>
        {s.incidents.length ? <div className="cb-list">{s.incidents.map((x, i) => (
          <div key={i}>{x.resolved ? <CheckCircle2 style={{ color: 'var(--ok)' }} /> : <AlertTriangle style={{ color: 'var(--bad)' }} />}
            <div className="grow"><div>{x.text}</div>{x.resolved && <div className="cb-cell-sub">Решение: {x.resolved}</div>}</div>
            {!x.resolved && <button className="btn btn-secondary btn-sm" onClick={() => save({ ...s, incidents: s.incidents.map((y, k) => (k === i ? { ...y, resolved: 'урегулировано с прорабом, клиент уведомлён' } : y)) }, 'Конфликт решён, клиент уведомлён')}>Решить конфликт</button>}
          </div>
        ))}</div> : <span className="muted" style={{ fontSize: 14 }}>Инцидентов нет</span>}
        <form className="row" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); if (!inc.trim()) return; save({ ...s, incidents: [...s.incidents, { text: `13.10 — ${inc.trim()}` }] }, 'Инцидент зарегистрирован'); setInc('') }}>
          <input className="input grow" style={{ minWidth: 180 }} value={inc} onChange={(e) => setInc(e.target.value)} placeholder="Описание инцидента" aria-label="Новый инцидент" />
          <button className="btn btn-secondary">Добавить</button>
        </form>
      </Section>

      <Section title="График работы" icon={<CalendarClock size={16} />}>
        <div className="cb-chips">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) => {
          const on = workDays(s.schedule).includes(i)
          return <span key={d} className="cb-chip" style={on ? { background: 'var(--accent-soft)', color: 'var(--fg)' } : undefined}>{d}</span>
        })}</div>
      </Section>

      <AdminActions role={role} blocked={s.blocked} cancelLabel="Отменить изменения"
        onCancel={() => save({ ...s, assigned: initial.find((x) => x.id === s.id)?.assigned ?? s.assigned }, 'Назначения возвращены к исходным')}
        onArchive={() => save({ ...s, status: s.status === 'Архив' ? 'Текущий' : 'Архив' }, s.status === 'Архив' ? 'Объект восстановлен' : 'Объект перенесён в архив')}
        onBlock={() => save({ ...s, blocked: !s.blocked }, s.blocked ? 'Объект разблокирован' : 'Объект заблокирован: назначения запрещены')} />

      {assign && <AssignModal s={s} onClose={() => setAssign(false)} onSave={(a) => { save({ ...s, assigned: [...s.assigned, a] }, `Назначено: ${eq(a.equipmentId)!.title}, водитель ${shortName(emp(a.driverId)!.name)} · уведомление отправлено (демо)`); setAssign(false) }} />}
      {closeAsk && (
        <Modal title="Закрыть объект?" onClose={() => setCloseAsk(false)} footer={<><button className="btn btn-secondary" onClick={() => setCloseAsk(false)}>Отмена</button>
          <button className="btn btn-dark" onClick={() => { save({ ...s, status: 'Архив', assigned: [], notes: `${s.notes ? s.notes + ' · ' : ''}Закрыт 13.10.2026` }, 'Объект закрыт и перенесён в архивные'); setCloseAsk(false) }}>Закрыть объект</button></>}>
          <p className="dim">Вся техника ({s.assigned.length}) будет снята с объекта, водители получат уведомление. Незакрытые инциденты: {s.incidents.filter((i) => !i.resolved).length}.</p>
          {s.incidents.some((i) => !i.resolved) && <div className="alert alert-warn"><AlertTriangle /><div>Есть нерешённые инциденты — рекомендуем решить их до закрытия.</div></div>}
        </Modal>
      )}
    </Drawer>
  )
}

function AssignModal({ s, onClose, onSave }: { s: SiteRow; onClose: () => void; onSave: (a: Assign) => void }) {
  const free = equipment.filter((e) => ['Свободна', 'Забронирована'].includes(e.status) && !s.assigned.some((a) => a.equipmentId === e.id))
  const [e, setE] = useState(free[0]?.id ?? '')
  const [d, setD] = useState(free[0]?.driverId ?? activeDrivers[0].id)
  const [from, setFrom] = useState('2026-10-14')
  return (
    <Modal title={`Назначить ресурсы · ${s.name}`} onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Отмена</button><button className="btn btn-primary" disabled={!e} onClick={() => onSave({ equipmentId: e, driverId: d, from })}>Назначить</button></>}>
      <Field label="Техника" hint="Показаны свободные и забронированные машины">
        <select className="select" value={e} onChange={(x) => { setE(x.target.value); const dd = equipment.find((q) => q.id === x.target.value)?.driverId; if (dd) setD(dd) }}>
          {free.map((q) => <option key={q.id} value={q.id}>{categoryOne[q.category]} {q.title} · {q.city} · {q.status}</option>)}
        </select>
      </Field>
      <Field label="Водитель">
        <select className="select" value={d} onChange={(x) => setD(x.target.value)}>
          {activeDrivers.map((q) => <option key={q.id} value={q.id}>{q.name} · {q.shiftState}</option>)}
        </select>
      </Field>
      <Field label="С даты"><input type="date" className="input" value={from} onChange={(x) => setFrom(x.target.value)} /></Field>
      <div className="alert alert-info"><Users /><div>Ограничения объекта: {s.limits || 'нет'}. График: {s.schedule}.</div></div>
    </Modal>
  )
}

function SiteForm({ init, isNew, onClose, onSave }: { init: SiteRow; isNew: boolean; onClose: () => void; onSave: (s: SiteRow) => void }) {
  const [f, setF] = useState(init)
  const [contr, setContr] = useState(init.contractors.join('\n'))
  const set = (p: Partial<SiteRow>) => setF((x) => ({ ...x, ...p }))
  const ok = f.name.trim() && f.address.trim()
  return (
    <Modal wide title={isNew ? 'Новый объект' : `Редактирование: ${init.name}`} onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Отмена</button><button className="btn btn-primary" disabled={!ok} onClick={() => onSave({ ...f, contractors: contr.split('\n').map((x) => x.trim()).filter(Boolean) })}>Сохранить</button></>}>
      <div className="grid g2">
        <Field label="Название объекта" required><input className="input" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="ЖК «Северный», 2-я очередь" /></Field>
        <Field label="Адрес" required><input className="input" value={f.address} onChange={(e) => set({ address: e.target.value })} placeholder="г. Минск, ул. …" /></Field>
        <Field label="Клиент (юрлицо)" required>
          <select className="select" value={f.clientId} onChange={(e) => set({ clientId: e.target.value })}>{tenants.map((c) => <option key={c.id} value={c.id}>{c.name}{c.critical ? ' — критический долг' : ''}</option>)}</select>
        </Field>
        <Field label="Генподрядчик"><input className="input" value={f.general} onChange={(e) => set({ general: e.target.value })} /></Field>
        <Field label="Подрядчики" hint="Каждый с новой строки"><textarea className="textarea" rows={3} value={contr} onChange={(e) => setContr(e.target.value)} /></Field>
        <Field label="Ответственные (контакты)"><textarea className="textarea" rows={3} value={f.contacts} onChange={(e) => set({ contacts: e.target.value })} placeholder="Прораб, телефон" /></Field>
        <Field label="Менеджер">
          <select className="select" value={f.managerId} onChange={(e) => set({ managerId: e.target.value })}>{managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        </Field>
        <Field label="График"><input className="input" value={f.schedule} onChange={(e) => set({ schedule: e.target.value })} /></Field>
      </div>
      <Field label="Ограничения"><input className="input" value={f.limits} onChange={(e) => set({ limits: e.target.value })} placeholder="Высота ворот, тоннаж, шум" /></Field>
      <Field label="Примечания"><textarea className="textarea" rows={2} value={f.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
    </Modal>
  )
}
