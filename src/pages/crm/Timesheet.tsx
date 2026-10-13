import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Gauge, Shuffle, Timer, Wrench } from 'lucide-react'
import { Badge, Field, Modal, PageHead, Progress, SearchInput, Stat, Tabs, money, num, useToast } from '../../ui'
import { emp, TODAY } from '../../data/mock'
import { isWeekend, NORM_DAY, timesheet, weekDays, type TimeRow } from '../../data/crm-b'
import type { CrmPageProps } from './types'
import { Person } from './crm-b-ui'

type Grp = 'driver' | 'mechanic' | 'office'
const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const grpOf = (r: TimeRow): Grp => { const ro = emp(r.employeeId)!.role; return ro === 'driver' ? 'driver' : ro === 'mechanic' ? 'mechanic' : 'office' }
const shift = (iso: string, d: number) => new Date(new Date(iso).getTime() + d * 864e5).toISOString().slice(0, 10)

/** Прошлая неделя — полностью отработанная (факт). */
const prevWeek: TimeRow[] = timesheet.map((r, i) => ({
  ...r,
  work: weekDays.map((d, k) => (r.absence[k] === 'О' || r.absence[k] === 'Б' || isWeekend(d) ? 0 : grpOf(r) === 'driver' ? [9, 10, 8, 12, 11][(i + k) % 5] : grpOf(r) === 'mechanic' ? 8 : [8, 9][(i + k) % 2])),
  repair: weekDays.map((d, k) => (isWeekend(d) ? 0 : grpOf(r) === 'mechanic' ? [2, 4, 3][k % 3] : grpOf(r) === 'driver' && (i + k) % 5 === 0 ? 3 : 0)),
  absence: weekDays.map((d, k) => (r.absence[k] === 'О' || r.absence[k] === 'Б' ? r.absence[k] : isWeekend(d) ? 'В' : null)),
}))

export default function Timesheet({ role }: CrmPageProps) {
  const toast = useToast()
  const canEdit = role !== 'mechanic'
  const [week, setWeek] = useState<0 | -1>(0)
  const [data, setData] = useState<Record<string, TimeRow[]>>({ '0': timesheet, '-1': prevWeek })
  const [grp, setGrp] = useState<Grp>(role === 'mechanic' ? 'mechanic' : 'driver')
  const [q, setQ] = useState('')
  const [onlyOt, setOnlyOt] = useState(false)
  const [payOt, setPayOt] = useState<Record<string, boolean>>({})
  const [edit, setEdit] = useState<TimeRow | null>(null)

  const days = weekDays.map((d) => shift(d, week * 7))
  const rows = data[String(week)]
  const isPlan = (k: number) => days[k] > TODAY
  const factWork = (r: TimeRow) => r.work.reduce((a, h, k) => a + (isPlan(k) ? 0 : h), 0)
  const factRep = (r: TimeRow) => r.repair.reduce((a, h, k) => a + (isPlan(k) ? 0 : h), 0)
  const ot = (r: TimeRow) => r.work.reduce((a, h, k) => a + (isPlan(k) ? 0 : Math.max(0, h + r.repair[k] - NORM_DAY) + (isWeekend(days[k]) && h ? h - Math.max(0, h - NORM_DAY) : 0)), 0)
  const planTotal = (r: TimeRow) => r.work.reduce((a, h) => a + h, 0) + r.repair.reduce((a, h) => a + h, 0)
  const load = (r: TimeRow) => Math.round((planTotal(r) / 40) * 100)
  const otPay = (r: TimeRow) => Math.round(ot(r) * (emp(r.employeeId)!.salary / 168) * 1.5)

  const list = rows.filter((r) => grpOf(r) === grp).filter((r) => (!q || emp(r.employeeId)!.name.toLowerCase().includes(q.toLowerCase())) && (!onlyOt || ot(r) > 0))
  const all = rows
  const totals = {
    work: all.reduce((a, r) => a + factWork(r), 0),
    rep: all.reduce((a, r) => a + factRep(r), 0),
    ot: all.reduce((a, r) => a + ot(r), 0),
    otPeople: all.filter((r) => ot(r) > 0).length,
    load: Math.round(all.filter((r) => grpOf(r) === 'driver').reduce((a, r) => a + load(r), 0) / Math.max(1, all.filter((r) => grpOf(r) === 'driver').length)),
  }
  const save = (r: TimeRow) => { setData((d) => ({ ...d, [String(week)]: d[String(week)].map((x) => (x.id === r.id ? r : x)) })); toast('Табель обновлён') }
  const range = `${days[0].slice(8)}–${days[6].slice(8)} ${new Date(days[6]).toLocaleDateString('ru-RU', { month: 'long' })} 2026`
  const drvLoad = rows.filter((r) => grpOf(r) === 'driver').map((r) => ({ r, l: load(r) })).sort((a, b) => b.l - a.l)

  return (
    <div className="cb-page">
      <PageHead title="Учёт времени" sub="Табель водителей, механиков и офиса: рабочие и ремонтные часы, переработки, влияние на оплату и загрузка."
        actions={<div className="row" style={{ gap: 6 }}>
          <button className="btn btn-secondary btn-icon btn-sm" aria-label="Предыдущая неделя" disabled={week === -1} onClick={() => setWeek(-1)}><ChevronLeft /></button>
          <b className="tnum" style={{ minWidth: 150, textAlign: 'center' }}>{range}</b>
          <button className="btn btn-secondary btn-icon btn-sm" aria-label="Следующая неделя" disabled={week === 0} onClick={() => setWeek(0)}><ChevronRight /></button>
        </div>} />

      <div className="cb-stats">
        <Stat label="Рабочие часы (факт)" value={num(totals.work)} icon={<Clock size={16} />} />
        <Stat label="Ремонтные часы" value={num(totals.rep)} icon={<Wrench size={16} />} delta="ТО, ремонт, простой" />
        <Stat label="Переработки" value={`${num(totals.ot)} ч`} icon={<Timer size={16} />} delta={`у ${totals.otPeople} сотрудников`} trend="down" />
        <Stat label="Загрузка водителей" value={`${totals.load}%`} icon={<Gauge size={16} />} delta="план + факт к норме 40 ч" />
      </div>

      <Tabs<Grp> value={grp} onChange={setGrp} items={[
        { id: 'driver', label: 'Водители', count: rows.filter((r) => grpOf(r) === 'driver').length },
        { id: 'mechanic', label: 'Механики', count: rows.filter((r) => grpOf(r) === 'mechanic').length },
        { id: 'office', label: 'Сотрудники офиса', count: rows.filter((r) => grpOf(r) === 'office').length },
      ]} />

      <div className="row-between">
        <div className="toolbar grow"><SearchInput value={q} onChange={setQ} placeholder="Поиск сотрудника" />
          <label className="check" style={{ fontSize: 13, alignItems: 'center' }}><input type="checkbox" style={{ marginTop: 0 }} checked={onlyOt} onChange={(e) => setOnlyOt(e.target.checked)} />Только с переработкой</label></div>
      </div>
      <div className="cb-legend">
        <span><i style={{ background: 'var(--warn-soft)', outline: '1px solid var(--warn)' }} />переработка &gt; {NORM_DAY} ч или выходной</span>
        <span><b style={{ color: 'var(--steel)' }}>+2р</b> ремонтные часы</span>
        <span><i style={{ background: 'var(--surface-3)' }} />В — выходной, О — отпуск, Б — больничный</span>
        <span><i style={{ background: 'var(--bad-soft)' }} />НВ — невыход</span>
        <span className="muted">серым — план</span>
      </div>

      <div className="table-wrap">
        <table className="table cb-week">
          <thead><tr>
            <th>Сотрудник</th>
            {days.map((d, k) => <th key={d} className={`d ${isWeekend(d) ? 'we' : ''} ${d === TODAY ? 'today' : ''}`}>{dayNames[k]}<div className="tnum" style={{ fontWeight: 500 }}>{d.slice(8)}.{d.slice(5, 7)}</div></th>)}
            <th className="r">Раб.</th><th className="r">Рем.</th><th className="r">Перераб.</th><th>Загрузка</th><th className="r">Влияние на оплату</th>
          </tr></thead>
          <tbody>
            {list.map((r) => {
              const e = emp(r.employeeId)!
              const o = ot(r)
              return (
                <tr key={r.id} className={canEdit ? 'clickable' : ''} onClick={canEdit ? () => setEdit(r) : undefined}>
                  <td style={{ minWidth: 200 }}><Person name={e.name} sub={e.position} /></td>
                  {r.work.map((h, k) => {
                    const abs = r.absence[k]
                    if (abs && !h && abs !== 'В') return <td key={k} className="d"><span className={`cb-h abs ${abs === 'НВ' ? 'bad' : ''}`}>{abs}</span></td>
                    if (!h && !r.repair[k]) return <td key={k} className="d"><span className="cb-h abs">{abs ?? '—'}</span></td>
                    const over = !isPlan(k) && (h + r.repair[k] > NORM_DAY || isWeekend(days[k]))
                    return <td key={k} className="d"><span className={`cb-h ${over ? 'ot' : ''} ${isPlan(k) ? 'plan' : ''}`} title={isPlan(k) ? 'План' : 'Факт'}><b>{h}</b>{r.repair[k] > 0 && <i>+{r.repair[k]}р</i>}</span></td>
                  })}
                  <td className="r tnum"><b>{factWork(r)}</b></td>
                  <td className="r tnum" style={{ color: 'var(--steel)' }}>{factRep(r) || '—'}</td>
                  <td className="r tnum">{o ? <b className="cb-neg">{o}</b> : <span className="muted">—</span>}</td>
                  <td style={{ minWidth: 120 }}><div className="cb-kpi"><Progress value={load(r)} tone={load(r) > 110 ? 'bad' : load(r) >= 80 ? 'ok' : undefined} /><b>{load(r)}%</b></div></td>
                  <td className="r nowrap" onClick={(ev) => ev.stopPropagation()}>
                    {o ? (
                      <label className="check" style={{ justifyContent: 'flex-end', alignItems: 'center', fontSize: 13 }}>
                        <input type="checkbox" style={{ marginTop: 0 }} disabled={!canEdit} checked={!!payOt[r.id + week]} onChange={(x) => { setPayOt({ ...payOt, [r.id + week]: x.target.checked }); toast(x.target.checked ? `Переработка ${o} ч (+${money(otPay(r))}) передана в расчёт зарплаты` : 'Оплата переработки отменена') }} />
                        <span className="tnum">+{money(otPay(r))}</span>
                      </label>
                    ) : <span className="muted">—</span>}
                  </td>
                </tr>
              )
            })}
            {!list.length && <tr><td colSpan={13} className="muted" style={{ textAlign: 'center', padding: 28 }}>Нет сотрудников по фильтру</td></tr>}
          </tbody>
        </table>
      </div>
      {canEdit && <div className="cb-sub">Нажмите на строку, чтобы скорректировать часы. Отметка в колонке «Влияние на оплату» включает переработку (×1,5) в расчёт зарплаты.</div>}

      {grp === 'driver' && (
        <div className="card">
          <div className="card-head"><h3>Управление загрузкой водителей</h3><span className="muted" style={{ fontSize: 13 }}>норма 40 ч в неделю</span></div>
          <div className="stack-sm">
            {drvLoad.map(({ r, l }) => { const e = emp(r.employeeId)!; return (
              <div key={r.id} className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
                <div style={{ width: 170, flex: 'none' }} className="cb-cell-main">{e.name.split(' ').slice(0, 2).join(' ')}</div>
                <div className="grow"><Progress value={Math.min(100, l)} tone={l > 110 ? 'bad' : l >= 80 ? 'ok' : undefined} /></div>
                <b className="tnum" style={{ width: 44, textAlign: 'right' }}>{l}%</b>
                <div style={{ width: 130, flex: 'none', textAlign: 'right' }} className="hide-mobile">
                  {l > 110 ? <button className="btn btn-secondary btn-sm" disabled={!canEdit} onClick={() => toast(`Смены ${e.name.split(' ')[0]} перераспределены на водителей с низкой загрузкой`)}><Shuffle />Разгрузить</button>
                    : l < 60 ? <Badge tone="info">Свободен для смен</Badge> : <Badge tone="ok">Норма</Badge>}
                </div>
              </div>
            ) })}
          </div>
        </div>
      )}

      {edit && <EditRow r={edit} days={days} onClose={() => setEdit(null)} onSave={(r) => { save(r); setEdit(null) }} />}
    </div>
  )
}

function EditRow({ r, days, onClose, onSave }: { r: TimeRow; days: string[]; onClose: () => void; onSave: (r: TimeRow) => void }) {
  const [f, setF] = useState(r)
  const setArr = (key: 'work' | 'repair', k: number, v: number) => setF((x) => ({ ...x, [key]: x[key].map((h, i) => (i === k ? v : h)) }))
  return (
    <Modal wide title={`Табель: ${emp(r.employeeId)!.name}`} onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Отмена</button><button className="btn btn-primary" onClick={() => onSave(f)}>Сохранить</button></>}>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>День</th><th>Рабочие, ч</th><th>Ремонт/ТО, ч</th><th>Отметка</th></tr></thead>
          <tbody>{days.map((d, k) => (
            <tr key={d}>
              <td className="nowrap"><b>{dayNames[k]}</b> <span className="muted tnum">{d.slice(8)}.{d.slice(5, 7)}</span></td>
              <td><input type="number" min={0} max={24} className="input" style={{ width: 80 }} value={f.work[k]} onChange={(e) => setArr('work', k, Number(e.target.value))} aria-label={`Рабочие часы ${dayNames[k]}`} /></td>
              <td><input type="number" min={0} max={24} className="input" style={{ width: 80 }} value={f.repair[k]} onChange={(e) => setArr('repair', k, Number(e.target.value))} aria-label={`Ремонтные часы ${dayNames[k]}`} /></td>
              <td><select className="select" style={{ width: 130 }} value={f.absence[k] ?? ''} onChange={(e) => setF((x) => ({ ...x, absence: x.absence.map((a, i) => (i === k ? e.target.value || null : a)) }))} aria-label="Отметка">
                <option value="">Работа</option><option value="В">Выходной</option><option value="О">Отпуск</option><option value="Б">Больничный</option><option value="НВ">Невыход</option>
              </select></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Field label="Итого за неделю"><b className="tnum">{f.work.reduce((a, b) => a + b, 0)} ч работы · {f.repair.reduce((a, b) => a + b, 0)} ч ремонта</b></Field>
    </Modal>
  )
}
