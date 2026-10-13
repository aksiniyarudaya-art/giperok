import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarPlus, CheckCircle2, FileText, Gauge, LayoutGrid, List, Play, Plus, Square, Timer, Truck, Wrench } from 'lucide-react'
import type { CrmPageProps } from '../types'
import {
  Badge, DataTable, Drawer, EquipmentArt, Field, KV, Modal, PageHead, SearchInput, Seg, Stat, date, money, num, uid, useToast, type Col,
} from '../../../ui'
import { TODAY, drivers, eq } from '../../../data/mock'
import { categoryLabels, categoryOne, type EquipmentCategory } from '../../../data/types'
import {
  NOW, docTotal, docsStore, fleetStore, hoursBetween, repairDowntime, repairSubs, repairsStore, repairHoursStore, toTemplate, useStore, useStoreList,
  type Attachment, type FleetUnit, type MechState, type RepairSub,
} from '../../../data/crm-c'
import { FileTile, LItem, Ico, Uploader, XBadge, closeRepair, dt, empShort, hrs, startRepair } from './parts'

type ModalKind = null | 'problem' | 'to' | 'start' | 'close'
const states: MechState[] = ['На смене', 'На объекте', 'Свободна', 'В ремонте']

export default function MechEquipment({ role }: CrmPageProps) {
  const toast = useToast()
  const fleet = useStoreList(fleetStore)
  const repairs = useStore(repairsStore)
  const docs = useStoreList(docsStore)
  const [q, setQ] = useState('')
  const [st, setSt] = useState<'all' | MechState>('all')
  const [cat, setCat] = useState<'' | EquipmentCategory>('')
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [openId, setOpenId] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalKind>(null)

  const rows = useMemo(() => fleet.rows.filter((u) => {
    const e = eq(u.id)!
    if (q && !`${e.title} ${e.plate}`.toLowerCase().includes(q.toLowerCase())) return false
    if (st !== 'all' && u.state !== st) return false
    if (cat && e.category !== cat) return false
    return true
  }), [fleet.rows, q, st, cat])
  const cats = [...new Set(fleet.rows.map((u) => eq(u.id)!.category))]

  const u = fleet.rows.find((x) => x.id === openId)
  const e = u ? eq(u.id)! : null
  const openRepair = u ? repairs.find((r) => r.id === u.repairId) : undefined
  const history = u ? repairs.filter((r) => r.equipmentId === u.id) : []
  const eqDocs = u ? docs.rows.filter((d) => d.equipmentId === u.id) : []

  const cols: Col<FleetUnit>[] = [
    { key: 't', title: 'Техника', render: (x) => <div><div style={{ fontWeight: 600 }}>{eq(x.id)!.title}</div><div className="cx-mini">{categoryOne[eq(x.id)!.category]}</div></div> },
    { key: 'p', title: 'Номер', nowrap: true, render: (x) => <span className="mono">{eq(x.id)!.plate}</span> },
    { key: 's', title: 'Статус', render: (x) => <XBadge s={x.state} /> },
    { key: 'm', title: 'Моточасы', align: 'r', hideMobile: true, render: (x) => <span className="tnum">{num(eq(x.id)!.motoHours)}</span> },
    { key: 'l', title: 'Последнее ТО', hideMobile: true, nowrap: true, render: (x) => date(x.lastTo) },
    { key: 'n', title: 'Следующее ТО', nowrap: true, render: (x) => <span className={x.nextTo < TODAY ? 'cx-bad' : x.nextTo === TODAY ? 'cx-warn' : ''}>{date(x.nextTo)}</span> },
    { key: 'd', title: 'Водитель', hideMobile: true, render: (x) => empShort(x.driverId) },
    { key: 'f', title: 'Неисправности', hideMobile: true, render: (x) => x.faults.length ? <span className="cx-warn">{x.faults.length}</span> : <span className="dim">—</span> },
  ]

  const setState = (s: MechState) => {
    if (!u) return
    if (s === 'В ремонте') { setModal('start'); return }
    if (u.state === 'В ремонте') { setModal('close'); return }
    fleet.patch(u.id, { state: s })
    toast(`Статус: ${s}. Менеджер и водитель уведомлены`)
  }

  return (
    <>
      <PageHead title="Техника" sub="Собственный парк: состояние, ТО, неисправности, ремонты и простой"
        actions={<Seg value={view} onChange={setView} items={[{ id: 'cards', label: 'Карточки' }, { id: 'table', label: 'Таблица' }]} />} />

      <div className="cx-stats">
        <Stat icon={<Truck />} label="Единиц в парке" value={fleet.rows.length} delta={`в работе: ${fleet.rows.filter((x) => x.state === 'На смене' || x.state === 'На объекте').length}`} />
        <Stat icon={<Wrench />} label="В ремонте" value={fleet.rows.filter((x) => x.state === 'В ремонте').length} delta={`простой ${hrs(Math.round(fleet.rows.reduce((a, x) => a + (x.repairStartedAt ? hoursBetween(x.repairStartedAt, NOW) : 0), 0)))}`} trend="down" />
        <Stat icon={<AlertTriangle />} label="ТО просрочено" value={fleet.rows.filter((x) => x.nextTo < TODAY).length} trend="down" delta={`сегодня: ${fleet.rows.filter((x) => x.nextTo === TODAY).length}`} />
        <Stat icon={<Gauge />} label="С неисправностями" value={fleet.rows.filter((x) => x.faults.length).length} />
      </div>

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <SearchInput value={q} onChange={setQ} placeholder="Марка, модель или номер" />
        <select className="select" value={cat} onChange={(x) => setCat(x.target.value as EquipmentCategory)} aria-label="Категория">
          <option value="">Все категории</option>{cats.map((c) => <option key={c} value={c}>{categoryLabels[c]}</option>)}
        </select>
        <Seg value={st} onChange={setSt} items={[{ id: 'all', label: 'Все' }, ...states.map((s) => ({ id: s, label: s }))]} />
      </div>

      {view === 'table'
        ? <div className="card"><DataTable cols={cols} rows={rows} rowKey={(x) => x.id} onRow={(x) => setOpenId(x.id)} /></div>
        : <div className="cx-eq-grid">
          {rows.map((x) => {
            const ex = eq(x.id)!
            return (
              <article key={x.id} className="card cx-eq" onClick={() => setOpenId(x.id)}>
                <div style={{ position: 'relative' }}><EquipmentArt category={ex.category} /><span className="cx-eq-state"><XBadge s={x.state} /></span></div>
                <div className="cx-eq-b">
                  <div className="row-between"><b>{ex.title}</b><span className="mono cx-mini">{ex.plate}</span></div>
                  <div className="cx-meta">
                    <div><span>Моточасы</span><b className="tnum">{num(ex.motoHours)}</b></div>
                    <div><span>Пробег</span><b className="tnum">{ex.mileage ? `${num(ex.mileage)} км` : '—'}</b></div>
                    <div><span>След. ТО</span><b className={x.nextTo < TODAY ? 'cx-bad' : x.nextTo === TODAY ? 'cx-warn' : ''}>{date(x.nextTo)}</b></div>
                    <div><span>Водитель</span><b>{empShort(x.driverId)}</b></div>
                  </div>
                  {x.state === 'В ремонте' && x.repairStartedAt && <div className="alert alert-warn" style={{ padding: '6px 10px', fontSize: 13 }}><Timer />Простой {hrs(Math.round(hoursBetween(x.repairStartedAt, NOW)))}</div>}
                  {x.state !== 'В ремонте' && !!x.faults.length && <div className="cx-mini cx-warn"><AlertTriangle size={13} /> {x.faults[0]}</div>}
                </div>
              </article>
            )
          })}
          {!rows.length && <div className="card"><div className="empty">Ничего не найдено</div></div>}
        </div>}

      {u && e && (
        <Drawer title={e.title} sub={<>{categoryOne[e.category]} · <span className="mono">{e.plate}</span></>} onClose={() => setOpenId(null)}
          footer={<div className="cx-btns" style={{ width: '100%' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal('problem')}><AlertTriangle />Описать проблему</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal('to')}><CalendarPlus />Назначить ТО</button>
            {u.state === 'В ремонте'
              ? <button className="btn btn-ok btn-sm" onClick={() => setModal('close')}><CheckCircle2 />Закрыть ремонт</button>
              : <button className="btn btn-primary btn-sm" onClick={() => setModal('start')}><Play />Начать ремонт</button>}
          </div>}>
          <div className="stack">
            <div style={{ position: 'relative' }}><EquipmentArt category={e.category} label={e.plate} /></div>
            <div className="cx-sec">
              <div className="cx-sec-h"><h4>Статус</h4><XBadge s={u.state} /></div>
              <Seg value={u.state} onChange={setState} items={states.map((s) => ({ id: s, label: s }))} />
              {u.state === 'В ремонте' && u.repairStartedAt && <div className="alert alert-warn"><Timer /><div>
                <b>Простой с {dt(u.repairStartedAt)} — {hrs(Math.round(hoursBetween(u.repairStartedAt, NOW) * 10) / 10)}</b>
                <div style={{ fontSize: 13 }}>Часы помечаются в табеле как «Ремонтные»: не для счёта клиенту, учитываются в ЗП.{openRepair ? ` Карточка ${openRepair.number}${openRepair.sub ? ` · ${openRepair.sub}` : ''}.` : ''}</div>
              </div></div>}
            </div>
            <div className="cx-sec">
              <KV items={[
                ['Марка / модель', `${e.brand} / ${e.model}`],
                ['Гос. номер', <span key="p" className="mono">{e.plate}</span>],
                ['Год выпуска', e.year],
                ['Где сейчас', u.siteName ?? (u.state === 'В ремонте' ? 'Ремонтный бокс, ул. Олешева, 9' : 'База, ул. Олешева, 9')],
                ['Пробег', e.mileage ? `${num(e.mileage)} км` : '—'],
                ['Моточасы', <span key="m" className="tnum">{num(e.motoHours)} м/ч</span>],
                ['Последнее ТО', date(u.lastTo)],
                ['Следующее ТО', <span key="n" className={u.nextTo < TODAY ? 'cx-bad' : ''}>{date(u.nextTo)} · {u.toKind}{u.nextTo < TODAY ? ' (просрочено)' : ''}</span>],
                ['Закреплённый водитель', <select key="d" className="select cx-inline-input" value={u.driverId ?? ''} onChange={(x) => { fleet.patch(u.id, { driverId: x.target.value || undefined }); toast('Водитель закреплён — уведомление отправлено в Telegram (демо)') }}>
                  <option value="">Не закреплён</option>{drivers.filter((d) => d.hireStage === 'Допущен').map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>],
              ]} />
            </div>
            <div className="cx-sec">
              <div className="cx-sec-h"><h4>Неисправности</h4><button className="btn btn-ghost btn-sm" onClick={() => setModal('problem')}><Plus />Описать</button></div>
              {u.faults.length ? u.faults.map((f, i) => <LItem key={i} icon={<Ico tone="warn"><AlertTriangle /></Ico>} title={f} right={<button className="btn btn-ghost btn-sm" onClick={() => { fleet.patch(u.id, { faults: u.faults.filter((_, j) => j !== i) }); toast('Неисправность отмечена устранённой') }}>Устранена</button>} />) : <div className="cx-note">Неисправностей не зафиксировано.</div>}
            </div>
            <div className="cx-sec">
              <div className="cx-sec-h"><h4>Документооборот (оплаты)</h4>
                <button className="btn btn-ghost btn-sm" onClick={() => { docs.add({ id: uid('md'), number: `ЗЗ-${330 + docs.rows.length}`, type: 'Заказ запчастей', date: TODAY, equipmentId: u.id, repairId: u.repairId, items: [], note: u.faults[0] ?? '', status: 'Черновик', pay: 'Ожидает оплаты', attachments: [] }); toast('Черновик заказа запчастей создан в документообороте') }}><FileText />Заказ запчастей</button>
              </div>
              {eqDocs.length ? eqDocs.map((d) => <LItem key={d.id} icon={<Ico tone="muted"><FileText /></Ico>} title={<>{d.type} {d.number}</>} sub={<>{date(d.date)}{docTotal(d) ? ` · ${money(docTotal(d))}` : ''}</>} right={<><XBadge s={d.status} />{d.pay !== 'Не требуется' && <XBadge s={d.pay} />}</>} />) : <div className="cx-note">Документов нет.</div>}
            </div>
            <div className="cx-sec">
              <div className="cx-sec-h"><h4>История ТО и ремонтов</h4><Badge>{history.length}</Badge></div>
              {history.map((r) => <LItem key={r.id} icon={<Ico tone={r.kind === 'Плановое ТО' ? 'info' : 'warn'}><Wrench /></Ico>} title={<>{r.number} · {r.title}</>} sub={<>{date(r.planned)} · {r.kind}{r.downtimeStart ? ` · простой ${hrs(Math.round(repairDowntime(r)))}` : ''}</>} right={<XBadge s={r.status} />} />)}
            </div>
          </div>
        </Drawer>
      )}

      {u && modal && <EqModal kind={modal} unit={u} sub={openRepair?.sub} onClose={() => setModal(null)} onSave={(v) => {
        if (modal === 'problem') {
          fleet.patch(u.id, { faults: [...u.faults, v.text] })
          if (v.files.length) docs.add({ id: uid('md'), number: `ФФ-${210 + docs.rows.length}`, type: v.files.some((f) => f.kind === 'video') ? 'Видеофиксация' : 'Фотофиксация', date: TODAY, equipmentId: u.id, items: [], note: v.text, status: 'Черновик', pay: 'Не требуется', attachments: v.files })
          toast('Проблема описана' + (v.files.length ? ', фото/видео сохранены в документообороте' : '') + '. Менеджер уведомлён')
        }
        if (modal === 'to') {
          repairsStore.set((p) => [{ id: uid('r'), number: `ТО-${1191 + p.length}`, kind: 'Плановое ТО', equipmentId: u.id, driverId: u.driverId, title: v.toKind, diagnosis: v.text || 'Плановое обслуживание по графику', source: 'График ТО', status: 'Новая', planned: v.date, checklist: toTemplate.map((t, i) => ({ id: `c${i}`, text: t, done: false })), parts: [], conclusion: '' }, ...p])
          fleet.patch(u.id, { nextTo: v.date, toKind: v.toKind })
          toast(`${v.toKind} назначено на ${date(v.date)}. Водитель получит уведомление`)
        }
        if (modal === 'start') {
          const r = startRepair(u.id, v.text.split(/[.,]/)[0] || 'Внеплановый ремонт', v.text, v.sub as RepairSub, u.driverId)
          toast(`Ремонт начат (${r.number}). Простой фиксируется, часы — «Ремонтные»`)
        }
        if (modal === 'close' && u.repairId) {
          const r = repairs.find((x) => x.id === u.repairId)
          closeRepair(u.repairId, v.text)
          if (u.driverId && r && r.sub === 'Ремонт силами водителя') repairHoursStore.set((p) => [{ id: uid('h'), empId: u.driverId!, equipmentId: u.id, repairId: r.id, date: TODAY, hours: Math.round(repairDowntime(r) * 10) / 10, note: r.title, status: 'На согласовании' }, ...p])
          toast('Ремонт закрыт, техника снова доступна. Время простоя зафиксировано')
        }
        setModal(null)
      }} />}
    </>
  )
}

function EqModal({ kind, unit, sub, onClose, onSave }: { kind: Exclude<ModalKind, null>; unit: FleetUnit; sub?: RepairSub; onClose: () => void; onSave: (v: { text: string; date: string; toKind: string; sub: string; files: Attachment[] }) => void }) {
  const [v, setV] = useState({ text: '', date: TODAY, toKind: unit.toKind, sub: sub ?? 'Ожидание запчастей', files: [] as Attachment[] })
  const titles = { problem: 'Описание проблемы', to: 'Назначить ТО', start: 'Начать ремонт', close: 'Закрыть ремонт' }
  const need = kind !== 'to'
  return (
    <Modal title={`${titles[kind]} · ${eq(unit.id)!.title}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Отмена</button><button className={`btn ${kind === 'close' ? 'btn-ok' : 'btn-primary'}`} disabled={need && v.text.trim().length < 3} onClick={() => onSave(v)}>{kind === 'start' ? <><Play />Начать ремонт</> : kind === 'close' ? <><Square />Закрыть ремонт</> : 'Сохранить'}</button></>}>
      <div className="stack">
        {kind === 'start' && <div className="alert alert-info"><Timer /><span>С момента нажатия система фиксирует время простоя. Часы ремонта идут в табель отдельно от рабочих с пометкой «Ремонтные» — не для счёта клиенту, но для ЗП.</span></div>}
        {kind === 'to' && <div className="g2 grid">
          <Field label="Вид ТО" required><select className="select" value={v.toKind} onChange={(x) => setV({ ...v, toKind: x.target.value })}>{['ЕТО', 'ТО-250', 'ТО-500', 'ТО-1000', 'Сезонное ТО'].map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Дата" required><input className="input" type="date" value={v.date} min={TODAY} onChange={(x) => setV({ ...v, date: x.target.value })} /></Field>
        </div>}
        {kind === 'start' && <Field label="Подстатус ремонта" required><Seg value={v.sub} onChange={(x) => setV({ ...v, sub: x })} items={repairSubs.map((s) => ({ id: s, label: s }))} /></Field>}
        <Field label={kind === 'close' ? 'Заключение' : kind === 'to' ? 'Комментарий' : 'Описание неисправности'} required={need}>
          <textarea className="textarea" value={v.text} onChange={(x) => setV({ ...v, text: x.target.value })}
            placeholder={kind === 'close' ? 'Что сделано, рекомендации, допуск к работе' : kind === 'to' ? 'Необязательно' : 'Что случилось, при каких условиях проявляется'} />
        </Field>
        {kind === 'problem' && <Field label="Фото и видео"><Uploader files={v.files} onChange={(files) => setV({ ...v, files })} accept="image/*,video/*" label="Добавить фото или видео поломки" /></Field>}
        {kind === 'close' && !!v.files.length && <div className="cx-files">{v.files.map((f) => <FileTile key={f.id} a={f} />)}</div>}
      </div>
    </Modal>
  )
}
