import { useState } from 'react'
import { ArrowDownUp, ArrowLeft, Building2, CheckCircle2, FileText, Gauge, Handshake, Pencil, Plus, Scale, ShieldCheck, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { CrmPageProps, CrmRole } from './types'
import { isAdmin } from './types'
import { DataTable, Field, KV, Modal, PageHead, Progress, SearchInput, Stat, StatusBadge, Tabs, date, dateShort, money, uid, useList, useToast, type Col } from '../../ui'
import { companies, drivers, emp, eq, equipment, managers, orders, site, sites } from '../../data/mock'
import type { Company, Order, OrderStatus } from '../../data/types'
import { clientManagers, type ClientManager } from '../../data/crm-a'
import { AdminActions, CriticalDebt } from './Equipment'
import './crm-a.css'

type OTab = 'new' | 'mod' | 'work' | 'done' | 'cancel'
const tabStatus: Record<OTab, OrderStatus[]> = { new: ['Новая'], mod: ['На модерации'], work: ['В работе', 'Ожидает оплаты'], done: ['Выполнена'], cancel: ['Отменена'] }
const allStatuses: OrderStatus[] = ['Новая', 'На модерации', 'Ожидает оплаты', 'В работе', 'Выполнена', 'Отменена']
const docKinds = ['Договор', 'Заявка-спецификация', 'Счёт', 'Акт', 'Путевой лист', 'Протокол разногласий']
const profHolidays = ['', 'День строителя — 9 августа', 'День работников дорожного хозяйства — 3-е воскресенье октября', 'День энергетика — 22 декабря', 'День работников нефтяной и газовой промышленности — 1-е воскресенье сентября', 'День работников жилищно-коммунального хозяйства — 4-е воскресенье марта', 'День работников транспорта — 1-е воскресенье ноября']
const short = (n?: string) => (n ? n.split(' ').slice(0, 2).join(' ') : '—')

export default function Tenants({ role }: CrmPageProps) {
  const toast = useToast()
  const nav = useNavigate()
  const cos = useList<Company>(companies.filter((c) => c.kind === 'tenant'))
  const ords = useList<Order>(orders)
  const mgrs = useList<ClientManager>(clientManagers)
  const [blocked, setBlocked] = useState<string[]>([])
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string | null>(null)
  const [coForm, setCoForm] = useState<Company | null>(null)
  const [tab, setTab] = useState<'orders' | 'managers' | 'req'>('orders')
  const [otab, setOtab] = useState<OTab>('new')
  const [fPeriod, setFPeriod] = useState(''), [fSite, setFSite] = useState(''), [fMgr, setFMgr] = useState(''), [fDrv, setFDrv] = useState('')
  const [asc, setAsc] = useState(false)
  const [oForm, setOForm] = useState<Order | null>(null)
  const [mForm, setMForm] = useState<ClientManager | null>(null)
  const [conflict, setConflict] = useState(false)

  const co = cos.rows.find((c) => c.id === sel)
  const coOrders = (id: string) => ords.rows.filter((o) => o.clientId === id)

  /* -------- список юрлиц -------- */
  if (!co) {
    const rows = cos.rows.filter((c) => !q || `${c.name} ${c.unp} ${c.representative}`.toLowerCase().includes(q.toLowerCase()))
    const cols: Col<Company>[] = [
      { key: 'n', title: 'Юрлицо', render: (c) => <div><b>{c.name}</b><div className="muted" style={{ fontSize: 12 }}>{c.type} · {c.legalAddress}</div></div> },
      { key: 'u', title: 'УНП', hideMobile: true, render: (c) => <span className="mono">{c.unp}</span> },
      { key: 'm', title: 'Менеджеры', hideMobile: true, align: 'r', render: (c) => mgrs.rows.filter((m) => m.companyId === c.id).length },
      { key: 'o', title: 'Заявки', align: 'r', render: (c) => <span className="tnum">{coOrders(c.id).filter((o) => o.status !== 'Отменена' && o.status !== 'Выполнена').length} / {coOrders(c.id).length}</span> },
      { key: 'k', title: 'Договор', hideMobile: true, render: (c) => c.hasContract ? <StatusBadge status="Подписан" /> : <span className="badge badge-warn">Нет договора</span> },
      { key: 'd', title: 'Долг', align: 'r', render: (c) => blocked.includes(c.id) ? <StatusBadge status="Заблокирован" /> : c.critical ? <span className="badge badge-bad">Критический · {money(c.debt)}</span> : c.debt ? <span className="tnum" style={{ color: 'var(--warn)' }}>{money(c.debt)}</span> : <span className="muted">—</span> },
    ]
    const debt = cos.rows.reduce((a, c) => a + c.debt, 0)
    return (
      <div className="stack">
        <PageHead title="Арендаторы" sub="Юрлица и физлица-клиенты, их менеджеры и заявки на аренду"
          actions={<button className="btn btn-primary" onClick={() => setCoForm({ ...companies[0], id: uid('c'), name: '', unp: '', legalAddress: '', director: '', representative: '', phone: '+375 ', email: '', bank: '', hasContract: false, debt: 0, critical: false, rating: 5, activeNote: undefined, site: '', socials: '' })}><Plus />Добавить юрлицо</button>} />
        <div className="ca-stats">
          <Stat icon={<Building2 />} label="Клиентов" value={cos.rows.length} delta={`${cos.rows.filter((c) => c.hasContract).length} с договором`} />
          <Stat icon={<Handshake />} label="Активные заявки" value={ords.rows.filter((o) => ['Новая', 'На модерации', 'В работе', 'Ожидает оплаты'].includes(o.status)).length} />
          <Stat label="Дебиторка" value={money(debt)} delta={`${cos.rows.filter((c) => c.debt > 0).length} должника`} trend="down" />
          <Stat label="Критический долг" value={cos.rows.filter((c) => c.critical).length} delta="назначения заблокированы" trend="down" />
        </div>
        {cos.rows.filter((c) => c.critical).map((c) => <div key={c.id} onClick={() => setSel(c.id)} style={{ cursor: 'pointer' }}><CriticalDebt clientId={c.id} /></div>)}
        <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Название, УНП, контактное лицо" /></div>
        <DataTable cols={cols} rows={rows} rowKey={(c) => c.id} onRow={(c) => { setSel(c.id); setTab('orders') }} />
        {coForm && <CompanyForm c={coForm} isNew onClose={() => setCoForm(null)} onSave={(c) => { cos.add(c); setCoForm(null); toast('Юрлицо добавлено') }} />}
      </div>
    )
  }

  /* -------- карточка юрлица -------- */
  const all = coOrders(co.id)
  const inTab = (t: OTab) => all.filter((o) => tabStatus[t].includes(o.status))
  const period = (o: Order) => !fPeriod || (fPeriod === 'today' ? o.date === '2026-10-13' : fPeriod === 'week' ? o.date >= '2026-10-07' && o.date <= '2026-10-20' : fPeriod === 'past' ? o.date < '2026-10-13' : o.date > '2026-10-13')
  const oRows = inTab(otab).filter((o) => period(o) && (!fSite || o.siteId === fSite) && (!fMgr || o.managerId === fMgr) && (!fDrv || o.driverId === fDrv))
    .sort((a, b) => (asc ? 1 : -1) * (a.date + a.start).localeCompare(b.date + b.start))
  const cMgrs = mgrs.rows.filter((m) => m.companyId === co.id)
  const coSites = sites.filter((s) => s.clientId === co.id)
  const busy = all.filter((o) => o.status === 'В работе').reduce((a, o) => a + o.hours, 0)
  const newOrder = (): Order => ({ id: uid('o'), number: `А-${2700 + ords.rows.length}`, date: '2026-10-15', start: '08:00', hours: 8, equipmentId: equipment[0].id, clientId: co.id, siteId: coSites[0]?.id ?? sites[0].id, managerId: 'e1', driverId: drivers[0].id, status: 'Новая', pay: 'Долг', cost: 760, paid: 0, delivery: 70, docs: ['Договор'], comment: '' })

  const oCols: Col<Order>[] = [
    { key: 'd', title: 'Дата аренды', nowrap: true, render: (o) => <div><b className="tnum">{dateShort(o.date)}</b><div className="muted mono" style={{ fontSize: 12 }}>{o.number}</div></div> },
    { key: 'e', title: 'Техника', render: (o) => eq(o.equipmentId)?.title },
    { key: 'm', title: 'Менеджер', hideMobile: true, render: (o) => short(emp(o.managerId)?.name) },
    { key: 'dr', title: 'Водитель', hideMobile: true, render: (o) => short(emp(o.driverId)?.name) },
    { key: 's', title: 'Статус', render: (o) => <StatusBadge status={o.status} /> },
    { key: 't', title: 'Время', hideMobile: true, nowrap: true, render: (o) => <span className="tnum">{o.start} · {o.hours} ч</span> },
    { key: 'site', title: 'Объект', hideMobile: true, render: (o) => site(o.siteId)?.name },
    { key: 'c', title: 'Стоимость', align: 'r', nowrap: true, render: (o) => <div><span className="tnum">{money(o.cost)}</span><div><StatusBadge status={o.pay} /></div></div> },
    { key: 'doc', title: 'Документы', hideMobile: true, render: (o) => <span className="row" style={{ gap: 4 }}><FileText size={14} className="muted" /><span className="tnum">{o.docs.length}</span></span> },
    { key: 'cm', title: 'Комментарий', hideMobile: true, render: (o) => <span className="muted" style={{ fontSize: 13 }}>{o.comment || '—'}</span> },
  ]

  return (
    <div className="stack">
      <div><button className="btn btn-ghost btn-sm" onClick={() => setSel(null)}><ArrowLeft />Все арендаторы</button></div>
      <PageHead title={co.name} sub={<span>УНП <span className="mono">{co.unp}</span> · {co.type} · {co.legalAddress}</span>}
        actions={<><button className="btn btn-secondary" onClick={() => setCoForm(co)}><Pencil />Изменить</button><button className="btn btn-primary" onClick={() => setOForm(newOrder())}><Plus />Новая заявка</button></>} />
      <CriticalDebt clientId={co.id} />
      {!co.critical && co.debt > 0 && <div className="alert alert-warn"><Scale /><div>Задолженность {money(co.debt)} — напомните клиенту об оплате.</div></div>}
      {blocked.includes(co.id) && <div className="alert alert-bad">Клиент заблокирован администратором: новые заявки не принимаются.</div>}

      <div className="ca-stats">
        <Stat label="Заявок всего" value={all.length} delta={`${inTab('work').length} в работе`} />
        <Stat label="Оборот" value={money(all.filter((o) => o.status !== 'Отменена').reduce((a, o) => a + o.cost, 0))} />
        <Stat label="Оплачено" value={money(all.reduce((a, o) => a + o.paid, 0))} trend="up" />
        <Stat label="Рейтинг клиента" value={`${co.rating} ★`} delta={co.hasContract ? 'договор подписан' : 'договор не заключён'} />
      </div>

      <div className="card">
        <div className="card-head"><h3>Действия менеджера</h3><span className="muted" style={{ fontSize: 13 }}>Загрузка по клиенту: {busy} ч в работе</span></div>
        <div className="ca-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => nav(`/crm/${role}/landlords`)}><ShieldCheck />Модерация техники</button>
          <button className="btn btn-secondary btn-sm" onClick={() => toast('Условия подтверждены · клиенту отправлено уведомление')}><CheckCircle2 />Подтвердить условия</button>
          <button className="btn btn-secondary btn-sm" onClick={() => toast(`Загрузка техники клиента: ${Math.min(100, Math.round(busy / 0.8))}% от плана`)}><Gauge />Контроль загрузки</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setConflict(true)}><Scale />Конфликтная ситуация</button>
        </div>
        <div style={{ marginTop: 12 }}><Progress value={Math.min(100, Math.round(busy / 0.8))} /></div>
      </div>

      <Tabs value={tab} onChange={setTab} items={[{ id: 'orders', label: 'Заявки', count: all.length }, { id: 'managers', label: 'Менеджеры', count: cMgrs.length }, { id: 'req', label: 'Реквизиты' }]} />

      {tab === 'orders' && <>
        <Tabs value={otab} onChange={setOtab} items={[
          { id: 'new', label: 'Новые', count: inTab('new').length }, { id: 'mod', label: 'На модерации', count: inTab('mod').length },
          { id: 'work', label: 'В работе', count: inTab('work').length },
          { id: 'done', label: 'Выполненные', count: inTab('done').length }, { id: 'cancel', label: 'Отменённые', count: inTab('cancel').length },
        ]} />
        <div className="ca-filters">
          <select className="select" value={fPeriod} onChange={(e) => setFPeriod(e.target.value)} aria-label="Срок"><option value="">Любой срок</option><option value="today">Сегодня</option><option value="week">± неделя</option><option value="past">Прошедшие</option><option value="future">Будущие</option></select>
          <select className="select" value={fSite} onChange={(e) => setFSite(e.target.value)} aria-label="Объект"><option value="">Все объекты</option>{coSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <select className="select" value={fMgr} onChange={(e) => setFMgr(e.target.value)} aria-label="Менеджер"><option value="">Все менеджеры</option>{managers.map((m) => <option key={m.id} value={m.id}>{short(m.name)}</option>)}</select>
          <select className="select" value={fDrv} onChange={(e) => setFDrv(e.target.value)} aria-label="Водитель"><option value="">Все водители</option>{drivers.map((d) => <option key={d.id} value={d.id}>{short(d.name)}</option>)}</select>
          <button className="btn btn-secondary" style={{ height: 38 }} onClick={() => setAsc(!asc)}><ArrowDownUp />Дата: {asc ? 'сначала старые' : 'сначала новые'}</button>
        </div>
        <DataTable cols={oCols} rows={oRows} rowKey={(o) => o.id} onRow={(o) => setOForm(o)} empty="Заявок с такими параметрами нет" />
      </>}

      {tab === 'managers' && <>
        <div className="row-between"><span className="muted" style={{ fontSize: 14 }}>Контактные лица клиента. Профкалендарь — повод для поздравления или визита.</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setMForm({ id: uid('cm'), companyId: co.id, name: '', position: '', phone1: '+375 ', requisites: `УНП ${co.unp}`, charter: '', poa: '' })}><Plus />Добавить менеджера</button></div>
        <DataTable rowKey={(m) => m.id} rows={cMgrs} onRow={(m) => setMForm(m)} empty="Менеджеры не добавлены" cols={[
          { key: 'n', title: 'ФИО', render: (m) => <div><b>{m.name}</b><div className="muted" style={{ fontSize: 12 }}>{m.position}</div></div> },
          { key: 'p', title: 'Телефоны', nowrap: true, render: (m) => <div className="mono" style={{ fontSize: 13 }}>{m.phone1}{m.phone2 && <div className="muted">{m.phone2}</div>}</div> },
          { key: 'e', title: 'E-mail', hideMobile: true, render: (m) => m.email || <span className="muted">—</span> },
          { key: 'd', title: 'Устав / доверенность', hideMobile: true, render: (m) => <div className="row" style={{ gap: 4 }}>{m.charter ? <span className="badge badge-ok plain">Устав</span> : <span className="badge badge-bad plain">Нет устава</span>}{m.poa && m.poa !== '—' ? <span className="badge badge-ok plain">Доверенность</span> : <span className="badge badge-muted plain">Без доверенности</span>}</div> },
          { key: 'c', title: 'Профкалендарь', hideMobile: true, render: (m) => <span style={{ fontSize: 13 }}>{m.profCalendar || '—'}</span> },
          { key: 'b', title: 'ДР', hideMobile: true, render: (m) => m.birthday ? <span className="tnum">{dateShort(m.birthday)}</span> : '—' },
        ]} />
      </>}

      {tab === 'req' && (
        <div className="card">
          <KV items={[
            ['Наименование', co.name], ['Тип', co.type], ['УНП', <span className="mono">{co.unp}</span>], ['Юридический адрес', co.legalAddress],
            ['Руководитель', co.director], ['Представитель', co.representative], ['Телефон', <span className="mono">{co.phone}</span>], ['E-mail', co.email],
            ['Сайт / соцсети', [co.site, co.socials].filter(Boolean).join(' · ') || '—'], ['Банковские реквизиты', <span className="mono">{co.bank}</span>],
            ['Договор', co.hasContract ? 'Подписан (ЭДО)' : 'Не заключён'],
          ]} />
        </div>
      )}

      <AdminActions role={role} what={co.name} onCancel={() => setBlocked(blocked.filter((x) => x !== co.id))} onArchive={() => { cos.remove(co.id); setSel(null) }} onBlock={() => setBlocked([...blocked, co.id])} />

      {coForm && <CompanyForm c={coForm} isNew={false} onClose={() => setCoForm(null)} onSave={(c) => { cos.update(c); setCoForm(null); toast('Карточка юрлица сохранена') }} />}
      {oForm && <OrderForm role={role} o={oForm} isNew={!ords.rows.some((x) => x.id === oForm.id)} onClose={() => setOForm(null)}
        onSave={(o) => { if (ords.rows.some((x) => x.id === o.id)) ords.update(o); else ords.add(o); setOForm(null); toast('Заявка сохранена') }}
        onDelete={() => { ords.remove(oForm.id); setOForm(null); toast('Заявка удалена') }} />}
      {mForm && <ManagerForm m={mForm} isNew={!mgrs.rows.some((x) => x.id === mForm.id)} onClose={() => setMForm(null)}
        onSave={(m) => { if (mgrs.rows.some((x) => x.id === m.id)) mgrs.update(m); else mgrs.add(m); setMForm(null); toast('Менеджер клиента сохранён') }}
        onDelete={() => { mgrs.remove(mForm.id); setMForm(null); toast('Менеджер удалён') }} />}
      {conflict && <ConflictModal client={co.name} onClose={() => setConflict(false)} />}
    </div>
  )
}

function ConflictModal({ client, onClose }: { client: string; onClose: () => void }) {
  const toast = useToast()
  const [text, setText] = useState('')
  const [res, setRes] = useState('Скидка / перерасчёт')
  return (
    <Modal title={`Конфликт: ${client}`} onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Отмена</button><button className="btn btn-primary" disabled={!text} onClick={() => { toast('Конфликт зафиксирован, решение отправлено клиенту'); onClose() }}>Зафиксировать решение</button></>}>
      <Field label="Суть претензии" required><textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Опоздание техники, спор по часам, повреждение…" /></Field>
      <Field label="Решение"><select className="select" value={res} onChange={(e) => setRes(e.target.value)}>{['Скидка / перерасчёт', 'Замена водителя', 'Замена техники', 'Претензия отклонена', 'Передать руководству'].map((x) => <option key={x}>{x}</option>)}</select></Field>
    </Modal>
  )
}

export function CompanyForm({ c, isNew, onClose, onSave }: { c: Company; isNew: boolean; onClose: () => void; onSave: (c: Company) => void }) {
  const [f, setF] = useState(c)
  const set = (p: Partial<Company>) => setF((s) => ({ ...s, ...p }))
  return (
    <Modal wide title={isNew ? 'Новое юрлицо' : `Карточка: ${c.name}`} onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Отмена</button><button className="btn btn-primary" disabled={!f.name || (f.type === 'Компания' && !/^\d{9}$/.test(f.unp))} onClick={() => onSave(f)}>Сохранить</button></>}>
      <div className="seg">{(['Компания', 'Физлицо'] as const).map((t) => <button key={t} type="button" className={f.type === t ? 'on' : ''} onClick={() => set({ type: t })}>{t}</button>)}</div>
      <div className="grid g2">
        <Field label="УНП" required={f.type === 'Компания'} hint="9 цифр"><input className="input mono" value={f.unp} maxLength={9} onChange={(e) => set({ unp: e.target.value.replace(/\D/g, '') })} /></Field>
        <Field label="Название" required><input className="input" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="ООО «…»" /></Field>
        <Field label="Юридический адрес"><input className="input" value={f.legalAddress} onChange={(e) => set({ legalAddress: e.target.value })} /></Field>
        <Field label="Руководитель"><input className="input" value={f.director} onChange={(e) => set({ director: e.target.value })} /></Field>
        <Field label="Представитель"><input className="input" value={f.representative} onChange={(e) => set({ representative: e.target.value })} /></Field>
        <Field label="Телефон"><input className="input" value={f.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
        <Field label="E-mail"><input className="input" value={f.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        <Field label="Сайт / соцсети"><input className="input" value={f.site ?? ''} onChange={(e) => set({ site: e.target.value })} /></Field>
      </div>
      <Field label="Реквизиты (р/с, банк, БИК)"><textarea className="textarea" style={{ minHeight: 70 }} value={f.bank} onChange={(e) => set({ bank: e.target.value })} placeholder="BY00 XXXX 3012 0000 0000 0000 · Банк · БИК" /></Field>
      <label className="check"><input type="checkbox" checked={f.hasContract} onChange={(e) => set({ hasContract: e.target.checked })} />Договор подписан</label>
    </Modal>
  )
}

function ManagerForm({ m, isNew, onClose, onSave, onDelete }: { m: ClientManager; isNew: boolean; onClose: () => void; onSave: (m: ClientManager) => void; onDelete: () => void }) {
  const [f, setF] = useState(m)
  const set = (p: Partial<ClientManager>) => setF((s) => ({ ...s, ...p }))
  const ok = f.name && f.position && f.phone1.length > 6 && f.requisites && f.charter && f.poa
  return (
    <Modal wide title={isNew ? 'Новый менеджер клиента' : f.name} onClose={onClose} footer={<>
      {!isNew && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={onDelete}><Trash2 />Удалить</button>}
      <button className="btn btn-ghost" onClick={onClose}>Отмена</button><button className="btn btn-primary" disabled={!ok} onClick={() => onSave(f)}>Сохранить</button>
    </>}>
      <div className="ca-sec">Обязательные</div>
      <div className="grid g2">
        <Field label="ФИО" required><input className="input" value={f.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Должность" required><input className="input" value={f.position} onChange={(e) => set({ position: e.target.value })} /></Field>
        <Field label="Телефон 1" required><input className="input" value={f.phone1} onChange={(e) => set({ phone1: e.target.value })} /></Field>
        <Field label="Привязка к юрлицу" required><select className="select" value={f.companyId} onChange={(e) => set({ companyId: e.target.value })}>{companies.filter((c) => c.kind === 'tenant').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Реквизиты" required><input className="input" value={f.requisites} onChange={(e) => set({ requisites: e.target.value })} /></Field>
        <Field label="Устав организации" required hint="PDF, скан"><div className="row" style={{ flexWrap: 'nowrap' }}><input className="input" value={f.charter} onChange={(e) => set({ charter: e.target.value })} placeholder="Файл не загружен" /><button type="button" className="btn btn-secondary" onClick={() => set({ charter: 'Устав_организации.pdf' })}>Загрузить</button></div></Field>
        <Field label="Доверенность" required hint="Укажите «—», если действует по уставу"><div className="row" style={{ flexWrap: 'nowrap' }}><input className="input" value={f.poa} onChange={(e) => set({ poa: e.target.value })} placeholder="№, дата" /><button type="button" className="btn btn-secondary" onClick={() => set({ poa: 'Доверенность №1 от 13.10.2026.pdf' })}>Загрузить</button></div></Field>
      </div>
      <div className="ca-sec">Важные</div>
      <div className="grid g2">
        <Field label="Телефон 2 (личный / мессенджер)"><input className="input" value={f.phone2 ?? ''} onChange={(e) => set({ phone2: e.target.value })} /></Field>
        <Field label="E-mail"><input className="input" value={f.email ?? ''} onChange={(e) => set({ email: e.target.value })} /></Field>
      </div>
      <Field label="Профессиональный календарь" hint="Отраслевой праздник — повод для корпоративного подарка или визита"><select className="select" value={f.profCalendar ?? ''} onChange={(e) => set({ profCalendar: e.target.value })}>{profHolidays.map((h) => <option key={h} value={h}>{h || '— не выбран —'}</option>)}</select></Field>
      <div className="ca-sec">Необязательные</div>
      <div className="grid g2">
        <Field label="День рождения"><input className="input" type="date" value={f.birthday ?? ''} onChange={(e) => set({ birthday: e.target.value })} /></Field>
        <Field label="Соцсети"><input className="input" value={f.socials ?? ''} onChange={(e) => set({ socials: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}

export function OrderForm({ role, o, isNew, onClose, onSave, onDelete }: { role: CrmRole; o: Order; isNew: boolean; onClose: () => void; onSave: (o: Order) => void; onDelete: () => void }) {
  const toast = useToast()
  const [f, setF] = useState(o)
  const [fin, setFin] = useState(false)
  const set = (p: Partial<Order>) => setF((s) => ({ ...s, ...p }))
  const client = companies.find((c) => c.id === f.clientId)
  const needFin = !!client?.critical && (f.status === 'В работе' || (f.status === 'Новая' && isNew)) && !fin
  const e = eq(f.equipmentId)
  const recalc = (p: Partial<Order>) => { const n = { ...f, ...p }; const x = eq(n.equipmentId); set({ ...p, cost: x ? x.pricePerHour * n.hours + n.delivery : n.cost }) }
  return (
    <Modal wide title={isNew ? 'Новая заявка на аренду' : `Заявка ${o.number}`} onClose={onClose} footer={<>
      {!isNew && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={onDelete}><Trash2 />Удалить</button>}
      <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
      <button className="btn btn-primary" disabled={needFin} onClick={() => onSave(f)}>Сохранить</button>
    </>}>
      {client?.critical && <div className="stack-sm"><CriticalDebt clientId={client.id} />
        {!fin ? <div className="row"><button className="btn btn-dark btn-sm" onClick={() => toast('Запрос отправлен финансовому директору')}>Запросить подтверждение</button><button className="btn btn-ghost btn-sm" onClick={() => setFin(true)}>{isAdmin(role) ? 'Снять блокировку (админ)' : 'Демо: фин. директор подтвердил'}</button></div>
          : <div className="alert alert-ok">Назначение подтверждено финансовым директором</div>}
      </div>}
      <div className="grid g3">
        <Field label="Дата аренды" required><input className="input" type="date" value={f.date} onChange={(ev) => set({ date: ev.target.value })} /></Field>
        <Field label="Начало"><input className="input" type="time" value={f.start} onChange={(ev) => set({ start: ev.target.value })} /></Field>
        <Field label="Время аренды, ч" required><input className="input" type="number" min={1} value={f.hours} onChange={(ev) => recalc({ hours: Number(ev.target.value) })} /></Field>
        <Field label="Техника" required><select className="select" value={f.equipmentId} onChange={(ev) => recalc({ equipmentId: ev.target.value, driverId: eq(ev.target.value)?.driverId ?? f.driverId })}>{equipment.map((x) => <option key={x.id} value={x.id}>{x.title} · {x.plate}</option>)}</select></Field>
        <Field label="Водитель"><select className="select" value={f.driverId} onChange={(ev) => set({ driverId: ev.target.value })}>{drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
        <Field label="Менеджер"><select className="select" value={f.managerId} onChange={(ev) => set({ managerId: ev.target.value })}>{managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        <Field label="Объект" required><select className="select" value={f.siteId} onChange={(ev) => set({ siteId: ev.target.value })}>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Статус заявки"><select className="select" value={f.status} onChange={(ev) => set({ status: ev.target.value as OrderStatus })}>{allStatuses.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Оплата"><select className="select" value={f.pay} onChange={(ev) => set({ pay: ev.target.value as Order['pay'] })}>{(['Оплачено', 'Частично', 'Долг'] as const).map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Доставка, BYN"><input className="input" type="number" value={f.delivery} onChange={(ev) => recalc({ delivery: Number(ev.target.value) })} /></Field>
        <Field label="Стоимость, BYN" hint={e ? `${e.pricePerHour} BYN/ч × ${f.hours} ч + доставка` : ''}><input className="input" type="number" value={f.cost} onChange={(ev) => set({ cost: Number(ev.target.value) })} /></Field>
      </div>
      <Field label="Документы">
        <div className="ca-chips">
          {f.docs.map((d) => <span key={d} className="ca-chip"><FileText size={13} />{d}<button type="button" className="btn btn-ghost btn-icon btn-sm" style={{ width: 20, height: 20 }} aria-label="Убрать" onClick={() => set({ docs: f.docs.filter((x) => x !== d) })}><X size={12} /></button></span>)}
          <select className="select" style={{ width: 'auto', height: 30, fontSize: 13 }} value="" onChange={(ev) => ev.target.value && set({ docs: [...f.docs, ev.target.value] })} aria-label="Добавить документ">
            <option value="">+ Добавить документ</option>{docKinds.filter((d) => !f.docs.includes(d)).map((d) => <option key={d}>{d}</option>)}</select>
        </div>
      </Field>
      <Field label="Комментарии"><textarea className="textarea" value={f.comment} onChange={(ev) => set({ comment: ev.target.value })} /></Field>
      {!isNew && <AdminActions role={role} what={`Заявка ${o.number}`} onCancel={() => set({ status: 'Отменена' })} onArchive={() => set({ status: 'Выполнена' })} onBlock={() => set({ status: 'На модерации' })} />}
    </Modal>
  )
}
