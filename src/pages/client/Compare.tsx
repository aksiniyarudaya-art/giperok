import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Scale, Trash2, X } from 'lucide-react'
import { Empty, EquipmentArt, PageHead, dateShort, money, num } from '../../ui'
import type { Equipment } from '../../data/types'
import { categoryOne } from '../../data/types'
import { availableDate } from '../../data/cabinet'
import { COMPARE_MAX, useClient } from './ctx'
import { findEq } from './parts'

type Row = { label: string; get: (e: Equipment) => number | undefined | string; fmt?: (v: number) => ReactNode; best?: 'min' | 'max' }

const rows: Row[] = [
  { label: 'Тип', get: (e) => categoryOne[e.category] },
  { label: 'Цена за час', get: (e) => e.pricePerHour, fmt: (v) => money(v), best: 'min' },
  { label: 'Цена за смену', get: (e) => e.pricePerShift, fmt: (v) => money(v), best: 'min' },
  { label: 'Мин. время аренды', get: (e) => e.minHours, fmt: (v) => `${v} ч`, best: 'min' },
  { label: 'Грузоподъёмность', get: (e) => e.capacity, fmt: (v) => `${num(v, 2)} т`, best: 'max' },
  { label: 'Вылет стрелы', get: (e) => e.boom, fmt: (v) => `${num(v, 1)} м`, best: 'max' },
  { label: 'Объём ковша', get: (e) => e.bucket, fmt: (v) => `${num(v, 2)} м³`, best: 'max' },
  { label: 'Доставка', get: (e) => e.deliveryPerKm, fmt: (v) => `${num(v, 1)} BYN/км`, best: 'min' },
  { label: 'Переработка', get: (e) => e.overtimePerHour, fmt: (v) => `${money(v)}/ч`, best: 'min' },
  { label: 'Рейтинг', get: (e) => e.rating, fmt: (v) => `★ ${v.toFixed(1)}`, best: 'max' },
  { label: 'Отзывов', get: (e) => e.reviews, fmt: (v) => String(v), best: 'max' },
  { label: 'Год выпуска', get: (e) => e.year, fmt: (v) => String(v), best: 'max' },
  { label: 'Доступность', get: (e) => { const d = availableDate(e); return d ? `с ${dateShort(d)}` : 'Свободна' } },
  { label: 'Город', get: (e) => e.city },
  { label: 'Доп. оборудование', get: (e) => e.extras.join(', ') || '—' },
]

export default function Compare() {
  const c = useClient()
  const list = c.compare.map((id) => findEq(id)!).filter(Boolean)
  return (
    <>
      <PageHead title="Сравнение техники" sub={`До ${COMPARE_MAX} машин рядом: цены, характеристики, рейтинг. Лучшие значения подсвечены.`}
        actions={list.length > 0 && <button className="btn btn-ghost" onClick={c.clearCompare}><Trash2 />Очистить</button>} />
      {!list.length ? (
        <div className="card"><Empty icon={<Scale />} text="Добавьте технику в сравнение из каталога — значок весов на карточке." />
          <div style={{ textAlign: 'center' }}><Link to="/client/catalog" className="btn btn-primary">Открыть каталог</Link></div></div>
      ) : (
        <div className="table-wrap">
          <table className="table cl-cmp">
            <thead>
              <tr>
                <th className="cl-cmp-k">Параметр</th>
                {list.map((e) => (
                  <th key={e.id}>
                    <div className="cl-cmp-head">
                      <button className="btn btn-ghost btn-icon btn-sm cl-cmp-x" onClick={() => c.toggleCompare(e.id)} aria-label="Убрать"><X /></button>
                      <EquipmentArt seed={e.id} category={e.category} label={e.title} />
                      <Link to={`/client/catalog/${e.id}`} className="cl-eq-title" style={{ fontSize: 14, textTransform: 'none', letterSpacing: 0 }}>{e.title}</Link>
                      <button className="btn btn-primary btn-sm btn-block" onClick={() => c.book(e.id)}>Забронировать</button>
                    </div>
                  </th>
                ))}
                {list.length < COMPARE_MAX && <th className="hide-mobile"><Link to="/client/catalog" className="cl-cmp-add"><Plus />Добавить</Link></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const vals = list.map(r.get)
                const nums = vals.filter((v): v is number => typeof v === 'number')
                const best = r.best && nums.length > 1 ? (r.best === 'min' ? Math.min(...nums) : Math.max(...nums)) : undefined
                if (vals.every((v) => v === undefined)) return null
                return (
                  <tr key={r.label}>
                    <td className="cl-cmp-k">{r.label}</td>
                    {vals.map((v, i) => (
                      <td key={i} className={`tnum ${best !== undefined && v === best ? 'cl-best' : ''}`}>
                        {v === undefined ? <span className="muted">—</span> : typeof v === 'number' && r.fmt ? r.fmt(v) : v}
                      </td>
                    ))}
                    {list.length < COMPARE_MAX && <td className="hide-mobile" />}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
