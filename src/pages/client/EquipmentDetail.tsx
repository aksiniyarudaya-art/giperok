import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, CalendarClock, Check, Clock, Heart, MapPin, Scale, ShieldCheck, Truck } from 'lucide-react'
import { Avatar, EquipmentArt, KV, StatusBadge, Tabs, date, dateShort, money, num, time } from '../../ui'
import { company, emp } from '../../data/mock'
import { categoryOne, workMode } from '../../data/types'
import { availableDate, executors, extrasByCategory, partnerDriver, reviewsFor, specFields, specLabel, specUnit } from '../../data/cabinet'
import { useClient } from './ctx'
import { EqCard, Rating, Stars, catalogItems, findEq } from './parts'
import { CalcWidget } from './CalculatorPage'

type T = 'specs' | 'extras' | 'owner' | 'reviews'

export default function EquipmentDetail() {
  const { id } = useParams()
  const c = useClient()
  const e = findEq(id)
  const [tab, setTab] = useState<T>('specs')
  const [shot, setShot] = useState(0)
  if (!e) return <Navigate to="/client/catalog" replace />
  const from = availableDate(e)
  const owner = company(e.ownerId)
  const ownerRating = executors.find((x) => x.id === e.ownerId)
  const drv = emp(e.driverId) ?? partnerDriver(e.driverId)
  const reviews = reviewsFor(e.id)
  const fav = c.fav.includes(e.id)
  const cmp = c.compare.includes(e.id)
  const similar = catalogItems.filter((x) => x.category === e.category && x.id !== e.id).slice(0, 3)
  const allExtras = extrasByCategory[e.category]

  return (
    <div className="stack" style={{ gap: 20 }}>
      <Link to="/client/catalog" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}><ArrowLeft />Каталог</Link>

      <div className="cl-detail">
        <div className="stack" style={{ minWidth: 0 }}>
          <div className="card cl-gallery">
            <div className="cl-gallery-main" style={{ transform: shot % 2 ? 'scaleX(-1)' : undefined }}><EquipmentArt category={e.category} label={e.title} /></div>
            <div className="cl-thumbs">
              {['Общий вид', 'Сзади', 'Кабина', 'Навесное'].map((l, i) => (
                <button key={l} className={`cl-thumb ${shot === i ? 'on' : ''}`} onClick={() => setShot(i)} aria-label={l}>
                  <div style={{ transform: i % 2 ? 'scaleX(-1)' : undefined }}><EquipmentArt category={e.category} label={l} /></div>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <span className="eyebrow">{categoryOne[e.category]} · учёт: {workMode[e.category]}</span>
              {from ? <span className="badge badge-warn">Доступна с {date(from)}</span> : <span className="badge badge-ok">Свободна сейчас</span>}
            </div>
            <h1 className="cl-h1">{e.title}</h1>
            <div className="row" style={{ gap: 14, marginTop: 8, fontSize: 14 }}>
              <Rating value={e.rating} reviews={e.reviews} />
              <span className="row dim" style={{ gap: 6 }}><MapPin size={15} />{e.address}</span>
            </div>
            <p className="dim" style={{ marginTop: 12 }}>{e.short} Год выпуска {e.year}, наработка {num(e.motoHours)} м/ч. Техника прошла проверку СпецХаб: документы, страховка, технический осмотр.</p>
            <div className="cl-keyspecs">
              {specFields[e.category].filter((k) => e[k] !== undefined).map((k) => (
                <div key={k}><span>{specLabel[k]}</span><b className="tnum">{num(e[k]!, 2)} {specUnit[k]}</b></div>
              ))}
              <div><span>Мин. аренда</span><b className="tnum">{e.minHours} ч</b></div>
            </div>
          </div>

          <div className="card">
            <Tabs<T> value={tab} onChange={setTab} items={[
              { id: 'specs', label: 'Характеристики' },
              { id: 'extras', label: 'Доп. оборудование', count: e.extras.length },
              { id: 'owner', label: 'Владелец' },
              { id: 'reviews', label: 'Отзывы', count: reviews.length },
            ]} />
            <div style={{ paddingTop: 18 }}>
              {tab === 'specs' && (
                <KV items={[
                  ['Категория', categoryOne[e.category]],
                  ['Марка / модель', `${e.brand} ${e.model}`],
                  ['Год выпуска', e.year],
                  ...specFields[e.category].filter((k) => e[k] !== undefined).map((k) => [specLabel[k], `${num(e[k]!, 2)} ${specUnit[k]}`] as [string, string]),
                  ['Моточасы', <span className="tnum">{num(e.motoHours)}</span>],
                  ...(e.mileage ? [['Пробег', `${num(e.mileage)} км`] as [string, string]] : []),
                  ['Цена за час', money(e.pricePerHour)],
                  ['Цена за смену (8 ч)', money(e.pricePerShift)],
                  ['Минимальный заказ', `${e.minHours} ч`],
                  ['Доставка', `${e.deliveryPerKm} BYN/км`],
                  ['Переработка', `${money(e.overtimePerHour)}/ч`],
                  ['Регион', `${e.region}, ${e.city}`],
                ]} />
              )}
              {tab === 'extras' && (
                <div className="stack-sm">
                  {allExtras.map((x) => {
                    const has = e.extras.includes(x)
                    return (
                      <div key={x} className={`cl-extra ${has ? '' : 'off'}`}>
                        {has ? <Check size={16} /> : <span className="cl-extra-dot" />}
                        <span className="grow">{x}</span>
                        {has ? <span className="badge badge-ok plain">в комплекте</span> : <span className="muted" style={{ fontSize: 12 }}>по запросу</span>}
                      </div>
                    )
                  })}
                </div>
              )}
              {tab === 'owner' && (
                <div className="stack">
                  <div className="row">
                    <Avatar name={owner?.name ?? 'Владелец'} size="lg" />
                    <div className="grow">
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{owner?.name}</div>
                      <div className="row" style={{ gap: 8, marginTop: 4 }}><Stars value={ownerRating?.rating ?? owner?.rating ?? 4.7} /><b className="tnum">{(ownerRating?.rating ?? owner?.rating ?? 4.7).toFixed(1)}</b><span className="muted" style={{ fontSize: 13 }}>· {ownerRating?.orders ?? 120} заказов</span></div>
                    </div>
                    <span className="badge badge-ok"><BadgeCheck size={14} />Проверен</span>
                  </div>
                  <KV items={[
                    ['Тип', e.own ? 'Собственный парк платформы' : 'Партнёр-арендодатель'],
                    ['Выход в срок', `${ownerRating?.onTime ?? 96}%`],
                    ['Машинист', drv ? <span className="row" style={{ gap: 8 }}><Avatar name={drv.name} size="sm" />{drv.name}</span> : 'Назначается при подтверждении'],
                    ['Рейтинг машиниста', drv ? `${drv.rating.toFixed(1)} из 5` : '—'],
                    ['Связь', 'Через чат платформы — контакты после подтверждения заказа'],
                  ]} />
                  <div className="alert alert-info"><ShieldCheck /><div>Сделка проходит через СпецХаб: платформа гарантирует выход техники или бесплатную замену в течение 4 часов.</div></div>
                </div>
              )}
              {tab === 'reviews' && (
                <div className="stack">
                  {reviews.map((r) => (
                    <div key={r.id} className="cl-review">
                      <div className="row-between"><div className="row" style={{ gap: 10 }}><Avatar name={r.author} size="sm" /><div><b>{r.author}</b><div className="muted" style={{ fontSize: 12 }}>{r.company}</div></div></div><span className="muted" style={{ fontSize: 12 }}>{dateShort(r.date)}</span></div>
                      <Stars value={r.stars} />
                      <p className="dim" style={{ fontSize: 14 }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="stack cl-detail-side">
          <div className="card">
            <div className="muted" style={{ fontSize: 13 }}>Цена от</div>
            <div className="cl-price lg"><b className="tnum">{money(e.pricePerHour)}</b><span>/час</span></div>
            <div className="muted tnum" style={{ fontSize: 13 }}>{money(e.pricePerShift)} за смену 8 ч · с НДС</div>
            <div className="stack-sm" style={{ margin: '16px 0', fontSize: 14 }}>
              <div className="row" style={{ gap: 8 }}><Clock size={16} className="muted" />Минимальный заказ {e.minHours} ч</div>
              <div className="row" style={{ gap: 8 }}><Truck size={16} className="muted" />Доставка {e.deliveryPerKm} BYN/км</div>
              <div className="row" style={{ gap: 8 }}><MapPin size={16} className="muted" />Гео-метка: {dateShort(e.lastGeoAt)}, {time(e.lastGeoAt)}</div>
            </div>
            {from
              ? <button className="btn btn-primary btn-block btn-lg" onClick={() => c.book(e.id)}><CalendarClock />Забронировать с {dateShort(from)}</button>
              : <button className="btn btn-primary btn-block btn-lg" onClick={() => c.book(e.id)}>Забронировать</button>}
            <div className="row" style={{ marginTop: 10, gap: 8 }}>
              <button className={`btn btn-secondary grow ${fav ? 'cl-on' : ''}`} onClick={() => c.toggleFav(e.id)}><Heart />{fav ? 'В избранном' : 'В избранное'}</button>
              <button className={`btn btn-secondary grow ${cmp ? 'cl-on' : ''}`} onClick={() => c.toggleCompare(e.id)}><Scale />{cmp ? 'В сравнении' : 'Сравнить'}</button>
            </div>
            {!c.hasContract && <div className="alert alert-warn" style={{ marginTop: 12, fontSize: 13 }}>Для бронирования нужен договор с платформой.</div>}
            <div className="row" style={{ marginTop: 12 }}><StatusBadge status={e.status} /><span className="muted" style={{ fontSize: 12 }}>гос. номер скрыт до подтверждения</span></div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Калькулятор</h3></div>
            <CalcWidget e={e} compact />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="stack">
          <h2 className="cl-h2">Похожая техника</h2>
          <div className="cl-grid">{similar.map((x) => <EqCard key={x.id} e={x} />)}</div>
        </section>
      )}
    </div>
  )
}
