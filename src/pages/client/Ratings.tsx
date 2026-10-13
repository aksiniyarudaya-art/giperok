import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Building2, HardHat, MessageSquarePlus, Star } from 'lucide-react'
import { Avatar, Field, Modal, PageHead, SearchInput, Seg, date, dateShort, num, useToast } from '../../ui'
import { company, emp } from '../../data/mock'
import { executorReviews, executors, partnerDriver, type Review } from '../../data/cabinet'
import { useClient } from './ctx'
import { Stars, findEq } from './parts'

type K = 'driver' | 'company'

function StarInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="cl-star-input" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" role="radio" aria-checked={value === i} aria-label={`${i}`} className={i <= value ? 'on' : ''} onClick={() => onChange(i)}><Star /></button>
      ))}
    </div>
  )
}

export default function Ratings() {
  const c = useClient()
  const toast = useToast()
  const [sp, setSp] = useSearchParams()
  const [kind, setKind] = useState<K>('driver')
  const [q, setQ] = useState('')
  const [reviews, setReviews] = useState<Review[]>(executorReviews)
  const [rated, setRated] = useState<string[]>([])
  const done = c.orders.filter((o) => o.status === 'Выполнена')
  const rateId = sp.get('rate')
  const [form, setForm] = useState<{ orderId: string; drv: number; comp: number; text: string } | null>(rateId ? { orderId: rateId, drv: 5, comp: 5, text: '' } : null)

  const list = useMemo(() => executors.filter((x) => x.kind === kind && x.name.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => b.rating - a.rating), [kind, q])
  const name = (id: string) => executors.find((x) => x.id === id)?.name ?? emp(id)?.name ?? company(id)?.name ?? id

  const submit = () => {
    if (!form) return
    const o = c.orders.find((x) => x.id === form.orderId)!
    const e = findEq(o.equipmentId)!
    const drvName = (emp(o.driverId) ?? partnerDriver(o.driverId))?.name ?? 'Машинист'
    const add: Review[] = [
      { id: `u-${Date.now()}-d`, author: 'Лисовская И.', company: 'ООО «СтройМонолит»', date: '2026-10-13', stars: form.drv, text: form.text || `Заказ ${o.number}: ${e.title}`, target: o.driverId },
      { id: `u-${Date.now()}-c`, author: 'Лисовская И.', company: 'ООО «СтройМонолит»', date: '2026-10-13', stars: form.comp, text: form.text || `Заказ ${o.number}: оценка компании-владельца`, target: e.ownerId },
    ]
    setReviews((s) => [...add, ...s])
    setRated((s) => [...s, o.id])
    setForm(null)
    setSp({}, { replace: true })
    toast(`Спасибо! Оценки для ${drvName.split(' ')[0]} и ${company(e.ownerId)?.name ?? 'владельца'} опубликованы`)
  }

  return (
    <>
      <PageHead title="Рейтинги исполнителей" sub="Публичная оценка водителей и компаний по выполненным заказам"
        actions={<button className="btn btn-primary" onClick={() => setForm({ orderId: done.find((o) => !rated.includes(o.id))?.id ?? done[0]?.id, drv: 5, comp: 5, text: '' })} disabled={!done.length}><MessageSquarePlus />Оставить оценку</button>} />

      <div className="cl-ratings">
        <div className="stack" style={{ minWidth: 0 }}>
          <div className="toolbar">
            <Seg<K> value={kind} onChange={setKind} items={[{ id: 'driver', label: 'Водители' }, { id: 'company', label: 'Компании' }]} />
            <SearchInput value={q} onChange={setQ} placeholder={kind === 'driver' ? 'ФИО водителя' : 'Название компании'} />
          </div>
          <div className="stack-sm">
            {list.map((x, i) => (
              <div key={x.id} className="card cl-exec">
                <span className={`cl-rank ${i < 3 ? 'top' : ''}`}>{i + 1}</span>
                <Avatar name={x.name} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{x.name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{x.kind === 'driver' ? <HardHat size={13} /> : <Building2 size={13} />} {x.sub} · {x.city}</div>
                </div>
                <div className="cl-exec-m hide-mobile"><b className="tnum">{num(x.orders)}</b><span>заказов</span></div>
                <div className="cl-exec-m hide-mobile"><b className="tnum">{x.onTime}%</b><span>вовремя</span></div>
                <div className="cl-exec-r"><div className="row" style={{ gap: 6 }}><b className="tnum" style={{ fontSize: 18 }}>{x.rating.toFixed(1)}</b><Stars value={x.rating} size={13} /></div><span className="muted" style={{ fontSize: 12 }}>{x.votes} оценок</span></div>
              </div>
            ))}
          </div>
        </div>
        <aside className="card">
          <div className="card-head"><h3>Последние отзывы</h3></div>
          <div className="stack">
            {reviews.slice(0, 7).map((r) => (
              <div key={r.id} className="cl-review">
                <div className="row-between" style={{ gap: 8 }}><b style={{ fontSize: 14 }}>{name(r.target)}</b><Stars value={r.stars} size={12} /></div>
                <p className="dim" style={{ fontSize: 13 }}>{r.text}</p>
                <span className="muted" style={{ fontSize: 12 }}>{r.author}, {r.company} · {dateShort(r.date)}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {form && (() => {
        const o = c.orders.find((x) => x.id === form.orderId)
        const e = o && findEq(o.equipmentId)
        const d = o && (emp(o.driverId) ?? partnerDriver(o.driverId))
        return (
          <Modal title="Оценка исполнителей" onClose={() => { setForm(null); setSp({}, { replace: true }) }} footer={<>
            <button className="btn btn-ghost" onClick={() => setForm(null)}>Отмена</button>
            <button className="btn btn-primary" onClick={submit} disabled={!o}>Опубликовать</button>
          </>}>
            <Field label="Выполненный заказ" required>
              <select className="select" value={form.orderId} onChange={(ev) => setForm({ ...form, orderId: ev.target.value })}>
                {done.map((x) => <option key={x.id} value={x.id}>{x.number} · {date(x.date)} · {findEq(x.equipmentId)?.title}{rated.includes(x.id) ? ' (оценён)' : ''}</option>)}
              </select>
            </Field>
            {o && e && <>
              <div className="cl-rate-row"><Avatar name={d?.name ?? 'Машинист'} size="sm" /><div className="grow"><b>{d?.name ?? 'Машинист'}</b><div className="muted" style={{ fontSize: 12 }}>Водитель / машинист</div></div><StarInput label="Оценка водителя" value={form.drv} onChange={(v) => setForm({ ...form, drv: v })} /></div>
              <div className="cl-rate-row"><Avatar name={company(e.ownerId)?.name ?? 'Компания'} size="sm" /><div className="grow"><b>{company(e.ownerId)?.name}</b><div className="muted" style={{ fontSize: 12 }}>Компания-владелец техники</div></div><StarInput label="Оценка компании" value={form.comp} onChange={(v) => setForm({ ...form, comp: v })} /></div>
            </>}
            <Field label="Отзыв" hint="Будет опубликован в профиле исполнителя от имени компании">
              <textarea className="textarea" value={form.text} onChange={(ev) => setForm({ ...form, text: ev.target.value })} placeholder="Пунктуальность, качество работы, состояние техники" />
            </Field>
          </Modal>
        )
      })()}
    </>
  )
}
