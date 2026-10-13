import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarClock, Gauge, Plus, Truck, Wallet } from 'lucide-react'
import { Avatar, DataTable, Donut, EquipmentArt, LineChart, PageHead, Progress, Sparkline, Stat, StatusBadge, dateShort, money, plural, type Col } from '../../ui'
import { partnerDrivers, partnerRevenue, type PartnerDriver } from '../../data/cabinet'
import { payoutBalance, usePartner } from './ctx'
import { inService, loadOf, revenueOf, trendOf } from './util'

export default function Dashboard() {
  const p = usePartner()
  const nav = useNavigate()
  const eqs = p.equipment
  const active = eqs.filter(inService)
  const busy = active.filter((e) => e.status === 'Арендована' || e.status === 'Забронирована')
  const avgLoad = Math.round(active.reduce((a, e) => a + loadOf(e), 0) / Math.max(1, active.length))
  const monthRev = partnerRevenue[partnerRevenue.length - 1].value
  const balance = payoutBalance(p.deals, p.payouts)
  const top = [...active].sort((a, b) => revenueOf(b) - revenueOf(a)).slice(0, 5)
  const maxRev = revenueOf(top[0])
  const fresh = p.orders.filter((o) => o.status === 'Новая')
  const cnt = (s: string) => eqs.filter((e) => e.status === s).length

  const dcols: Col<PartnerDriver>[] = [
    { key: 'n', title: 'Водитель', render: (d) => <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}><Avatar name={d.name} size="sm" /><div><div style={{ fontWeight: 600 }}>{d.name}</div><div className="muted" style={{ fontSize: 12 }}>{d.phone}</div></div></div> },
    { key: 'e', title: 'Техника', render: (d) => eqs.find((e) => e.id === d.equipmentId)?.title ?? '—', hideMobile: true },
    { key: 'o', title: 'Заказы', render: (d) => <span className="tnum">{d.orders}</span>, align: 'r' },
    { key: 'r', title: 'Рейтинг', render: (d) => <b className="tnum">★ {d.rating.toFixed(1)}</b>, align: 'r', nowrap: true },
    { key: 'a', title: 'Адрес сейчас', render: (d) => <span className="dim" style={{ fontSize: 13 }}>{d.address}</span>, hideMobile: true },
    { key: 's', title: 'Статус', render: (d) => <StatusBadge status={d.state === 'Свободен' ? 'Свободна' : d.state} /> },
  ]

  return (
    <>
      <PageHead title="Добрый день, Игорь Михайлович" sub="ООО «ТехноПарк Аренда» · партнёр Гиперок с 2024 года · рейтинг ★ 4.9"
        actions={<button className="btn btn-primary" onClick={() => nav('/partner/equipment?add=1')}><Plus />Добавить технику</button>} />

      <div className="grid g4">
        <Stat icon={<Truck />} label="Моя техника" value={eqs.length} delta={`${active.length} в обороте · ${cnt('На модерации')} на модерации`} />
        <Stat icon={<Gauge />} label="Загрузка парка" value={`${avgLoad}%`} delta={`${busy.length} из ${active.length} ${plural(active.length, 'машины', 'машин', 'машин')} заняты сейчас`} trend="up" />
        <Stat icon={<CalendarClock />} label="Выручка в октябре" value={money(monthRev)} delta="на 13.10 · +12% к темпу сентября" trend="up" />
        <Stat icon={<Wallet />} label="Остаток к выплате" value={money(balance)} delta="ближайшая выплата 15.10" />
      </div>

      <div className="pt-dash">
        <div className="card">
          <div className="card-head"><h3>Выручка по месяцам</h3><span className="muted" style={{ fontSize: 13 }}>до вычета комиссии 10%</span></div>
          <LineChart data={partnerRevenue} height={210} format={(v) => `${Math.round(v / 1000)}k`} />
        </div>
        <div className="card">
          <div className="card-head"><h3>Техника по статусам</h3><Link to="/partner/equipment" className="btn btn-ghost btn-sm">Вся<ArrowRight /></Link></div>
          <Donut center={String(eqs.length)} parts={[
            { label: 'Свободна', value: cnt('Свободна'), color: 'var(--ok)' },
            { label: 'Арендована', value: cnt('Арендована'), color: 'var(--accent)' },
            { label: 'Забронирована', value: cnt('Забронирована'), color: 'var(--steel)' },
            { label: 'На модерации', value: cnt('На модерации'), color: 'var(--warn)' },
            { label: 'Скрыта / архив', value: cnt('Скрытая') + cnt('Архив'), color: 'var(--line-strong)' },
          ]} />
        </div>
      </div>

      <div className="pt-dash even">
        <div className="card">
          <div className="card-head"><h3>Загрузка техники</h3><span className="muted" style={{ fontSize: 13 }}>за 30 дней</span></div>
          <div className="stack-sm">
            {[...active].sort((a, b) => loadOf(b) - loadOf(a)).map((e) => (
              <div key={e.id} className="pt-load">
                <div className="pt-load-t"><span>{e.title}</span><StatusBadge status={e.status} /></div>
                <Progress value={loadOf(e)} tone={loadOf(e) >= 70 ? 'ok' : undefined} />
                <b className="tnum">{loadOf(e)}%</b>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Топ прибыльных машин</h3><span className="muted" style={{ fontSize: 13 }}>выручка за 30 дней</span></div>
          <div className="stack-sm">
            {top.map((e, i) => (
              <div key={e.id} className="pt-top">
                <span className={`pt-rank ${i === 0 ? 'gold' : ''}`}>{i + 1}</span>
                <div className="pt-top-img"><EquipmentArt category={e.category} /></div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }} className="pt-ell">{e.title}</div>
                  <div className="pt-top-bar"><span style={{ width: `${(revenueOf(e) / maxRev) * 100}%` }} /></div>
                </div>
                <span className="hide-mobile"><Sparkline values={trendOf(e)} width={70} /></span>
                <b className="tnum" style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{money(revenueOf(e))}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      {fresh.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head"><h3>Новые заказы <span className="badge badge-info plain">{fresh.length}</span></h3><Link to="/partner/orders" className="btn btn-ghost btn-sm">К заказам<ArrowRight /></Link></div>
          <div className="pt-fresh">
            {fresh.map((o) => (
              <button key={o.id} className="pt-fresh-i" onClick={() => nav(`/partner/orders?open=${o.id}`)}>
                <div className="row-between"><b className="mono">{o.number}</b><span className="muted" style={{ fontSize: 12 }}>{dateShort(o.date)}, {o.start}</span></div>
                <div style={{ fontWeight: 600 }}>{eqs.find((e) => e.id === o.equipmentId)?.title}</div>
                <div className="muted" style={{ fontSize: 13 }}>{o.client} · {o.site}</div>
                <div className="row-between"><b className="tnum">{money(o.amount)}</b><span className="btn btn-primary btn-sm">Рассмотреть</span></div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="stack" style={{ marginTop: 16 }}>
        <div className="row-between"><h3 style={{ fontSize: 16 }}>Водители</h3><span className="muted" style={{ fontSize: 13 }}>{partnerDrivers.filter((d) => d.state === 'На смене').length} на смене · адреса по последней гео-метке</span></div>
        <DataTable cols={dcols} rows={partnerDrivers} rowKey={(d) => d.id} />
      </div>
    </>
  )
}
