import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardList, Play, Plus, Timer, Trash2, Wrench } from 'lucide-react'
import type { CrmPageProps } from '../types'
import {
  Badge, DataTable, Drawer, Field, Modal, PageHead, Progress, SearchInput, Seg, Stat, Tabs, date, daysBetween, money, num, uid, useToast, type Col,
} from '../../../ui'
import { TODAY, eq } from '../../../data/mock'
import {
  NOW, fleetStore, partsTotal, repairDowntime, repairStatuses, repairSubs, repairsStore, toTemplate, useStore, useStoreList,
  type Part, type Repair, type RepairStatus,
} from '../../../data/crm-c'
import { Checklist, Kanban, NextBtn, Steps, XBadge, closeRepair, dt, empShort, eqPlate, eqTitle, hrs } from './parts'

type View = 'board' | 'table' | 'plan'
type Kind = 'all' | 'Плановое ТО' | 'Внеплановый ремонт'

export default function Repairs({ role }: CrmPageProps) {
  const toast = useToast()
  const list = useStoreList(repairsStore)
  const fleet = useStore(fleetStore)
  const [view, setView] = useState<View>('board')
  const [kind, setKind] = useState<Kind>('all')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState<null | { equipmentId?: string; kind?: Repair['kind'] }>(null)

  const rows = useMemo(() => list.rows.filter((r) => {
    if (kind !== 'all' && r.kind !== kind) return false
    if (q && !`${r.number} ${r.title} ${eqTitle(r.equipmentId)} ${eqPlate(r.equipmentId)}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [list.rows, kind, q])

  const move = (r: Repair, to: RepairStatus) => {
    if (to === 'Закрыта') { setOpenId(r.id); toast('Чтобы закрыть, заполните заключение в карточке'); return }
    const patch: Partial<Repair> = { status: to }
    if (to === 'В работе' && !r.downtimeStart) patch.downtimeStart = NOW
    if (to === 'В работе' && r.kind === 'Внеплановый ремонт') fleetStore.set((p) => p.map((u) => (u.id === r.equipmentId ? { ...u, state: 'В ремонте', repairId: r.id, repairStartedAt: patch.downtimeStart ?? r.downtimeStart } : u)))
    list.patch(r.id, patch)
    toast(`${r.number}: ${to}`)
  }

  const inWork = list.rows.filter((r) => r.status === 'В работе')
  const nowDown = list.rows.filter((r) => r.downtimeStart && !r.downtimeEnd).reduce((a, r) => a + repairDowntime(r), 0)

  const cols: Col<Repair>[] = [
    { key: 'n', title: '№', nowrap: true, render: (r) => <span className="mono">{r.number}</span> },
    { key: 'k', title: 'Вид', hideMobile: true, render: (r) => <XBadge s={r.kind} /> },
    { key: 't', title: 'Работы', render: (r) => <div><div style={{ fontWeight: 600 }}>{r.title}</div><div className="cx-mini">{eqTitle(r.equipmentId)} · <span className="mono">{eqPlate(r.equipmentId)}</span></div></div> },
    { key: 'd', title: 'Дата', nowrap: true, hideMobile: true, render: (r) => <span className={r.planned < TODAY && r.status === 'Новая' ? 'cx-bad' : ''}>{date(r.planned)}</span> },
    { key: 's', title: 'Статус', render: (r) => <div className="stack-sm" style={{ gap: 4 }}><XBadge s={r.status} />{r.sub && r.status === 'В работе' && <XBadge s={r.sub} />}</div> },
    { key: 'c', title: 'Чек-лист', hideMobile: true, render: (r) => <span className="tnum">{r.checklist.filter((c) => c.done).length}/{r.checklist.length}</span> },
    { key: 'p', title: 'Запчасти', align: 'r', hideMobile: true, render: (r) => r.parts.length ? <span className="tnum">{money(partsTotal(r))}</span> : <span className="dim">—</span> },
    { key: 'w', title: 'Простой', align: 'r', nowrap: true, render: (r) => r.downtimeStart ? <span className="tnum">{hrs(Math.round(repairDowntime(r)))}</span> : <span className="dim">—</span> },
  ]

  return (
    <>
      <PageHead title="ТО и ремонты" sub="Плановые ТО по графику и внеплановые ремонты: Новая → В работе → Решение → Закрыта"
        actions={<>
          <button className="btn btn-secondary" onClick={() => setCreating({ kind: 'Плановое ТО' })}><CalendarClock />Плановое ТО</button>
          <button className="btn btn-primary" onClick={() => setCreating({ kind: 'Внеплановый ремонт' })}><Plus />Ремонт</button>
        </>} />

      <div className="cx-stats" style={{ ['--n' as string]: 5 }}>
        <Stat icon={<ClipboardList />} label="Новые" value={list.rows.filter((r) => r.status === 'Новая').length} delta={`просрочено: ${list.rows.filter((r) => r.status === 'Новая' && r.planned < TODAY).length}`} />
        <Stat icon={<Wrench />} label="В работе" value={inWork.length} delta={repairSubs.map((s) => inWork.filter((r) => r.sub === s).length).join(' · ') + ' по подстатусам'} />
        <Stat icon={<AlertTriangle />} label="Ждут решения" value={list.rows.filter((r) => r.status === 'Решение').length} />
        <Stat icon={<CheckCircle2 />} label="Закрыто" value={list.rows.filter((r) => r.status === 'Закрыта').length} />
        <Stat icon={<Timer />} label="Текущий простой" value={hrs(Math.round(nowDown))} trend="down" delta="«Ремонтные» часы" />
      </div>

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <Tabs value={view} onChange={setView} items={[{ id: 'board', label: 'Доска' }, { id: 'table', label: 'Таблица', count: rows.length }, { id: 'plan', label: 'График ТО' }]} />
        <div className="grow" />
        {view !== 'plan' && <>
          <SearchInput value={q} onChange={setQ} placeholder="№, техника, работы" />
          <Seg value={kind} onChange={setKind} items={[{ id: 'all', label: 'Все' }, { id: 'Плановое ТО', label: 'Плановые ТО' }, { id: 'Внеплановый ремонт', label: 'Ремонты' }]} />
        </>}
      </div>

      {view === 'board' && <Kanban columns={repairStatuses} items={rows} colOf={(r) => r.status} onMove={move} onOpen={(r) => setOpenId(r.id)}
        render={(r) => {
          const done = r.checklist.filter((c) => c.done).length
          return <>
            <div className="row-between"><span className="mono cx-mini">{r.number}</span><XBadge s={r.kind === 'Плановое ТО' ? 'Плановое ТО' : 'Внеплановый ремонт'} /></div>
            <div className="cx-card-t">{r.title}</div>
            <div className="cx-card-s">{eqTitle(r.equipmentId)} · <span className="mono">{eqPlate(r.equipmentId)}</span></div>
            {r.sub && r.status === 'В работе' && <div><XBadge s={r.sub} /></div>}
            {!!r.checklist.length && <div className="stack-sm" style={{ gap: 4 }}><Progress value={(done / r.checklist.length) * 100} tone={done === r.checklist.length ? 'ok' : undefined} /><span className="cx-mini">Чек-лист {done}/{r.checklist.length}</span></div>}
            <div className="cx-card-foot">
              <span className={r.planned < TODAY && r.status === 'Новая' ? 'cx-bad' : ''}>{r.downtimeStart ? <><Timer size={12} /> {hrs(Math.round(repairDowntime(r)))}</> : date(r.planned)}</span>
              {r.status !== 'Решение' && <NextBtn steps={repairStatuses} value={r.status} onMove={(s) => move(r, s)} />}
              {r.status === 'Решение' && <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setOpenId(r.id) }}>Закрыть</button>}
            </div>
          </>
        }} />}

      {view === 'table' && <div className="card"><DataTable cols={cols} rows={rows} rowKey={(r) => r.id} onRow={(r) => setOpenId(r.id)} /></div>}

      {view === 'plan' && <PlanView onCreate={(id) => setCreating({ equipmentId: id, kind: 'Плановое ТО' })} onOpen={setOpenId} />}

      {openId && <RepairDrawer id={openId} role={role} onClose={() => setOpenId(null)} />}
      {creating && <CreateModal init={creating} fleetIds={fleet.map((u) => u.id)} onClose={() => setCreating(null)} onSave={(r) => { list.add(r); setCreating(null); setOpenId(r.id); toast(`Создана карточка ${r.number}`) }} />}
    </>
  )
}

/* ---------- График ТО ---------- */
function PlanView({ onCreate, onOpen }: { onCreate: (eqId: string) => void; onOpen: (id: string) => void }) {
  const fleet = useStore(fleetStore)
  const repairs = useStore(repairsStore)
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(TODAY); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10) })
  const planned = repairs.filter((r) => r.kind === 'Плановое ТО' && r.status !== 'Закрыта')
  const overdue = planned.filter((r) => r.planned < TODAY)
  const sorted = [...fleet].sort((a, b) => a.nextTo.localeCompare(b.nextTo))
  return (
    <div className="stack">
      <section className="card">
        <div className="card-head"><h3>Ближайшие 14 дней</h3>{!!overdue.length && <Badge tone="bad">Просрочено: {overdue.length}</Badge>}</div>
        <div className="cx-strip">
          {days.map((d, i) => {
            const items = planned.filter((r) => r.planned === d || (i === 0 && r.planned < TODAY))
            return (
              <div key={d} className={`cx-day ${d === TODAY ? 'today' : ''}`}>
                <span className="d">{d.slice(8, 10)}.{d.slice(5, 7)}</span>
                <span className="w">{new Date(d).toLocaleDateString('ru-RU', { weekday: 'short' })}</span>
                {items.map((r) => <span key={r.id} className={`cx-chip ${r.planned < TODAY ? 'bad' : ''}`} title={`${r.number} ${eqTitle(r.equipmentId)}`} onClick={() => onOpen(r.id)}>{eq(r.equipmentId)!.brand}</span>)}
              </div>
            )
          })}
        </div>
      </section>
      <section className="card">
        <div className="card-head"><h3>График ТО по парку</h3><span className="cx-note">Интервал ТО по моточасам; дата — расчётная</span></div>
        <DataTable rowKey={(u) => u.id} rows={sorted} cols={[
          { key: 't', title: 'Техника', render: (u) => <div><div style={{ fontWeight: 600 }}>{eqTitle(u.id)}</div><div className="cx-mini mono">{eqPlate(u.id)}</div></div> },
          { key: 'k', title: 'Вид', nowrap: true, render: (u) => u.toKind },
          { key: 'l', title: 'Последнее', nowrap: true, hideMobile: true, render: (u) => date(u.lastTo) },
          { key: 'n', title: 'Плановое', nowrap: true, render: (u) => { const d = daysBetween(TODAY, u.nextTo); return <div><div>{date(u.nextTo)}</div><div className={`cx-mini ${d < 0 ? 'cx-bad' : d === 0 ? 'cx-warn' : ''}`}>{d < 0 ? `просрочено на ${-d} дн.` : d === 0 ? 'сегодня' : `через ${d} дн.`}</div></div> } },
          { key: 'm', title: 'Моточасы', align: 'r', hideMobile: true, render: (u) => <span className="tnum">{num(eq(u.id)!.motoHours)}</span> },
          { key: 's', title: 'Состояние', hideMobile: true, render: (u) => <XBadge s={u.state} /> },
          { key: 'a', title: '', align: 'r', render: (u) => { const r = planned.find((x) => x.equipmentId === u.id); return r ? <button className="btn btn-ghost btn-sm" onClick={() => onOpen(r.id)}>{r.number}</button> : <button className="btn btn-secondary btn-sm" onClick={() => onCreate(u.id)}><Plus />ТО</button> } },
        ]} />
      </section>
    </div>
  )
}

/* ---------- Карточка ТО / ремонта ---------- */
function RepairDrawer({ id, onClose }: { id: string; role: string; onClose: () => void }) {
  const toast = useToast()
  const list = useStoreList(repairsStore)
  const r = list.rows.find((x) => x.id === id)
  const [newCk, setNewCk] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  if (!r) return null
  const set = (p: Partial<Repair>) => list.patch(r.id, p)
  const closed = r.status === 'Закрыта'
  const setPart = (pid: string, p: Partial<Part>) => set({ parts: r.parts.map((x) => (x.id === pid ? { ...x, ...p } : x)) })
  const done = r.checklist.filter((c) => c.done).length

  const changeStatus = (s: RepairStatus) => {
    if (s === 'Закрыта') {
      if (!r.conclusion.trim()) { toast('Заполните заключение — без него карточку не закрыть'); return }
      closeRepair(r.id, r.conclusion); toast(`${r.number} закрыта, техника доступна. Водитель получил решение`); return
    }
    const p: Partial<Repair> = { status: s }
    if (s === 'В работе' && !r.downtimeStart) p.downtimeStart = NOW
    set(p); toast(`Статус: ${s}`)
  }

  return (
    <Drawer title={`${r.number} · ${r.title}`} sub={<>{eqTitle(r.equipmentId)} · <span className="mono">{eqPlate(r.equipmentId)}</span> · {r.kind}</>} onClose={onClose}
      footer={<div className="row-between" style={{ width: '100%' }}>
        {confirmDel
          ? <div className="row"><span className="cx-mini">Удалить карточку?</span><button className="btn btn-danger btn-sm" onClick={() => { list.remove(r.id); onClose(); toast('Карточка удалена') }}>Да, удалить</button><button className="btn btn-ghost btn-sm" onClick={() => setConfirmDel(false)}>Нет</button></div>
          : <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDel(true)}><Trash2 />Удалить</button>}
        <div className="row">
          {r.status === 'Новая' && <button className="btn btn-primary btn-sm" onClick={() => changeStatus('В работе')}><Play />В работу</button>}
          {r.status === 'В работе' && <button className="btn btn-primary btn-sm" onClick={() => changeStatus('Решение')}>Решение</button>}
          {r.status === 'Решение' && <button className="btn btn-ok btn-sm" onClick={() => changeStatus('Закрыта')}><CheckCircle2 />Закрыть</button>}
        </div>
      </div>}>
      <div className="stack">
        <Steps steps={repairStatuses} value={r.status} onChange={closed ? undefined : changeStatus} />
        {r.status === 'В работе' && <Field label="Подстатус ремонта">
          <Seg value={r.sub ?? ('' as never)} onChange={(s) => { set({ sub: s }); toast(`Подстатус: ${s}`) }} items={repairSubs.map((s) => ({ id: s, label: s }))} />
        </Field>}
        <div className="grid g2" style={{ gap: 10 }}>
          <div className="card-flat"><div className="cx-mini">Источник</div><b>{r.source}</b></div>
          <div className="card-flat"><div className="cx-mini">Плановая дата · водитель</div><b>{date(r.planned)} · {empShort(r.driverId)}</b></div>
        </div>

        <div className="cx-sec">
          <div className="cx-sec-h"><h4>Описание и диагностика</h4></div>
          <textarea className="textarea" value={r.diagnosis} disabled={closed} onChange={(e) => set({ diagnosis: e.target.value })} />
        </div>

        <div className="cx-sec">
          <div className="cx-sec-h"><h4>Чек-лист работ</h4><span className="cx-mini tnum">{done}/{r.checklist.length}</span></div>
          <Progress value={r.checklist.length ? (done / r.checklist.length) * 100 : 0} tone={done === r.checklist.length && done ? 'ok' : undefined} />
          <Checklist items={r.checklist} disabled={closed} onToggle={(cid) => set({ checklist: r.checklist.map((c) => (c.id === cid ? { ...c, done: !c.done } : c)) })} />
          {!closed && <form className="row" onSubmit={(e) => { e.preventDefault(); if (!newCk.trim()) return; set({ checklist: [...r.checklist, { id: uid('c'), text: newCk.trim(), done: false }] }); setNewCk('') }}>
            <input className="input grow" value={newCk} onChange={(e) => setNewCk(e.target.value)} placeholder="Добавить пункт работ" /><button className="btn btn-secondary"><Plus />Пункт</button>
          </form>}
        </div>

        <div className="cx-sec">
          <div className="cx-sec-h"><h4>Запчасти</h4>{!closed && <button className="btn btn-ghost btn-sm" onClick={() => set({ parts: [...r.parts, { id: uid('p'), name: '', qty: 1, price: 0 }] })}><Plus />Добавить</button>}</div>
          {r.parts.length ? <div className="table-wrap"><table className="table cx-parts">
            <thead><tr><th>Наименование</th><th className="r">Кол-во</th><th className="r">Цена</th><th className="r">Сумма</th>{!closed && <th />}</tr></thead>
            <tbody>{r.parts.map((p) => <tr key={p.id}>
              <td style={{ minWidth: 170 }}>{closed ? p.name : <input className="input" value={p.name} placeholder="Запчасть" onChange={(e) => setPart(p.id, { name: e.target.value })} />}</td>
              <td className="r" style={{ width: 80 }}>{closed ? p.qty : <input className="input tnum" type="number" min="0" value={p.qty} onChange={(e) => setPart(p.id, { qty: Number(e.target.value) })} />}</td>
              <td className="r" style={{ width: 100 }}>{closed ? money(p.price) : <input className="input tnum" type="number" min="0" step="0.1" value={p.price} onChange={(e) => setPart(p.id, { price: Number(e.target.value) })} />}</td>
              <td className="r nowrap tnum">{money(p.qty * p.price)}</td>
              {!closed && <td><button className="btn btn-ghost btn-sm btn-icon" aria-label="Удалить" onClick={() => set({ parts: r.parts.filter((x) => x.id !== p.id) })}><Trash2 /></button></td>}
            </tr>)}</tbody>
          </table></div> : <div className="cx-note">Запчасти не требуются или ещё не добавлены.</div>}
          {!!r.parts.length && <div className="cx-total"><span className="muted">Итого по запчастям</span><b>{money(partsTotal(r))}</b></div>}
        </div>

        <div className="cx-sec">
          <div className="cx-sec-h"><h4>Время простоя</h4>{r.downtimeStart && !r.downtimeEnd && <Badge tone="warn">идёт</Badge>}</div>
          {r.downtimeStart
            ? <div className="grid g3" style={{ gap: 10 }}>
              <div className="card-flat"><div className="cx-mini">Начало</div><b>{dt(r.downtimeStart)}</b></div>
              <div className="card-flat"><div className="cx-mini">Окончание</div><b>{r.downtimeEnd ? dt(r.downtimeEnd) : '—'}</b></div>
              <div className="card-flat"><div className="cx-mini">Итого (ремонтные)</div><b className="tnum">{hrs(Math.round(repairDowntime(r) * 10) / 10)}</b></div>
            </div>
            : <div className="row-between"><span className="cx-note">Простой не начат — фиксируется при переводе «В работу».</span>{!closed && <button className="btn btn-secondary btn-sm" onClick={() => { set({ downtimeStart: NOW, status: r.status === 'Новая' ? 'В работе' : r.status }); toast('Простой зафиксирован с текущего момента') }}><Timer />Начать отсчёт</button>}</div>}
        </div>

        <div className="cx-sec">
          <div className="cx-sec-h"><h4>Заключение</h4>{r.status === 'Решение' && !r.conclusion && <Badge tone="warn">нужно для закрытия</Badge>}</div>
          <textarea className="textarea" value={r.conclusion} disabled={closed} placeholder="Что сделано, причина неисправности, допуск техники к работе" onChange={(e) => set({ conclusion: e.target.value })} />
        </div>
      </div>
    </Drawer>
  )
}

/* ---------- Новая карточка ---------- */
function CreateModal({ init, fleetIds, onClose, onSave }: { init: { equipmentId?: string; kind?: Repair['kind'] }; fleetIds: string[]; onClose: () => void; onSave: (r: Repair) => void }) {
  const fleet = useStore(fleetStore)
  const [v, setV] = useState({ kind: init.kind ?? 'Внеплановый ремонт' as Repair['kind'], equipmentId: init.equipmentId ?? fleetIds[0], title: init.kind === 'Плановое ТО' ? 'ТО-250' : '', planned: TODAY, diagnosis: '' })
  const ok = v.title.trim().length > 1
  const save = () => {
    const n = repairsStore.get().length
    onSave({
      id: uid('r'), number: v.kind === 'Плановое ТО' ? `ТО-${1191 + n}` : `Р-${2048 + n}`, kind: v.kind, equipmentId: v.equipmentId, driverId: fleet.find((u) => u.id === v.equipmentId)?.driverId,
      title: v.title, diagnosis: v.diagnosis, source: v.kind === 'Плановое ТО' ? 'График ТО' : 'Осмотр механика', status: 'Новая', planned: v.planned,
      checklist: (v.kind === 'Плановое ТО' ? toTemplate : ['Осмотр и диагностика', 'Устранение неисправности', 'Проверка после ремонта']).map((t, i) => ({ id: `c${i}`, text: t, done: false })), parts: [], conclusion: '',
    })
  }
  return (
    <Modal title="Новая карточка ТО / ремонта" onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Отмена</button><button className="btn btn-primary" disabled={!ok} onClick={save}>Создать</button></>}>
      <div className="stack">
        <Seg value={v.kind} onChange={(k) => setV({ ...v, kind: k, title: k === 'Плановое ТО' ? 'ТО-250' : '' })} items={[{ id: 'Плановое ТО', label: 'Плановое ТО' }, { id: 'Внеплановый ремонт', label: 'Внеплановый ремонт' }]} />
        <Field label="Техника" required><select className="select" value={v.equipmentId} onChange={(e) => setV({ ...v, equipmentId: e.target.value })}>{fleetIds.map((id) => <option key={id} value={id}>{eqTitle(id)} · {eqPlate(id)}</option>)}</select></Field>
        <div className="grid g2">
          <Field label={v.kind === 'Плановое ТО' ? 'Вид ТО' : 'Неисправность'} required>
            {v.kind === 'Плановое ТО'
              ? <select className="select" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })}>{['ЕТО', 'ТО-250', 'ТО-500', 'ТО-1000', 'Сезонное ТО'].map((t) => <option key={t}>{t}</option>)}</select>
              : <input className="input" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Например, течь гидравлики" />}
          </Field>
          <Field label="Дата" required><input className="input" type="date" value={v.planned} onChange={(e) => setV({ ...v, planned: e.target.value })} /></Field>
        </div>
        <Field label="Описание / диагностика"><textarea className="textarea" value={v.diagnosis} onChange={(e) => setV({ ...v, diagnosis: e.target.value })} /></Field>
        <div className="cx-note">Карточка появится в колонке «Новая». Чек-лист работ заполнится по шаблону — его можно дополнить.</div>
      </div>
    </Modal>
  )
}
