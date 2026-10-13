import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, FileSignature, Phone } from 'lucide-react'
import { Field, Modal, StatusBadge, date, money, useToast } from '../../ui'
import { TODAY } from '../../data/mock'
import { availableDate, clientSites, isoPlus } from '../../data/cabinet'
import type { Order } from '../../data/types'
import { useClient, type BookPrefill } from './ctx'
import { calcCost, findEq } from './parts'

const times = Array.from({ length: 33 }, (_, i) => `${String(6 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`).slice(0, 33)
const wd = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

export default function BookingModal({ equipmentId, prefill, onClose }: { equipmentId: string; prefill?: BookPrefill; onClose: () => void }) {
  const c = useClient()
  const toast = useToast()
  const nav = useNavigate()
  const e = findEq(equipmentId)!
  const from = availableDate(e) ?? TODAY
  const first = from > TODAY ? from : isoPlus(1)
  const [d, setD] = useState(first)
  const [start, setStart] = useState(prefill?.start ?? '08:00')
  const [hours, setHours] = useState(Math.max(prefill?.hours ?? 8, e.minHours))
  const [shifts, setShifts] = useState(1)
  const [siteId, setSiteId] = useState(prefill?.siteId ?? clientSites[0].id)
  const [newAddr, setNewAddr] = useState('')
  const [km, setKm] = useState(18)
  const [comment, setComment] = useState(prefill?.comment ?? '')
  const [done, setDone] = useState<Order | null>(null)

  if (!c.hasContract) {
    return (
      <Modal title="Нужен договор аренды" onClose={onClose} footer={<>
        <button className="btn btn-ghost" onClick={() => toast('Звонок менеджеру: +375 (44) 582-11-11 (демо)')}><Phone />Позвонить</button>
        {c.contractRequested
          ? <button className="btn btn-secondary" onClick={onClose}>Понятно</button>
          : <button className="btn btn-primary" onClick={() => { c.requestContract(); onClose() }}><FileSignature />Заключить договор</button>}
      </>}>
        <div className="alert alert-warn"><AlertTriangle /><div>Бронирование <b>{e.title}</b> доступно только компаниям с действующим договором на платформе Гиперок. Он гарантирует выход техники на объект и фиксирует цены.</div></div>
        <ol className="cl-steps">
          <li><b>Оставьте заявку</b><span>Проверим реквизиты по УНП — 10 минут.</span></li>
          <li><b>Подпишите договор в ЭДО</b><span>Документ придёт в раздел «Диалоги → Документы на подпись».</span></li>
          <li><b>Бронируйте в 3 клика</b><span>Дата, время, объект — и заказ уходит на модерацию.</span></li>
        </ol>
        {c.contractRequested && <div className="alert alert-info"><CheckCircle2 /><div>Заявка на договор уже отправлена. Менеджер свяжется с вами в течение часа.</div></div>}
      </Modal>
    )
  }

  const cost = calcCost(e, { hours, shifts, km, overtime: 0, weekend: [0, 6].includes(new Date(d).getDay()) })
  const site = clientSites.find((s) => s.id === siteId)
  const days = Array.from({ length: 14 }, (_, i) => isoPlus(i + 1))

  if (done) {
    return (
      <Modal title="Заказ создан" onClose={onClose} footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Закрыть</button>
        <button className="btn btn-primary" onClick={() => { onClose(); nav('/client/orders?tab=moderation') }}>Перейти к заказу</button>
      </>}>
        <div className="cl-done">
          <CheckCircle2 />
          <h3>Заказ {done.number} отправлен</h3>
          <p className="muted">{e.title} · {date(done.date)} с {done.start} · {done.hours} ч</p>
          <StatusBadge status="На модерации" />
          <p className="dim" style={{ fontSize: 14 }}>Менеджер подтвердит технику и водителя в течение 30 минут. Счёт придёт в «Диалоги».</p>
        </div>
      </Modal>
    )
  }

  const submit = () => {
    if (siteId === 'new' && !newAddr.trim()) { toast('Укажите адрес нового объекта'); return }
    const o: Order = {
      id: `co-${Date.now()}`, number: `К-${3140 + c.orders.length}`, date: d, start, hours, equipmentId: e.id, clientId: 'c1',
      siteId: siteId === 'new' ? 'cs7' : siteId, managerId: 'e2', driverId: e.driverId ?? 'd1', status: 'На модерации', pay: 'Долг',
      cost: cost.total, paid: 0, delivery: cost.delivery, docs: ['Заявка'], comment: siteId === 'new' ? `Новый объект: ${newAddr}. ${comment}` : comment,
    }
    c.addOrder(o)
    setDone(o)
    toast(prefill?.fromOrder ? `Заказ ${prefill.fromOrder} повторён` : 'Заказ отправлен на модерацию')
  }

  return (
    <Modal wide title={prefill?.fromOrder ? `Повтор заказа ${prefill.fromOrder}` : 'Бронирование техники'} onClose={onClose} footer={<>
      <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
      <button className="btn btn-primary" onClick={submit}>Забронировать · {money(cost.total)}</button>
    </>}>
      <div className="cl-book">
        <div className="stack">
          <div className="row" style={{ gap: 10 }}>
            <div className="grow"><div style={{ fontWeight: 700 }}>{e.title}</div><div className="muted" style={{ fontSize: 13 }}>{e.address}</div></div>
            <span className="badge badge-ok">Договор №ДА-2026/118</span>
          </div>
          <Field label="Дата начала" required hint={from > TODAY ? `Техника занята до ${date(from)}` : 'Ближайшие 14 дней'}>
            <div className="cl-days">
              {days.map((x) => {
                const busy = x < from
                const dd = new Date(x)
                return (
                  <button key={x} type="button" disabled={busy} className={`cl-day ${d === x ? 'on' : ''} ${[0, 6].includes(dd.getDay()) ? 'we' : ''}`} onClick={() => setD(x)}>
                    <span>{wd[dd.getDay()]}</span><b>{dd.getDate()}</b>
                  </button>
                )
              })}
            </div>
            <input type="date" className="input" value={d} min={first} onChange={(ev) => ev.target.value && setD(ev.target.value)} aria-label="Дата" />
          </Field>
          <div className="grid g3">
            <Field label="Время подачи" required>
              <select className="select" value={start} onChange={(ev) => setStart(ev.target.value)}>{times.map((t) => <option key={t}>{t}</option>)}</select>
            </Field>
            <Field label="Часов в смене" required hint={`минимум ${e.minHours} ч`}>
              <input type="number" className="input" min={e.minHours} max={24} value={hours} onChange={(ev) => setHours(Math.max(1, +ev.target.value))} />
            </Field>
            <Field label="Смен">
              <input type="number" className="input" min={1} max={30} value={shifts} onChange={(ev) => setShifts(Math.max(1, +ev.target.value))} />
            </Field>
          </div>
          <Field label="Объект" required>
            <select className="select" value={siteId} onChange={(ev) => setSiteId(ev.target.value)}>
              {clientSites.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.address}</option>)}
              <option value="new">+ Новый объект</option>
            </select>
          </Field>
          {siteId === 'new' && <Field label="Адрес нового объекта" required><input className="input" value={newAddr} onChange={(ev) => setNewAddr(ev.target.value)} placeholder="Город, улица, дом" /></Field>}
          <Field label={`Расстояние доставки: ${km} км`} hint="Рассчитано от базы техники до объекта, туда и обратно">
            <input type="range" className="range" min={0} max={150} value={km} onChange={(ev) => setKm(+ev.target.value)} aria-label="Расстояние доставки" />
          </Field>
          <Field label="Комментарий для водителя и менеджера">
            <textarea className="textarea" value={comment} onChange={(ev) => setComment(ev.target.value)} placeholder="Пропуск, особенности въезда, контакт прораба" />
          </Field>
        </div>
        <aside className="card-flat cl-book-sum">
          <div className="eyebrow">Стоимость</div>
          <div className="cl-sum-line"><span>Работа: {money(e.pricePerHour)} × {cost.billedHours} ч × {shifts}</span><b className="tnum">{money(cost.base)}</b></div>
          <div className="cl-sum-line"><span>Доставка: {km} км × 2 × {e.deliveryPerKm} BYN</span><b className="tnum">{money(cost.delivery)}</b></div>
          {cost.weekend > 0 && <div className="cl-sum-line"><span>Выходной день +20%</span><b className="tnum">{money(cost.weekend)}</b></div>}
          <div className="cl-sum-line muted"><span>Переработка</span><span className="tnum">{money(e.overtimePerHour)}/ч</span></div>
          <div className="cl-sum-total"><span>Итого</span><b className="tnum">{money(cost.total)}</b></div>
          <div className="muted" style={{ fontSize: 12 }}>в т. ч. НДС 20% — {money(cost.vat)}</div>
          <hr className="cl-hr" />
          <div className="stack-sm" style={{ fontSize: 13 }}>
            <div><span className="muted">Подача:</span> {date(d)}, {start}</div>
            <div><span className="muted">Объект:</span> {siteId === 'new' ? newAddr || '—' : site?.name}</div>
            <div><span className="muted">После отправки:</span> <StatusBadge status="На модерации" /></div>
          </div>
        </aside>
      </div>
    </Modal>
  )
}
