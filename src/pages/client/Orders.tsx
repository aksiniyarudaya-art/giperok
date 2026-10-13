import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Ban, CreditCard, Download, FileText, MessagesSquare, Plus, Repeat2, Star } from 'lucide-react'
import { DataTable, Drawer, EquipmentArt, KV, PageHead, SearchInput, Stat, StatusBadge, Tabs, date, money, plural, useToast, type Col, EqThumb } from '../../ui'
import { emp } from '../../data/mock'
import type { Order } from '../../data/types'
import { clientSite, partnerDriver } from '../../data/cabinet'
import { useClient } from './ctx'
import { findEq } from './parts'

type T = 'current' | 'moderation' | 'payment' | 'done' | 'cancelled'
const inTab: Record<T, (o: Order) => boolean> = {
  current: (o) => o.status === 'Новая' || o.status === 'В работе',
  moderation: (o) => o.status === 'На модерации',
  payment: (o) => o.status === 'Ожидает оплаты',
  done: (o) => o.status === 'Выполнена',
  cancelled: (o) => o.status === 'Отменена',
}
const steps = ['На модерации', 'Новая', 'В работе', 'Ожидает оплаты', 'Выполнена']
const stepLabel: Record<string, string> = { 'На модерации': 'Модерация', 'Новая': 'Подтверждён', 'В работе': 'В работе', 'Ожидает оплаты': 'Оплата', 'Выполнена': 'Выполнен' }

export default function Orders() {
  const c = useClient()
  const toast = useToast()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const tab = (sp.get('tab') as T) || 'current'
  const setTab = (t: T) => setSp({ tab: t }, { replace: true })
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const open = c.orders.find((o) => o.id === openId)

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return c.orders.filter(inTab[tab]).filter((o) => !s || `${o.number} ${findEq(o.equipmentId)?.title} ${clientSite(o.siteId)?.name}`.toLowerCase().includes(s))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [c.orders, tab, q])
  const cnt = (t: T) => c.orders.filter(inTab[t]).length
  const toPay = c.orders.reduce((a, o) => a + (o.status !== 'Отменена' ? o.cost - o.paid : 0), 0)
  const typical = c.orders.filter((o) => o.status === 'Выполнена' && clientSite(o.siteId)?.typical).slice(0, 3)

  const repeat = (o: Order) => { setOpenId(null); c.book(o.equipmentId, { siteId: o.siteId, hours: o.hours, start: o.start, comment: o.comment, fromOrder: o.number }) }

  const cols: Col<Order>[] = [
    { key: 'n', title: '№', render: (o) => <b className="mono">{o.number}</b>, nowrap: true },
    { key: 'd', title: 'Дата', render: (o) => <span className="tnum">{date(o.date)}<span className="muted"> · {o.start}</span></span>, nowrap: true },
    { key: 'e', title: 'Техника', render: (o) => <EqThumb eq={findEq(o.equipmentId)}><span style={{ fontWeight: 500 }}>{findEq(o.equipmentId)?.title}</span></EqThumb> },
    { key: 's', title: 'Объект', render: (o) => clientSite(o.siteId)?.name, hideMobile: true },
    { key: 'h', title: 'Часы', render: (o) => <span className="tnum">{o.hours}</span>, align: 'r', hideMobile: true },
    { key: 'c', title: 'Сумма', render: (o) => <b className="tnum">{money(o.cost)}</b>, align: 'r', nowrap: true },
    { key: 'p', title: 'Оплата', render: (o) => o.status === 'Отменена' ? <span className="muted">—</span> : <StatusBadge status={o.pay} />, hideMobile: true },
    { key: 'st', title: 'Статус', render: (o) => <StatusBadge status={o.status} /> },
  ]

  const si = open ? steps.indexOf(open.status) : -1
  const e = open && findEq(open.equipmentId)
  const drv = open && (emp(open.driverId) ?? partnerDriver(open.driverId))

  return (
    <>
      <PageHead title="Мои заказы" sub="Текущие, на модерации, ожидающие оплаты и выполненные заказы, документы по каждому"
        actions={<button className="btn btn-primary" onClick={() => nav('/client/catalog')}><Plus />Новый заказ</button>} />

      <div className="grid g4" style={{ marginBottom: 20 }}>
        <Stat label="В работе сейчас" value={cnt('current')} delta="подтверждено и на объекте" />
        <Stat label="На модерации" value={cnt('moderation')} delta="подтвердим за 30 минут" />
        <Stat label="К оплате" value={money(toPay)} delta={`${cnt('payment')} ${plural(cnt('payment'), 'счёт', 'счёта', 'счетов')} ожидают`} trend={toPay ? 'down' : undefined} />
        <Stat label="Выполнено" value={cnt('done')} delta="за последние 30 дней" trend="up" />
      </div>

      {typical.length > 0 && (
        <div className="card-flat cl-repeat" style={{ marginBottom: 20 }}>
          <div><div style={{ fontWeight: 700 }}>Повторить для типового объекта</div><div className="muted" style={{ fontSize: 13 }}>Та же техника, объект и время — в один клик</div></div>
          <div className="row" style={{ gap: 8 }}>
            {typical.map((o) => <button key={o.id} className="btn btn-secondary btn-sm" onClick={() => repeat(o)}><Repeat2 />{findEq(o.equipmentId)?.title} → {clientSite(o.siteId)?.name}</button>)}
          </div>
        </div>
      )}

      <div className="stack">
        <Tabs<T> value={tab} onChange={setTab} items={[
          { id: 'current', label: 'Текущие', count: cnt('current') },
          { id: 'moderation', label: 'На модерации', count: cnt('moderation') },
          { id: 'payment', label: 'Ожидают оплаты', count: cnt('payment') },
          { id: 'done', label: 'Выполненные', count: cnt('done') },
          { id: 'cancelled', label: 'Отменённые', count: cnt('cancelled') },
        ]} />
        <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Номер заказа, техника, объект" /></div>
        <DataTable cols={cols} rows={rows} rowKey={(o) => o.id} onRow={(o) => setOpenId(o.id)} empty="В этой вкладке заказов нет" />
      </div>

      {open && e && (
        <Drawer title={`Заказ ${open.number}`} sub={`${date(open.date)}, подача ${open.start}`} onClose={() => setOpenId(null)} footer={<>
          {(open.status === 'На модерации' || open.status === 'Новая') && <button className="btn btn-danger" onClick={() => { c.updateOrder({ ...open, status: 'Отменена' }); toast(`Заказ ${open.number} отменён`) }}><Ban />Отменить</button>}
          {open.status === 'Ожидает оплаты' && <button className="btn btn-ok" onClick={() => { c.updateOrder({ ...open, status: 'Выполнена', pay: 'Оплачено', paid: open.cost }); toast('Оплата прошла, заказ закрыт') }}><CreditCard />Оплатить {money(open.cost - open.paid)}</button>}
          {open.status === 'Выполнена' && <button className="btn btn-secondary" onClick={() => nav('/client/ratings?rate=' + open.id)}><Star />Оценить</button>}
          <button className="btn btn-primary" onClick={() => repeat(open)}><Repeat2 />Повторить заказ</button>
        </>}>
          <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 120, flex: 'none' }}><EquipmentArt seed={e.id} category={e.category} label={e.title} /></div>
            <div className="grow stack-sm">
              <StatusBadge status={open.status} />
              <b style={{ fontSize: 16 }}>{e.title}</b>
              <span className="muted" style={{ fontSize: 13 }}>{clientSite(open.siteId)?.address}</span>
            </div>
          </div>

          {open.status !== 'Отменена' && (
            <div className="cl-track">
              {steps.map((s, i) => <div key={s} className={`cl-track-s ${i <= si ? 'done' : ''} ${i === si ? 'cur' : ''}`}><span />{stepLabel[s]}</div>)}
            </div>
          )}

          <KV items={[
            ['Объект', clientSite(open.siteId)?.name],
            ['Подача', `${date(open.date)}, ${open.start}`],
            ['Длительность', `${open.hours} ч`],
            ['Машинист', drv ? `${drv.name} · ★ ${drv.rating.toFixed(1)}` : 'Назначается'],
            ['Менеджер', emp(open.managerId)?.name],
            ['Доставка', money(open.delivery)],
            ['Стоимость', <b className="tnum">{money(open.cost)}</b>],
            ['Оплачено', <span className="tnum">{money(open.paid)} {open.status !== 'Отменена' && <StatusBadge status={open.pay} />}</span>],
            ['Комментарий', open.comment || '—'],
          ]} />

          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Документы</div>
            <div className="stack-sm">
              {open.docs.map((d) => (
                <div key={d} className="cl-doc">
                  <FileText size={18} />
                  <div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>{d}</div><div className="muted" style={{ fontSize: 12 }}>PDF · {open.number} · {date(open.date)}</div></div>
                  {(d.startsWith('Акт') || d === 'Счёт') && open.status !== 'Выполнена'
                    ? <button className="btn btn-secondary btn-sm" onClick={() => nav('/client/dialogs?tab=docs')}>На подпись</button>
                    : <button className="btn btn-ghost btn-icon btn-sm" onClick={() => toast(`Скачивание: ${d} ${open.number}.pdf`)} aria-label={`Скачать ${d}`}><Download /></button>}
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={() => nav('/client/dialogs')}><MessagesSquare />Написать в поддержку по заказу</button>
        </Drawer>
      )}
    </>
  )
}
