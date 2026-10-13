import { useState } from 'react'
import { Archive, Building2, Clock, MapPin, Pencil, Phone, Plus, RotateCcw, Warehouse } from 'lucide-react'
import { Empty, Field, Modal, PageHead, SearchInput, Seg, Tabs, useToast } from '../../ui'
import type { PartnerSite } from '../../data/cabinet'
import { usePartner } from './ctx'

type T = 'Текущий' | 'Архив'
const blank = (): PartnerSite => ({ id: `ps-${Date.now()}`, name: '', address: '', kind: 'Объект клиента', client: '', contacts: '', schedule: '', equipmentIds: [], notes: '', status: 'Текущий' })

export default function Sites() {
  const p = usePartner()
  const toast = useToast()
  const [tab, setTab] = useState<T>('Текущий')
  const [q, setQ] = useState('')
  const [form, setForm] = useState<PartnerSite | null>(null)
  const [isNew, setIsNew] = useState(false)
  const list = p.sites.filter((s) => s.status === tab && `${s.name} ${s.address} ${s.client}`.toLowerCase().includes(q.trim().toLowerCase()))
  const eqTitle = (id: string) => p.equipment.find((e) => e.id === id)?.title ?? id
  const avail = p.equipment.filter((e) => e.status !== 'Архив')

  const save = () => {
    if (!form) return
    if (!form.name.trim() || !form.address.trim()) { toast('Заполните название и адрес'); return }
    p.saveSite(form); toast(isNew ? 'Объект добавлен' : 'Объект сохранён'); setForm(null)
  }

  return (
    <>
      <PageHead title="Мои объекты" sub="Базы, стоянки и объекты клиентов, где работает ваша техника"
        actions={<button className="btn btn-primary" onClick={() => { setForm(blank()); setIsNew(true) }}><Plus />Добавить объект</button>} />
      <div className="stack">
        <Tabs<T> value={tab} onChange={setTab} items={[
          { id: 'Текущий', label: 'Текущие', count: p.sites.filter((s) => s.status === 'Текущий').length },
          { id: 'Архив', label: 'Архив', count: p.sites.filter((s) => s.status === 'Архив').length },
        ]} />
        <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Название, адрес, клиент" /></div>
        {list.length ? (
          <div className="auto-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))' }}>
            {list.map((s) => (
              <div key={s.id} className="card pt-site">
                <div className="row-between" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                  <div className="row" style={{ gap: 12, flexWrap: 'nowrap', minWidth: 0 }}>
                    <span className={`pt-site-ico ${s.kind === 'База / стоянка' ? 'base' : ''}`}>{s.kind === 'База / стоянка' ? <Warehouse /> : <Building2 />}</span>
                    <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700 }}>{s.name}</div><div className="muted" style={{ fontSize: 12 }}>{s.kind}{s.client !== '—' && s.client ? ` · ${s.client}` : ''}</div></div>
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm" aria-label="Редактировать" onClick={() => { setForm(s); setIsNew(false) }}><Pencil /></button>
                </div>
                <div className="stack-sm" style={{ fontSize: 13 }}>
                  <div className="pt-site-l"><MapPin size={14} />{s.address}</div>
                  {s.schedule && s.schedule !== '—' && <div className="pt-site-l"><Clock size={14} />{s.schedule}</div>}
                  {s.contacts && s.contacts !== '—' && <div className="pt-site-l"><Phone size={14} />{s.contacts}</div>}
                </div>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Техника на объекте · {s.equipmentIds.length}</div>
                  <div className="row" style={{ gap: 6 }}>
                    {s.equipmentIds.length ? s.equipmentIds.map((id) => <span key={id} className="badge badge-muted plain">{eqTitle(id)}</span>) : <span className="muted" style={{ fontSize: 13 }}>нет</span>}
                  </div>
                </div>
                {s.notes && <div className="muted" style={{ fontSize: 13 }}>{s.notes}</div>}
                <div className="row" style={{ marginTop: 'auto' }}>
                  {s.status === 'Текущий'
                    ? <button className="btn btn-ghost btn-sm" onClick={() => { p.saveSite({ ...s, status: 'Архив' }); toast('Объект перенесён в архив') }}><Archive />В архив</button>
                    : <button className="btn btn-ghost btn-sm" onClick={() => { p.saveSite({ ...s, status: 'Текущий' }); toast('Объект восстановлен') }}><RotateCcw />Восстановить</button>}
                </div>
              </div>
            ))}
          </div>
        ) : <div className="card"><Empty text="Объектов нет" /></div>}
      </div>

      {form && (
        <Modal title={isNew ? 'Новый объект' : form.name} onClose={() => setForm(null)} footer={<>
          <button className="btn btn-ghost" onClick={() => setForm(null)}>Отмена</button>
          <button className="btn btn-primary" onClick={save}>Сохранить</button>
        </>}>
          <Field label="Тип"><Seg value={form.kind} onChange={(v) => setForm({ ...form, kind: v })} items={[{ id: 'Объект клиента', label: 'Объект клиента' }, { id: 'База / стоянка', label: 'База / стоянка' }]} /></Field>
          <div className="grid g2">
            <Field label="Название" required><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Клиент"><input className="input" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder={form.kind === 'База / стоянка' ? '—' : 'ООО «…»'} /></Field>
          </div>
          <Field label="Адрес" required><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <div className="grid g2">
            <Field label="Контакты"><input className="input" value={form.contacts} onChange={(e) => setForm({ ...form, contacts: e.target.value })} placeholder="ФИО · телефон" /></Field>
            <Field label="График"><input className="input" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Пн–Пт 08:00–18:00" /></Field>
          </div>
          <Field label="Техника на объекте">
            <div className="pt-checks">
              {avail.map((e) => {
                const on = form.equipmentIds.includes(e.id)
                return <label key={e.id} className={`pt-checkchip ${on ? 'on' : ''}`}><input type="checkbox" checked={on} onChange={() => setForm({ ...form, equipmentIds: on ? form.equipmentIds.filter((x) => x !== e.id) : [...form.equipmentIds, e.id] })} />{e.title}</label>
              })}
            </div>
          </Field>
          <Field label="Примечания"><textarea className="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Пропуск, ограничения по въезду, проживание" /></Field>
        </Modal>
      )}
    </>
  )
}
