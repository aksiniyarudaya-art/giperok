import { useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, Archive, Ban, Plus, Send, ShieldAlert, Undo2, Wrench, XCircle } from 'lucide-react'
import type { CrmPageProps, CrmRole } from './types'
import { isAdmin } from './types'
import {
  DataTable, Drawer, EquipmentArt, Field, KV, Modal, PageHead, Progress, SearchInput, Seg, Stat, StatusBadge, Tabs,
  date, dateShort, money, num, time, uid, useList, useToast, type Col, EqThumb } from '../../ui'
import { companies, company, drivers, emp, equipment, site, sites } from '../../data/mock'
import { categoryLabels, categoryOne, type Equipment, type EquipmentCategory } from '../../data/types'
import { crmEqStatus, eqFinance, eqNotes, repairs, toRequests, type ToDecision, type ToRequest } from '../../data/crm-a'
import './crm-a.css'

/* ================= Общие элементы (используются и в других разделах CRM) ================= */

/** Дополнительные действия администратора: отменить / архивировать / заблокировать. */
export function AdminActions({ role, what, onCancel, onArchive, onBlock }: { role: CrmRole; what: string; onCancel?: () => void; onArchive?: () => void; onBlock?: () => void }) {
  const toast = useToast()
  if (!isAdmin(role)) return null
  return (
    <div className="ca-admin">
      <span className="eyebrow">Администратор</span>
      <button className="btn btn-secondary btn-sm" onClick={() => { onCancel?.(); toast(`${what}: отменено администратором`) }}><Undo2 />Отменить</button>
      <button className="btn btn-secondary btn-sm" onClick={() => { onArchive?.(); toast(`${what}: перенесено в архив`) }}><Archive />Архивировать</button>
      <button className="btn btn-danger btn-sm" onClick={() => { onBlock?.(); toast(`${what}: заблокировано`) }}><Ban />Заблокировать</button>
    </div>
  )
}

/** Блок «Критический долг» — блокирует назначение техники, пока не подтвердит фин. директор. */
export function CriticalDebt({ clientId, compact }: { clientId?: string; compact?: boolean }) {
  const c = company(clientId)
  if (!c?.critical) return null
  return (
    <div className="ca-crit" role="alert">
      <ShieldAlert />
      <div>
        <b>Критический долг: {money(c.debt)}</b> — {c.name}
        {!compact && <div className="s">Назначение техники на объекты клиента заблокировано, пока не подтвердит финансовый директор.</div>}
      </div>
    </div>
  )
}

/** Назначить технику: водитель + объект → уведомление в Telegram. */
export function AssignModal({ role, item, defaultSiteId, onClose, onDone }: { role: CrmRole; item: Equipment; defaultSiteId?: string; onClose: () => void; onDone: (driverId: string, siteId: string) => void }) {
  const toast = useToast()
  const [driverId, setDriverId] = useState(item.driverId ?? drivers[0].id)
  const [siteId, setSiteId] = useState(defaultSiteId ?? sites[0].id)
  const [from, setFrom] = useState('2026-10-14T08:00')
  const [fin, setFin] = useState<'none' | 'requested' | 'approved'>('none')
  const s = site(siteId)!
  const client = company(s.clientId)
  const blocked = !!client?.critical && fin !== 'approved'
  const d = emp(driverId)!
  const driverWarn = d.hireStage !== 'Допущен' ? `не допущен (${d.hireStage})` : d.status !== 'Активный' ? d.status.toLowerCase() : ''
  return (
    <Modal title={`Назначить: ${item.title}`} onClose={onClose} footer={<>
      <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
      <button className="btn btn-primary" disabled={blocked || !!driverWarn} onClick={() => {
        onDone(driverId, siteId)
        toast(`Уведомление отправлено водителю в Telegram: ${d.name.split(' ').slice(0, 2).join(' ')}`)
        onClose()
      }}><Send />Назначить и уведомить</button>
    </>}>
      <div className="grid g2">
        <Field label="Водитель" required>
          <select className="select" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            {drivers.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.shiftState}{x.hireStage !== 'Допущен' ? ' · без допуска' : ''}</option>)}
          </select>
        </Field>
        <Field label="Объект" required>
          <select className="select" value={siteId} onChange={(e) => { setSiteId(e.target.value); setFin('none') }}>
            {sites.filter((x) => x.status === 'Текущий').map((x) => <option key={x.id} value={x.id}>{x.name}{company(x.clientId)?.critical ? ' · ⚠ долг' : ''}</option>)}
          </select>
        </Field>
        <Field label="Начало работ"><input className="input" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="Клиент"><input className="input" value={client?.name ?? '—'} disabled /></Field>
      </div>
      {driverWarn && <div className="alert alert-warn"><AlertTriangle /><div>Водитель {driverWarn} — назначение невозможно. Выберите другого водителя или отправьте заявку кадровику.</div></div>}
      {client?.critical && (
        <div className="stack-sm">
          <CriticalDebt clientId={client.id} />
          {fin === 'none' && <div className="row">
            <button className="btn btn-dark btn-sm" onClick={() => { setFin('requested'); toast('Запрос отправлен финансовому директору') }}>Запросить подтверждение фин. директора</button>
            {isAdmin(role) && <button className="btn btn-secondary btn-sm" onClick={() => { setFin('approved'); toast('Блокировка снята администратором') }}>Снять блокировку (админ)</button>}
          </div>}
          {fin === 'requested' && <div className="row"><span className="badge badge-warn">Ожидает решения фин. директора</span><button className="btn btn-ghost btn-sm" onClick={() => { setFin('approved'); toast('Фин. директор подтвердил назначение') }}>Демо: фин. директор подтвердил</button></div>}
          {fin === 'approved' && <div className="alert alert-ok">Назначение подтверждено финансовым директором.</div>}
        </div>
      )}
      <div className="card-flat stack-sm" style={{ fontSize: 13 }}>
        <span className="eyebrow">Сообщение в Telegram-бот водителя · демо</span>
        <div>🚜 <b>Новое назначение</b>: {item.title} ({item.plate})<br />📍 {s.name}, {s.address}<br />🕗 {from.replace('T', ' ')} · график: {s.schedule}<br />☎ {s.contacts}<br />⚠ {s.limits || 'Ограничений нет'}</div>
      </div>
    </Modal>
  )
}

/* ================= Форма техники ================= */
export type EqRow = Equipment & { note?: string }
export function EqForm({ initial, attracted, onClose, onSave, title }: { initial?: EqRow; attracted: boolean; onClose: () => void; onSave: (e: EqRow) => void; title?: string }) {
  const landlords = companies.filter((c) => c.kind === 'landlord' && c.id !== 'own')
  const [f, setF] = useState<EqRow>(initial ?? {
    ...equipment[0], id: uid('eq'), brand: '', model: '', title: '', plate: '', year: 2022, extras: [], status: attracted ? 'На модерации' : 'Свободна',
    ownerId: attracted ? landlords[0].id : 'own', own: !attracted, motoHours: 0, mileage: 0, rentCostForUs: attracted ? 60 : undefined, note: '', rating: 5, reviews: 0,
  })
  const set = (p: Partial<EqRow>) => setF((s) => ({ ...s, ...p }))
  const numv = (v: string) => (v === '' ? undefined : Number(v))
  return (
    <Modal wide title={title ?? (initial ? `Редактировать: ${initial.title}` : attracted ? 'Добавить привлечённую технику' : 'Добавить свою технику')} onClose={onClose} footer={<>
      <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
      <button className="btn btn-primary" disabled={!f.brand || !f.model || !f.plate} onClick={() => onSave({ ...f, title: `${f.brand} ${f.model}`, pricePerShift: f.pricePerHour * 8, overtimePerHour: Math.round(f.pricePerHour * 1.5) })}>Сохранить</button>
    </>}>
      <div className="grid g3">
        <Field label="Тип" required><select className="select" value={f.category} onChange={(e) => set({ category: e.target.value as EquipmentCategory })}>
          {Object.entries(categoryOne).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Марка" required><input className="input" value={f.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="JCB" /></Field>
        <Field label="Модель" required><input className="input" value={f.model} onChange={(e) => set({ model: e.target.value })} placeholder="3CX Super" /></Field>
        <Field label="Госномер" required><input className="input mono" value={f.plate} onChange={(e) => set({ plate: e.target.value })} placeholder="1234 АВ-7" /></Field>
        <Field label="Год выпуска"><input className="input" type="number" value={f.year} onChange={(e) => set({ year: Number(e.target.value) })} /></Field>
        <Field label="Закреплённый водитель"><select className="select" value={f.driverId ?? ''} onChange={(e) => set({ driverId: e.target.value || undefined })}>
          <option value="">— не закреплён —</option>{drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
        <Field label="Грузоподъёмность, т"><input className="input" type="number" step="0.1" value={f.capacity ?? ''} onChange={(e) => set({ capacity: numv(e.target.value) })} /></Field>
        <Field label="Вылет стрелы, м"><input className="input" type="number" step="0.1" value={f.boom ?? ''} onChange={(e) => set({ boom: numv(e.target.value) })} /></Field>
        <Field label="Объём ковша, м³"><input className="input" type="number" step="0.01" value={f.bucket ?? ''} onChange={(e) => set({ bucket: numv(e.target.value) })} /></Field>
        <Field label="Моточасы"><input className="input" type="number" value={f.motoHours} onChange={(e) => set({ motoHours: Number(e.target.value) })} /></Field>
        <Field label="Пробег, км"><input className="input" type="number" value={f.mileage} onChange={(e) => set({ mileage: Number(e.target.value) })} /></Field>
        <Field label={attracted ? 'Ставка для клиента, BYN/ч' : 'Стоимость аренды, BYN/ч'} required><input className="input" type="number" value={f.pricePerHour} onChange={(e) => set({ pricePerHour: Number(e.target.value) })} /></Field>
        {attracted && <>
          <Field label="Ставка для нас, BYN/ч" required><input className="input" type="number" value={f.rentCostForUs ?? 0} onChange={(e) => set({ rentCostForUs: Number(e.target.value) })} /></Field>
          <Field label="Арендодатель" required><select className="select" value={f.ownerId} onChange={(e) => set({ ownerId: e.target.value })}>
            {landlords.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
        </>}
      </div>
      <Field label="Доп. оборудование" hint="Через запятую"><input className="input" value={f.extras.join(', ')} onChange={(e) => set({ extras: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></Field>
      <Field label="Примечания"><textarea className="textarea" value={f.note ?? ''} onChange={(e) => set({ note: e.target.value })} /></Field>
    </Modal>
  )
}

/* ================= Страница ================= */
type Top = 'own' | 'attracted' | 'to'
type ToTab = 'Заявка' | 'В процессе' | 'Закрыта'
const capOpts = [0, 5, 10, 20, 25], boomOpts = [0, 10, 20, 30], bucketOpts = [0, 0.5, 1, 1.5]

export default function EquipmentPage({ role }: CrmPageProps) {
  const toast = useToast()
  const list = useList<EqRow>(equipment.map((e) => ({ ...e, note: eqNotes[e.id] ?? '' })))
  const tos = useList<ToRequest>(toRequests)
  const [top, setTop] = useState<Top>('own')
  const [toTab, setToTab] = useState<ToTab>('Заявка')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<'' | EquipmentCategory>('')
  const [cap, setCap] = useState(0), [boom, setBoom] = useState(0), [bucket, setBucket] = useState(0)
  const [extra, setExtra] = useState('')
  const [st, setSt] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [form, setForm] = useState<{ item?: EqRow } | null>(null)
  const [assign, setAssign] = useState<EqRow | null>(null)
  const [toOpen, setToOpen] = useState<string | null>(null)

  const own = list.rows.filter((e) => e.own), att = list.rows.filter((e) => !e.own)
  const base = top === 'attracted' ? att : own
  const extrasAll = useMemo(() => [...new Set(base.flatMap((e) => e.extras))].sort(), [base])
  const rows = base.filter((e) =>
    (!q || `${e.title} ${e.plate} ${emp(e.driverId)?.name ?? ''}`.toLowerCase().includes(q.toLowerCase())) &&
    (!cat || e.category === cat) && (!cap || (e.capacity ?? 0) >= cap) && (!boom || (e.boom ?? 0) >= boom) &&
    (!bucket || (e.bucket ?? 0) >= bucket) && (!extra || e.extras.includes(extra)) && (!st || crmEqStatus(e) === st))
  const all = list.rows
  const cnt = (s: string) => all.filter((e) => crmEqStatus(e) === s).length
  const cur = list.rows.find((e) => e.id === open)
  const toCur = tos.rows.find((t) => t.id === toOpen)

  const cols: Col<EqRow>[] = [
    { key: 't', title: 'Техника', render: (e) => (
      <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
        <div className="ca-eq-thumb hide-mobile"><div className="eq-img"><EquipmentArt seed={e.id} category={e.category} /></div></div>
        <div style={{ minWidth: 0 }}><b>{e.title}</b><div className="muted mono" style={{ fontSize: 12 }}>{e.plate} · {e.year}</div></div>
      </div>) },
    { key: 'c', title: 'Тип', hideMobile: true, render: (e) => categoryOne[e.category] },
    { key: 's', title: 'Статус', render: (e) => <StatusBadge status={crmEqStatus(e)} /> },
    { key: 'd', title: 'Водитель', hideMobile: true, render: (e) => emp(e.driverId)?.name.split(' ').slice(0, 2).join(' ') ?? '—' },
    { key: 'spec', title: 'Характеристики', hideMobile: true, render: (e) => <span className="muted" style={{ fontSize: 13 }}>{[e.capacity && `${e.capacity} т`, e.boom && `${e.boom} м`, e.bucket && `${e.bucket} м³`].filter(Boolean).join(' · ')}</span> },
    { key: 'mh', title: 'Моточасы', align: 'r', hideMobile: true, render: (e) => <span className="tnum">{num(e.motoHours)}</span> },
    ...(top === 'attracted'
      ? [{ key: 'p', title: 'Для нас / клиента', align: 'r' as const, nowrap: true, render: (e: EqRow) => <span className="tnum">{e.rentCostForUs} / <b>{e.pricePerHour}</b> BYN/ч</span> }]
      : [{ key: 'p', title: 'Ставка', align: 'r' as const, nowrap: true, render: (e: EqRow) => <span className="tnum">{e.pricePerHour} BYN/ч</span> }]),
    { key: 'f', title: 'Прибыль (окт)', align: 'r', hideMobile: true, render: (e) => { const f = eqFinance(e); return <span className={`tnum ${f.profit < 0 ? 'ca-flag' : ''}`}>{money(f.profit)}</span> } },
    { key: 'a', title: '', align: 'r', render: (e) => <button className="btn btn-secondary btn-sm" disabled={crmEqStatus(e) === 'ТО'} onClick={(ev) => { ev.stopPropagation(); setAssign(e) }}><Send />Назначить</button> },
  ]

  const toRows = tos.rows.filter((t) => t.stage === toTab)
  const toCols: Col<ToRequest>[] = [
    { key: 'd', title: 'Дата', nowrap: true, render: (t) => <span className="tnum">{dateShort(t.created)}, {time(t.created)}</span> },
    { key: 'e', title: 'Техника', render: (t) => { const e = list.rows.find((x) => x.id === t.eqId); return <EqThumb eq={e}><b>{e?.title}</b><div className="muted mono" style={{ fontSize: 12 }}>{e?.plate}</div></EqThumb> } },
    { key: 'p', title: 'Проблема', hideMobile: true, render: (t) => <span style={{ fontSize: 13 }}>{t.problem}</span> },
    { key: 'u', title: 'Срочность', render: (t) => <span className={`badge ${t.urgency === 'Аварийно' ? 'badge-bad' : t.urgency === 'Срочно' ? 'badge-warn' : 'badge-info'}`}>{t.urgency}</span> },
    { key: 'm', title: 'Механик', hideMobile: true, render: (t) => emp(t.mechanicId)?.name.split(' ').slice(0, 2).join(' ') },
    { key: 's', title: 'Статус', render: (t) => <StatusBadge status={t.status} /> },
    { key: 'r', title: 'Решение', hideMobile: true, render: (t) => t.decision || <span className="muted">—</span> },
  ]

  const setEqStatus = (id: string, status: Equipment['status']) => { const e = list.rows.find((x) => x.id === id); if (e) list.update({ ...e, status }) }

  return (
    <div className="stack">
      <PageHead title="Техника и ТО" sub="Собственный парк и привлечённая техника партнёров · назначения · техническое обслуживание"
        actions={top !== 'to' && <button className="btn btn-primary" onClick={() => setForm({})}><Plus />Добавить технику</button>} />

      <div className="ca-stats c5">
        <Stat label="Своя / привлечённая" value={<>{own.length}<span className="muted" style={{ fontSize: 18 }}> / {att.length}</span></>} />
        <Stat label="В рейсе" value={cnt('В рейсе')} delta={`${Math.round(cnt('В рейсе') / all.length * 100)}% загрузки`} trend="up" />
        <Stat label="Простаивает" value={cnt('Свободна')} delta="свободна сегодня" />
        <Stat label="На ТО" value={cnt('ТО')} delta={`${tos.rows.filter((t) => t.stage === 'В процессе').length} в процессе`} trend="down" />
        <Stat label="Заявки на ТО" value={tos.rows.filter((t) => t.stage === 'Заявка').length} delta="ждут решения" trend="down" />
      </div>

      <Tabs value={top} onChange={(v) => { setTop(v); setCat(''); setExtra('') }} items={[
        { id: 'own', label: 'Своя техника', count: own.length },
        { id: 'attracted', label: 'Привлечённая', count: att.length },
        { id: 'to', label: 'ТО (своя)', count: tos.rows.filter((t) => t.stage !== 'Закрыта').length },
      ]} />

      {top !== 'to' ? (
        <>
          <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Модель, госномер, водитель" />
            <Seg value={st} onChange={setSt} items={[{ id: '', label: 'Все' }, { id: 'В рейсе', label: 'В рейсе' }, { id: 'Свободна', label: 'Свободна' }, { id: 'ТО', label: 'ТО' }]} />
          </div>
          <div className="ca-filters">
            <select className="select" value={cat} onChange={(e) => setCat(e.target.value as EquipmentCategory | '')} aria-label="Категория">
              <option value="">Все категории</option>{Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select className="select" value={cap} onChange={(e) => setCap(Number(e.target.value))} aria-label="Грузоподъёмность">
              {capOpts.map((v) => <option key={v} value={v}>{v ? `Грузоподъёмность от ${v} т` : 'Любая грузоподъёмность'}</option>)}</select>
            <select className="select" value={boom} onChange={(e) => setBoom(Number(e.target.value))} aria-label="Вылет стрелы">
              {boomOpts.map((v) => <option key={v} value={v}>{v ? `Вылет стрелы от ${v} м` : 'Любой вылет стрелы'}</option>)}</select>
            <select className="select" value={bucket} onChange={(e) => setBucket(Number(e.target.value))} aria-label="Объём ковша">
              {bucketOpts.map((v) => <option key={v} value={v}>{v ? `Ковш от ${v} м³` : 'Любой объём ковша'}</option>)}</select>
            <select className="select" value={extra} onChange={(e) => setExtra(e.target.value)} aria-label="Доп. оборудование">
              <option value="">Любое доп. оборудование</option>{extrasAll.map((x) => <option key={x}>{x}</option>)}</select>
          </div>
          <DataTable cols={cols} rows={rows} rowKey={(e) => e.id} onRow={(e) => setOpen(e.id)} empty="Нет техники по выбранным фильтрам" />
        </>
      ) : (
        <>
          <div className="row-between">
            <Seg value={toTab} onChange={setToTab} items={[
              { id: 'Заявка', label: `Заявки на ТО · ${tos.rows.filter((t) => t.stage === 'Заявка').length}` },
              { id: 'В процессе', label: `В процессе · ${tos.rows.filter((t) => t.stage === 'В процессе').length}` },
              { id: 'Закрыта', label: 'История ТО' },
            ]} />
            <span className="muted" style={{ fontSize: 13 }}>Механик диагностирует и закрывает ТО, менеджер утверждает вывод из рейса и решение</span>
          </div>
          <DataTable cols={toCols} rows={toRows} rowKey={(t) => t.id} onRow={(t) => setToOpen(t.id)} empty="Заявок нет" />
        </>
      )}

      {cur && <EqCard role={role} e={cur} onClose={() => setOpen(null)}
        onEdit={() => setForm({ item: cur })}
        onAssign={() => setAssign(cur)}
        onNote={(note) => list.update({ ...cur, note })}
        onTo={() => {
          tos.add({ id: uid('to'), eqId: cur.id, driverId: cur.driverId ?? 'd1', created: new Date('2026-10-13T11:00:00').toISOString(), problem: 'Направлено менеджером на диагностику', urgency: 'Плановое', stage: 'Заявка', status: 'Новая', mechanicId: 'e4', diagnosis: '', works: [], decision: '', outOfTrip: false, downtime: 0, cost: 0 })
          toast('Заявка на ТО создана, механик уведомлён'); setOpen(null); setTop('to'); setToTab('Заявка')
        }}
        onArchive={() => { list.update({ ...cur, status: 'Архив' }); setOpen(null) }}
        onBlock={() => { list.update({ ...cur, status: 'Скрытая' }) }}
        onCancelAssign={() => setEqStatus(cur.id, 'Свободна')} />}

      {form && <EqForm initial={form.item} attracted={form.item ? !form.item.own : top === 'attracted'} onClose={() => setForm(null)}
        onSave={(e) => { if (form.item) list.update(e); else list.add(e); setForm(null); toast(form.item ? 'Изменения сохранены' : 'Техника добавлена') }} />}

      {assign && <AssignModal role={role} item={assign} onClose={() => setAssign(null)} onDone={(driverId) => { list.update({ ...assign, driverId, status: 'Арендована' }) }} />}

      {toCur && <ToCard role={role} t={toCur} eqTitle={list.rows.find((x) => x.id === toCur.eqId)?.title ?? ''} free={own.filter((e) => crmEqStatus(e) === 'Свободна' && e.id !== toCur.eqId)}
        onClose={() => setToOpen(null)}
        onUpdate={(t, msg) => {
          tos.update(t); toast(msg)
          if (t.outOfTrip && t.stage !== 'Закрыта') setEqStatus(t.eqId, 'В ремонте')
          if (t.stage === 'Закрыта') setEqStatus(t.eqId, 'Свободна')
          if (t.replaceEqId) setEqStatus(t.replaceEqId, 'Арендована')
        }}
        onRemove={() => { tos.remove(toCur.id); setToOpen(null); toast('Заявка на ТО отклонена') }} />}
    </div>
  )
}

/* ================= Карточка техники ================= */
function EqCard({ role, e, onClose, onEdit, onAssign, onNote, onTo, onArchive, onBlock, onCancelAssign }: {
  role: CrmRole; e: EqRow; onClose: () => void; onEdit: () => void; onAssign: () => void; onNote: (n: string) => void; onTo: () => void
  onArchive: () => void; onBlock: () => void; onCancelAssign: () => void
}) {
  const toast = useToast()
  const [note, setNote] = useState(e.note ?? '')
  const f = eqFinance(e)
  const hist = repairs.filter((r) => r.eqId === e.id)
  const owner = company(e.ownerId)
  const status = crmEqStatus(e)
  const row = (k: string, v: ReactNode): [string, ReactNode] => [k, v]
  return (
    <Drawer title={e.title} sub={<span className="mono">{e.plate} · {e.own ? 'своя' : `привлечённая · ${owner?.name}`}</span>} onClose={onClose} footer={<>
      {e.own && <button className="btn btn-secondary" onClick={onTo} disabled={status === 'ТО'}><Wrench />На ТО</button>}
      <button className="btn btn-secondary" onClick={onEdit}>Редактировать</button>
      <button className="btn btn-primary" onClick={onAssign} disabled={status === 'ТО'}><Send />Назначить</button>
    </>}>
      <div className="eq-img" style={{ maxHeight: 220 }}><EquipmentArt seed={e.id} category={e.category} label={categoryOne[e.category]} /></div>
      <div className="row"><StatusBadge status={status} />{e.extras.map((x) => <span key={x} className="ca-chip">{x}</span>)}</div>
      <KV items={[
        row('Тип', categoryOne[e.category]),
        row('Марка / модель', `${e.brand} ${e.model}, ${e.year} г.`),
        row('Статус', status === 'В рейсе' ? 'В рейсе' : status === 'ТО' ? 'На техобслуживании' : 'Свободна'),
        row('Закреплённый водитель', emp(e.driverId)?.name ?? '—'),
        row('Закреплённый менеджер', emp(e.managerId)?.name ?? '—'),
        row('Моточасы / пробег', <span className="tnum">{num(e.motoHours)} м/ч{e.mileage ? ` · ${num(e.mileage)} км` : ''}</span>),
        row('Характеристики', [e.capacity && `${e.capacity} т`, e.boom && `стрела ${e.boom} м`, e.bucket && `ковш ${e.bucket} м³`].filter(Boolean).join(', ') || '—'),
        row('Стоимость аренды', <span className="tnum">{e.pricePerHour} BYN/ч · {money(e.pricePerShift)}/смена · мин. {e.minHours} ч</span>),
        ...(!e.own ? [
          row('Стоимость для нас', <span className="tnum">{e.rentCostForUs} BYN/ч</span>),
          row('Стоимость для клиента', <span className="tnum"><b>{e.pricePerHour} BYN/ч</b> · наценка {e.pricePerHour - (e.rentCostForUs ?? 0)} BYN/ч</span>),
        ] : []),
        row('Местоположение', `${e.address} · гео ${dateShort(e.lastGeoAt)} ${time(e.lastGeoAt)}`),
      ]} />

      <div className="card-flat stack-sm">
        <div className="row-between"><b>Финансовая эффективность · октябрь</b><span className={`badge ${f.margin >= 25 ? 'badge-ok' : f.margin >= 10 ? 'badge-warn' : 'badge-bad'}`}>маржа {f.margin}%</span></div>
        <div className="ca-cmp">
          <div><div className="l">Доход</div><div className="n">{money(f.revenue)}</div></div>
          <div><div className="l">{e.own ? 'Расходы' : 'Субаренда'}</div><div className="n">{money(f.cost)}</div></div>
          <div><div className="l">Прибыль</div><div className={`n ${f.profit < 0 ? 'bad' : ''}`}>{money(f.profit)}</div></div>
        </div>
        <div className="row-between" style={{ fontSize: 13 }}><span className="muted">Загрузка · {f.hours} ч, {f.deals} сделок</span><b className="tnum">{f.util}%</b></div>
        <Progress value={f.util} />
      </div>

      <div className="stack-sm">
        <b>История ремонтов</b>
        {hist.length ? <div className="table-wrap"><table className="table ca-tight"><thead><tr><th>Дата</th><th>Работы</th><th className="r">Сумма</th></tr></thead><tbody>
          {hist.map((r) => <tr key={r.id}><td className="nowrap tnum">{date(r.date)}</td><td><div>{r.works}</div><div className="muted" style={{ fontSize: 12 }}>{r.kind} · простой {r.downtime} ч · {r.mechanic}</div></td><td className="r tnum">{money(r.cost)}</td></tr>)}
        </tbody></table></div> : <span className="muted">Ремонтов не было</span>}
      </div>

      <Field label="Примечания"><textarea className="textarea" value={note} onChange={(ev) => setNote(ev.target.value)} onBlur={() => { if (note !== (e.note ?? '')) { onNote(note); toast('Примечание сохранено') } }} /></Field>
      <AdminActions role={role} what={e.title} onCancel={onCancelAssign} onArchive={onArchive} onBlock={onBlock} />
    </Drawer>
  )
}

/* ================= Карточка ТО ================= */
function ToCard({ role, t, eqTitle, free, onClose, onUpdate, onRemove }: { role: CrmRole; t: ToRequest; eqTitle: string; free: EqRow[]; onClose: () => void; onUpdate: (t: ToRequest, msg: string) => void; onRemove: () => void }) {
  const toast = useToast()
  const [decision, setDecision] = useState<ToDecision>(t.decision || 'Ремонт')
  const [rep, setRep] = useState(t.replaceEqId ?? free[0]?.id ?? '')
  const steps = ['Новая', 'В работе', 'Решение', 'Закрыта']
  const si = t.stage === 'Закрыта' ? 3 : t.decision ? 2 : t.stage === 'В процессе' ? 1 : 0
  return (
    <Drawer title={`ТО: ${eqTitle}`} sub={`Заявка от ${date(t.created)} · водитель ${emp(t.driverId)?.name}`} onClose={onClose} footer={t.stage !== 'Закрыта' ? <>
      {t.stage === 'Заявка' && <button className="btn btn-danger" onClick={onRemove}><XCircle />Отклонить</button>}
      {!t.outOfTrip && <button className="btn btn-dark" onClick={() => onUpdate({ ...t, outOfTrip: true, stage: 'В процессе', status: 'В работе' }, 'Вывод из рейса утверждён · водитель и механик уведомлены')}>Утвердить вывод из рейса</button>}
      <button className="btn btn-primary" onClick={() => {
        const msg = decision === 'Замена' ? `Решение: замена на ${free.find((x) => x.id === rep)?.title ?? '—'} · водителю отправлено уведомление` : decision === 'Субаренда' ? 'Решение: субаренда · создана заявка в колл-центр «Мы арендуем»' : 'Решение: ремонт · механик приступает'
        onUpdate({ ...t, decision, stage: 'В процессе', status: 'Решение', outOfTrip: true, replaceEqId: decision === 'Замена' ? rep : undefined }, msg)
      }}>Принять решение</button>
    </> : undefined}>
      <div className="ca-pipe">{steps.map((s, i) => <span key={s} className={i < si ? 'done' : i === si ? 'on' : ''}>{s}</span>)}</div>
      <KV items={[
        ['Проблема', t.problem],
        ['Срочность', <span className={`badge ${t.urgency === 'Аварийно' ? 'badge-bad' : t.urgency === 'Срочно' ? 'badge-warn' : 'badge-info'}`}>{t.urgency}</span>],
        ['Механик', emp(t.mechanicId)?.name],
        ['Статус', <StatusBadge status={t.status} />],
        ['Вывод из рейса', t.outOfTrip ? 'Утверждён' : 'Не утверждён — техника работает'],
        ['Простой', `${t.downtime} ч`],
        ['Стоимость работ', money(t.cost)],
        ...(t.closed ? [['Закрыта', date(t.closed)] as [string, ReactNode]] : []),
      ]} />
      <div className="card-flat stack-sm">
        <b>От механика</b>
        <div style={{ fontSize: 14 }}>{t.diagnosis || <span className="muted">Диагностика ещё не проведена</span>}</div>
        {t.works.length > 0 && <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>{t.works.map((w) => <li key={w}>{w}</li>)}</ul>}
        <div className="row"><button className="btn btn-secondary btn-sm" onClick={() => toast('Сообщение механику отправлено в чат')}>Написать механику</button>
          <button className="btn btn-ghost btn-sm" onClick={() => toast('Механик назначен на диагностику сегодня')}>Запросить диагностику</button></div>
      </div>
      {t.stage !== 'Закрыта' ? (
        <div className="stack-sm">
          <b>Решение менеджера</b>
          <Seg value={decision} onChange={setDecision} items={[{ id: 'Ремонт', label: 'Ремонт' }, { id: 'Замена', label: 'Замена' }, { id: 'Субаренда', label: 'Субаренда' }]} />
          {decision === 'Замена' && <Field label="Подменная техника (свободная своя)"><select className="select" value={rep} onChange={(e) => setRep(e.target.value)}>
            {free.map((x) => <option key={x.id} value={x.id}>{x.title} · {x.plate}</option>)}</select></Field>}
          {decision === 'Субаренда' && <div className="alert alert-info">Будет создана заявка «Мы арендуем» в колл-центре на аналогичную технику у партнёров.</div>}
        </div>
      ) : <div className="alert alert-ok">ТО закрыто механиком · решение: {t.decision}</div>}
      <AdminActions role={role} what="Заявка на ТО" onCancel={onRemove} onArchive={() => onUpdate({ ...t, stage: 'Закрыта', status: 'Закрыта', closed: '2026-10-13' }, 'ТО перенесено в историю')} />
    </Drawer>
  )
}
