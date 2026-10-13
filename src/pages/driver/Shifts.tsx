import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Ban, CalendarCheck2, CalendarClock, CheckCircle2, ClipboardCheck, FileText, Gauge, History, Info, MapPin, MessageCircle, Play, Route as RouteIcon, ShieldAlert, Truck, Wrench } from 'lucide-react'
import { EquipmentArt, KV, num, Seg, StatusBadge } from '../../ui'
import { assignments, eqAdmission, myEq, myMechanic, remarks, restrictions, shiftHistory, todayShift, waybills, week, type PlanDay, type ShiftRecord, type Waybill } from '../../data/driver'
import { eq, site } from '../../data/mock'
import { categoryOne } from '../../data/types'
import { Group, Row, Sheet } from './kit'
import { dur, hoursStr, shiftTimes, useDriver, useNow } from './store'

type Tab = 'shifts' | 'waybills' | 'equipment'
const wd = (iso: string, o: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(iso + 'T12:00:00').toLocaleDateString('ru-RU', o)
const dayTone = (s: PlanDay['status']) => (s === 'Текущая' ? 'accent' : s === 'Выполнена' ? 'ok' : s === 'Запланирована' ? 'info' : undefined)

export default function Shifts() {
  const loc = useLocation()
  const [tab, setTab] = useState<Tab>((loc.state as { tab?: Tab } | null)?.tab ?? 'shifts')
  return (
    <div className="drv-pad stack">
      <div className="drv-segwrap">
        <Seg value={tab} onChange={setTab} items={[{ id: 'shifts', label: 'Смены' }, { id: 'waybills', label: 'Путевые листы' }, { id: 'equipment', label: 'Техника' }]} />
      </div>
      {tab === 'shifts' && <ShiftsTab />}
      {tab === 'waybills' && <WaybillsTab />}
      {tab === 'equipment' && <EquipmentTab />}
    </div>
  )
}

/* ---------------- Смены / рейсы / вахты ---------------- */
function ShiftsTab() {
  const nav = useNavigate()
  const { session, toast } = useDriver()
  const now = useNow()
  const t = shiftTimes(session, now)
  const [day, setDay] = useState<PlanDay | null>(null)
  const [rec, setRec] = useState<ShiftRecord | null>(null)
  const [confirmed, setConfirmed] = useState<Record<string, 'yes' | 'no'>>({ '2026-10-14': 'yes' })
  const [kind, setKind] = useState<'all' | 'смена' | 'рейс' | 'вахта'>('all')
  const hist = shiftHistory.filter((h) => kind === 'all' || h.kind === kind)
  const exitStatus = session.phase === 'active' ? 'На смене' : session.phase === 'done' ? 'Завершена' : 'Не начата'

  return (
    <>
      <div className="drv-tiles">
        <div><span>Смен в октябре</span><b className="tnum">9</b></div>
        <div><span>Отработано</span><b className="tnum">91 ч</b></div>
        <div><span>Ремонтные</span><b className="tnum">5,5 ч</b></div>
      </div>

      <Group title="Текущая смена" flush>
        <div className="drv-card">
          <div className="row-between">
            <span className="eyebrow">Сегодня · {todayShift.kind} · {todayShift.orderNo}</span>
            <StatusBadge status={exitStatus} />
          </div>
          <h3 className="drv-card-title">{todayShift.site.name}</h3>
          <div className="drv-meta"><MapPin />{todayShift.site.address}</div>
          <div className="drv-meta"><CalendarClock />{todayShift.start}–{todayShift.end} · {todayShift.client}</div>
          {session.startedAt && <div className="drv-meta"><Play />В работе <b className="mono">{dur(t.work)}</b> · пауза {dur(t.pause, false)}</div>}
          <button className="btn btn-primary btn-lg btn-block" disabled={session.phase === 'done'} onClick={() => nav('/driver/shift')}>
            <Play />{session.phase === 'idle' ? 'Начать смену' : session.phase === 'active' ? 'Открыть смену' : 'Смена завершена'}
          </button>
        </div>
      </Group>

      <Group title="График на неделю · 12–18 октября">
        {week.map((d) => (
          <Row key={d.date} onClick={() => setDay(d)}
            icon={<span className="drv-daynum">{new Date(d.date + 'T12:00:00').getDate()}</span>} tone={dayTone(d.status)}
            title={d.siteId ? site(d.siteId)?.name : 'Выходной'}
            sub={d.siteId ? `${wd(d.date, { weekday: 'long' })} · ${d.start}–${d.end}${d.note ? ' · изменено' : ''}` : wd(d.date, { weekday: 'long' })}
            right={d.status === 'Запланирована' && confirmed[d.date] === 'yes' ? <span className="badge badge-ok">Выйду</span> : d.status === 'Запланирована' && confirmed[d.date] === 'no' ? <span className="badge badge-bad">Не выйду</span> : <StatusBadge status={d.status} />} />
        ))}
      </Group>

      <Group title="История" action={
        <div className="drv-chips">
          {(['all', 'смена', 'рейс', 'вахта'] as const).map((k) => (
            <button key={k} type="button" className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{k === 'all' ? 'Все' : k[0].toUpperCase() + k.slice(1) + 'ы'}</button>
          ))}
        </div>
      }>
        {hist.length === 0 && <Row icon={<History />} title="Нет записей этого типа" sub="Рейсы назначаются на самосвалы и манипуляторы" chevron={false} />}
        {hist.map((h) => (
          <Row key={h.id} onClick={() => setRec(h)} icon={h.status === 'Выполнена' ? <CheckCircle2 /> : <Ban />} tone={h.status === 'Выполнена' ? 'ok' : 'warn'}
            title={`${wd(h.date)} · ${site(h.siteId)?.name}`}
            sub={h.status === 'Выполнена' ? `${h.kind} · ${hoursStr(h.worked)} работы${h.repair ? ` · ремонт ${hoursStr(h.repair)}` : ''}` : h.status}
            right={<span className="drv-time mono">{h.orderNo}</span>} />
        ))}
      </Group>

      {day && (
        <Sheet title={day.siteId ? site(day.siteId)!.name : 'Выходной'} sub={wd(day.date, { weekday: 'long', day: 'numeric', month: 'long' })} onClose={() => setDay(null)}
          footer={day.status === 'Запланирована' ? (
            <>
              <button className="btn btn-secondary btn-lg grow" onClick={() => { setConfirmed((s) => ({ ...s, [day.date]: 'no' })); toast('Менеджер получит уведомление о невыходе', 'warn'); setDay(null) }}>Не выйду</button>
              <button className="btn btn-primary btn-lg grow" onClick={() => { setConfirmed((s) => ({ ...s, [day.date]: 'yes' })); toast('Выход подтверждён'); setDay(null) }}>Подтвердить выход</button>
            </>
          ) : day.status === 'Текущая' ? <button className="btn btn-primary btn-lg btn-block" onClick={() => nav('/driver/shift')}><Play />Перейти к смене</button> : undefined}>
          {day.siteId ? (
            <>
              <KV items={[
                ['Тип', day.kind], ['Время', `${day.start}–${day.end}`], ['Заказ', day.orderNo], ['Адрес', site(day.siteId)?.address],
                ['Контакт', site(day.siteId)?.contacts], ['Режим объекта', site(day.siteId)?.schedule], ['Ограничения', site(day.siteId)?.limits || '—'],
                ['Техника', `${myEq.title} · ${myEq.plate}`], ['Статус', <StatusBadge key="s" status={day.status} />],
              ]} />
              {day.note && <div className="alert alert-warn"><Info />{day.note}</div>}
              {site(day.siteId)?.notes && <div className="alert alert-info"><Info />{site(day.siteId)?.notes}</div>}
            </>
          ) : <p className="muted">Смена не назначена. Если хотите выйти в этот день — напишите менеджеру в чат.</p>}
        </Sheet>
      )}

      {rec && (
        <Sheet title={`${rec.kind[0].toUpperCase() + rec.kind.slice(1)} ${wd(rec.date, { day: 'numeric', month: 'long' })}`} sub={site(rec.siteId)?.name} onClose={() => setRec(null)}>
          <div className="drv-tiles">
            <div><span>Работа</span><b className="tnum">{hoursStr(rec.worked)}</b></div>
            <div><span>Пауза</span><b className="tnum">{hoursStr(rec.pause)}</b></div>
            <div><span>Ремонт</span><b className="tnum">{hoursStr(rec.repair)}</b></div>
          </div>
          <KV items={[
            ['Статус', <StatusBadge key="s" status={rec.status} />], ['Заказ', rec.orderNo], ['Путевой лист', rec.waybill],
            ['Моточасы', `${num(rec.motoStart, 1)} → ${num(rec.motoEnd, 1)}`], ['Адрес', site(rec.siteId)?.address],
          ]} />
          {rec.repair > 0 && <div className="alert alert-info"><Wrench />Ремонтные часы учтены в табеле отдельно: не выставляются клиенту, оплачиваются в зарплате.</div>}
        </Sheet>
      )}
    </>
  )
}

/* ---------------- Путевые листы ---------------- */
function WaybillsTab() {
  const nav = useNavigate()
  const { session } = useDriver()
  const [open, setOpen] = useState<Waybill | null>(null)
  const active = waybills[0]
  const hist = waybills.slice(1)
  const monthMoto = hist.reduce((a, w) => a + ((w.motoEnd ?? w.motoStart) - w.motoStart), 0)
  const monthKm = hist.reduce((a, w) => a + w.km, 0)
  const wbState = session.wb.accepted ? 'Принят' : session.wb.manualSent ? 'На модерации' : session.wb.front ? 'Фото загружено' : 'Не оформлен'

  return (
    <>
      <div className="drv-tiles">
        <div><span>Моточасы, окт.</span><b className="tnum">{num(monthMoto, 1)}</b></div>
        <div><span>Перегоны, км</span><b className="tnum">{monthKm}</b></div>
        <div><span>Листов</span><b className="tnum">{hist.length}</b></div>
      </div>

      <Group title="Активный путевой лист" flush>
        <div className="drv-card">
          <div className="row-between"><b className="mono">{session.wb.number || active.number}</b><StatusBadge status={session.wb.accepted ? 'Активный' : wbState === 'На модерации' ? 'На модерации' : 'Новый'} /></div>
          <KV items={[
            ['Дата', new Date(active.date).toLocaleDateString('ru-RU')], ['Техника', `${myEq.title} · ${myEq.plate}`], ['Объект', site(active.siteId)?.name],
            ['Нач. моточасы', session.wb.moto || num(active.motoStart, 1)], ['Оформление', wbState],
          ]} />
          {!session.wb.accepted && session.phase !== 'done' && (
            <button className="btn btn-primary btn-lg btn-block" onClick={() => nav('/driver/shift')}><FileText />Сфотографировать путевой лист</button>
          )}
        </div>
      </Group>

      <Group title="История путевых листов">
        {hist.map((w) => (
          <Row key={w.id} onClick={() => setOpen(w)} icon={<FileText />} tone={w.status === 'На модерации' ? 'warn' : undefined}
            title={<span className="mono">{w.number}</span>}
            sub={`${wd(w.date)} · ${num((w.motoEnd ?? w.motoStart) - w.motoStart, 1)} м/ч${w.km ? ` · ${w.km} км` : ''}`}
            right={<StatusBadge status={w.status} />} />
        ))}
      </Group>

      {open && (
        <Sheet title={open.number} sub={wd(open.date, { weekday: 'long', day: 'numeric', month: 'long' })} onClose={() => setOpen(null)}>
          <KV items={[
            ['Статус', <StatusBadge key="s" status={open.status} />], ['Объект', site(open.siteId)?.name], ['Техника', `${myEq.title} · ${myEq.plate}`],
            ['Моточасы нач.', num(open.motoStart, 1)], ['Моточасы кон.', num(open.motoEnd ?? open.motoStart, 1)],
            ['Наработка', `${num((open.motoEnd ?? open.motoStart) - open.motoStart, 1)} м/ч`], ['Пробег (перегон)', `${open.km} км`], ['Расход топлива', `${open.fuel} л`],
          ]} />
          {open.status === 'На модерации' && <div className="alert alert-warn"><Info />Показания, введённые вручную, расходятся с распознанными на 0,5 м/ч — лист проверяет менеджер.</div>}
        </Sheet>
      )}
    </>
  )
}

/* ---------------- Техника ---------------- */
function EquipmentTab() {
  const nav = useNavigate()
  const { session, toast } = useDriver()
  const accepted = session.phase !== 'idle' && Object.keys(session.photos).length >= 6
  return (
    <>
      <Group title="Текущая техника" flush>
        <button type="button" className="drv-eqcard" onClick={() => nav('/driver/equipment')}>
          <div className="drv-eqcard-img"><EquipmentArt seed={myEq.id} category={myEq.category} label={myEq.title} /></div>
          <div className="drv-eqcard-main">
            <b>{myEq.title}</b><span className="mono">{myEq.plate}</span>
            <span className="drv-row-sub">{categoryOne[myEq.category]} · {myEq.year} г. · {num(myEq.motoHours)} м/ч</span>
            <StatusBadge status="Допущен" />
          </div>
        </button>
      </Group>

      <Group title="Приём / сдача">
        <Row icon={<ClipboardCheck />} tone={accepted ? 'ok' : 'accent'} title={accepted ? 'Принята сегодня' : 'Приём на 13.10 не выполнен'}
          sub={accepted ? 'Чек-лист ТМЦ и фото 360° сохранены' : 'Чек-лист ТМЦ + фото 360° перед сменой'}
          onClick={() => nav('/driver/shift')} />
        <Row icon={<Truck />} title="Сдать технику" sub={session.phase === 'active' ? 'Шаг 4 рабочей смены: фото возврата и показания' : 'Доступно после начала смены'}
          onClick={() => {
            if (session.phase === 'active') nav('/driver/shift')
            else toast(session.phase === 'done' ? 'Техника уже сдана сегодня' : 'Сначала примите технику и начните смену', 'warn')
          }} />
      </Group>

      <Group title="Ограничения от механика">
        {restrictions.map((r) => (
          <Row key={r.id} icon={<ShieldAlert />} tone="warn" title={r.text} sub={`${r.by} · ${r.until === 'постоянно' ? 'постоянно' : 'до ' + new Date(r.until).toLocaleDateString('ru-RU')}`} chevron={false} />
        ))}
      </Group>

      <Group title="История закреплений">
        {assignments.map((a) => {
          const e = eq(a.eqId)
          return (
            <Row key={a.id} icon={<CalendarCheck2 />} tone={a.to ? undefined : 'ok'} title={`${e?.title} · ${e?.plate}`}
              sub={`${new Date(a.from).toLocaleDateString('ru-RU')} — ${a.to ? new Date(a.to).toLocaleDateString('ru-RU') : 'по н. в.'} · ${a.returned || a.accepted}`}
              right={a.to ? <StatusBadge status="Архив" /> : <StatusBadge status="Текущий" />} chevron={false} />
          )
        })}
      </Group>
    </>
  )
}

/* ---------------- Карточка техники ---------------- */
export function EquipmentCard() {
  const nav = useNavigate()
  const e = myEq
  return (
    <div className="stack drv-pb">
      <div className="drv-eq-hero">
        <EquipmentArt seed={e.id} category={e.category} label={e.title} />
        <span className="drv-photo-count">Фото · 6</span>
      </div>
      <div className="drv-pad stack">
        <div>
          <div className="eyebrow">{categoryOne[e.category]} · {e.year} г.</div>
          <h2 className="drv-h2">{e.title}</h2>
          <div className="row" style={{ marginTop: 8 }}>
            <span className="drv-plate mono">{e.plate}</span>
            <StatusBadge status="Допущен" />
          </div>
        </div>
        <div className="drv-tiles">
          <div><span>Моточасы</span><b className="tnum">{num(e.motoHours)}</b></div>
          <div><span>До {eqAdmission.nextService}</span><b className="tnum">{eqAdmission.nextServiceIn} м/ч</b></div>
          <div><span>Ковш</span><b className="tnum">{String(e.bucket ?? '—').replace('.', ',')} м³</b></div>
        </div>
        <Group title="Допуск механика" flush>
          <div className="drv-card">
            <KV items={[
              ['Статус', <StatusBadge key="s" status={eqAdmission.status} />], ['Действует до', new Date(eqAdmission.until).toLocaleDateString('ru-RU') + ' (до ТО-250)'],
              ['Последнее ЕТО', eqAdmission.lastEto], ['Выдал допуск', eqAdmission.by], ['Масса', `${e.capacity} т`], ['Вылет стрелы', `${String(e.boom).replace('.', ',')} м`],
              ['Навесное', e.extras.join(', ')],
            ]} />
          </div>
        </Group>
        <Group title="Замечания механика">
          {remarks.map((r) => (
            <Row key={r.id} icon={r.level === 'ok' ? <CheckCircle2 /> : r.level === 'warn' ? <ShieldAlert /> : <Gauge />} tone={r.level === 'ok' ? 'ok' : r.level === 'warn' ? 'warn' : 'info'}
              title={r.text} sub={`${new Date(r.date).toLocaleDateString('ru-RU')} · ${r.by}`} chevron={false} />
          ))}
        </Group>
        <Group title="Ограничения">
          {restrictions.map((r) => <Row key={r.id} icon={<ShieldAlert />} tone="warn" title={r.text} sub={r.by} chevron={false} />)}
        </Group>
        <div className="drv-actions">
          <button className="btn btn-secondary btn-lg" onClick={() => nav('/driver/requests', { state: { create: 'ТО' } })}><Wrench />Заявка на ТО</button>
          <button className="btn btn-secondary btn-lg" onClick={() => nav('/driver/requests', { state: { create: 'Ремонт' } })}><RouteIcon />Поломка</button>
          <button className="btn btn-dark btn-lg drv-span2" onClick={() => nav('/driver/chats/c-mech')}><MessageCircle />Написать механику · {myMechanic.name.split(' ').slice(0, 2).join(' ')}</button>
        </div>
      </div>
    </div>
  )
}
