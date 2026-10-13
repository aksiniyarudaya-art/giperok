import { useState } from 'react'
import { CalendarClock, Info } from 'lucide-react'
import { EquipmentArt, Field, PageHead, money } from '../../ui'
import type { Equipment } from '../../data/types'
import { categoryLabels, type EquipmentCategory } from '../../data/types'
import { useClient } from './ctx'
import { calcCost, catalogItems, findEq, type CalcInput } from './parts'

export function CalcWidget({ e, compact, onBook }: { e: Equipment; compact?: boolean; onBook?: () => void }) {
  const [i, setI] = useState<CalcInput>({ hours: 8, shifts: 1, km: 20, overtime: 0, weekend: false })
  const set = <K extends keyof CalcInput>(k: K, v: CalcInput[K]) => setI((s) => ({ ...s, [k]: v }))
  const r = calcCost(e, i)
  const parts = [
    { l: 'Смена', v: r.base, c: 'var(--accent)' },
    { l: 'Доставка', v: r.delivery, c: 'var(--steel)' },
    { l: 'Переработка', v: r.overtime, c: 'var(--warn)' },
    { l: 'Выходной', v: r.weekend, c: 'var(--bad)' },
  ].filter((p) => p.v > 0)
  return (
    <div className={`cl-calc ${compact ? 'compact' : ''}`}>
      <div className="stack">
        <div className="grid g2">
          <Field label="Часов в смене" hint={`мин. ${e.minHours} ч`}><input className="input" type="number" min={1} max={24} value={i.hours} onChange={(x) => set('hours', Math.max(1, +x.target.value))} /></Field>
          <Field label="Количество смен"><input className="input" type="number" min={1} max={60} value={i.shifts} onChange={(x) => set('shifts', Math.max(1, +x.target.value))} /></Field>
        </div>
        <Field label={`Доставка: ${i.km} км до объекта`} hint={`${e.deliveryPerKm} BYN/км, туда и обратно`}>
          <input type="range" className="range" min={0} max={200} value={i.km} onChange={(x) => set('km', +x.target.value)} aria-label="Расстояние" />
        </Field>
        <Field label={`Переработка: ${i.overtime} ч за смену`} hint={`${money(e.overtimePerHour)}/ч сверх смены`}>
          <input type="range" className="range" min={0} max={6} value={i.overtime} onChange={(x) => set('overtime', +x.target.value)} aria-label="Переработка" />
        </Field>
        <label className="check"><input type="checkbox" checked={i.weekend} onChange={(x) => set('weekend', x.target.checked)} />Работа в выходной день (+20% к смене)</label>
      </div>
      <div className="cl-calc-res">
        <div className="cl-calc-bar">{parts.map((p) => <span key={p.l} style={{ flex: p.v, background: p.c }} title={p.l} />)}</div>
        <div className="cl-sum-line"><span><i style={{ background: 'var(--accent)' }} />Смена: {money(e.pricePerHour)} × {r.billedHours} ч × {i.shifts}</span><b className="tnum">{money(r.base)}</b></div>
        <div className="cl-sum-line"><span><i style={{ background: 'var(--steel)' }} />Доставка {i.km * 2} км</span><b className="tnum">{money(r.delivery)}</b></div>
        <div className="cl-sum-line"><span><i style={{ background: 'var(--warn)' }} />Переработка {i.overtime * i.shifts} ч</span><b className="tnum">{money(r.overtime)}</b></div>
        {r.weekend > 0 && <div className="cl-sum-line"><span><i style={{ background: 'var(--bad)' }} />Выходной день</span><b className="tnum">{money(r.weekend)}</b></div>}
        <div className="cl-sum-total"><span>Итого</span><b className="tnum">{money(r.total)}</b></div>
        <div className="muted" style={{ fontSize: 12 }}>в т. ч. НДС 20% — {money(r.vat)}{i.hours < e.minHours ? ` · оплачивается минимум ${e.minHours} ч` : ''}</div>
        {onBook && <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} onClick={onBook}><CalendarClock />Забронировать на этих условиях</button>}
      </div>
    </div>
  )
}

export default function CalculatorPage() {
  const c = useClient()
  const [cat, setCat] = useState<EquipmentCategory>('excavator')
  const ofCat = catalogItems.filter((e) => e.category === cat)
  const [id, setId] = useState(ofCat[0].id)
  const e = findEq(id)!
  return (
    <>
      <PageHead title="Калькулятор стоимости" sub="Прозрачное ценообразование: смена, доставка и переработка — без скрытых платежей" />
      <div className="cl-calc-page">
        <div className="card stack">
          <Field label="Тип техники">
            <select className="select" value={cat} onChange={(x) => { const v = x.target.value as EquipmentCategory; setCat(v); setId(catalogItems.find((q) => q.category === v)!.id) }}>
              {(Object.keys(categoryLabels) as EquipmentCategory[]).map((k) => <option key={k} value={k}>{categoryLabels[k]}</option>)}
            </select>
          </Field>
          <Field label="Машина">
            <select className="select" value={id} onChange={(x) => setId(x.target.value)}>
              {ofCat.map((q) => <option key={q.id} value={q.id}>{q.title} — {money(q.pricePerHour)}/ч · {q.city}</option>)}
            </select>
          </Field>
          <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 120 }}><EquipmentArt category={e.category} label={e.title} /></div>
            <div className="grow stack-sm" style={{ fontSize: 13 }}>
              <b style={{ fontSize: 15 }}>{e.title}</b>
              <span className="muted">{e.short}</span>
              <span className="tnum">Час {money(e.pricePerHour)} · смена {money(e.pricePerShift)}</span>
            </div>
          </div>
          <div className="alert alert-info" style={{ fontSize: 13 }}><Info /><div>Время смены считается по путевому листу водителя. Переработка — каждый час сверх согласованной смены; доставка — по факту километража базы до объекта.</div></div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Расчёт</h3><span className="badge badge-muted plain">цены с НДС</span></div>
          <CalcWidget key={id} e={e} onBook={() => c.book(e.id)} />
        </div>
      </div>
    </>
  )
}
