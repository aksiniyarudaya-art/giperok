import { useState } from 'react'
import { ArrowLeft, Check, FileText, Link2, Pencil, Plus, Trash2, Truck, Wallet, X } from 'lucide-react'
import type { CrmPageProps, CrmRole } from './types'
import { DataTable, Drawer, EquipmentArt, Field, KV, Modal, PageHead, SearchInput, Seg, Stat, StatusBadge, Tabs, date, dateShort, money, num, uid, useList, useToast, type Col } from '../../ui'
import { companies, emp, equipment, orders, site } from '../../data/mock'
import { categoryLabels, categoryOne, type Company, type EquipmentCategory } from '../../data/types'
import { landlordEqStatus, partnerManagers, partnerSites, type LandlordEqStatus, type PartnerManager, type PartnerPay, type PartnerSite } from '../../data/crm-a'
import { AdminActions, EqForm, type EqRow } from './Equipment'
import { CompanyForm } from './Tenants'
import './crm-a.css'

type LTab = 'eq' | 'history' | 'managers' | 'sites'
const eqTabs: LandlordEqStatus[] = ['Свободная', 'На модерации', 'В работе', 'Отклонённая', 'Архив']
type Row = EqRow & { lstatus: LandlordEqStatus; reason?: string }
const seedStatus: Record<string, LandlordEqStatus> = { eq16: 'Отклонённая', eq24: 'Архив', eq19: 'На модерации' }
const short = (n?: string) => (n ? n.split(' ').slice(0, 2).join(' ') : '—')

export default function Landlords({ role }: CrmPageProps) {
  const toast = useToast()
  const cos = useList<Company>(companies.filter((c) => c.kind === 'landlord' && c.id !== 'own'))
  const eqs = useList<Row>(equipment.filter((e) => !e.own).map((e) => ({ ...e, lstatus: seedStatus[e.id] ?? landlordEqStatus(e), reason: seedStatus[e.id] === 'Отклонённая' ? 'Нет действующей страховки и техосмотра' : undefined })))
  const mgrs = useList<PartnerManager>(partnerManagers)
  const psites = useList<PartnerSite>(partnerSites)
  const [paid, setPaid] = useState<Record<string, PartnerPay>>({})
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string | null>(null)
  const [tab, setTab] = useState<LTab>('eq')
  const [etab, setEtab] = useState<LandlordEqStatus>('Свободная')
  const [cat, setCat] = useState<'' | EquipmentCategory>('')
  const [eqQ, setEqQ] = useState('')
  const [payF, setPayF] = useState<'' | PartnerPay>('')
  const [coForm, setCoForm] = useState<{ c: Company; isNew: boolean } | null>(null)
  const [eqForm, setEqForm] = useState<{ item?: Row } | null>(null)
  const [eqOpen, setEqOpen] = useState<string | null>(null)
  const [mForm, setMForm] = useState<PartnerManager | null>(null)
  const [sForm, setSForm] = useState<PartnerSite | null>(null)

  const co = cos.rows.find((c) => c.id === sel)
  const byOwner = (id: string) => eqs.rows.filter((e) => e.ownerId === id)
  const history = (id: string) => orders.filter((o) => byOwner(id).some((e) => e.id === o.equipmentId) && o.status !== 'Отменена' && o.status !== 'Новая').map((o) => {
    const e = eqs.rows.find((x) => x.id === o.equipmentId)!
    const sum = (e.rentCostForUs ?? 0) * o.hours + Math.round(o.delivery * 0.8)
    const base: PartnerPay = o.pay === 'Оплачено' ? 'Оплачено' : o.date < '2026-10-06' ? 'Долг' : 'Не оплачено'
    return { ...o, eqTitle: e.title, sum, ppay: paid[o.id] ?? base }
  })
  const toPay = (id: string) => history(id).filter((h) => h.ppay !== 'Оплачено').reduce((a, h) => a + h.sum, 0)

  if (!co) {
    const rows = cos.rows.filter((c) => !q || `${c.name} ${c.unp}`.toLowerCase().includes(q.toLowerCase()))
    const cols: Col<Company>[] = [
      { key: 'n', title: 'Арендодатель', render: (c) => <div><b>{c.name}</b><div className="muted" style={{ fontSize: 12 }}>{c.type} · {c.legalAddress}</div></div> },
      { key: 'u', title: 'УНП', hideMobile: true, render: (c) => <span className="mono">{c.unp}</span> },
      { key: 'e', title: 'Техника', align: 'r', render: (c) => <span className="tnum">{byOwner(c.id).filter((e) => e.lstatus === 'В работе').length} / {byOwner(c.id).length}</span> },
      { key: 'm', title: 'Модерация', hideMobile: true, render: (c) => { const n = byOwner(c.id).filter((e) => e.lstatus === 'На модерации').length; return n ? <span className="badge badge-warn">{n} на проверке</span> : <span className="muted">—</span> } },
      { key: 'k', title: 'Договор', hideMobile: true, render: (c) => c.hasContract ? <StatusBadge status="Подписан" /> : <span className="badge badge-warn">Нет договора</span> },
      { key: 'p', title: 'К выплате', align: 'r', render: (c) => <span className="tnum">{money(toPay(c.id))}</span> },
      { key: 'r', title: 'Рейтинг', align: 'r', hideMobile: true, render: (c) => `${c.rating} ★` },
    ]
    return (
      <div className="stack">
        <PageHead title="Арендодатели" sub="Партнёры, которые сдают технику через платформу: техника, модерация, выплаты"
          actions={<button className="btn btn-primary" onClick={() => setCoForm({ c: { ...companies[5], id: uid('l'), name: '', unp: '', legalAddress: '', director: '', representative: '', phone: '+375 ', email: '', bank: '', hasContract: false, debt: 0, rating: 5, site: '' }, isNew: true })}><Plus />Добавить юрлицо</button>} />
        <div className="ca-stats">
          <Stat icon={<Truck />} label="Партнёров" value={cos.rows.length} delta={`${cos.rows.filter((c) => c.hasContract).length} с договором`} />
          <Stat label="Привлечённая техника" value={eqs.rows.length} delta={`${eqs.rows.filter((e) => e.lstatus === 'В работе').length} в работе`} />
          <Stat label="На модерации" value={eqs.rows.filter((e) => e.lstatus === 'На модерации').length} delta="ждут проверки" trend="down" />
          <Stat icon={<Wallet />} label="К выплате партнёрам" value={money(cos.rows.reduce((a, c) => a + toPay(c.id), 0))} />
        </div>
        <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Название или УНП" /></div>
        <DataTable cols={cols} rows={rows} rowKey={(c) => c.id} onRow={(c) => { setSel(c.id); setTab('eq') }} />
        {coForm && <CompanyForm c={coForm.c} isNew onClose={() => setCoForm(null)} onSave={(c) => { cos.add({ ...c, kind: 'landlord' }); setCoForm(null); toast('Арендодатель добавлен') }} />}
      </div>
    )
  }

  const own = byOwner(co.id)
  const eqRows = own.filter((e) => e.lstatus === etab && (!cat || e.category === cat) && (!eqQ || `${e.title} ${e.plate}`.toLowerCase().includes(eqQ.toLowerCase())))
  const hist = history(co.id)
  const histRows = hist.filter((h) => !payF || h.ppay === payF)
  const cMgrs = mgrs.rows.filter((m) => m.companyId === co.id)
  const cSites = psites.rows.filter((s) => s.companyId === co.id)
  const cur = eqs.rows.find((e) => e.id === eqOpen)
  const debt = hist.filter((h) => h.ppay === 'Долг').reduce((a, h) => a + h.sum, 0)

  const eqCols: Col<Row>[] = [
    { key: 't', title: 'Техника', render: (e) => <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}><div className="ca-eq-thumb hide-mobile"><div className="eq-img"><EquipmentArt seed={e.id} category={e.category} /></div></div><div><b>{e.title}</b><div className="muted mono" style={{ fontSize: 12 }}>{e.plate} · {e.year}</div></div></div> },
    { key: 'c', title: 'Тип', hideMobile: true, render: (e) => categoryOne[e.category] },
    { key: 'd', title: 'Водитель', hideMobile: true, render: (e) => short(emp(e.driverId)?.name) },
    { key: 'm', title: 'Менеджер', hideMobile: true, render: (e) => short(emp(e.managerId)?.name) },
    { key: 'p', title: 'Для нас / клиента', align: 'r', nowrap: true, render: (e) => <span className="tnum">{e.rentCostForUs} / <b>{e.pricePerHour}</b> BYN/ч</span> },
    { key: 's', title: 'Статус', render: (e) => <StatusBadge status={e.lstatus} /> },
  ]

  return (
    <div className="stack">
      <div><button className="btn btn-ghost btn-sm" onClick={() => setSel(null)}><ArrowLeft />Все арендодатели</button></div>
      <PageHead title={co.name} sub={<span>УНП <span className="mono">{co.unp}</span> · {co.director} · <span className="mono">{co.phone}</span></span>}
        actions={<><button className="btn btn-secondary" onClick={() => setCoForm({ c: co, isNew: false })}><Pencil />Карточка юрлица</button>
          <button className="btn btn-primary" disabled={!toPay(co.id)} onClick={() => { const m: Record<string, PartnerPay> = { ...paid }; hist.forEach((h) => { m[h.id] = 'Оплачено' }); setPaid(m); toast(`Оплата ${money(toPay(co.id))} утверждена и передана в бухгалтерию`) }}><Check />Утвердить оплату</button></>} />
      {!co.hasContract && <div className="alert alert-warn">С партнёром не заключён договор — технику нельзя подключать к сделкам до подписания.</div>}
      <div className="ca-stats">
        <Stat label="Техника" value={own.length} delta={`${own.filter((e) => e.lstatus === 'В работе').length} в работе`} />
        <Stat label="Заявок выполнено" value={hist.length} />
        <Stat label="К выплате" value={money(toPay(co.id))} />
        <Stat label="Просрочено (долг)" value={money(debt)} trend={debt ? 'down' : undefined} delta={debt ? 'оплатить в приоритете' : 'нет'} />
      </div>

      <Tabs value={tab} onChange={setTab} items={[
        { id: 'eq', label: 'Техника', count: own.length }, { id: 'history', label: 'История заявок', count: hist.length },
        { id: 'managers', label: 'Менеджеры', count: cMgrs.length }, { id: 'sites', label: 'Объекты', count: cSites.length },
      ]} />

      {tab === 'eq' && <>
        <div className="row-between">
          <div className="seg">{eqTabs.map((s) => <button key={s} className={etab === s ? 'on' : ''} onClick={() => setEtab(s)}>{s} <span className="muted tnum">{own.filter((e) => e.lstatus === s).length}</span></button>)}</div>
          <button className="btn btn-secondary btn-sm" onClick={() => setEqForm({})}><Plus />Добавить технику</button>
        </div>
        <div className="toolbar">
          <SearchInput value={eqQ} onChange={setEqQ} placeholder="Модель или госномер" />
          <select className="select" value={cat} onChange={(e) => setCat(e.target.value as EquipmentCategory | '')} aria-label="Категория"><option value="">Все категории</option>{Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </div>
        <DataTable cols={eqCols} rows={eqRows} rowKey={(e) => e.id} onRow={(e) => setEqOpen(e.id)} empty={`Нет техники в статусе «${etab}»`} />
      </>}

      {tab === 'history' && <>
        <Seg value={payF} onChange={setPayF} items={[{ id: '', label: 'Все' }, { id: 'Оплачено', label: 'Оплачено' }, { id: 'Не оплачено', label: 'Не оплачено' }, { id: 'Долг', label: 'Долг' }]} />
        <DataTable rowKey={(h) => h.id} rows={histRows} empty="Заявок нет" cols={[
          { key: 'd', title: 'Дата', nowrap: true, render: (h) => <div><b className="tnum">{dateShort(h.date)}</b><div className="muted mono" style={{ fontSize: 12 }}>{h.number}</div></div> },
          { key: 'e', title: 'Техника', render: (h) => h.eqTitle },
          { key: 's', title: 'Объект', hideMobile: true, render: (h) => site(h.siteId)?.name },
          { key: 'h', title: 'Часы', align: 'r', hideMobile: true, render: (h) => h.hours },
          { key: 'st', title: 'Статус заявки', hideMobile: true, render: (h) => <StatusBadge status={h.status} /> },
          { key: 'sum', title: 'Партнёру', align: 'r', render: (h) => <span className="tnum">{money(h.sum)}</span> },
          { key: 'p', title: 'Оплата', render: (h) => <StatusBadge status={h.ppay === 'Не оплачено' ? 'Ожидает оплаты' : h.ppay} /> },
          { key: 'a', title: '', align: 'r', render: (h) => h.ppay !== 'Оплачено' ? <button className="btn btn-ok btn-sm" onClick={() => { setPaid({ ...paid, [h.id]: 'Оплачено' }); toast(`Оплата ${money(h.sum)} утверждена`) }}><Check />Утвердить</button> : null },
        ]} />
      </>}

      {tab === 'managers' && <>
        <div className="row-between"><span className="muted" style={{ fontSize: 14 }}>Контактные лица партнёра</span><button className="btn btn-secondary btn-sm" onClick={() => setMForm({ id: uid('pm'), companyId: co.id, name: '', position: '', phone: '+375 ', email: '', note: '' })}><Plus />Добавить</button></div>
        <DataTable rowKey={(m) => m.id} rows={cMgrs} onRow={(m) => setMForm(m)} empty="Менеджеры не добавлены" cols={[
          { key: 'n', title: 'ФИО', render: (m) => <div><b>{m.name}</b><div className="muted" style={{ fontSize: 12 }}>{m.position}</div></div> },
          { key: 'p', title: 'Телефон', nowrap: true, render: (m) => <span className="mono" style={{ fontSize: 13 }}>{m.phone}</span> },
          { key: 'e', title: 'E-mail', hideMobile: true, render: (m) => m.email },
          { key: 'c', title: 'Примечание', hideMobile: true, render: (m) => <span className="muted" style={{ fontSize: 13 }}>{m.note || '—'}</span> },
        ]} />
      </>}

      {tab === 'sites' && <>
        <div className="row-between"><span className="muted" style={{ fontSize: 14 }}>Стоянки и базы, откуда подаётся техника</span><button className="btn btn-secondary btn-sm" onClick={() => setSForm({ id: uid('ps'), companyId: co.id, name: '', address: '', kind: 'Стоянка', units: 1, contact: '' })}><Plus />Добавить объект</button></div>
        <DataTable rowKey={(s) => s.id} rows={cSites} onRow={(s) => setSForm(s)} empty="Объекты не добавлены" cols={[
          { key: 'n', title: 'Объект', render: (s) => <div><b>{s.name}</b><div className="muted" style={{ fontSize: 12 }}>{s.address}</div></div> },
          { key: 'k', title: 'Тип', render: (s) => <span className="badge plain">{s.kind}</span> },
          { key: 'u', title: 'Единиц', align: 'r', render: (s) => s.units },
          { key: 'c', title: 'Контакт', hideMobile: true, render: (s) => <span style={{ fontSize: 13 }}>{s.contact}</span> },
        ]} />
      </>}

      <AdminActions role={role} what={co.name} onArchive={() => { cos.remove(co.id); setSel(null) }} />

      {cur && <PartnerEqCard role={role} e={cur} onClose={() => setEqOpen(null)} onEdit={() => setEqForm({ item: cur })}
        onStatus={(lstatus, msg, reason) => { eqs.update({ ...cur, lstatus, reason }); toast(msg) }} />}
      {eqForm && <EqForm attracted initial={eqForm.item ?? { ...equipment[2], id: uid('eq'), brand: '', model: '', title: '', plate: '', extras: [], own: false, ownerId: co.id, status: 'На модерации', motoHours: 0, mileage: 0, note: '' }}
        title={eqForm.item ? undefined : `Добавить технику · ${co.name}`} onClose={() => setEqForm(null)}
        onSave={(e) => { const prev = eqForm.item; if (prev) eqs.update({ ...prev, ...e }); else { eqs.add({ ...e, lstatus: 'На модерации' }); setEtab('На модерации') } setEqForm(null); toast(prev ? 'Изменения сохранены' : 'Техника добавлена и отправлена на модерацию') }} />}
      {coForm && <CompanyForm c={coForm.c} isNew={false} onClose={() => setCoForm(null)} onSave={(c) => { cos.update(c); setCoForm(null); toast('Карточка сохранена') }} />}
      {mForm && (
        <Modal title={mForm.name || 'Новый менеджер партнёра'} onClose={() => setMForm(null)} footer={<>
          {mgrs.rows.some((m) => m.id === mForm.id) && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => { mgrs.remove(mForm.id); setMForm(null); toast('Удалено') }}><Trash2 />Удалить</button>}
          <button className="btn btn-ghost" onClick={() => setMForm(null)}>Отмена</button>
          <button className="btn btn-primary" disabled={!mForm.name} onClick={() => { if (mgrs.rows.some((m) => m.id === mForm.id)) mgrs.update(mForm); else mgrs.add(mForm); setMForm(null); toast('Менеджер сохранён') }}>Сохранить</button>
        </>}>
          <div className="grid g2">
            <Field label="ФИО" required><input className="input" value={mForm.name} onChange={(e) => setMForm({ ...mForm, name: e.target.value })} /></Field>
            <Field label="Должность"><input className="input" value={mForm.position} onChange={(e) => setMForm({ ...mForm, position: e.target.value })} /></Field>
            <Field label="Телефон" required><input className="input" value={mForm.phone} onChange={(e) => setMForm({ ...mForm, phone: e.target.value })} /></Field>
            <Field label="E-mail"><input className="input" value={mForm.email} onChange={(e) => setMForm({ ...mForm, email: e.target.value })} /></Field>
          </div>
          <Field label="Примечание"><textarea className="textarea" value={mForm.note} onChange={(e) => setMForm({ ...mForm, note: e.target.value })} /></Field>
        </Modal>
      )}
      {sForm && (
        <Modal title={sForm.name || 'Новый объект партнёра'} onClose={() => setSForm(null)} footer={<>
          {psites.rows.some((s) => s.id === sForm.id) && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => { psites.remove(sForm.id); setSForm(null); toast('Удалено') }}><Trash2 />Удалить</button>}
          <button className="btn btn-ghost" onClick={() => setSForm(null)}>Отмена</button>
          <button className="btn btn-primary" disabled={!sForm.name || !sForm.address} onClick={() => { if (psites.rows.some((s) => s.id === sForm.id)) psites.update(sForm); else psites.add(sForm); setSForm(null); toast('Объект сохранён') }}>Сохранить</button>
        </>}>
          <div className="grid g2">
            <Field label="Название" required><input className="input" value={sForm.name} onChange={(e) => setSForm({ ...sForm, name: e.target.value })} /></Field>
            <Field label="Тип"><select className="select" value={sForm.kind} onChange={(e) => setSForm({ ...sForm, kind: e.target.value as PartnerSite['kind'] })}>{(['Стоянка', 'Ремонтная база', 'Объект клиента'] as const).map((k) => <option key={k}>{k}</option>)}</select></Field>
            <Field label="Адрес" required><input className="input" value={sForm.address} onChange={(e) => setSForm({ ...sForm, address: e.target.value })} /></Field>
            <Field label="Единиц техники"><input className="input" type="number" value={sForm.units} onChange={(e) => setSForm({ ...sForm, units: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Контакт"><input className="input" value={sForm.contact} onChange={(e) => setSForm({ ...sForm, contact: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  )
}

function PartnerEqCard({ role, e, onClose, onEdit, onStatus }: { role: CrmRole; e: Row; onClose: () => void; onEdit: () => void; onStatus: (s: LandlordEqStatus, msg: string, reason?: string) => void }) {
  const toast = useToast()
  const [reject, setReject] = useState(false)
  const [reason, setReason] = useState('')
  const docs = [['Техпаспорт', true], ['Страховой полис', e.lstatus !== 'Отклонённая'], ['Гостехосмотр', e.lstatus !== 'Отклонённая'], ['Договор аренды', true]] as const
  return (
    <Drawer title={e.title} sub={<span className="mono">{e.plate} · {companies.find((c) => c.id === e.ownerId)?.name}</span>} onClose={onClose} footer={
      e.lstatus === 'На модерации' ? <>
        <button className="btn btn-danger" onClick={() => setReject(true)}><X />Отклонить</button>
        <button className="btn btn-ok" onClick={() => onStatus('Свободная', 'Техника одобрена и опубликована в каталоге')}><Check />Одобрить</button>
      </> : <>
        <button className="btn btn-secondary" onClick={onEdit}><Pencil />Редактировать</button>
        {e.lstatus === 'Свободная' && <button className="btn btn-primary" onClick={() => { onStatus('В работе', 'Техника подключена к сделке · партнёр уведомлён'); toast('Водителю партнёра отправлено уведомление в Telegram') }}><Link2 />Подключить к сделке</button>}
        {(e.lstatus === 'Отклонённая' || e.lstatus === 'Архив') && <button className="btn btn-primary" onClick={() => onStatus('На модерации', 'Отправлено на повторную модерацию')}>На модерацию</button>}
        {e.lstatus === 'В работе' && <button className="btn btn-secondary" onClick={() => onStatus('Свободная', 'Техника освобождена')}>Освободить</button>}
      </>}>
      <div className="grid g2" style={{ gap: 8 }}>
        <div className="eq-img"><EquipmentArt seed={e.id} category={e.category} label={categoryOne[e.category]} /></div>
        <div className="grid g2" style={{ gap: 8 }}>{['Спереди', 'Сбоку', 'Кабина', 'Моточасы'].map((p) => <div key={p} className="ca-doc has" style={{ aspectRatio: '4 / 3' }}>{p}</div>)}</div>
      </div>
      <div className="row"><StatusBadge status={e.lstatus} />{e.reason && <span className="muted" style={{ fontSize: 13 }}>Причина: {e.reason}</span>}</div>
      <KV items={[
        ['Марка', e.brand], ['Модель', e.model], ['Госномер', <span className="mono">{e.plate}</span>], ['Год выпуска', e.year],
        ['Закреплённый водитель', emp(e.driverId)?.name ?? '—'], ['Закреплённый менеджер', emp(e.managerId)?.name ?? '—'],
        ['Тип', categoryOne[e.category]],
        ['Характеристики', [e.capacity && `${e.capacity} т`, e.boom && `стрела ${e.boom} м`, e.bucket && `ковш ${e.bucket} м³`].filter(Boolean).join(', ') || '—'],
        ['Доп. оборудование', e.extras.join(', ') || '—'],
        ['Моточасы / пробег', `${num(e.motoHours)} м/ч${e.mileage ? ` · ${num(e.mileage)} км` : ''}`],
        ['Местонахождение', e.address],
        ['Стоимость аренды (для нас)', <span className="tnum">{e.rentCostForUs} BYN/ч</span>],
        ['Стоимость для клиента', <span className="tnum"><b>{e.pricePerHour} BYN/ч</b> · смена {money(e.pricePerShift)}</span>],
        ['Последнее гео', date(e.lastGeoAt)],
      ]} />
      <div className="stack-sm"><b>Документы</b>
        {docs.map(([d, ok]) => <div key={d} className="row-between card-flat" style={{ padding: '10px 12px' }}><span className="row" style={{ gap: 8 }}><FileText size={16} className="muted" />{d}</span>{ok ? <StatusBadge status="Проверена" /> : <span className="badge badge-bad">Нет / просрочен</span>}</div>)}
      </div>
      {reject && (
        <div className="card-flat stack-sm">
          <Field label="Причина отклонения" required><textarea className="textarea" value={reason} onChange={(ev) => setReason(ev.target.value)} placeholder="Например: нет страховки, фото не соответствуют" /></Field>
          <div className="row"><button className="btn btn-danger" disabled={!reason} onClick={() => onStatus('Отклонённая', 'Техника отклонена · партнёр уведомлён', reason)}>Отклонить с причиной</button><button className="btn btn-ghost" onClick={() => setReject(false)}>Отмена</button></div>
        </div>
      )}
      <AdminActions role={role} what={e.title} onCancel={() => onStatus('На модерации', 'Возвращено на модерацию')} onArchive={() => onStatus('Архив', 'Перенесено в архив')} onBlock={() => onStatus('Отклонённая', 'Заблокировано', 'Заблокировано администратором')} />
    </Drawer>
  )
}
