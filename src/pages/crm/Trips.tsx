import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarClock, FileText, MapPin, Plus, Repeat, ShieldAlert, Star, Truck, UserCheck, Wrench } from 'lucide-react'
import {
  Badge, DataTable, Drawer, Field, KV, Modal, PageHead, SearchInput, Seg, Stat, StatusBadge, Tabs,
  date, dateShort, money, num, uid, useList, useToast, type Col,
} from '../../ui'
import { categoryOne, workMode } from '../../data/types'
import { emp, eq, equipment, site, sites, TODAY } from '../../data/mock'
import { activeDrivers, isWeekend, modeMeta, trips as seed, tripEnd, type Attendance, type Trip, type TripMode, type TripStatus } from '../../data/crm-b'
import { isAdmin, type CrmPageProps } from './types'
import { AdminActions, Person, Section, shortName } from './crm-b-ui'

type TabId = TripStatus | 'Архив'
const statusTabs: TripStatus[] = ['Новая', 'Начатая', 'Завершённая', 'Отклонённая']
const tabLabel: Record<TabId, string> = { 'Новая': 'Новые', 'Начатая': 'Начатые', 'Завершённая': 'Завершённые', 'Отклонённая': 'Отклонённые', 'Архив': 'Архив' }
const attTone: Record<Attendance, 'ok' | 'warn' | 'bad' | 'info' | 'muted'> = { 'Вышел': 'ok', 'Опоздал': 'warn', 'Не вышел': 'bad', 'Замена': 'warn', 'Ожидается': 'muted' }
const modeOne: Record<TripMode, string> = { 'смена': 'Смена', 'рейс': 'Рейс', 'вахта': 'Вахта' }
const docOptions = ['Путевой лист', 'Табель', 'Акт', 'Наряд-допуск', 'Табель вахты', 'ТТН']

const duration = (t: Trip) => (t.mode === 'вахта' ? `${t.days} дн. · ${t.hours} ч` : `${t.hours} ч${t.runs ? ` · ${t.runs} ходк.` : ''}`)

export default function Trips({ role }: CrmPageProps) {
  const toast = useToast()
  const list = useList<Trip>(seed)
  const [mode, setMode] = useState<TripMode>('смена')
  const [tab, setTab] = useState<TabId>('Начатая')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [drv, setDrv] = useState('')
  const [st, setSt] = useState('')
  const [onlyWeekend, setOnlyWeekend] = useState(false)
  const [onlyViol, setOnlyViol] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [form, setForm] = useState<Trip | null>(null)

  const inMode = list.rows.filter((t) => t.mode === mode)
  const visible = inMode.filter((t) => (tab === 'Архив' ? t.archived : !t.archived && t.status === tab))
  const rows = visible.filter((t) => {
    const e = eq(t.equipmentId)!
    const s = site(t.siteId)
    const hay = `${t.number} ${e.title} ${e.plate} ${emp(t.driverId)?.name} ${s?.name} ${s?.address} ${t.note}`.toLowerCase()
    return (!q || hay.includes(q.toLowerCase())) && (!cat || e.category === cat) && (!drv || t.driverId === drv) && (!st || t.siteId === st)
      && (!onlyWeekend || t.weekend) && (!onlyViol || t.violations.length > 0)
  })
  const cats = [...new Set(equipment.filter((e) => workMode[e.category] === mode).map((e) => e.category))]

  const today = list.rows.filter((t) => !t.archived && (t.date === TODAY || (t.status === 'Начатая')))
  const stats = {
    active: list.rows.filter((t) => t.status === 'Начатая' && !t.archived).length,
    noShow: list.rows.filter((t) => ['Не вышел', 'Замена'].includes(t.attendance) && t.status !== 'Отклонённая').length,
    viol: list.rows.reduce((a, t) => a + t.violations.length, 0),
    sum: today.reduce((a, t) => a + (t.status === 'Начатая' ? t.cost : 0), 0),
  }

  const cur = list.rows.find((t) => t.id === openId) ?? null
  const patch = (t: Trip, p: Partial<Trip>, msg?: string) => { list.update({ ...t, ...p }); if (msg) toast(msg) }

  const cols: Col<Trip>[] = [
    { key: 'n', title: '№', nowrap: true, render: (t) => <div><div className="mono cb-cell-main">{t.number}</div>{t.blocked && <Badge tone="bad">Заблокирована</Badge>}</div> },
    { key: 'd', title: 'Дата и время', nowrap: true, render: (t) => (
      <div><div className="cb-cell-main tnum">{dateShort(t.date)}{t.weekend && <span style={{ marginLeft: 6 }}><Badge tone="warn" plain>вых.</Badge></span>}</div>
        <div className="cb-cell-sub tnum">{t.mode === 'вахта' ? `с ${t.start}, ${t.days} дн.` : `${t.start}–${t.end}`}</div></div>
    ) },
    { key: 'e', title: 'Техника', render: (t) => { const e = eq(t.equipmentId)!; return <div><div className="cb-cell-main">{e.title}</div><div className="cb-cell-sub">{categoryOne[e.category]} · <span className="mono">{e.plate}</span>{e.own ? '' : ' · привлечённая'}</div></div> } },
    { key: 'dr', title: 'Водитель', render: (t) => <div><div style={{ whiteSpace: 'nowrap' }}>{shortName(emp(t.driverId)?.name ?? '—')}</div><Badge tone={attTone[t.attendance]}>{t.attendance}</Badge></div> },
    { key: 's', title: 'Объект', hideMobile: true, render: (t) => { const s = site(t.siteId); return <div><div className="cb-cell-main">{s?.name}</div><div className="cb-cell-sub">{s?.address}</div></div> } },
    { key: 'h', title: 'Длительность', nowrap: true, hideMobile: true, render: (t) => <span className="tnum">{duration(t)}</span> },
    { key: 'c', title: 'Стоимость', align: 'r', nowrap: true, render: (t) => <b className="tnum">{money(t.cost)}</b> },
    { key: 'to', title: 'ТО', hideMobile: true, render: (t) => (t.to ? <Badge tone="warn">ТО</Badge> : <span className="muted">нет</span>) },
    { key: 'v', title: 'Нарушения', hideMobile: true, render: (t) => (t.violations.length ? <Badge tone="bad">{t.violations.length}</Badge> : <span className="muted">—</span>) },
    { key: 'st', title: 'Статус', render: (t) => <StatusBadge status={t.status} /> },
  ]

  const newTrip = (): Trip => {
    const e = equipment.find((x) => workMode[x.category] === mode && x.status !== 'В ремонте')!
    return { id: uid('t'), number: `${mode === 'смена' ? 'СМ' : mode === 'рейс' ? 'РС' : 'ВХ'}-${1200 + list.rows.length}`, mode, date: '2026-10-14', start: '08:00', end: '16:00', days: mode === 'вахта' ? 15 : undefined, hours: mode === 'вахта' ? 150 : 8, weekend: false, equipmentId: e.id, driverId: e.driverId ?? activeDrivers[0].id, siteId: sites[0].id, cost: e.pricePerHour * (mode === 'вахта' ? 150 : 8), to: false, docs: [], note: '', status: 'Новая', attendance: 'Ожидается', violations: [], motivation: 0, runs: mode === 'рейс' ? 3 : undefined }
  }

  return (
    <div className="cb-page">
      <PageHead title="Рейсы и смены" sub="Учёт работы техники по типу: смены, рейсы и вахты. Контроль явки, замены водителей и нарушений."
        actions={<button className="btn btn-primary" onClick={() => setForm(newTrip())}><Plus />Добавить {mode === 'смена' ? 'смену' : mode === 'рейс' ? 'рейс' : 'вахту'}</button>} />

      <div className="cb-stats">
        <Stat label="Сейчас в работе" value={stats.active} icon={<Truck size={16} />} delta="начатые смены, рейсы, вахты" />
        <Stat label="Не вышли / замена" value={stats.noShow} icon={<UserCheck size={16} />} delta="требуют контроля явки" trend={stats.noShow ? 'down' : undefined} />
        <Stat label="Нарушения" value={stats.viol} icon={<ShieldAlert size={16} />} delta="за последние 2 недели" trend="down" />
        <Stat label="Стоимость в работе" value={money(stats.sum)} icon={<CalendarClock size={16} />} />
      </div>

      <div className="cb-mode" role="tablist" aria-label="Тип работы">
        {(['смена', 'рейс', 'вахта'] as TripMode[]).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? 'on' : ''} onClick={() => { setMode(m); setCat('') }}>
            <span className="t">{modeMeta[m].title}<span>{list.rows.filter((t) => t.mode === m && !t.archived).length}</span></span>
            <span className="s">{modeMeta[m].cats}</span>
          </button>
        ))}
      </div>

      <Tabs<TabId> value={tab} onChange={setTab}
        items={[...statusTabs.map((s) => ({ id: s as TabId, label: tabLabel[s], count: inMode.filter((t) => !t.archived && t.status === s).length })),
          ...(isAdmin(role) ? [{ id: 'Архив' as TabId, label: 'Архив', count: inMode.filter((t) => t.archived).length }] : [])]} />

      <div className="stack-sm">
        <div className="toolbar">
          <SearchInput value={q} onChange={setQ} placeholder="№, техника, госномер, водитель, объект" />
          <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Тип техники">
            <option value="">Вся техника</option>{cats.map((c) => <option key={c} value={c}>{categoryOne[c]}</option>)}
          </select>
          <select className="select" value={drv} onChange={(e) => setDrv(e.target.value)} aria-label="Водитель">
            <option value="">Все водители</option>{activeDrivers.map((d) => <option key={d.id} value={d.id}>{shortName(d.name)}</option>)}
          </select>
          <select className="select" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Объект">
            <option value="">Все объекты</option>{sites.filter((s) => s.status === 'Текущий').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="cb-toolbar-checks">
          <label className="check"><input type="checkbox" checked={onlyWeekend} onChange={(e) => setOnlyWeekend(e.target.checked)} />Работа в выходные</label>
          <label className="check"><input type="checkbox" checked={onlyViol} onChange={(e) => setOnlyViol(e.target.checked)} />Только с нарушениями</label>
        </div>
      </div>

      <DataTable cols={cols} rows={rows} rowKey={(t) => t.id} onRow={(t) => setOpenId(t.id)} empty={`Нет ${modeMeta[mode].plural} в этой вкладке`} />

      {cur && <TripCard t={cur} role={role} onClose={() => setOpenId(null)} patch={patch} onEdit={() => setForm(cur)}
        onRemove={() => { list.remove(cur.id); setOpenId(null); toast('Запись удалена') }} />}
      {form && <TripForm init={form} isNew={!list.rows.some((t) => t.id === form.id)} onClose={() => setForm(null)}
        onSave={(t) => {
          if (list.rows.some((x) => x.id === t.id)) { list.update(t); toast('Изменения сохранены') }
          else { list.add(t); setMode(t.mode); setTab('Новая'); toast(`${t.number} создана · водителю отправлено уведомление в Telegram (демо)`) }
          setForm(null)
        }} />}
    </div>
  )
}

function TripCard({ t, role, onClose, patch, onEdit, onRemove }: { t: Trip; role: CrmPageProps['role']; onClose: () => void; patch: (t: Trip, p: Partial<Trip>, m?: string) => void; onEdit: () => void; onRemove: () => void }) {
  const e = eq(t.equipmentId)!
  const s = site(t.siteId)
  const d = emp(t.driverId)
  const [newDrv, setNewDrv] = useState('')
  const [viol, setViol] = useState('')
  const replacements = useMemo(() => activeDrivers.filter((x) => x.id !== t.driverId), [t.driverId])

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onEdit}>Редактировать</button>
      {t.status === 'Новая' && <><button className="btn btn-secondary" onClick={() => patch(t, { status: 'Отклонённая' }, 'Смена отклонена')}>Отклонить</button>
        <button className="btn btn-primary" onClick={() => patch(t, { status: 'Начатая', attendance: t.attendance === 'Ожидается' ? 'Вышел' : t.attendance }, 'Смена начата, таймер запущен у водителя')}>Начать</button></>}
      {t.status === 'Начатая' && <button className="btn btn-primary" onClick={() => patch(t, { status: 'Завершённая', docs: [...new Set([...t.docs, 'Табель'])] }, 'Смена завершена, табель передан в бухгалтерию')}>Завершить</button>}
      {t.status === 'Отклонённая' && <button className="btn btn-secondary" onClick={() => patch(t, { status: 'Новая', attendance: 'Ожидается' }, 'Возвращено в новые')}>Вернуть в новые</button>}
    </>
  )

  return (
    <Drawer title={`${modeOne[t.mode]} ${t.number}`} sub={<span className="row" style={{ gap: 6 }}><StatusBadge status={t.status} />{t.blocked && <Badge tone="bad">Заблокирована</Badge>}{t.archived && <Badge>Архив</Badge>}</span>} onClose={onClose} footer={footer}>
      <KV items={[
        ['Дата', <span className="tnum">{date(t.date)}{t.weekend ? ' · выходной день' : ''}</span>],
        ['Время начала', <span className="tnum">{t.start}</span>],
        ['Окончание', <span className="tnum">{t.mode === 'вахта' ? `${date(new Date(new Date(t.date).getTime() + (t.days ?? 0) * 864e5).toISOString())} ${t.end}` : t.end} · {t.weekend ? 'работа в выходные (×1,5)' : 'рабочие часы'}</span>],
        ['Техника', <span>{e.title} · <span className="mono">{e.plate}</span> <span className="muted">({e.own ? 'своя' : 'привлечённая'})</span></span>],
        ['Водитель', d?.name ?? '—'],
        ['Объект', <span>{s?.name}<div className="cb-cell-sub">{s?.address}</div></span>],
        ['Длительность', duration(t)],
        ['Стоимость', <b className="tnum">{money(t.cost)}</b>],
        ['ТО', t.to ? <Badge tone="warn">Да, требуется ТО</Badge> : 'Нет'],
        ['Документы', t.docs.length ? <div className="cb-chips">{t.docs.map((x) => <span key={x} className="cb-chip"><FileText />{x}</span>)}</div> : <span className="muted">пока нет</span>],
        ['Примечание', t.note || <span className="muted">—</span>],
      ]} />

      <div className="cb-box soft">
        <div className="row-between"><h4>Взаимодействие с водителем</h4><Person name={d?.name ?? '—'} sub={d?.phone} /></div>

        <div className="stack-sm">
          <span className="eyebrow">Явка</span>
          <Seg<Attendance> value={t.attendance} onChange={(v) => patch(t, { attendance: v, ...(v === 'Не вышел' ? { motivation: t.motivation - 10 } : {}) }, v === 'Не вышел' ? 'Отмечен невыход · −10 баллов мотивации' : `Явка: ${v}`)}
            items={(['Ожидается', 'Вышел', 'Опоздал', 'Не вышел'] as Attendance[]).map((x) => ({ id: x, label: x }))} />
          {t.attendance === 'Не вышел' && <div className="alert alert-bad"><AlertTriangle /><div>Водитель не вышел на смену. Назначьте замену, чтобы не сорвать выход техники.</div></div>}
        </div>

        <div className="stack-sm">
          <span className="eyebrow">Сменить водителя</span>
          <div className="row" style={{ gap: 8 }}>
            <select className="select grow" value={newDrv} onChange={(x) => setNewDrv(x.target.value)} aria-label="Новый водитель" style={{ minWidth: 180 }}>
              <option value="">Выберите водителя</option>
              {replacements.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.position.toLowerCase()} · {x.shiftState}</option>)}
            </select>
            <button className="btn btn-dark" disabled={!newDrv} onClick={() => { patch(t, { driverId: newDrv, attendance: 'Замена' }, `Водитель заменён: ${shortName(emp(newDrv)!.name)} · уведомление в Telegram (демо)`); setNewDrv('') }}><Repeat />Заменить</button>
          </div>
        </div>

        <div className="stack-sm">
          <span className="eyebrow">Нарушения ({t.violations.length})</span>
          {t.violations.length ? <div className="cb-list">{t.violations.map((v, i) => (
            <div key={i}><ShieldAlert style={{ color: 'var(--bad)' }} /><span className="grow">{v}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => patch(t, { violations: t.violations.filter((_, k) => k !== i), motivation: t.motivation + 5 }, 'Нарушение снято')}>Снять</button></div>
          ))}</div> : <span className="muted" style={{ fontSize: 14 }}>Нарушений не зафиксировано</span>}
          <form className="row" style={{ gap: 8 }} onSubmit={(x) => { x.preventDefault(); if (!viol.trim()) return; patch(t, { violations: [...t.violations, viol.trim()], motivation: t.motivation - 5 }, 'Нарушение зафиксировано · −5 баллов'); setViol('') }}>
            <input className="input grow" style={{ minWidth: 180 }} value={viol} onChange={(x) => setViol(x.target.value)} placeholder="Опоздание, простой, нет фото ПЛ…" aria-label="Нарушение" />
            <button className="btn btn-secondary">Зафиксировать</button>
          </form>
        </div>

        <div className="row-between">
          <div className="stack-sm" style={{ gap: 2 }}>
            <span className="eyebrow">Влияние на мотивацию</span>
            <b className={`tnum ${t.motivation > 0 ? 'cb-pos' : t.motivation < 0 ? 'cb-neg' : ''}`} style={{ fontSize: 20 }}>{t.motivation > 0 ? '+' : ''}{num(t.motivation)} баллов</b>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => patch(t, { motivation: t.motivation + 5 }, 'Бонус +5 баллов передан в «Мотивацию»')}><Star />Бонус +5</button>
            <button className="btn btn-secondary btn-sm" onClick={() => patch(t, { motivation: t.motivation - 5 }, 'Штраф −5 баллов передан в «Мотивацию»')}>Штраф −5</button>
          </div>
        </div>
      </div>

      <Section title="Техника и объект" icon={<MapPin size={16} />}>
        <div className="cb-list">
          <div><Wrench /><span className="grow">Моточасы {num(e.motoHours)} · {t.to ? 'после смены — плановое ТО' : 'ТО не требуется'}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => patch(t, { to: !t.to }, t.to ? 'ТО снято' : 'Отмечено: требуется ТО, механик уведомлён')}>{t.to ? 'Снять ТО' : 'Нужно ТО'}</button></div>
          <div><MapPin /><span className="grow">Последнее гео водителя: {s?.name}, сверка координат пройдена (демо)</span></div>
        </div>
      </Section>

      <AdminActions role={role} blocked={t.blocked} cancelLabel="Отменить смену"
        onCancel={() => patch(t, { status: 'Отклонённая' }, 'Смена отменена администратором')}
        onArchive={() => { patch(t, { archived: !t.archived }, t.archived ? 'Возвращено из архива' : 'Перенесено в архив') }}
        onBlock={() => patch(t, { blocked: !t.blocked }, t.blocked ? 'Разблокировано' : 'Заблокировано: изменения запрещены')} />
      {isAdmin(role) && <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', color: 'var(--bad)' }} onClick={onRemove}>Удалить запись</button>}
    </Drawer>
  )
}

function TripForm({ init, isNew, onClose, onSave }: { init: Trip; isNew: boolean; onClose: () => void; onSave: (t: Trip) => void }) {
  const [f, setF] = useState<Trip>(init)
  const set = (p: Partial<Trip>) => setF((x) => {
    const n = { ...x, ...p }
    const e = eq(n.equipmentId)!
    n.weekend = isWeekend(n.date)
    if (n.mode === 'вахта') n.hours = (n.days ?? 1) * 10
    n.end = n.mode === 'вахта' ? n.start : tripEnd(n.start, n.hours)
    if (!('cost' in p)) n.cost = Math.round(e.pricePerHour * n.hours * (n.weekend ? 1.5 : 1) + (p.equipmentId ? e.deliveryPerKm * 25 : 0))
    return n
  })
  const eqs = equipment.filter((e) => workMode[e.category] === f.mode)
  return (
    <Modal wide title={isNew ? `Новая запись: ${f.mode}` : `Редактирование ${f.number}`} onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Отмена</button><button className="btn btn-primary" onClick={() => onSave(f)}>Сохранить</button></>}>
      {isNew && <Field label="Тип работы"><Seg<TripMode> value={f.mode} onChange={(m) => { const e = equipment.find((x) => workMode[x.category] === m)!; set({ mode: m, equipmentId: e.id, days: m === 'вахта' ? 15 : undefined, hours: m === 'вахта' ? 150 : 8, runs: m === 'рейс' ? 3 : undefined, number: `${m === 'смена' ? 'СМ' : m === 'рейс' ? 'РС' : 'ВХ'}-${f.number.split('-')[1]}` }) }}
        items={[{ id: 'смена', label: 'Смена' }, { id: 'рейс', label: 'Рейс' }, { id: 'вахта', label: 'Вахта' }]} /></Field>}
      <div className="grid g3">
        <Field label="Дата" required><input type="date" className="input" value={f.date} onChange={(e) => set({ date: e.target.value })} /></Field>
        <Field label="Время начала" required><input type="time" className="input" value={f.start} onChange={(e) => set({ start: e.target.value })} /></Field>
        {f.mode === 'вахта'
          ? <Field label="Длительность, дней" hint="10 ч в сутки"><input type="number" min={1} className="input" value={f.days ?? 1} onChange={(e) => set({ days: Number(e.target.value) })} /></Field>
          : <Field label="Длительность, ч" hint={`Окончание: ${f.end}${f.weekend ? ' · выходной' : ''}`}><input type="number" min={1} max={24} className="input" value={f.hours} onChange={(e) => set({ hours: Number(e.target.value) })} /></Field>}
      </div>
      <div className="grid g2">
        <Field label="Техника" required>
          <select className="select" value={f.equipmentId} onChange={(e) => set({ equipmentId: e.target.value })}>
            {eqs.map((e) => <option key={e.id} value={e.id}>{categoryOne[e.category]} {e.title} · {e.plate}{e.own ? '' : ' (привл.)'}{e.status === 'В ремонте' ? ' — в ремонте' : ''}</option>)}
          </select>
        </Field>
        <Field label="Водитель" required>
          <select className="select" value={f.driverId} onChange={(e) => set({ driverId: e.target.value })}>
            {activeDrivers.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.shiftState}</option>)}
          </select>
        </Field>
        <Field label="Объект" required>
          <select className="select" value={f.siteId} onChange={(e) => set({ siteId: e.target.value })}>
            {sites.filter((s) => s.status === 'Текущий').map((s) => <option key={s.id} value={s.id}>{s.name} — {s.address}</option>)}
          </select>
        </Field>
        <Field label="Стоимость, BYN" hint={f.weekend ? 'Работа в выходной: ставка ×1,5' : 'Ставка × часы + доставка'}>
          <input type="number" className="input" value={f.cost} onChange={(e) => set({ cost: Number(e.target.value) })} />
        </Field>
        {f.mode === 'рейс' && <Field label="Количество ходок"><input type="number" min={1} className="input" value={f.runs ?? 1} onChange={(e) => set({ runs: Number(e.target.value) })} /></Field>}
      </div>
      <label className="check"><input type="checkbox" checked={f.to} onChange={(e) => set({ to: e.target.checked })} />Требуется ТО (механик получит уведомление)</label>
      <Field label="Документы">
        <div className="cb-toolbar-checks">{docOptions.map((d) => (
          <label key={d} className="check"><input type="checkbox" checked={f.docs.includes(d)} onChange={(e) => set({ docs: e.target.checked ? [...f.docs, d] : f.docs.filter((x) => x !== d) })} />{d}</label>
        ))}</div>
      </Field>
      <Field label="Примечание"><textarea className="textarea" rows={3} value={f.note} onChange={(e) => set({ note: e.target.value })} placeholder="Особые условия, пропуск, контакт прораба" /></Field>
    </Modal>
  )
}
