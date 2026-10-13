import { useMemo, useState } from 'react'
import { AlertOctagon, Check, Gift, HardHat, Inbox, MessageSquare, Plus, ShieldAlert, Timer, Trash2, X } from 'lucide-react'
import type { CrmPageProps } from '../types'
import {
  Avatar, Badge, DataTable, Drawer, Field, KV, Modal, PageHead, SearchInput, Seg, Stat, Tabs, date, money, time, uid, useToast, type Col,
} from '../../../ui'
import { TODAY, drivers } from '../../../data/mock'
import type { Employee } from '../../../data/types'
import {
  driverMeta, feedbackStore, fleetStore, motivationStore, repairHoursStore, requestsStore, violationsStore, useStore, useStoreList,
  type Violation,
} from '../../../data/crm-c'
import { LItem, Ico, XBadge, acceptRequest, empShort, eqPlate, eqTitle, hrs } from './parts'

type Filter = 'all' | 'shift' | 'req' | 'restr'
type ModalKind = null | 'feedback' | 'violation' | 'hours' | 'motivation'
const activeReq = (s: string) => s !== 'Решение' && s !== 'Отклонена'

export default function MechDrivers({ role }: CrmPageProps) {
  const toast = useToast()
  const fleet = useStore(fleetStore)
  const reqs = useStoreList(requestsStore)
  const viol = useStoreList(violationsStore)
  const fb = useStoreList(feedbackStore)
  const mot = useStoreList(motivationStore)
  const rh = useStoreList(repairHoursStore)
  const [restr, setRestr] = useState<Record<string, string[]>>(() => Object.fromEntries(Object.entries(driverMeta).map(([k, v]) => [k, v.restrictions])))
  const [q, setQ] = useState('')
  const [f, setF] = useState<Filter>('all')
  const [open, setOpen] = useState<Employee | null>(null)
  const [tab, setTab] = useState<'over' | 'req' | 'viol' | 'hist'>('over')
  const [modal, setModal] = useState<ModalKind>(null)
  const [answerFor, setAnswerFor] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')

  const rows = useMemo(() => drivers.filter((d) => {
    if (q && !d.name.toLowerCase().includes(q.toLowerCase())) return false
    if (f === 'shift') return d.shiftState === 'На смене'
    if (f === 'req') return reqs.rows.some((r) => r.driverId === d.id && activeReq(r.status))
    if (f === 'restr') return (restr[d.id] ?? []).length > 0
    return true
  }), [q, f, reqs.rows, restr])

  const cols: Col<Employee>[] = [
    { key: 'n', title: 'Водитель', render: (d) => <div className="row" style={{ flexWrap: 'nowrap' }}><Avatar name={d.name} size="sm" /><div><div style={{ fontWeight: 600 }}>{d.name}</div><div className="cx-mini">{d.position}</div></div></div> },
    { key: 's', title: 'Смена', nowrap: true, render: (d) => d.status !== 'Активный' ? <XBadge s={d.status} /> : <XBadge s={d.shiftState ?? 'Выходной'} /> },
    { key: 'e', title: 'Техника', hideMobile: true, render: (d) => { const u = fleet.filter((x) => x.driverId === d.id); return u.length ? u.map((x) => <div key={x.id} className="nowrap">{eqTitle(x.id)} <span className="dim mono">{eqPlate(x.id)}</span></div>) : <span className="dim">—</span> } },
    { key: 'r', title: 'Заявки', align: 'r', render: (d) => { const n = reqs.rows.filter((r) => r.driverId === d.id && activeReq(r.status)).length; return n ? <Badge tone="info">{n}</Badge> : <span className="dim">0</span> } },
    { key: 'l', title: 'Ограничения', hideMobile: true, render: (d) => (restr[d.id] ?? []).length ? <span className="cx-warn" style={{ fontSize: 13 }}>{restr[d.id][0]}{restr[d.id].length > 1 ? ` +${restr[d.id].length - 1}` : ''}</span> : d.hireStage !== 'Допущен' ? <XBadge s={d.hireStage} /> : <span className="dim">нет</span> },
    { key: 'v', title: 'Нарушения', align: 'r', hideMobile: true, render: (d) => { const n = viol.rows.filter((v) => v.driverId === d.id).length; return n ? <span className="cx-bad tnum">{n}</span> : <span className="dim">0</span> } },
    { key: 'k', title: 'KPI', align: 'r', hideMobile: true, render: (d) => <span className="tnum">{d.kpi}%</span> },
  ]

  const onShift = drivers.filter((d) => d.shiftState === 'На смене').length
  const activeReqs = reqs.rows.filter((r) => activeReq(r.status)).length
  const withRestr = drivers.filter((d) => (restr[d.id] ?? []).length).length
  const rhPending = rh.rows.filter((h) => h.status === 'На согласовании' && h.empId.startsWith('d')).length

  const d = open
  const dUnits = d ? fleet.filter((u) => u.driverId === d.id) : []
  const dReqs = d ? reqs.rows.filter((r) => r.driverId === d.id) : []
  const dViol = d ? viol.rows.filter((v) => v.driverId === d.id) : []
  const dMot = d ? mot.rows.filter((m) => m.empId === d.id) : []
  const dRh = d ? rh.rows.filter((h) => h.empId === d.id) : []
  const dFb = d ? fb.rows.filter((x) => x.driverId === d.id) : []

  return (
    <>
      <PageHead title="Водители" sub="Смены, закреплённая техника, заявки на ТО, допуски и мотивация водителей"
        actions={role === 'mechanic' || role === 'admin' ? <button className="btn btn-secondary" onClick={() => { setF('req') }}><Inbox />Активные заявки</button> : undefined} />

      <div className="cx-stats">
        <Stat icon={<HardHat />} label="На смене сейчас" value={`${onShift} из ${drivers.length}`} />
        <Stat icon={<Inbox />} label="Активные заявки" value={activeReqs} delta={`новых: ${reqs.rows.filter((r) => r.status === 'Отправлена').length}`} />
        <Stat icon={<ShieldAlert />} label="С ограничениями допуска" value={withRestr} />
        <Stat icon={<Timer />} label="Ремонтные часы на согласовании" value={rhPending} />
      </div>

      <div className="card stack">
        <div className="toolbar">
          <SearchInput value={q} onChange={setQ} placeholder="Поиск по ФИО" />
          <Seg value={f} onChange={setF} items={[{ id: 'all', label: 'Все' }, { id: 'shift', label: 'На смене' }, { id: 'req', label: 'С заявками' }, { id: 'restr', label: 'С ограничениями' }]} />
        </div>
        <DataTable cols={cols} rows={rows} rowKey={(r) => r.id} onRow={(r) => { setOpen(r); setTab('over') }} />
      </div>

      {d && (
        <Drawer title={d.name} sub={`${d.position} · ${d.phone}`} onClose={() => setOpen(null)}
          footer={<div className="cx-btns" style={{ width: '100%' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal('feedback')}><MessageSquare />Обратная связь</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal('violation')}><AlertOctagon />Нарушение</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal('hours')}><Timer />Ремонтные часы</button>
            <button className="btn btn-primary btn-sm" onClick={() => setModal('motivation')}><Gift />Бонус / штраф</button>
          </div>}>
          <div className="stack">
            <Tabs value={tab} onChange={setTab} items={[
              { id: 'over', label: 'Обзор' },
              { id: 'req', label: 'Заявки', count: dReqs.filter((r) => activeReq(r.status)).length },
              { id: 'viol', label: 'Нарушения и мотивация', count: dViol.length + dMot.length },
              { id: 'hist', label: 'История' },
            ]} />

            {tab === 'over' && <>
              <div className="cx-sec">
                <div className="cx-sec-h"><h4>Текущая смена</h4>{d.status !== 'Активный' ? <XBadge s={d.status} /> : <XBadge s={d.shiftState ?? 'Выходной'} />}</div>
                {d.shiftState === 'На смене' && dUnits.length
                  ? <KV items={[['Объект', dUnits.find((u) => u.siteName)?.siteName ?? '—'], ['Начало', 'сегодня, 08:00'], ['Режим', 'смена 8 ч + переработка по согласованию'], ['Допуск', <XBadge key="h" s={d.hireStage} />]]} />
                  : <div className="cx-note">Сегодня смена не назначена.{d.hireStage !== 'Допущен' && ' Без статуса «Допущен» смены и техника не назначаются.'}</div>}
              </div>
              <div className="cx-sec">
                <div className="cx-sec-h"><h4>Назначенная техника</h4></div>
                {dUnits.length ? dUnits.map((u) => (
                  <LItem key={u.id} icon={<Ico tone={u.state === 'В ремонте' ? 'warn' : 'accent'}><HardHat /></Ico>} title={<>{eqTitle(u.id)} <span className="dim mono">{eqPlate(u.id)}</span></>}
                    sub={<>След. ТО: <span className={u.nextTo < TODAY ? 'cx-bad' : ''}>{date(u.nextTo)}</span>{u.faults.length ? ` · ${u.faults[0]}` : ''}</>} right={<XBadge s={u.state} />} />
                )) : <div className="cx-note">Техника не закреплена.</div>}
              </div>
              <div className="cx-sec">
                <div className="cx-sec-h"><h4>Ограничения по допуску</h4></div>
                {(restr[d.id] ?? []).map((r, i) => (
                  <div key={i} className="alert alert-warn" style={{ alignItems: 'center' }}><ShieldAlert /><span className="grow">{r}</span>
                    <button className="btn btn-ghost btn-sm btn-icon" aria-label="Снять ограничение" onClick={() => { setRestr((s) => ({ ...s, [d.id]: s[d.id].filter((_, j) => j !== i) })); toast('Ограничение снято, водитель уведомлён') }}><X /></button></div>
                ))}
                {!(restr[d.id] ?? []).length && <div className="cx-note">Ограничений нет.</div>}
                <form className="row" onSubmit={(e) => { e.preventDefault(); const v = (new FormData(e.currentTarget).get('r') as string).trim(); if (!v) return; setRestr((s) => ({ ...s, [d.id]: [...(s[d.id] ?? []), v] })); e.currentTarget.reset(); toast('Ограничение добавлено — водитель увидит его в приложении') }}>
                  <input name="r" className="input grow" placeholder="Новое ограничение, напр. «Без работы на высоте»" />
                  <button className="btn btn-secondary"><Plus />Добавить</button>
                </form>
              </div>
            </>}

            {tab === 'req' && <div className="cx-sec">
              {dReqs.length ? dReqs.map((r) => (
                <div key={r.id} className="card-flat stack-sm">
                  <div className="row-between"><b>{r.type === 'ТО' ? 'Заявка на ТО' : 'Заявка на ремонт'} · {eqTitle(r.equipmentId)}</b><XBadge s={r.status} /></div>
                  <div className="cx-note">{date(r.createdAt)}, {time(r.createdAt)} · «{r.text}»</div>
                  {!!r.media.length && <div className="row">{r.media.map((m) => <Badge key={m}>{m}</Badge>)}</div>}
                  {r.answer && <div className="alert alert-info"><MessageSquare /><span>{r.answer}</span></div>}
                  {r.status === 'Отправлена' && <div className="cx-btns">
                    <button className="btn btn-ok btn-sm" onClick={() => { const rr = acceptRequest(r); toast(`Заявка на ТО принята → ${rr.number}`) }}><Check />Принять заявку на ТО</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { reqs.patch(r.id, { status: 'Отклонена', answer: 'Неисправность не подтвердилась при осмотре' }); toast('Заявка отклонена') }}>Отклонить</button>
                  </div>}
                  {(r.status === 'Принята' || r.status === 'В работе') && <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setAnswerFor(r.id); setAnswer('Неисправность устранена, техника допущена к работе') }}>Отправить решение</button>}
                </div>
              )) : <div className="cx-note">Заявок нет.</div>}
            </div>}

            {tab === 'viol' && <>
              <div className="cx-sec">
                <div className="cx-sec-h"><h4>Нарушения эксплуатации</h4><button className="btn btn-ghost btn-sm" onClick={() => setModal('violation')}><Plus />Зафиксировать</button></div>
                {dViol.length ? dViol.map((v) => <LItem key={v.id} icon={<Ico tone="bad"><AlertOctagon /></Ico>} title={v.text} sub={<>{date(v.date)} · {eqTitle(v.equipmentId)}{v.fine ? ` · штраф ${money(v.fine)}` : ''}</>} right={<><XBadge s={v.severity} /><button className="btn btn-ghost btn-sm btn-icon" aria-label="Удалить" onClick={() => viol.remove(v.id)}><Trash2 /></button></>} />) : <div className="cx-note">Нарушений нет.</div>}
              </div>
              <div className="cx-sec">
                <div className="cx-sec-h"><h4>Мотивация</h4><button className="btn btn-ghost btn-sm" onClick={() => setModal('motivation')}><Plus />Бонус / штраф</button></div>
                {dMot.length ? dMot.map((m) => <LItem key={m.id} icon={<Ico tone={m.kind === 'Бонус' ? 'ok' : 'bad'}><Gift /></Ico>} title={<>{m.kind === 'Бонус' ? '+' : '−'}{money(m.amount)} · {m.reason}</>} sub={<>{date(m.date)} · поставил {empShort(m.by)}</>} right={<XBadge s={m.status} />} />) : <div className="cx-note">Записей нет.</div>}
              </div>
              <div className="cx-sec">
                <div className="cx-sec-h"><h4>Ремонтные часы</h4><button className="btn btn-ghost btn-sm" onClick={() => setModal('hours')}><Plus />Добавить</button></div>
                {dRh.length ? dRh.map((h) => <LItem key={h.id} icon={<Ico tone="info"><Timer /></Ico>} title={<>{hrs(h.hours)} · {eqTitle(h.equipmentId)}</>} sub={<>{date(h.date)} · {h.note}</>}
                  right={h.status === 'На согласовании' ? <><button className="btn btn-ok btn-sm" onClick={() => { rh.patch(h.id, { status: 'Согласовано механиком' }); toast('Ремонтные часы согласованы, переданы кадровику') }}><Check />Согласовать</button><button className="btn btn-ghost btn-sm" onClick={() => rh.patch(h.id, { status: 'Отклонено' })}>Отклонить</button></> : <XBadge s={h.status} />} />) : <div className="cx-note">Ремонтных часов нет.</div>}
              </div>
            </>}

            {tab === 'hist' && <div className="cx-sec">
              <div className="cx-sec-h"><h4>История обращений</h4></div>
              {[...dFb.map((x) => ({ date: x.date, t: 'Обратная связь механика', s: x.text })),
                ...(driverMeta[d.id]?.appeals ?? []).map((a) => ({ date: a.date, t: a.text, s: `Результат: ${a.result}` }))]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((x, i) => <LItem key={i} icon={<Ico tone="muted"><MessageSquare /></Ico>} title={x.t} sub={<>{date(x.date)} · {x.s}</>} />)}
              {!dFb.length && !(driverMeta[d.id]?.appeals ?? []).length && <div className="cx-note">Обращений пока не было.</div>}
            </div>}
          </div>
        </Drawer>
      )}

      {answerFor && <Modal title="Решение по заявке" onClose={() => setAnswerFor(null)} footer={<><button className="btn btn-ghost" onClick={() => setAnswerFor(null)}>Отмена</button><button className="btn btn-primary" disabled={!answer.trim()} onClick={() => { reqs.patch(answerFor, { status: 'Решение', answer }); setAnswerFor(null); toast('Решение отправлено водителю в приложение') }}>Отправить</button></>}>
        <Field label="Решение для водителя" required hint="Водитель увидит статус «Решение» и текст в приложении"><textarea className="textarea" value={answer} onChange={(e) => setAnswer(e.target.value)} /></Field>
      </Modal>}

      {d && modal && <DriverModal kind={modal} driver={d} units={dUnits.map((u) => u.id)} onClose={() => setModal(null)} onSave={(kind, v) => {
        if (kind === 'feedback') { fb.add({ id: uid('f'), driverId: d.id, date: TODAY, text: v.text }); toast('Обратная связь отправлена водителю в приложение') }
        if (kind === 'violation') {
          const rec: Violation = { id: uid('v'), driverId: d.id, equipmentId: v.eq || undefined, date: TODAY, text: v.text, severity: v.severity as Violation['severity'], fine: Number(v.amount) || 0 }
          viol.add(rec)
          if (rec.fine) mot.add({ id: uid('m'), empId: d.id, kind: 'Штраф', amount: rec.fine, reason: `Нарушение эксплуатации: ${rec.text}`, date: TODAY, by: 'e4', status: 'На утверждении' })
          toast('Нарушение зафиксировано' + (rec.fine ? ', штраф передан на утверждение кадровику' : ''))
        }
        if (kind === 'hours') { rh.add({ id: uid('h'), empId: d.id, equipmentId: v.eq, date: TODAY, hours: Number(v.amount) || 0, note: v.text, status: 'Согласовано механиком' }); toast('Ремонтные часы согласованы — в табеле помечены как «Ремонтные»') }
        if (kind === 'motivation') { mot.add({ id: uid('m'), empId: d.id, kind: v.severity as 'Бонус' | 'Штраф', amount: Number(v.amount) || 0, reason: v.text, date: TODAY, by: 'e4', status: 'На утверждении' }); toast(`${v.severity} поставлен, ушёл на утверждение кадровику`) }
        setModal(null)
      }} />}
    </>
  )
}

function DriverModal({ kind, driver, units, onClose, onSave }: { kind: Exclude<ModalKind, null>; driver: Employee; units: string[]; onClose: () => void; onSave: (k: Exclude<ModalKind, null>, v: { text: string; eq: string; amount: string; severity: string }) => void }) {
  const titles = { feedback: 'Обратная связь водителю', violation: 'Нарушение эксплуатации', hours: 'Согласовать ремонтные часы', motivation: 'Мотивация: бонус или штраф' }
  const [v, setV] = useState({ text: '', eq: units[0] ?? '', amount: kind === 'hours' ? '4' : '', severity: kind === 'motivation' ? 'Бонус' : 'Средняя' })
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }))
  const ok = v.text.trim().length > 2 && (kind !== 'hours' || Number(v.amount) > 0) && (kind !== 'motivation' || Number(v.amount) > 0)
  return (
    <Modal title={titles[kind]} onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Отмена</button><button className="btn btn-primary" disabled={!ok} onClick={() => onSave(kind, v)}>Сохранить</button></>}>
      <div className="stack">
        <div className="row"><Avatar name={driver.name} size="sm" /><b>{driver.name}</b></div>
        {kind === 'motivation' && <Field label="Тип"><div><Seg value={v.severity} onChange={(x) => setV((s) => ({ ...s, severity: x }))} items={[{ id: 'Бонус', label: 'Бонус' }, { id: 'Штраф', label: 'Штраф' }]} /></div></Field>}
        {kind === 'violation' && <Field label="Тяжесть"><select className="select" value={v.severity} onChange={set('severity')}><option>Низкая</option><option>Средняя</option><option>Высокая</option></select></Field>}
        {(kind === 'violation' || kind === 'hours') && <Field label="Техника" required={kind === 'hours'}>
          <select className="select" value={v.eq} onChange={set('eq')}>{kind === 'violation' && <option value="">Не указана</option>}{(units.length ? units : fleetStore.get().map((u) => u.id)).map((id) => <option key={id} value={id}>{eqTitle(id)} · {eqPlate(id)}</option>)}</select>
        </Field>}
        <Field label={kind === 'feedback' ? 'Сообщение' : kind === 'hours' ? 'Какие работы выполнялись' : kind === 'violation' ? 'Описание нарушения' : 'Основание'} required>
          <textarea className="textarea" value={v.text} onChange={set('text')} placeholder={kind === 'feedback' ? 'Например: ЕТО выполнено качественно, замечаний нет' : ''} />
        </Field>
        {kind !== 'feedback' && <Field label={kind === 'hours' ? 'Часы ремонта' : kind === 'violation' ? 'Штраф, BYN (необязательно)' : 'Сумма, BYN'} required={kind !== 'violation'}
          hint={kind === 'hours' ? 'Часы маркируются в табеле как «Ремонтные»: не для счёта клиенту, для ЗП' : kind === 'violation' ? 'Штраф уйдёт на утверждение кадровику' : 'Уйдёт на утверждение кадровику и в KPI'}>
          <input className="input tnum" type="number" min="0" step={kind === 'hours' ? '0.5' : '10'} value={v.amount} onChange={set('amount')} />
        </Field>}
      </div>
    </Modal>
  )
}
