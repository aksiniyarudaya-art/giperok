import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BellRing, Check, CheckCheck, Download, FileText, Send, X } from 'lucide-react'
import { DataTable, Drawer, EquipmentArt, Field, KV, Modal, PageHead, SearchInput, Stat, StatusBadge, Tabs, date, money, useToast, type Col } from '../../ui'
import { partnerDriver, partnerDrivers, type PartnerOrder, type PartnerOrderStatus } from '../../data/cabinet'
import { usePartner } from './ctx'

type T = 'new' | 'await' | 'paid' | 'done' | 'rejected'
const st: Record<T, PartnerOrderStatus> = { new: 'Новая', await: 'Ожидает оплаты', paid: 'Оплачено', done: 'Выполнена', rejected: 'Отклонена' }
const reasons = ['Техника занята в эти даты', 'Техника на ТО', 'Нет свободного машиниста', 'Слишком далеко от базы', 'Другое']

export default function Orders() {
  const p = usePartner()
  const toast = useToast()
  const [sp, setSp] = useSearchParams()
  const [tab, setTab] = useState<T>('new')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(sp.get('open'))
  const [reject, setReject] = useState<{ o: PartnerOrder; reason: string; text: string } | null>(null)
  const [drv, setDrv] = useState<Record<string, string>>({})
  const open = p.orders.find((o) => o.id === openId)
  const eqOf = (id: string) => p.equipment.find((e) => e.id === id)

  const rows = useMemo(() => p.orders.filter((o) => o.status === st[tab])
    .filter((o) => `${o.number} ${o.client} ${o.site} ${eqOf(o.equipmentId)?.title}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date)), [p.orders, p.equipment, tab, q]) // eslint-disable-line react-hooks/exhaustive-deps
  const cnt = (t: T) => p.orders.filter((o) => o.status === st[t]).length
  const sum = (t: T) => p.orders.filter((o) => o.status === st[t]).reduce((a, o) => a + o.amount, 0)

  const close = () => { setOpenId(null); if (sp.get('open')) setSp({}, { replace: true }) }
  const move = (o: PartnerOrder, status: PartnerOrderStatus, msg: string, extra: Partial<PartnerOrder> = {}) => { p.updateOrder({ ...o, status, ...extra }); toast(msg) }

  const cols: Col<PartnerOrder>[] = [
    { key: 'n', title: '№', render: (o) => <b className="mono">{o.number}</b>, nowrap: true },
    { key: 'd', title: 'Дата', render: (o) => <span className="tnum">{date(o.date)}<span className="muted"> · {o.start}</span></span>, nowrap: true },
    { key: 'e', title: 'Техника', render: (o) => <span style={{ fontWeight: 500 }}>{eqOf(o.equipmentId)?.title}</span> },
    { key: 'c', title: 'Клиент', render: (o) => o.client, hideMobile: true },
    { key: 's', title: 'Объект', render: (o) => <span className="dim">{o.site}</span>, hideMobile: true },
    { key: 'h', title: 'Часы', render: (o) => <span className="tnum">{o.hours}</span>, align: 'r', hideMobile: true },
    { key: 'a', title: 'Сумма', render: (o) => <b className="tnum">{money(o.amount)}</b>, align: 'r', nowrap: true },
    { key: 'st', title: 'Статус', render: (o) => <StatusBadge status={o.status} />, hideMobile: true },
  ]
  const e = open && eqOf(open.equipmentId)
  const curDrv = open ? drv[open.id] ?? e?.driverId ?? '' : ''

  return (
    <>
      <PageHead title="Заказы" sub="Заявки клиентов на вашу технику: примите новые, контролируйте оплату и закрывайте выполненные" />
      <div className="grid g4" style={{ marginBottom: 20 }}>
        <Stat label="Новые" value={cnt('new')} delta={`на ${money(sum('new'))}`} />
        <Stat label="Ожидается оплата" value={money(sum('await'))} delta={`${cnt('await')} заказа`} trend={sum('await') ? 'down' : undefined} />
        <Stat label="Оплачено, в работе" value={money(sum('paid'))} delta={`${cnt('paid')} заказа`} trend="up" />
        <Stat label="Выполнено за 30 дней" value={cnt('done')} delta={money(sum('done'))} />
      </div>
      <div className="stack">
        <Tabs<T> value={tab} onChange={setTab} items={[
          { id: 'new', label: 'Новые', count: cnt('new') },
          { id: 'await', label: 'Ожидается оплата', count: cnt('await') },
          { id: 'paid', label: 'Оплаченные', count: cnt('paid') },
          { id: 'done', label: 'Выполненные', count: cnt('done') },
          { id: 'rejected', label: 'Отклонённые', count: cnt('rejected') },
        ]} />
        <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Номер, клиент, объект, техника" /></div>
        <DataTable cols={cols} rows={rows} rowKey={(o) => o.id} onRow={(o) => setOpenId(o.id)} empty="Заказов в этой вкладке нет" />
      </div>

      {open && e && (
        <Drawer title={`Заказ ${open.number}`} sub={`${open.client}`} onClose={close} footer={<>
          {open.status === 'Новая' && <>
            <button className="btn btn-danger" onClick={() => setReject({ o: open, reason: reasons[0], text: '' })}><X />Отклонить</button>
            <button className="btn btn-primary" onClick={() => { move(open, 'Ожидает оплаты', 'Заказ принят — клиенту выставлен счёт', { docs: ['Договор-заявка', 'Счёт'] }); setTab('await') }}><Check />Принять</button>
          </>}
          {open.status === 'Ожидает оплаты' && <>
            <button className="btn btn-secondary" onClick={() => toast('Напоминание об оплате отправлено клиенту')}><BellRing />Напомнить</button>
            <button className="btn btn-ok" onClick={() => move(open, 'Оплачено', 'Оплата подтверждена платформой', { docs: [...open.docs, 'Платёжное поручение'] })}><Check />Оплата получена</button>
          </>}
          {open.status === 'Оплачено' && <button className="btn btn-primary" onClick={() => move(open, 'Выполнена', 'Заказ закрыт, путевой лист и акт прикреплены', { docs: ['Договор-заявка', 'Путевой лист', 'Акт', 'Счёт'] })}><CheckCheck />Отметить выполненным</button>}
        </>}>
          <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 110, flex: 'none' }}><EquipmentArt category={e.category} /></div>
            <div className="grow stack-sm"><StatusBadge status={open.status} /><b>{e.title}</b><span className="muted" style={{ fontSize: 13 }}>{e.plate}</span></div>
          </div>
          {open.reason && <div className="alert alert-bad">Причина отказа: {open.reason}</div>}
          <KV items={[
            ['Клиент', open.client],
            ['Контакт', open.contact],
            ['Объект', open.site],
            ['Адрес', open.address],
            ['Подача', `${date(open.date)}, ${open.start}`],
            ['Длительность', `${open.hours} ч`],
            ['Сумма', <b className="tnum">{money(open.amount)}</b>],
            ['Комиссия платформы', money(Math.round(open.amount * 0.1))],
            ['К выплате вам', <b className="tnum" style={{ color: 'var(--ok)' }}>{money(open.amount - Math.round(open.amount * 0.1))}</b>],
            ['Комментарий клиента', open.comment || '—'],
          ]} />
          {(open.status === 'Новая' || open.status === 'Ожидает оплаты' || open.status === 'Оплачено') && (
            <div className="card-flat stack-sm">
              <Field label="Машинист на заказ">
                <select className="select" value={curDrv} onChange={(x) => setDrv({ ...drv, [open.id]: x.target.value })}>
                  <option value="">Не назначен</option>
                  {partnerDrivers.map((d) => <option key={d.id} value={d.id}>{d.name} · ★ {d.rating}</option>)}
                </select>
              </Field>
              <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={!curDrv} onClick={() => toast(`Детали объекта отправлены ${partnerDriver(curDrv)?.name.split(' ')[0]} в Telegram`)}><Send />Отправить водителю</button>
            </div>
          )}
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Документы</div>
            <div className="stack-sm">
              {open.docs.map((d) => (
                <div key={d} className="pt-doc"><FileText size={18} /><span className="grow">{d}</span><button className="btn btn-ghost btn-icon btn-sm" aria-label={`Скачать ${d}`} onClick={() => toast(`Скачивание: ${d} ${open.number}.pdf`)}><Download /></button></div>
              ))}
            </div>
          </div>
        </Drawer>
      )}

      {reject && (
        <Modal title={`Отклонить заказ ${reject.o.number}`} onClose={() => setReject(null)} footer={<>
          <button className="btn btn-ghost" onClick={() => setReject(null)}>Отмена</button>
          <button className="btn btn-danger" onClick={() => { move(reject.o, 'Отклонена', 'Заказ отклонён, клиенту предложим другую технику', { reason: reject.reason === 'Другое' ? reject.text || 'Другое' : reject.reason }); setReject(null); close() }}>Отклонить</button>
        </>}>
          <Field label="Причина" required>
            <select className="select" value={reject.reason} onChange={(x) => setReject({ ...reject, reason: x.target.value })}>{reasons.map((r) => <option key={r}>{r}</option>)}</select>
          </Field>
          {reject.reason === 'Другое' && <Field label="Комментарий"><textarea className="textarea" value={reject.text} onChange={(x) => setReject({ ...reject, text: x.target.value })} /></Field>}
          <div className="muted" style={{ fontSize: 13 }}>Частые отказы снижают позицию техники в каталоге.</div>
        </Modal>
      )}
    </>
  )
}
