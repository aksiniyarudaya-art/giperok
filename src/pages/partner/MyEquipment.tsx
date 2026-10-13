import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Archive, Eye, EyeOff, Pencil, Plus, RotateCcw, ShieldAlert } from 'lucide-react'
import { DataTable, Drawer, EquipmentArt, KV, PageHead, Progress, SearchInput, StatusBadge, Tabs, date, money, num, useToast, type Col } from '../../ui'
import { categoryLabels, categoryOne, type Equipment, type EquipmentCategory, type EquipmentStatus } from '../../data/types'
import { partnerDriver, specFields, specLabel, specUnit } from '../../data/cabinet'
import { usePartner } from './ctx'
import EquipmentForm from './EquipmentForm'
import { loadOf, revenueOf } from './util'

type T = 'Свободна' | 'На модерации' | 'Забронирована' | 'Арендована' | 'Скрытая' | 'Архив'
const tabs: { id: T; label: string }[] = [
  { id: 'Свободна', label: 'Свободная' }, { id: 'На модерации', label: 'На модерации' }, { id: 'Забронирована', label: 'Забронирована' },
  { id: 'Арендована', label: 'Арендована' }, { id: 'Скрытая', label: 'Скрытая' }, { id: 'Архив', label: 'Архив' },
]

export default function MyEquipment() {
  const p = usePartner()
  const toast = useToast()
  const [sp, setSp] = useSearchParams()
  const [tab, setTab] = useState<T>('Свободна')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<EquipmentCategory | ''>('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [form, setForm] = useState<{ e?: Equipment } | null>(sp.get('add') ? {} : null)
  const open = p.equipment.find((e) => e.id === openId)

  const rows = useMemo(() => p.equipment.filter((e) => (e.status === 'В ремонте' ? 'Свободна' : e.status) === tab)
    .filter((e) => (!cat || e.category === cat) && `${e.title} ${e.plate} ${e.city}`.toLowerCase().includes(q.trim().toLowerCase())), [p.equipment, tab, q, cat])
  const count = (t: T) => p.equipment.filter((e) => (e.status === 'В ремонте' ? 'Свободна' : e.status) === t).length

  const setStatus = (e: Equipment, status: EquipmentStatus, msg: string) => { p.saveEquipment({ ...e, status }); toast(msg) }
  const closeForm = () => { setForm(null); if (sp.get('add')) setSp({}, { replace: true }) }

  const cols: Col<Equipment>[] = [
    { key: 't', title: 'Техника', render: (e) => (
      <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
        <div className="pt-thumb"><EquipmentArt category={e.category} /></div>
        <div style={{ minWidth: 0 }}><div style={{ fontWeight: 600 }}>{e.title}</div><div className="muted" style={{ fontSize: 12 }}>{categoryOne[e.category]} · <span className="mono">{e.plate}</span> · {e.year}</div></div>
      </div>
    ) },
    { key: 's', title: 'Характеристики', render: (e) => <span className="dim" style={{ fontSize: 13 }}>{specFields[e.category].filter((k) => e[k] !== undefined).map((k) => `${num(e[k]!, 2)} ${specUnit[k]}`).join(' · ')}</span>, hideMobile: true },
    { key: 'p', title: 'Цена/ч', render: (e) => <b className="tnum">{money(e.pricePerHour)}</b>, align: 'r', nowrap: true },
    { key: 'd', title: 'Машинист', render: (e) => partnerDriver(e.driverId)?.name.split(' ').slice(0, 2).join(' ') ?? <span className="muted">—</span>, hideMobile: true },
    { key: 'l', title: 'Загрузка', render: (e) => <div className="row" style={{ gap: 8, flexWrap: 'nowrap', minWidth: 110 }}><div className="grow"><Progress value={loadOf(e)} /></div><span className="tnum" style={{ fontSize: 12 }}>{loadOf(e)}%</span></div>, hideMobile: true },
    { key: 'st', title: 'Статус', render: (e) => <StatusBadge status={e.status} /> },
  ]

  return (
    <>
      <PageHead title="Моя техника" sub={`${p.equipment.length} ед. · свободная техника видна клиентам в каталоге и на карте`}
        actions={<button className="btn btn-primary" onClick={() => setForm({})}><Plus />Добавить технику</button>} />
      <div className="stack">
        <Tabs<T> value={tab} onChange={setTab} items={tabs.map((t) => ({ ...t, count: count(t.id) }))} />
        <div className="toolbar">
          <SearchInput value={q} onChange={setQ} placeholder="Модель, гос. номер, город" />
          <select className="select" value={cat} onChange={(e) => setCat(e.target.value as EquipmentCategory | '')} aria-label="Категория">
            <option value="">Все категории</option>
            {(Object.keys(categoryLabels) as EquipmentCategory[]).map((k) => <option key={k} value={k}>{categoryLabels[k]}</option>)}
          </select>
        </div>
        {tab === 'На модерации' && count('На модерации') > 0 && <div className="alert alert-warn"><ShieldAlert /><div>Менеджер Гиперок проверяет документы и фото. Обычно до 2 часов в рабочее время — уведомление придёт в чат.</div></div>}
        <DataTable cols={cols} rows={rows} rowKey={(e) => e.id} onRow={(e) => setOpenId(e.id)} empty="В этой вкладке техники нет" />
      </div>

      {open && (
        <Drawer title={open.title} sub={`${categoryOne[open.category]} · ${open.plate}`} onClose={() => setOpenId(null)} footer={<>
          {open.status === 'Свободна' && <button className="btn btn-secondary" onClick={() => setStatus(open, 'Скрытая', 'Техника скрыта из каталога')}><EyeOff />Скрыть</button>}
          {open.status === 'Скрытая' && <button className="btn btn-ok" onClick={() => setStatus(open, 'Свободна', 'Техника снова видна в каталоге')}><Eye />Показать в каталоге</button>}
          {(open.status === 'Свободна' || open.status === 'Скрытая' || open.status === 'На модерации') && <button className="btn btn-danger" onClick={() => { setStatus(open, 'Архив', 'Техника перенесена в архив'); setOpenId(null) }}><Archive />В архив</button>}
          {open.status === 'Архив' && <button className="btn btn-secondary" onClick={() => setStatus(open, 'На модерации', 'Техника восстановлена и отправлена на модерацию')}><RotateCcw />Восстановить</button>}
          {open.status !== 'Архив' && <button className="btn btn-primary" onClick={() => setForm({ e: open })}><Pencil />Редактировать</button>}
        </>}>
          <EquipmentArt category={open.category} label={open.title} />
          <div className="row"><StatusBadge status={open.status} />{open.availableFrom && <span className="muted" style={{ fontSize: 13 }}>освободится {date(open.availableFrom)}</span>}</div>
          {(open.status === 'Арендована' || open.status === 'Забронирована') && <div className="alert alert-info" style={{ fontSize: 13 }}><ShieldAlert /><div>Техника в заказе — скрыть или архивировать можно после его завершения.</div></div>}
          <div className="grid g3">
            <div className="card-flat"><div className="muted" style={{ fontSize: 12 }}>Загрузка 30 дн.</div><b className="tnum" style={{ fontSize: 18 }}>{loadOf(open)}%</b></div>
            <div className="card-flat"><div className="muted" style={{ fontSize: 12 }}>Выручка 30 дн.</div><b className="tnum" style={{ fontSize: 18 }}>{money(revenueOf(open))}</b></div>
            <div className="card-flat"><div className="muted" style={{ fontSize: 12 }}>Рейтинг</div><b className="tnum" style={{ fontSize: 18 }}>★ {open.rating.toFixed(1)}</b></div>
          </div>
          <KV items={[
            ['Марка / модель', `${open.brand} ${open.model}`],
            ['Год выпуска', open.year],
            ...specFields[open.category].filter((k) => open[k] !== undefined).map((k) => [specLabel[k], `${num(open[k]!, 2)} ${specUnit[k]}`] as [string, string]),
            ['Доп. оборудование', open.extras.join(', ') || '—'],
            ['Цена', `${money(open.pricePerHour)}/ч · ${money(open.pricePerShift)}/смена`],
            ['Мин. аренда', `${open.minHours} ч`],
            ['Доставка', `${open.deliveryPerKm} BYN/км`],
            ['Переработка', `${money(open.overtimePerHour)}/ч`],
            ['Машинист', partnerDriver(open.driverId)?.name ?? '—'],
            ['Стоянка', open.address],
            ['Моточасы', num(open.motoHours)],
          ]} />
          <p className="muted" style={{ fontSize: 13 }}>{open.short}</p>
        </Drawer>
      )}

      {form && <EquipmentForm initial={form.e} onClose={closeForm} onSave={(e) => { p.saveEquipment(e); if (!form.e) setTab('На модерации') }} />}
    </>
  )
}
