import { Link } from 'react-router-dom'
import { CalendarClock, Heart, MapPin, Scale, Star } from 'lucide-react'
import { EquipmentArt, dateShort, money, num } from '../../ui'
import type { Equipment } from '../../data/types'
import { availableDate, partnerExtraEquipment, specFields, specLabel, specUnit } from '../../data/cabinet'
import { equipment } from '../../data/mock'
import { useClient } from './ctx'

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="cl-stars" aria-label={`Рейтинг ${value} из 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= Math.round(value) ? 'on' : ''} />)}
    </span>
  )
}

export function Rating({ value, reviews }: { value: number; reviews?: number }) {
  return (
    <span className="cl-rating"><Star size={14} /><b className="tnum">{value.toFixed(1)}</b>{reviews !== undefined && <span className="muted">· {reviews} отз.</span>}</span>
  )
}

export function specText(e: Equipment, max = 3) {
  return specFields[e.category]
    .filter((k) => e[k] !== undefined)
    .slice(0, max)
    .map((k) => `${specLabel[k].split(' ')[0].toLowerCase()} ${num(e[k]!, 2)} ${specUnit[k]}`)
}

/** Карточка техники в каталоге. */
export function EqCard({ e }: { e: Equipment }) {
  const c = useClient()
  const fav = c.fav.includes(e.id)
  const cmp = c.compare.includes(e.id)
  const from = availableDate(e)
  return (
    <article className="cl-eq">
      <Link to={`/client/catalog/${e.id}`} className="cl-eq-img" aria-label={e.title}>
        <EquipmentArt category={e.category} label={e.title} />
        {from ? <span className="cl-eq-flag busy">Доступна с {dateShort(from)}</span> : <span className="cl-eq-flag free">Свободна сейчас</span>}
      </Link>
      <div className="cl-eq-actions">
        <button className={`cl-ico ${fav ? 'on' : ''}`} onClick={() => c.toggleFav(e.id)} aria-label={fav ? 'Убрать из избранного' : 'В избранное'} aria-pressed={fav}><Heart /></button>
        <button className={`cl-ico ${cmp ? 'on' : ''}`} onClick={() => c.toggleCompare(e.id)} aria-label={cmp ? 'Убрать из сравнения' : 'В сравнение'} aria-pressed={cmp}><Scale /></button>
      </div>
      <div className="cl-eq-body">
        <div className="row-between" style={{ gap: 8 }}>
          <Rating value={e.rating} reviews={e.reviews} />
          <span className="muted mono" style={{ fontSize: 12 }}>{e.year} г.</span>
        </div>
        <Link to={`/client/catalog/${e.id}`} className="cl-eq-title">{e.title}</Link>
        <p className="cl-eq-short">{e.short}</p>
        <div className="cl-eq-specs">{specText(e).map((t) => <span key={t}>{t}</span>)}<span>от {e.minHours} ч</span></div>
        <div className="cl-eq-addr"><MapPin size={14} />{e.address}</div>
        <div className="cl-eq-foot">
          <div>
            <div className="muted" style={{ fontSize: 12 }}>цена от</div>
            <div className="cl-price"><b className="tnum">{money(e.pricePerHour)}</b><span>/час</span></div>
          </div>
          {from
            ? <button className="btn btn-secondary btn-sm" onClick={() => c.book(e.id)}><CalendarClock />с {dateShort(from)}</button>
            : <button className="btn btn-primary btn-sm" onClick={() => c.book(e.id)}>Забронировать</button>}
        </div>
      </div>
    </article>
  )
}

/* ---------- Расчёт стоимости ---------- */
export type CalcInput = { hours: number; shifts: number; km: number; overtime: number; weekend: boolean }
export function calcCost(e: Equipment, i: CalcInput) {
  const billedHours = Math.max(i.hours, e.minHours)
  const base = e.pricePerHour * billedHours * i.shifts
  const delivery = Math.round(e.deliveryPerKm * i.km * 2)
  const overtime = e.overtimePerHour * i.overtime * i.shifts
  const weekend = i.weekend ? Math.round(base * 0.2) : 0
  const total = base + delivery + overtime + weekend
  return { billedHours, base, delivery, overtime, weekend, total, vat: Math.round((total * 20) / 120) }
}

/* ---------- Техника, видимая клиентам ---------- */
const hidden: Equipment['status'][] = ['На модерации', 'Скрытая', 'Архив']
export const catalogItems: Equipment[] = [...equipment, ...partnerExtraEquipment].filter((e) => !hidden.includes(e.status))
export const findEq = (id?: string) => catalogItems.find((e) => e.id === id) ?? [...equipment, ...partnerExtraEquipment].find((e) => e.id === id)
