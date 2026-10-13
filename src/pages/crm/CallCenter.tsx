import { useEffect, useState } from 'react'
import { Check, Mic, Pause, Pencil, Phone, PhoneCall, PhoneIncoming, PhoneOff, Play, Plus, Rocket, Send, UserPlus, X } from 'lucide-react'
import type { CrmPageProps, CrmRole } from './types'
import { Badge, DataTable, Drawer, Field, KV, Modal, PageHead, SearchInput, Seg, Stat, StatusBadge, Tabs, dateShort, money, time, uid, useList, useToast, type Col } from '../../ui'
import { companies, company, emp, eq, equipment, managers, sites } from '../../data/mock'
import { categoryLabels, categoryOne, type EquipmentCategory } from '../../data/types'
import { callReqs, type CallDir, type CallReq, type CallStatus } from '../../data/crm-a'
import { AdminActions, AssignModal, CriticalDebt } from './Equipment'
import './crm-a.css'

const statuses: CallStatus[] = ['Новая', 'В работе', 'Принята', 'Отклонена', 'Сделка запущена']
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const short = (n?: string) => (n ? n.split(' ').slice(0, 2).join(' ') : '—')
const NOW = '2026-10-13T11:20:00'

type Call = { kind: 'in-known' | 'in-new' | 'out'; phone: string; companyId?: string; contact?: string; reqId?: string; stage: 'ring' | 'talk'; sec: number }

export default function CallCenter({ role }: CrmPageProps) {
  const toast = useToast()
  const list = useList<CallReq>(callReqs)
  const [dir, setDir] = useState<CallDir>('in')
  const [src, setSrc] = useState<'own' | 'attracted'>('own')
  const [q, setQ] = useState('')
  const [st, setSt] = useState('')
  const [cat, setCat] = useState('')
  const [mgr, setMgr] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [form, setForm] = useState<CallReq | null>(null)
  const [call, setCall] = useState<Call | null>(null)
  const [knownIdx, setKnownIdx] = useState(0)

  useEffect(() => {
    if (call?.stage !== 'talk') return
    const t = setInterval(() => setCall((c) => (c ? { ...c, sec: c.sec + 1 } : c)), 1000)
    return () => clearInterval(t)
  }, [call?.stage])

  const inDir = list.rows.filter((r) => r.dir === dir)
  const rows = inDir.filter((r) => r.source === src && (!q || `${r.companyName} ${r.contact} ${r.phone}`.toLowerCase().includes(q.toLowerCase())) && (!st || r.status === st) && (!cat || r.category === cat) && (!mgr || r.managerId === mgr))
    .sort((a, b) => b.created.localeCompare(a.created))
  const cur = list.rows.find((r) => r.id === open)
  const blank = (p: Partial<CallReq> = {}): CallReq => ({ id: uid('cr'), dir, source: src, created: NOW, companyName: '', contact: '', phone: '+375 ', category: 'excavator', address: '', dateFrom: '2026-10-15', hours: 8, price: 0, status: 'Новая', managerId: 'e3', comment: '', ...p })

  const demoKnown = () => {
    const c = companies[knownIdx % 2 === 0 ? 1 : 0] // Белдорстрой-7 (долг) / СтройМонолит (активная аренда)
    setKnownIdx(knownIdx + 1)
    setCall({ kind: 'in-known', phone: c.phone, companyId: c.id, contact: c.representative, stage: 'ring', sec: 0 })
  }
  const demoNew = () => setCall({ kind: 'in-new', phone: '+375 29 ' + (300 + Math.floor(Math.random() * 600)) + '-' + (10 + Math.floor(Math.random() * 89)) + '-' + (10 + Math.floor(Math.random() * 89)), stage: 'ring', sec: 0 })
  const dial = (r: CallReq) => { setCall({ kind: 'out', phone: r.phone, companyId: r.companyId, contact: r.contact, reqId: r.id, stage: 'talk', sec: 0 }); toast(`Вызов ${r.phone} через IP-телефонию (демо)`) }

  const endCall = () => {
    if (!call) return
    const rec = { duration: Math.max(call.sec, 37), at: NOW }
    if (call.reqId) {
      const r = list.rows.find((x) => x.id === call.reqId); if (r) list.update({ ...r, record: rec })
      toast('Запись звонка прикреплена к карточке')
      setOpen(call.reqId)
    } else {
      const c = company(call.companyId)
      setDir('in')
      setForm(blank({ dir: 'in', companyId: c?.id, companyName: c?.name ?? '', contact: call.contact ?? '', phone: call.phone, record: rec, address: c ? sites.find((s) => s.clientId === c.id)?.address ?? '' : '', siteId: c ? sites.find((s) => s.clientId === c.id)?.id : undefined }))
      toast('Запись звонка прикреплена к карточке контакта')
    }
    setCall(null)
  }

  const cols: Col<CallReq>[] = [
    { key: 'd', title: 'Дата', nowrap: true, render: (r) => <div><b className="tnum">{dateShort(r.created)}</b><div className="muted tnum" style={{ fontSize: 12 }}>{time(r.created)}</div></div> },
    { key: 'c', title: dir === 'in' ? 'Клиент' : 'Арендодатель', render: (r) => <div><b>{r.companyName}</b>{company(r.companyId)?.critical && <span className="badge badge-bad" style={{ marginLeft: 6 }}>Долг</span>}<div className="muted" style={{ fontSize: 12 }}>{short(r.contact)} · <span className="mono">{r.phone}</span></div></div> },
    { key: 'e', title: 'Техника', render: (r) => <div>{categoryOne[r.category]}<div className="muted" style={{ fontSize: 12 }}>{eq(r.eqId)?.title ?? 'не назначена'}</div></div> },
    { key: 'a', title: dir === 'in' ? 'Объект' : 'Откуда', hideMobile: true, render: (r) => <span style={{ fontSize: 13 }}>{r.address || '—'}</span> },
    { key: 'p', title: 'Период', hideMobile: true, nowrap: true, render: (r) => <span className="tnum">с {dateShort(r.dateFrom)} · {r.hours} ч</span> },
    { key: 's', title: 'Сумма', align: 'r', hideMobile: true, render: (r) => <span className="tnum">{money(r.price)}</span> },
    { key: 'st', title: 'Статус', render: (r) => <CallStatusBadge s={r.status} /> },
    { key: 'r', title: '', hideMobile: true, render: (r) => r.record ? <span className="muted row" style={{ gap: 4, fontSize: 12 }} title="Запись звонка"><Mic size={14} />{mmss(r.record.duration)}</span> : null },
    { key: 'call', title: '', align: 'r', render: (r) => <button className="btn btn-ok btn-sm" onClick={(e) => { e.stopPropagation(); dial(r) }}><Phone />Позвонить</button> },
  ]

  return (
    <div className="stack">
      <PageHead title="Колл-центр" sub="Входящие и исходящие заявки, звонки, запуск сделок"
        actions={<>
          <button className="btn btn-secondary" onClick={demoKnown}><PhoneIncoming />Демо: входящий от клиента в базе</button>
          <button className="btn btn-secondary" onClick={demoNew}><UserPlus />Демо: новый номер</button>
          <button className="btn btn-primary" onClick={() => setForm(blank())}><Plus />Новая заявка</button>
        </>} />

      <div className="ca-stats">
        <Stat label="Новые заявки" value={list.rows.filter((r) => r.status === 'Новая').length} delta="ждут обработки" trend="down" />
        <Stat label="В работе" value={list.rows.filter((r) => r.status === 'В работе').length} />
        <Stat label="Сделок запущено" value={list.rows.filter((r) => r.status === 'Сделка запущена' || r.status === 'Принята').length} trend="up" delta={money(list.rows.filter((r) => r.status === 'Сделка запущена' || r.status === 'Принята').reduce((a, r) => a + r.price, 0))} />
        <Stat label="Записей звонков" value={list.rows.filter((r) => r.record).length} delta="за 3 дня" />
      </div>

      <Tabs value={dir} onChange={(v) => { setDir(v) }} items={[
        { id: 'in', label: 'У нас арендуют', count: list.rows.filter((r) => r.dir === 'in').length },
        { id: 'out', label: 'Мы арендуем', count: list.rows.filter((r) => r.dir === 'out').length },
      ]} />
      <div className="row-between">
        <Seg value={src} onChange={setSrc} items={[{ id: 'own', label: `Наша техника · ${inDir.filter((r) => r.source === 'own').length}` }, { id: 'attracted', label: `Привлечённая · ${inDir.filter((r) => r.source === 'attracted').length}` }]} />
        <span className="muted" style={{ fontSize: 13 }}>{dir === 'in' ? 'Клиенты, которые арендуют у нас' : 'Партнёры, у которых арендуем мы (субаренда, подмена)'}</span>
      </div>
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Компания, контакт, телефон" />
        <select className="select" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Статус"><option value="">Все статусы</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Категория"><option value="">Вся техника</option>{Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select className="select" value={mgr} onChange={(e) => setMgr(e.target.value)} aria-label="Менеджер"><option value="">Все менеджеры</option>{managers.map((m) => <option key={m.id} value={m.id}>{short(m.name)}</option>)}</select>
      </div>
      <DataTable cols={cols} rows={rows} rowKey={(r) => r.id} onRow={(r) => setOpen(r.id)} empty="Заявок нет" />

      {cur && <CallCard role={role} r={cur} onClose={() => setOpen(null)} onEdit={() => setForm(cur)} onDial={() => dial(cur)}
        onUpdate={(r, msg) => { list.update(r); toast(msg) }} />}

      {form && <CallForm r={form} isNew={!list.rows.some((x) => x.id === form.id)} onClose={() => setForm(null)}
        onSave={(r) => { if (list.rows.some((x) => x.id === r.id)) list.update(r); else { list.add(r); setDir(r.dir); setSrc(r.source) } setForm(null); toast('Карточка заявки сохранена') }} />}

      {call && <CallPopup call={call} onAccept={() => setCall({ ...call, stage: 'talk' })} onDecline={() => { setCall(null); toast('Вызов отклонён · номер добавлен в пропущенные') }} onEnd={endCall} />}
    </div>
  )
}

const CallStatusBadge = ({ s }: { s: CallStatus }) => (s === 'Сделка запущена' ? <Badge tone="ok">{s}</Badge> : <StatusBadge status={s} />)

function CallPopup({ call, onAccept, onDecline, onEnd }: { call: Call; onAccept: () => void; onDecline: () => void; onEnd: () => void }) {
  const c = company(call.companyId)
  const tagBad = !!c && c.debt > 0
  return (
    <div className="ca-call" role="dialog" aria-label="Звонок">
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <div className="ring">{call.kind === 'out' ? <PhoneCall /> : <PhoneIncoming />}</div>
        <div className="grow">
          <div className="muted" style={{ fontSize: 12 }}>{call.kind === 'out' ? 'Исходящий вызов' : call.stage === 'ring' ? 'Входящий звонок' : 'Идёт разговор'} · {call.stage === 'talk' ? mmss(call.sec) : 'IP-телефония (демо)'}</div>
          <div className="mono" style={{ fontWeight: 700, fontSize: 16 }}>{call.phone}</div>
        </div>
        {call.stage === 'talk' && <span className="badge badge-bad plain"><Mic size={12} />REC</span>}
      </div>
      {c ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ font: '600 17px var(--font-display)' }}>{c.name}</div>
          <div className="muted" style={{ fontSize: 13 }}>Звонит: {call.contact}</div>
          {call.kind !== 'out' && <div className={`tag ${tagBad ? 'bad' : 'ok'}`}>{tagBad ? `Долг ${money(c.debt)}${c.critical ? ' · критический' : ''}` : c.activeNote ?? 'Клиент без задолженности'}</div>}
        </div>
      ) : call.kind === 'in-new' && <div style={{ marginTop: 12 }}><div style={{ font: '600 16px var(--font-display)' }}>Номер не найден в базе</div><div className="muted" style={{ fontSize: 13 }}>После звонка откроется чистая карточка с этим номером</div></div>}
      <div className="row" style={{ marginTop: 14 }}>
        {call.stage === 'ring' ? <>
          <button className="btn btn-ok grow" style={{ background: 'var(--ok)', color: 'var(--surface)' }} onClick={onAccept}><Phone />Ответить</button>
          <button className="btn btn-danger grow" onClick={onDecline}><PhoneOff />Отклонить</button>
        </> : <button className="btn btn-danger btn-block" onClick={onEnd}><PhoneOff />Завершить и открыть карточку</button>}
      </div>
    </div>
  )
}

export function CallRecord({ duration, at }: { duration: number; at: string }) {
  const [play, setPlay] = useState(false)
  const [pos, setPos] = useState(0)
  useEffect(() => {
    if (!play) return
    const t = setInterval(() => setPos((p) => { if (p + 1 >= duration) { setPlay(false); return 0 } return p + 1 }), 120)
    return () => clearInterval(t)
  }, [play, duration])
  const bars = 48
  return (
    <div className="ca-audio">
      <button className="btn btn-dark btn-icon btn-sm" onClick={() => setPlay(!play)} aria-label={play ? 'Пауза' : 'Воспроизвести'}>{play ? <Pause /> : <Play />}</button>
      <div className="wave" aria-hidden>{Array.from({ length: bars }, (_, i) => <i key={i} className={i / bars < pos / duration ? 'p' : ''} style={{ height: `${25 + Math.abs(Math.sin(i * 1.7) * 70)}%` }} />)}</div>
      <span className="mono tnum" style={{ fontSize: 12 }}>{mmss(pos)} / {mmss(duration)}</span>
      <span className="muted hide-mobile" style={{ fontSize: 11 }}>{dateShort(at)} {time(at)}</span>
    </div>
  )
}

function CallCard({ role, r, onClose, onEdit, onDial, onUpdate }: { role: CrmRole; r: CallReq; onClose: () => void; onEdit: () => void; onDial: () => void; onUpdate: (r: CallReq, msg: string) => void }) {
  const [reject, setReject] = useState(false)
  const [reason, setReason] = useState('')
  const [assign, setAssign] = useState(false)
  const [eqId, setEqId] = useState(r.eqId ?? equipment.find((e) => e.category === r.category && e.own === (r.source === 'own'))?.id ?? equipment[0].id)
  const c = company(r.companyId)
  const blocked = !!c?.critical
  const pool = equipment.filter((e) => e.category === r.category && e.own === (r.source === 'own'))
  return (
    <Drawer title={r.companyName || 'Новый контакт'} sub={`${r.dir === 'in' ? 'У нас арендуют' : 'Мы арендуем'} · ${r.source === 'own' ? 'наша техника' : 'привлечённая техника'}`} onClose={onClose} footer={<>
      <button className="btn btn-ok" onClick={onDial}><Phone />Позвонить</button>
      <button className="btn btn-secondary" onClick={onEdit}><Pencil />Редактировать</button>
      {(r.status === 'Новая' || r.status === 'В работе') && <>
        <button className="btn btn-danger" onClick={() => setReject(true)}><X />Отклонить</button>
        <button className="btn btn-primary" onClick={() => onUpdate({ ...r, status: 'Принята' }, 'Заявка принята')}><Check />Принять</button>
      </>}
      {r.status === 'Принята' && <button className="btn btn-primary" disabled={blocked || !r.eqId} onClick={() => onUpdate({ ...r, status: 'Сделка запущена' }, `Сделка запущена · заявка создана в разделе «${r.dir === 'in' ? 'Арендаторы' : 'Арендодатели'}»`)}><Rocket />Запустить сделку</button>}
    </>}>
      <CriticalDebt clientId={r.companyId} />
      {!c && r.dir === 'in' && <div className="alert alert-info">Новый клиент — после принятия заявки будет создана карточка юрлица в «Арендаторах».</div>}
      <div className="row"><CallStatusBadge s={r.status} />{r.reason && <span className="muted" style={{ fontSize: 13 }}>Причина: {r.reason}</span>}</div>
      <KV items={[
        ['Контакт', r.contact || '—'],
        ['Телефон', <a className="mono" href={`tel:${r.phone}`}>{r.phone}</a>],
        ['Компания', r.companyName || '—'],
        ['Техника', `${categoryOne[r.category]}${r.eqId ? ` · ${eq(r.eqId)?.title} (${eq(r.eqId)?.plate})` : ' · не назначена'}`],
        [r.dir === 'in' ? 'Объект' : 'Адрес подачи', r.address || '—'],
        ['Период', `с ${dateShort(r.dateFrom)}, ${r.hours} ч`],
        ['Сумма', money(r.price)],
        ['Менеджер', emp(r.managerId)?.name],
        ['Создана', `${dateShort(r.created)}, ${time(r.created)}`],
        ['Комментарий', r.comment || '—'],
      ]} />
      <div className="stack-sm"><b>Запись звонка</b>
        {r.record ? <CallRecord duration={r.record.duration} at={r.record.at} /> : <span className="muted" style={{ fontSize: 14 }}>Записей нет — позвоните клиенту, запись прикрепится автоматически</span>}
      </div>
      <div className="card-flat stack-sm">
        <b>Назначить технику</b>
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <select className="select grow" value={eqId} onChange={(e) => setEqId(e.target.value)} aria-label="Техника">{(pool.length ? pool : equipment).map((e) => <option key={e.id} value={e.id}>{e.title} · {e.plate} · {e.status}</option>)}</select>
          <button className="btn btn-dark" onClick={() => { if (r.dir === 'in' && r.siteId) setAssign(true); else onUpdate({ ...r, eqId, status: r.status === 'Новая' ? 'В работе' : r.status }, 'Техника закреплена за заявкой') }}><Send />Назначить</button>
        </div>
        {r.dir === 'in' && r.siteId && <span className="muted" style={{ fontSize: 12 }}>Откроется назначение водителя и уведомление в Telegram</span>}
      </div>
      {reject && (
        <div className="card-flat stack-sm">
          <Field label="Причина отклонения" required><select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">— выберите —</option>{['Нет свободной техники на даты', 'Критический долг клиента', 'Не устроила цена', 'Удалённость объекта', 'Клиент передумал', 'Нет договора'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <div className="row"><button className="btn btn-danger" disabled={!reason} onClick={() => { onUpdate({ ...r, status: 'Отклонена', reason }, 'Заявка отклонена'); setReject(false) }}>Отклонить с причиной</button><button className="btn btn-ghost" onClick={() => setReject(false)}>Отмена</button></div>
        </div>
      )}
      <AdminActions role={role} what="Заявка колл-центра" onCancel={() => onUpdate({ ...r, status: 'Новая', reason: undefined }, 'Статус сброшен')} onArchive={() => onUpdate({ ...r, status: 'Отклонена', reason: 'Архив' }, 'Заявка в архиве')} onBlock={() => onUpdate({ ...r, status: 'Отклонена', reason: 'Номер заблокирован' }, 'Номер заблокирован')} />
      {assign && eq(eqId) && <AssignModal role={role} item={eq(eqId)!} defaultSiteId={r.siteId} onClose={() => setAssign(false)} onDone={() => onUpdate({ ...r, eqId, status: r.status === 'Новая' ? 'В работе' : r.status }, 'Техника назначена на заявку')} />}
    </Drawer>
  )
}

function CallForm({ r, isNew, onClose, onSave }: { r: CallReq; isNew: boolean; onClose: () => void; onSave: (r: CallReq) => void }) {
  const [f, setF] = useState(r)
  const set = (p: Partial<CallReq>) => setF((s) => ({ ...s, ...p }))
  const pool = companies.filter((c) => (f.dir === 'in' ? c.kind === 'tenant' : c.kind === 'landlord' && c.id !== 'own'))
  const eqPool = equipment.filter((e) => e.category === f.category && e.own === (f.source === 'own'))
  return (
    <Modal wide title={isNew ? (r.record ? 'Карточка звонка' : 'Новая заявка') : 'Редактировать заявку'} onClose={onClose} footer={<>
      <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
      <button className="btn btn-primary" disabled={f.phone.length < 8 || !f.contact} onClick={() => onSave(f)}>Сохранить</button>
    </>}>
      {f.record && <CallRecord duration={f.record.duration} at={f.record.at} />}
      <CriticalDebt clientId={f.companyId} />
      <div className="row">
        <Seg value={f.dir} onChange={(v) => set({ dir: v, companyId: undefined, companyName: '' })} items={[{ id: 'in', label: 'У нас арендуют' }, { id: 'out', label: 'Мы арендуем' }]} />
        <Seg value={f.source} onChange={(v) => set({ source: v, eqId: undefined })} items={[{ id: 'own', label: 'Наша техника' }, { id: 'attracted', label: 'Привлечённая' }]} />
      </div>
      <div className="grid g3">
        <Field label="Телефон" required><input className="input mono" value={f.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
        <Field label="ФИО контакта" required><input className="input" value={f.contact} onChange={(e) => set({ contact: e.target.value })} /></Field>
        <Field label="Компания из базы"><select className="select" value={f.companyId ?? ''} onChange={(e) => { const c = company(e.target.value); set({ companyId: c?.id, companyName: c?.name ?? f.companyName, contact: f.contact || c?.representative || '' }) }}>
          <option value="">— новый контакт —</option>{pool.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        {!f.companyId && <Field label="Название компании"><input className="input" value={f.companyName} onChange={(e) => set({ companyName: e.target.value })} placeholder="ООО «…» или ФИО физлица" /></Field>}
        <Field label="Категория техники"><select className="select" value={f.category} onChange={(e) => set({ category: e.target.value as EquipmentCategory, eqId: undefined })}>{Object.entries(categoryOne).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Единица техники"><select className="select" value={f.eqId ?? ''} onChange={(e) => set({ eqId: e.target.value || undefined })}><option value="">— подобрать позже —</option>{eqPool.map((e) => <option key={e.id} value={e.id}>{e.title} · {e.plate}</option>)}</select></Field>
        {f.dir === 'in' && <Field label="Объект"><select className="select" value={f.siteId ?? ''} onChange={(e) => { const s = sites.find((x) => x.id === e.target.value); set({ siteId: s?.id, address: s?.address ?? f.address }) }}><option value="">— новый адрес —</option>{sites.filter((s) => s.status === 'Текущий').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>}
        <Field label="Адрес"><input className="input" value={f.address} onChange={(e) => set({ address: e.target.value })} /></Field>
        <Field label="Дата начала"><input className="input" type="date" value={f.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} /></Field>
        <Field label="Часов"><input className="input" type="number" value={f.hours} onChange={(e) => set({ hours: Number(e.target.value) })} /></Field>
        <Field label="Сумма, BYN"><input className="input" type="number" value={f.price} onChange={(e) => set({ price: Number(e.target.value) })} /></Field>
        <Field label="Менеджер"><select className="select" value={f.managerId} onChange={(e) => set({ managerId: e.target.value })}>{managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        <Field label="Статус"><select className="select" value={f.status} onChange={(e) => set({ status: e.target.value as CallStatus })}>{statuses.map((s) => <option key={s}>{s}</option>)}</select></Field>
      </div>
      <Field label="Комментарий"><textarea className="textarea" value={f.comment} onChange={(e) => set({ comment: e.target.value })} placeholder="Что нужно клиенту, условия, договорённости" /></Field>
    </Modal>
  )
}
