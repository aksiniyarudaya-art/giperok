import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CalendarClock, ClipboardList, CreditCard, Heart, LayoutGrid, Map as MapIcon, MessagesSquare, Repeat2, Route as RouteIcon, Scale } from 'lucide-react'
import { BarChart, EquipmentArt, PageHead, Stat, StatusBadge, dateShort, money, plural } from '../../ui'
import { categoryLabels, type EquipmentCategory } from '../../data/types'
import { availableDate, clientPayments, clientSite, clientThreads } from '../../data/cabinet'
import { useClient } from './ctx'
import { findEq } from './parts'

export default function Dashboard() {
  const c = useClient()
  const nav = useNavigate()
  const month = c.orders.filter((o) => o.date.startsWith('2026-10') && o.status !== 'Отменена')
  const trips = month.reduce((a, o) => a + (findEq(o.equipmentId)?.category === 'dumptruck' ? Math.ceil(o.hours / 2) : 1), 0)
  const active = c.orders.filter((o) => ['Новая', 'В работе', 'На модерации'].includes(o.status)).sort((a, b) => a.date.localeCompare(b.date))
  const toPay = c.orders.filter((o) => o.status !== 'Отменена').reduce((a, o) => a + o.cost - o.paid, 0)
  const pendingDocs = c.docs.filter((d) => d.status !== 'Подписан').length
  const lastMsgs = clientThreads.filter((t) => t.unread).map((t) => ({ t, m: t.msgs[t.msgs.length - 1] }))
  const last = c.orders.find((o) => o.status === 'Выполнена')
  const paidTotal = clientPayments.reduce((a, p) => a + p.value, 0)
  const cmp = c.compare.map((id) => findEq(id)!).filter(Boolean)
  const fav = c.fav.map((id) => findEq(id)!).filter(Boolean)

  return (
    <>
      <PageHead title="Добрый день, Ирина" sub="ООО «СтройМонолит» · договор №ДА-2026/118 · персональный менеджер Бондарь М."
        actions={<>
          <Link to="/client/map" className="btn btn-secondary"><MapIcon />Карта</Link>
          <Link to="/client/catalog" className="btn btn-primary"><LayoutGrid />Найти технику</Link>
        </>} />

      {!c.hasContract && (
        <div className="alert alert-warn" style={{ marginBottom: 16 }}><AlertTriangle /><div className="grow">Договор с платформой не заключён — бронирование недоступно. {c.contractRequested ? 'Заявка отправлена, менеджер на связи.' : ''}</div>
          {!c.contractRequested && <button className="btn btn-primary btn-sm" onClick={c.requestContract}>Заключить договор</button>}</div>
      )}

      <div className="grid g4">
        <Stat icon={<RouteIcon />} label="Рейсов и смен в октябре" value={trips} delta={`${month.length} ${plural(month.length, 'заказ', 'заказа', 'заказов')}, +18% к сентябрю`} trend="up" />
        <Stat icon={<ClipboardList />} label="Активные заказы" value={active.length} delta={`${c.orders.filter((o) => o.status === 'На модерации').length} на модерации`} />
        <Stat icon={<MessagesSquare />} label="Новые сообщения" value={c.unread + pendingDocs} delta={`${c.unread} в чатах · ${pendingDocs} док. на подпись`} />
        <Stat icon={<CreditCard />} label="К оплате" value={money(toPay)} delta="ближайший срок 17.10" trend={toPay ? 'down' : undefined} />
      </div>

      <div className="cl-dash">
        <div className="card">
          <div className="card-head">
            <div><h3>График оплат</h3><div className="muted" style={{ fontSize: 13 }}>Оплачено за 6 мес.: <b className="tnum">{money(paidTotal)}</b></div></div>
            <div className="row" style={{ gap: 14, fontSize: 12 }}><span className="cl-lg"><i style={{ background: 'var(--accent)' }} />Оплачено</span><span className="cl-lg"><i style={{ background: 'var(--steel)' }} />Начислено</span></div>
          </div>
          <BarChart data={clientPayments} height={220} format={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
        </div>

        <div className="card">
          <div className="card-head"><h3>Ближайшие заказы</h3><Link to="/client/orders" className="btn btn-ghost btn-sm">Все<ArrowRight /></Link></div>
          <div className="stack-sm">
            {active.slice(0, 4).map((o) => (
              <button key={o.id} className="cl-row-btn" onClick={() => nav(`/client/orders?tab=${o.status === 'На модерации' ? 'moderation' : 'current'}`)}>
                <div className="cl-date"><b>{new Date(o.date).getDate()}</b><span>{dateShort(o.date).split(' ')[1]}</span></div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{findEq(o.equipmentId)?.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{clientSite(o.siteId)?.name} · {o.start}, {o.hours} ч</div>
                </div>
                <StatusBadge status={o.status} />
              </button>
            ))}
          </div>
          {last && (
            <button className="btn btn-secondary btn-block" style={{ marginTop: 12 }} onClick={() => c.book(last.equipmentId, { siteId: last.siteId, hours: last.hours, start: last.start, fromOrder: last.number })}>
              <Repeat2 />Повторить {last.number} · {clientSite(last.siteId)?.name}
            </button>
          )}
        </div>
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head"><h3><Scale size={16} /> Сравнение</h3><Link to="/client/compare" className="btn btn-ghost btn-sm">Открыть<ArrowRight /></Link></div>
          {cmp.length ? (
            <div className="stack-sm">
              {cmp.map((e) => (
                <Link key={e.id} to={`/client/catalog/${e.id}`} className="cl-mini">
                  <div className="cl-mini-img"><EquipmentArt category={e.category} /></div>
                  <div className="grow" style={{ minWidth: 0 }}><div className="cl-near-t">{e.title}</div><div className="muted" style={{ fontSize: 12 }}>★ {e.rating.toFixed(1)} · {e.city}</div></div>
                  <b className="tnum" style={{ fontSize: 13 }}>{money(e.pricePerHour)}</b>
                </Link>
              ))}
            </div>
          ) : <p className="muted" style={{ fontSize: 14 }}>Пока пусто — добавьте машины из каталога.</p>}
        </div>
        <div className="card">
          <div className="card-head"><h3><Heart size={16} /> Избранное</h3><Link to="/client/favorites" className="btn btn-ghost btn-sm">Все {fav.length}<ArrowRight /></Link></div>
          <div className="stack-sm">
            {fav.slice(0, 4).map((e) => {
              const d = availableDate(e)
              return (
                <Link key={e.id} to={`/client/catalog/${e.id}`} className="cl-mini">
                  <div className="cl-mini-img"><EquipmentArt category={e.category} /></div>
                  <div className="grow" style={{ minWidth: 0 }}><div className="cl-near-t">{e.title}</div><div className="muted" style={{ fontSize: 12 }}>{categoryLabels[e.category as EquipmentCategory]}</div></div>
                  {d ? <span className="badge badge-warn plain"><CalendarClock size={12} />{dateShort(d)}</span> : <span className="badge badge-ok plain">свободна</span>}
                </Link>
              )
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3><MessagesSquare size={16} /> Новые сообщения</h3><Link to="/client/dialogs" className="btn btn-ghost btn-sm">Диалоги<ArrowRight /></Link></div>
          <div className="stack-sm">
            {lastMsgs.map(({ t, m }) => (
              <Link key={t.id} to="/client/dialogs" className="cl-msg">
                <div className="row-between"><b style={{ fontSize: 13 }}>{t.title}</b><span className="badge badge-accent plain">{t.unread}</span></div>
                <div className="dim" style={{ fontSize: 13 }}>{m.text}</div>
              </Link>
            ))}
            {pendingDocs > 0 && <Link to="/client/dialogs?tab=docs" className="cl-msg warn"><b style={{ fontSize: 13 }}>Документы на подпись: {pendingDocs}</b><span className="dim" style={{ fontSize: 13 }}>Акт, счёт и доп. соглашение ждут ЭЦП</span></Link>}
          </div>
        </div>
      </div>
    </>
  )
}
