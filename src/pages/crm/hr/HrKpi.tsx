import { useMemo, useState } from 'react'
import { Calculator, Check, CheckCheck, Gauge, Gift, Plus, RotateCcw, Send, Wallet } from 'lucide-react'
import type { CrmPageProps } from '../types'
import {
  Avatar, BarChart, DataTable, Drawer, Field, KV, Modal, PageHead, Progress, Seg, Stat, Tabs, date, money, uid, useToast, type Col,
} from '../../../ui'
import { TODAY, emp, employees } from '../../../data/mock'
import { roleLabels, type Role } from '../../../data/types'
import {
  calcKpi, defaultWeights, kpiCoef, kpiPeriodStore, kpiStore, motivationStore, repairHoursStore, useStore, useStoreList,
  type KpiRow, type KpiWeights, type Motivation,
} from '../../../data/crm-c'
import { XBadge, dt, empShort } from '../mechanic/parts'

type Tab = 'calc' | 'adj' | 'total'
type RoleF = 'all' | Role
const RH_RATE = 14 // BYN за ремонтный час
const BONUS_SHARE = 0.25 // премиальная часть от оклада

export default function HrKpi({ role }: CrmPageProps) {
  const toast = useToast()
  const kpi = useStoreList(kpiStore)
  const mot = useStoreList(motivationStore)
  const rh = useStore(repairHoursStore)
  const period = useStore(kpiPeriodStore)
  const [tab, setTab] = useState<Tab>('calc')
  const [rf, setRf] = useState<RoleF>('all')
  const [w, setW] = useState<KpiWeights>(defaultWeights)
  const [openId, setOpenId] = useState<string | null>(null)
  const [addAdj, setAddAdj] = useState(false)

  const rows = useMemo(() => kpi.rows.filter((k) => rf === 'all' || emp(k.empId)?.role === rf).map((k) => ({ ...k, ...calcKpi(k, w) })), [kpi.rows, rf, w])
  const approvedAdj = (id: string, kind: Motivation['kind']) => mot.rows.filter((m) => m.empId === id && m.kind === kind && m.status === 'Утверждено').reduce((a, m) => a + m.amount, 0)
  const rhHours = (id: string) => rh.filter((h) => h.empId === id && (h.status === 'Подтверждено кадровиком' || h.status === 'Передано в бухгалтерию')).reduce((a, h) => a + h.hours, 0)
  const payout = (k: KpiRow) => {
    const e = emp(k.empId)!
    const v = calcKpi(k, w).kpi
    const bonusPart = Math.round(e.salary * BONUS_SHARE * kpiCoef(v))
    const bonus = approvedAdj(k.empId, 'Бонус'), fine = approvedAdj(k.empId, 'Штраф'), rhp = Math.round(rhHours(k.empId) * RH_RATE)
    return { base: e.salary, bonusPart, bonus, fine, rhp, total: e.salary + bonusPart + bonus - fine + rhp, kpi: v }
  }
  const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.kpi, 0) / rows.length) : 0
  const pending = kpi.rows.filter((k) => k.status !== 'Утверждён')
  const adjPending = mot.rows.filter((m) => m.status === 'На утверждении')
  const totalFund = kpi.rows.reduce((a, k) => a + payout(k).total, 0)

  const cols: Col<(typeof rows)[number]>[] = [
    { key: 'e', title: 'Сотрудник', render: (r) => <div className="row" style={{ flexWrap: 'nowrap' }}><Avatar name={emp(r.empId)?.name ?? ''} size="sm" /><div><div className="nowrap" style={{ fontWeight: 600 }}>{empShort(r.empId)}</div><div className="cx-mini">{roleLabels[emp(r.empId)!.role]}</div></div></div> },
    { key: 'a', title: 'Явка', align: 'r', hideMobile: true, render: (r) => <span className="tnum">{r.attendance}%</span> },
    { key: 'v', title: 'Нарушения', align: 'r', hideMobile: true, render: (r) => <span className={`tnum ${r.violations ? 'cx-bad' : ''}`}>{r.violations}</span> },
    { key: 's', title: 'Смены', align: 'r', hideMobile: true, render: (r) => <span className="tnum">{r.shiftsDone}/{r.shiftsPlan}</span> },
    { key: 'r', title: 'Рейтинг', align: 'r', hideMobile: true, render: (r) => <span className="tnum">{r.rating.toFixed(1)}</span> },
    { key: 'k', title: 'KPI', render: (r) => <div style={{ minWidth: 90 }}><b className={`tnum ${r.kpi >= 85 ? 'cx-ok' : r.kpi >= 70 ? 'cx-warn' : 'cx-bad'}`}>{r.kpi}%</b><Progress value={r.kpi} tone={r.kpi >= 85 ? 'ok' : r.kpi < 70 ? 'bad' : undefined} /></div> },
    { key: 'c', title: 'Коэф.', align: 'r', hideMobile: true, render: (r) => <span className="tnum">×{kpiCoef(r.kpi).toFixed(1)}</span> },
    { key: 't', title: 'Статус', render: (r) => <XBadge s={r.status} /> },
  ]

  const open = kpi.rows.find((k) => k.id === openId)

  return (
    <>
      <PageHead title="KPI и отчёты" sub={`Расчёт KPI, штрафы и премии, итог к передаче в бухгалтерию · ${period.period}`}
        actions={<>
          <select className="select" style={{ width: 'auto' }} value={period.period} onChange={(e) => kpiPeriodStore.set({ period: e.target.value })} aria-label="Период">{['Сентябрь 2026', 'Август 2026', 'Июль 2026'].map((p) => <option key={p}>{p}</option>)}</select>
          <button className="btn btn-primary" disabled={!pending.length} onClick={() => { kpi.set((p) => p.map((k) => ({ ...k, status: 'Утверждён' }))); toast(`Утверждено KPI: ${pending.length}`) }}><CheckCheck />Утвердить все</button>
        </>} />

      <div className="cx-stats">
        <Stat icon={<Gauge />} label="Средний KPI" value={`${avg}%`} delta={`${rows.length} сотрудников`} />
        <Stat icon={<Calculator />} label="KPI на утверждении" value={kpi.rows.filter((k) => k.status === 'На утверждении').length} delta={`черновиков: ${kpi.rows.filter((k) => k.status === 'Черновик').length}`} />
        <Stat icon={<Gift />} label="Премии / штрафы на утв." value={adjPending.length} />
        <Stat icon={<Wallet />} label="Фонд к выплате" value={money(totalFund)} delta={period.sentAt ? `передан ${dt(period.sentAt)}` : 'не передан'} trend={period.sentAt ? 'up' : undefined} />
      </div>

      <div className="stack">
        <Tabs value={tab} onChange={setTab} items={[{ id: 'calc', label: 'Расчёт KPI', count: kpi.rows.length }, { id: 'adj', label: 'Штрафы и премии', count: adjPending.length }, { id: 'total', label: 'Итог в бухгалтерию' }]} />

        {tab === 'calc' && <>
          <section className="card stack">
            <div className="card-head" style={{ marginBottom: 0 }}><h3>Формула KPI</h3><button className="btn btn-ghost btn-sm" onClick={() => setW(defaultWeights)}><RotateCcw />Веса по умолчанию</button></div>
            <div className="cx-formula">KPI = (Явка×{w.attendance} + (100 − 25×Нарушения)×{w.violations} + Смены факт/план×100×{w.shifts} + Рейтинг/5×100×{w.rating}) / {w.attendance + w.violations + w.shifts + w.rating}</div>
            <div className="cx-weights">
              {([['attendance', 'Явка'], ['violations', 'Нарушения'], ['shifts', 'Выполненные смены'], ['rating', 'Рейтинг']] as const).map(([k, l]) => (
                <Field key={k} label={`${l}: вес ${w[k]}`}><input className="range" type="range" min="0" max="60" step="5" value={w[k]} onChange={(e) => setW({ ...w, [k]: Number(e.target.value) })} /></Field>
              ))}
            </div>
            <div className="cx-mini">Коэффициент премии: KPI ≥ 95% → ×1.2 · ≥ 85% → ×1.0 · ≥ 70% → ×0.8 · ниже → ×0.5. Премиальная часть — {BONUS_SHARE * 100}% оклада.</div>
          </section>
          <section className="card stack">
            <div className="toolbar"><Seg value={rf} onChange={setRf} items={[{ id: 'all', label: 'Все' }, { id: 'driver', label: 'Водители' }, { id: 'mechanic', label: 'Механики' }, { id: 'manager', label: 'Менеджеры' }]} /></div>
            <BarChart height={170} data={rows.map((r) => ({ label: emp(r.empId)!.name.split(' ')[0].slice(0, 7), value: r.kpi }))} format={(v) => `${Math.round(v)}`} />
            <DataTable cols={cols} rows={rows} rowKey={(r) => r.id} onRow={(r) => setOpenId(r.id)} />
          </section>
        </>}

        {tab === 'adj' && <section className="card stack">
          <div className="row-between"><div className="cx-note">Премии и штрафы ставят механики и менеджеры (мотивация, нарушения эксплуатации). Кадровик утверждает — утверждённые попадают в итог.</div><button className="btn btn-primary" onClick={() => setAddAdj(true)}><Plus />Премия / штраф</button></div>
          <DataTable rowKey={(m) => m.id} rows={mot.rows} cols={[
            { key: 'e', title: 'Сотрудник', render: (m) => <span className="nowrap">{empShort(m.empId)}</span> },
            { key: 'k', title: 'Тип', render: (m) => <XBadge s={m.kind} /> },
            { key: 'a', title: 'Сумма', align: 'r', nowrap: true, render: (m) => <b className={`tnum ${m.kind === 'Бонус' ? 'cx-ok' : 'cx-bad'}`}>{m.kind === 'Бонус' ? '+' : '−'}{money(m.amount)}</b> },
            { key: 'r', title: 'Основание', hideMobile: true, render: (m) => <div>{m.reason}<div className="cx-mini">{date(m.date)} · {empShort(m.by)}</div></div> },
            { key: 's', title: 'Статус', render: (m) => <XBadge s={m.status} /> },
            { key: 'x', title: '', align: 'r', render: (m) => m.status === 'На утверждении' ? <div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
              <button className="btn btn-ok btn-sm" aria-label="Утвердить" onClick={() => { mot.patch(m.id, { status: 'Утверждено' }); toast(`${m.kind} утверждён и учтён в итоге`) }}><Check /></button>
              <button className="btn btn-ghost btn-sm" onClick={() => { mot.patch(m.id, { status: 'Отклонено' }); toast('Отклонено') }}>Откл.</button></div> : null },
          ]} />
        </section>}

        {tab === 'total' && <section className="card stack">
          <div className="row-between">
            <div><h3 style={{ fontSize: 16 }}>Итог за {period.period}</h3><div className="cx-mini">Оклад + премиальная часть × коэффициент KPI + премии − штрафы + ремонтные часы ({RH_RATE} BYN/ч)</div></div>
            <button className="btn btn-primary" disabled={!!pending.length || !!period.sentAt} title={pending.length ? 'Сначала утвердите все KPI' : ''} onClick={() => { kpiPeriodStore.set({ ...period, sentAt: `${TODAY}T11:30:00` }); toast('Ведомость передана в бухгалтерию (демо)') }}><Send />{period.sentAt ? 'Передано' : 'Передать в бухгалтерию'}</button>
          </div>
          {!!pending.length && <div className="alert alert-warn"><Gauge /><span>Не утверждено KPI: {pending.length}. Передача в бухгалтерию станет доступна после утверждения.</span></div>}
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Сотрудник</th><th className="r">KPI</th><th className="r hide-mobile">Оклад</th><th className="r hide-mobile">Премия по KPI</th><th className="r hide-mobile">Премии</th><th className="r hide-mobile">Штрафы</th><th className="r hide-mobile">Рем. часы</th><th className="r">Итого</th></tr></thead>
            <tbody>{kpi.rows.map((k) => { const p = payout(k); return (
              <tr key={k.id} className="clickable" onClick={() => setOpenId(k.id)}>
                <td><span className="nowrap">{empShort(k.empId)}</span> {k.status !== 'Утверждён' && <XBadge s={k.status} />}</td>
                <td className="r tnum">{p.kpi}%</td><td className="r tnum hide-mobile nowrap">{money(p.base)}</td><td className="r tnum hide-mobile nowrap">{money(p.bonusPart)}</td>
                <td className="r tnum hide-mobile cx-ok nowrap">{p.bonus ? `+${money(p.bonus)}` : '—'}</td><td className="r tnum hide-mobile cx-bad nowrap">{p.fine ? `−${money(p.fine)}` : '—'}</td>
                <td className="r tnum hide-mobile nowrap">{p.rhp ? money(p.rhp) : '—'}</td><td className="r tnum nowrap"><b>{money(p.total)}</b></td>
              </tr>) })}</tbody>
          </table></div>
          <div className="cx-total"><span className="muted">Итого фонд оплаты</span><b>{money(totalFund)}</b></div>
        </section>}
      </div>

      {open && <KpiDrawer row={open} w={w} payout={payout(open)} onClose={() => setOpenId(null)} />}
      {addAdj && <AdjModal onClose={() => setAddAdj(false)} onSave={(m) => { mot.add(m); setAddAdj(false); toast(`${m.kind} добавлен и утверждён`) }} />}
    </>
  )
}

function KpiDrawer({ row, w, payout, onClose }: { row: KpiRow; w: KpiWeights; payout: { base: number; bonusPart: number; bonus: number; fine: number; rhp: number; total: number; kpi: number }; onClose: () => void }) {
  const toast = useToast()
  const kpi = useStoreList(kpiStore)
  const e = emp(row.empId)!
  const { parts } = calcKpi(row, w)
  const num = (k: keyof KpiRow, v: string) => kpi.patch(row.id, { [k]: Number(v) } as Partial<KpiRow>)
  return (
    <Drawer title={e.name} sub={`${e.position} · ${roleLabels[e.role]}`} onClose={onClose}
      footer={<div className="row-between" style={{ width: '100%' }}>
        {row.status === 'Утверждён' ? <button className="btn btn-ghost btn-sm" onClick={() => { kpi.patch(row.id, { status: 'На утверждении' }); toast('KPI возвращён на пересчёт') }}><RotateCcw />Вернуть</button> : <span />}
        {row.status !== 'Утверждён' && <button className="btn btn-ok btn-sm" onClick={() => { kpi.patch(row.id, { status: 'Утверждён' }); toast('KPI утверждён') }}><Check />Утвердить KPI</button>}
      </div>}>
      <div className="stack">
        <div className="row-between card-flat"><div><div className="cx-mini">KPI за период</div><div style={{ font: '600 32px/1 var(--font-display)' }} className={payout.kpi >= 85 ? 'cx-ok' : payout.kpi >= 70 ? 'cx-warn' : 'cx-bad'}>{payout.kpi}%</div></div><XBadge s={row.status} /></div>
        <div className="cx-sec">
          <div className="cx-sec-h"><h4>Показатели</h4><span className="cx-mini">редактируемые</span></div>
          <div className="grid g2" style={{ gap: 12 }}>
            <Field label="Явка, %"><input className="input tnum" type="number" min="0" max="100" value={row.attendance} disabled={row.status === 'Утверждён'} onChange={(x) => num('attendance', x.target.value)} /></Field>
            <Field label="Нарушения"><input className="input tnum" type="number" min="0" value={row.violations} disabled={row.status === 'Утверждён'} onChange={(x) => num('violations', x.target.value)} /></Field>
            <Field label="Смены выполнено"><input className="input tnum" type="number" min="0" value={row.shiftsDone} disabled={row.status === 'Утверждён'} onChange={(x) => num('shiftsDone', x.target.value)} /></Field>
            <Field label="Смены по плану"><input className="input tnum" type="number" min="0" value={row.shiftsPlan} disabled={row.status === 'Утверждён'} onChange={(x) => num('shiftsPlan', x.target.value)} /></Field>
            <Field label="Рейтинг (1–5)"><input className="input tnum" type="number" min="1" max="5" step="0.1" value={row.rating} disabled={row.status === 'Утверждён'} onChange={(x) => num('rating', x.target.value)} /></Field>
          </div>
        </div>
        <div className="cx-sec">
          <div className="cx-sec-h"><h4>Вклад в KPI</h4></div>
          {([['Явка', parts.attendance, w.attendance], ['Без нарушений', parts.violations, w.violations], ['Выполненные смены', parts.shifts, w.shifts], ['Рейтинг', parts.rating, w.rating]] as const).map(([l, v, wt]) => (
            <div key={l} className="stack-sm" style={{ gap: 4 }}><div className="row-between"><span>{l} <span className="cx-mini">вес {wt}</span></span><b className="tnum">{Math.round(v)}</b></div><Progress value={v} tone={v >= 85 ? 'ok' : v < 60 ? 'bad' : undefined} /></div>
          ))}
        </div>
        <div className="cx-sec">
          <div className="cx-sec-h"><h4>К выплате</h4></div>
          <KV items={[['Оклад', money(payout.base)], [`Премия по KPI (×${kpiCoef(payout.kpi).toFixed(1)})`, money(payout.bonusPart)], ['Премии', payout.bonus ? `+${money(payout.bonus)}` : '—'], ['Штрафы', payout.fine ? `−${money(payout.fine)}` : '—'], ['Ремонтные часы', payout.rhp ? money(payout.rhp) : '—']]} />
          <div className="cx-total"><span className="muted">Итого</span><b>{money(payout.total)}</b></div>
        </div>
      </div>
    </Drawer>
  )
}

function AdjModal({ onClose, onSave }: { onClose: () => void; onSave: (m: Motivation) => void }) {
  const [v, setV] = useState({ empId: 'd1', kind: 'Бонус' as Motivation['kind'], amount: '100', reason: '' })
  const ok = Number(v.amount) > 0 && v.reason.trim().length > 2
  return (
    <Modal title="Премия или штраф" onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Отмена</button><button className="btn btn-primary" disabled={!ok} onClick={() => onSave({ id: uid('m'), empId: v.empId, kind: v.kind, amount: Number(v.amount), reason: v.reason, date: TODAY, by: 'e6', status: 'Утверждено' })}>Сохранить</button></>}>
      <div className="stack">
        <Seg value={v.kind} onChange={(k) => setV({ ...v, kind: k })} items={[{ id: 'Бонус', label: 'Премия' }, { id: 'Штраф', label: 'Штраф' }]} />
        <Field label="Сотрудник" required><select className="select" value={v.empId} onChange={(e) => setV({ ...v, empId: e.target.value })}>{employees.filter((e) => e.hireStage === 'Допущен').map((e) => <option key={e.id} value={e.id}>{e.name} · {e.position}</option>)}</select></Field>
        <Field label="Сумма, BYN" required><input className="input tnum" type="number" min="0" step="10" value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value })} /></Field>
        <Field label="Основание" required><textarea className="textarea" value={v.reason} onChange={(e) => setV({ ...v, reason: e.target.value })} style={{ minHeight: 70 }} /></Field>
      </div>
    </Modal>
  )
}
