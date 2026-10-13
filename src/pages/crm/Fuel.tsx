import { useState } from 'react'
import { AlertTriangle, Ban, Camera, Check, CreditCard, Flag, Fuel as FuelIcon, Gauge, Plus, Search, X } from 'lucide-react'
import type { CrmPageProps, CrmRole } from './types'
import { DataTable, Drawer, Field, KV, Modal, PageHead, SearchInput, Stat, StatusBadge, Tabs, Badge, dateShort, money, num, time, uid, useList, useToast, type Col } from '../../ui'
import { drivers, emp, eq, equipment, site, sites } from '../../data/mock'
import { categoryOne } from '../../data/types'
import { FUEL_PRICE, fuelNorm, fuelReqs, fuelStage, type FuelReq, type FuelStage, type FuelStatus } from '../../data/crm-a'
import { AdminActions } from './Equipment'
import './crm-a.css'

const short = (n?: string) => (n ? n.split(' ').slice(0, 2).join(' ') : '—')
const NOW = '2026-10-13T11:30:00'

/** Сверка: факт по чеку vs топливная карта vs норматив по виду работ. */
function fuelCheck(f: FuelReq) {
  const e = eq(f.eqId)
  if (!e || !f.hoursWorked) return null
  const normRate = fuelNorm[e.category]
  const norm = normRate * f.hoursWorked
  const over = Math.round(((f.liters - norm) / norm) * 100)
  const cardDiff = f.cardLiters !== undefined ? f.liters - f.cardLiters : 0
  return { normRate, norm, rate: +(f.liters / f.hoursWorked).toFixed(1), over, flag: over > 15, cardDiff }
}

const statusTone = (s: FuelStatus) => s === 'Расследование' || s === 'Заблокирована' ? <Badge tone="bad">{s}</Badge> : s === 'Утверждена' || s === 'Заправлена' ? <Badge tone="accent">{s}</Badge> : s === 'На сверке' ? <Badge tone="warn">{s}</Badge> : <StatusBadge status={s === 'Подтверждена' ? 'Завершено' : s} />

export default function FuelPage({ role }: CrmPageProps) {
  const toast = useToast()
  const list = useList<FuelReq>(fuelReqs)
  const [tab, setTab] = useState<FuelStage>('Новые')
  const [q, setQ] = useState('')
  const [fEq, setFEq] = useState(''), [fDrv, setFDrv] = useState(''), [fSite, setFSite] = useState('')
  const [onlyFlag, setOnlyFlag] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [form, setForm] = useState<FuelReq | null>(null)

  const inTab = (t: FuelStage) => list.rows.filter((f) => fuelStage(f.status) === t)
  const rows = inTab(tab).filter((f) => (!q || `${eq(f.eqId)?.title} ${emp(f.driverId)?.name} ${f.station}`.toLowerCase().includes(q.toLowerCase())) &&
    (!fEq || f.eqId === fEq) && (!fDrv || f.driverId === fDrv) && (!fSite || f.siteId === fSite) && (!onlyFlag || fuelCheck(f)?.flag)).sort((a, b) => b.date.localeCompare(a.date))
  const flags = list.rows.filter((f) => fuelCheck(f)?.flag && f.status !== 'Подтверждена' && f.status !== 'Заблокирована')
  const week = list.rows.filter((f) => f.status !== 'Отклонена' && f.status !== 'Новая')
  const cur = list.rows.find((f) => f.id === open)

  const cols: Col<FuelReq>[] = [
    { key: 'd', title: 'Дата', nowrap: true, render: (f) => <div><b className="tnum">{dateShort(f.date)}</b><div className="muted tnum" style={{ fontSize: 12 }}>{time(f.date)}</div></div> },
    { key: 'e', title: 'Техника', render: (f) => { const e = eq(f.eqId); return <div><b>{e?.title}</b><div className="muted mono" style={{ fontSize: 12 }}>{e?.plate}</div></div> } },
    { key: 'dr', title: 'Водитель', hideMobile: true, render: (f) => short(emp(f.driverId)?.name) },
    { key: 'l', title: 'Литры', align: 'r', render: (f) => <span className="tnum">{f.liters} л</span> },
    { key: 'c', title: 'Стоимость', align: 'r', hideMobile: true, render: (f) => <span className="tnum">{money(f.liters * f.price)}</span> },
    { key: 'n', title: 'Расход / норма', hideMobile: true, render: (f) => { const c = fuelCheck(f); return c ? (c.flag ? <span className="ca-flag"><Flag />+{c.over}% · {c.rate} л/ч</span> : <span className="tnum" style={{ fontSize: 13 }}>{c.rate} / {c.normRate} л/ч</span>) : <span className="muted">—</span> } },
    { key: 'doc', title: 'Документы', hideMobile: true, render: (f) => f.receipt ? <span className="row" style={{ gap: 6 }}><Badge tone="ok" plain>чек</Badge><Badge tone="ok" plain>моточасы</Badge></span> : <span className="muted" style={{ fontSize: 13 }}>нет</span> },
    { key: 's', title: 'Статус', render: (f) => statusTone(f.status) },
  ]

  return (
    <div className="stack">
      <PageHead title="Заправка" sub="Заявки водителей, сверка чеков с топливными картами и нормами расхода"
        actions={<button className="btn btn-primary" onClick={() => setForm({ id: uid('f'), date: NOW, eqId: equipment.find((e) => e.own)!.id, driverId: drivers[0].id, siteId: sites[0].id, liters: 100, price: FUEL_PRICE, status: 'Новая', receipt: false, motoBefore: 0, motoAfter: 0, hoursWorked: 0, station: 'Белоруснефть АЗС №41', comment: '' })}><Plus />Добавить заявку</button>} />

      <div className="ca-stats">
        <Stat icon={<FuelIcon />} label="Новые заявки" value={inTab('Новые').length} delta="ждут утверждения" />
        <Stat label="В работе" value={inTab('В работе').length} delta={`${list.rows.filter((f) => f.status === 'На сверке').length} на сверке`} />
        <Stat label="Заправлено за неделю" value={`${num(week.reduce((a, f) => a + f.liters, 0))} л`} delta={money(week.reduce((a, f) => a + f.liters * f.price, 0))} />
        <Stat icon={<Flag />} label="Перерасход > 15%" value={flags.length} delta="нужно расследование" trend="down" />
      </div>

      {flags.map((f) => (
        <div key={f.id} className="ca-crit" style={{ cursor: 'pointer' }} onClick={() => setOpen(f.id)}>
          <Flag />
          <div className="grow"><b>Перерасход +{fuelCheck(f)!.over}%</b> — {eq(f.eqId)?.title}, {short(emp(f.driverId)?.name)}, {dateShort(f.date)}
            <div className="s">{f.status === 'Расследование' ? `Идёт расследование: ${f.investigation ?? ''}` : 'Менеджер обязан провести расследование: слив или поломка.'}</div></div>
        </div>
      ))}

      <Tabs value={tab} onChange={setTab} items={(['Новые', 'В работе', 'Архивные'] as FuelStage[]).map((t) => ({ id: t, label: t, count: inTab(t).length }))} />
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Техника, водитель, АЗС" />
        <select className="select" value={fEq} onChange={(e) => setFEq(e.target.value)} aria-label="Техника"><option value="">Вся техника</option>{[...new Set(list.rows.map((f) => f.eqId))].map((id) => <option key={id} value={id}>{eq(id)?.title}</option>)}</select>
        <select className="select" value={fDrv} onChange={(e) => setFDrv(e.target.value)} aria-label="Водитель"><option value="">Все водители</option>{drivers.map((d) => <option key={d.id} value={d.id}>{short(d.name)}</option>)}</select>
        <select className="select" value={fSite} onChange={(e) => setFSite(e.target.value)} aria-label="Объект"><option value="">Все объекты</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <label className="check" style={{ fontSize: 13 }}><input type="checkbox" checked={onlyFlag} onChange={(e) => setOnlyFlag(e.target.checked)} />Только перерасход</label>
      </div>

      <DataTable cols={cols} rows={rows} rowKey={(f) => f.id} onRow={(f) => setOpen(f.id)} empty="Заявок нет" />

      {cur && <FuelCard role={role} f={cur} onClose={() => setOpen(null)} onUpdate={(f, msg) => { list.update(f); toast(msg) }} />}
      {form && (
        <Modal title="Новая заявка на заправку" onClose={() => setForm(null)} footer={<>
          <button className="btn btn-ghost" onClick={() => setForm(null)}>Отмена</button>
          <button className="btn btn-primary" disabled={form.liters <= 0} onClick={() => { list.add(form); setForm(null); setTab('Новые'); toast('Заявка на заправку создана') }}>Создать</button>
        </>}>
          <div className="grid g2">
            <Field label="Дата и время"><input className="input" type="datetime-local" value={form.date.slice(0, 16)} onChange={(e) => setForm({ ...form, date: `${e.target.value}:00` })} /></Field>
            <Field label="Техника" required><select className="select" value={form.eqId} onChange={(e) => setForm({ ...form, eqId: e.target.value, driverId: eq(e.target.value)?.driverId ?? form.driverId })}>{equipment.filter((e) => e.own).map((e) => <option key={e.id} value={e.id}>{e.title} · {e.plate}</option>)}</select></Field>
            <Field label="Водитель" required><select className="select" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>{drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
            <Field label="Объект"><select className="select" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })}>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
            <Field label="Количество литров" required><input className="input" type="number" value={form.liters} onChange={(e) => setForm({ ...form, liters: Number(e.target.value) })} /></Field>
            <Field label="АЗС / топливозаправщик"><input className="input" value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })} /></Field>
          </div>
          <div className="muted" style={{ fontSize: 13 }}>Ориентировочная стоимость: <b className="tnum">{money(form.liters * form.price)}</b> ({FUEL_PRICE} BYN/л)</div>
          <Field label="Комментарий"><textarea className="textarea" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  )
}

function FuelCard({ role, f, onClose, onUpdate }: { role: CrmRole; f: FuelReq; onClose: () => void; onUpdate: (f: FuelReq, msg: string) => void }) {
  const [inv, setInv] = useState(false)
  const [invKind, setInvKind] = useState<'Слив' | 'Поломка'>('Слив')
  const [invText, setInvText] = useState('')
  const e = eq(f.eqId)
  const c = fuelCheck(f)
  const closed = f.status === 'Подтверждена' || f.status === 'Отклонена' || f.status === 'Заблокирована'
  return (
    <Drawer title={`Заправка · ${e?.title}`} sub={`${dateShort(f.date)}, ${time(f.date)} · ${emp(f.driverId)?.name}`} onClose={onClose} footer={!closed ? <>
      {f.status !== 'Расследование' && <button className="btn btn-danger" onClick={() => onUpdate({ ...f, status: 'Заблокирована' }, 'Заправки водителя заблокированы до разбирательства')}><Ban />Заблокировать</button>}
      {f.status === 'Новая' && <>
        <button className="btn btn-secondary" onClick={() => onUpdate({ ...f, status: 'Отклонена' }, 'Заявка отклонена')}><X />Отклонить</button>
        <button className="btn btn-primary" onClick={() => onUpdate({ ...f, status: 'Утверждена' }, 'Заправка утверждена · водителю отправлено уведомление в Telegram')}><Check />Утвердить</button>
      </>}
      {f.status === 'Утверждена' && <button className="btn btn-primary" onClick={() => onUpdate({ ...f, status: 'Заправлена', receipt: true, motoBefore: e?.motoHours ?? 0, motoAfter: (e?.motoHours ?? 0) + 9, hoursWorked: 9 }, 'Водитель загрузил фото чека и моточасов')}><Camera />Демо: водитель загрузил чек</button>}
      {f.status === 'Заправлена' && <button className="btn btn-primary" onClick={() => onUpdate({ ...f, status: 'На сверке', cardLiters: f.cardLiters ?? f.liters }, 'Данные получены из кабинета топливной карты')}><CreditCard />Сверить с топливной картой</button>}
      {f.status === 'На сверке' && <>
        {c?.flag && <button className="btn btn-dark" onClick={() => setInv(true)}><Search />Начать расследование (слив/поломка)</button>}
        <button className="btn btn-primary" disabled={!!c?.flag || (c?.cardDiff ?? 0) !== 0} onClick={() => onUpdate({ ...f, status: 'Подтверждена' }, 'Заправка подтверждена и передана в бухгалтерию')}><Check />Подтвердить</button>
      </>}
      {f.status === 'Расследование' && <>
        <button className="btn btn-secondary" onClick={() => onUpdate({ ...f, status: 'Подтверждена', investigation: `${f.investigation ?? ''} Итог: поломка, создана заявка на ТО.` }, 'Итог: поломка · создана заявка на ТО механику')}>Итог: поломка → ТО</button>
        <button className="btn btn-danger" onClick={() => onUpdate({ ...f, status: 'Заблокирована', investigation: `${f.investigation ?? ''} Итог: слив топлива, штраф.` }, 'Итог: слив · водитель заблокирован, штраф передан в «Мотивацию»')}><Ban />Итог: слив → блокировка</button>
      </>}
    </> : undefined}>
      {c?.flag && (
        <div className="ca-crit"><Flag /><div><b>Красный флаг: расход выше нормы на {c.over}%</b><div className="s">Норма для «{categoryOne[e!.category]}» — {c.normRate} л/моточас. Менеджер обязан провести расследование: слив или поломка.</div></div></div>
      )}
      {c && c.cardDiff !== 0 && <div className="alert alert-warn"><AlertTriangle /><div>Чек и топливная карта расходятся на <b>{Math.abs(c.cardDiff)} л</b>.</div></div>}
      <div className="row">{statusTone(f.status)}</div>
      <KV items={[
        ['Дата', `${dateShort(f.date)}, ${time(f.date)}`],
        ['Техника', `${e?.title} · ${e?.plate}`],
        ['Водитель', emp(f.driverId)?.name],
        ['Объект', site(f.siteId)?.name],
        ['Количество литров', <span className="tnum">{f.liters} л</span>],
        ['Стоимость', <span className="tnum">{money(f.liters * f.price)} · {f.price} BYN/л</span>],
        ['АЗС', f.station],
        ['Статус', f.status],
        ['Комментарий', f.comment || '—'],
      ]} />
      <div className="stack-sm"><b>Документы</b>
        <div className="grid g2" style={{ gap: 10 }}>
          <div className={`ca-doc ${f.receipt ? 'has' : ''}`}><Camera />{f.receipt ? <>Фото чека<br /><b className="tnum">{f.liters} л · {money(f.liters * f.price)}</b></> : 'Фото чека не загружено'}</div>
          <div className={`ca-doc ${f.receipt ? 'has' : ''}`}><Gauge />{f.receipt ? <>Фото моточасов<br /><b className="tnum">{num(f.motoAfter)} м/ч</b></> : 'Моточасы не загружены'}</div>
        </div>
      </div>
      {c ? (
        <div className="card-flat stack-sm">
          <b>Сверка факта и чека</b>
          <div className="ca-cmp">
            <div><div className="l">Чек водителя</div><div className="n">{f.liters} л</div></div>
            <div><div className="l">Топливная карта</div><div className={`n ${c.cardDiff ? 'bad' : ''}`}>{f.cardLiters !== undefined ? `${f.cardLiters} л` : '—'}</div></div>
            <div><div className="l">Норма ({f.hoursWorked} м/ч)</div><div className="n">{Math.round(c.norm)} л</div></div>
          </div>
          <div className="ca-meter">
            <span className="muted">Моточасы: {num(f.motoBefore)} → {num(f.motoAfter)}</span><span className="tnum">{f.hoursWorked} ч</span>
            <span className="muted">Фактический расход</span><span className={`tnum ${c.flag ? 'ca-flag' : ''}`}>{c.rate} л/ч ({c.over > 0 ? '+' : ''}{c.over}%)</span>
          </div>
        </div>
      ) : <div className="alert alert-info">Сверка станет доступна после загрузки чека и моточасов водителем.</div>}
      {f.investigation && <div className="card-flat"><b>Расследование</b><div style={{ fontSize: 14, marginTop: 4 }}>{f.investigation}</div></div>}
      {inv && (
        <div className="card-flat stack-sm">
          <b>Расследование перерасхода</b>
          <div className="seg">{(['Слив', 'Поломка'] as const).map((k) => <button key={k} type="button" className={invKind === k ? 'on' : ''} onClick={() => setInvKind(k)}>Версия: {k.toLowerCase()}</button>)}</div>
          <Field label="Что проверяем"><textarea className="textarea" value={invText} onChange={(ev) => setInvText(ev.target.value)} placeholder={invKind === 'Слив' ? 'Запросить видео АЗС, GPS-трек, опросить водителя' : 'Механику: диагностика топливной системы, форсунок'} /></Field>
          <div className="row"><button className="btn btn-dark" onClick={() => onUpdate({ ...f, status: 'Расследование', investigation: `Версия: ${invKind.toLowerCase()}. ${invText}` }, invKind === 'Поломка' ? 'Расследование начато · механик назначен на диагностику' : 'Расследование начато · заправки водителя на контроле')}>Начать</button><button className="btn btn-ghost" onClick={() => setInv(false)}>Отмена</button></div>
        </div>
      )}
      <AdminActions role={role} what="Заявка на заправку" onCancel={() => onUpdate({ ...f, status: 'Новая' }, 'Статус сброшен')} onArchive={() => onUpdate({ ...f, status: 'Подтверждена' }, 'В архиве')} onBlock={() => onUpdate({ ...f, status: 'Заблокирована' }, 'Заблокировано')} />
    </Drawer>
  )
}
