import { useState } from 'react'
import { Camera, Check, FileText, Plus, Send, X } from 'lucide-react'
import { EquipmentArt, Field, Modal, useToast } from '../../ui'
import { regions } from '../../data/mock'
import { categoryOne, type Equipment, type EquipmentCategory } from '../../data/types'
import { extrasByCategory, partnerDrivers, specFields, specLabel, specUnit } from '../../data/cabinet'

const docsList = ['Техпаспорт', 'Страховка ОСГО', 'Техосмотр', 'Удостоверение машиниста']

export function blankEquipment(): Equipment {
  return {
    id: `pn-${Date.now()}`, category: 'excavator', brand: '', model: '', title: '', short: '', plate: '', year: 2022,
    extras: [], pricePerHour: 90, pricePerShift: 720, minHours: 4, deliveryPerKm: 2.8, overtimePerHour: 135,
    region: 'Минская обл.', city: 'Минск', address: '', map: { x: 50, y: 46 }, rating: 5, reviews: 0, status: 'На модерации',
    ownerId: 'l1', own: false, motoHours: 0, mileage: 0, lastGeoAt: '2026-10-13T09:00:00',
  }
}

export default function EquipmentForm({ initial, onClose, onSave }: { initial?: Equipment; onClose: () => void; onSave: (e: Equipment) => void }) {
  const toast = useToast()
  const isNew = !initial
  const [f, setF] = useState<Equipment>(initial ?? blankEquipment())
  const [photos, setPhotos] = useState(isNew ? 0 : 4)
  const [docs, setDocs] = useState<string[]>(isNew ? [] : docsList.slice(0, 3))
  const [custom, setCustom] = useState('')
  const [err, setErr] = useState('')
  const set = <K extends keyof Equipment>(k: K, v: Equipment[K]) => setF((s) => ({ ...s, [k]: v }))
  const numIn = (k: 'capacity' | 'boom' | 'bucket' | 'pricePerHour' | 'pricePerShift' | 'minHours' | 'deliveryPerKm' | 'overtimePerHour' | 'year' | 'motoHours', step = 1) => (
    <input className="input tnum" type="number" step={step} value={f[k] ?? ''} onChange={(e) => set(k, e.target.value === '' ? undefined as never : +e.target.value as never)} />
  )
  const extras = [...new Set([...extrasByCategory[f.category], ...f.extras])]

  const submit = () => {
    if (!f.brand.trim() || !f.model.trim()) { setErr('Укажите марку и модель'); return }
    if (!f.address.trim()) { setErr('Укажите адрес стоянки техники'); return }
    if (isNew && photos < 1) { setErr('Добавьте хотя бы одно фото'); return }
    const out: Equipment = { ...f, title: `${f.brand} ${f.model}`, short: f.short || `${categoryOne[f.category]} ${f.brand} ${f.model}, ${f.year} г.` }
    onSave(out)
    toast(isNew ? 'Техника отправлена на модерацию — проверка до 2 часов' : 'Изменения сохранены')
    onClose()
  }

  return (
    <Modal wide title={isNew ? 'Новая техника' : `Редактирование: ${initial!.title}`} onClose={onClose} footer={<>
      {err && <span className="pt-err">{err}</span>}
      <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
      <button className="btn btn-primary" onClick={submit}>{isNew ? <><Send />Отправить на модерацию</> : <><Check />Сохранить</>}</button>
    </>}>
      <section className="pt-fs">
        <h4>Основное</h4>
        <div className="grid g3">
          <Field label="Категория" required>
            <select className="select" value={f.category} onChange={(e) => { const c = e.target.value as EquipmentCategory; setF((s) => ({ ...s, category: c, extras: [] })) }}>
              {(Object.keys(categoryOne) as EquipmentCategory[]).map((k) => <option key={k} value={k}>{categoryOne[k]}</option>)}
            </select>
          </Field>
          <Field label="Марка" required><input className="input" value={f.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Например, JCB" /></Field>
          <Field label="Модель" required><input className="input" value={f.model} onChange={(e) => set('model', e.target.value)} placeholder="Например, 3CX Super" /></Field>
          <Field label="Год выпуска">{numIn('year')}</Field>
          <Field label="Гос. номер" hint="Клиенты увидят после подтверждения"><input className="input mono" value={f.plate} onChange={(e) => set('plate', e.target.value)} placeholder="1234 АВ-7" /></Field>
          <Field label="Моточасы">{numIn('motoHours')}</Field>
        </div>
        <Field label="Мини-описание" hint="1–2 предложения: для каких работ подходит"><textarea className="textarea" style={{ minHeight: 70 }} value={f.short} onChange={(e) => set('short', e.target.value)} /></Field>
      </section>

      <section className="pt-fs">
        <h4>Характеристики</h4>
        <div className="grid g3">
          {specFields[f.category].map((k) => <Field key={k} label={`${specLabel[k]}, ${specUnit[k]}`}>{numIn(k, 0.1)}</Field>)}
        </div>
        <div className="label" style={{ marginTop: 4 }}>Доп. оборудование</div>
        <div className="pt-checks">
          {extras.map((x) => (
            <label key={x} className={`pt-checkchip ${f.extras.includes(x) ? 'on' : ''}`}>
              <input type="checkbox" checked={f.extras.includes(x)} onChange={() => set('extras', f.extras.includes(x) ? f.extras.filter((y) => y !== x) : [...f.extras, x])} />{x}
            </label>
          ))}
          <form className="row" style={{ gap: 6 }} onSubmit={(e) => { e.preventDefault(); if (custom.trim()) { set('extras', [...f.extras, custom.trim()]); setCustom('') } }}>
            <input className="input" style={{ height: 34, width: 180 }} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Своё оборудование" aria-label="Своё оборудование" />
            <button className="btn btn-secondary btn-sm btn-icon" aria-label="Добавить"><Plus /></button>
          </form>
        </div>
      </section>

      <section className="pt-fs">
        <h4>Цены и условия</h4>
        <div className="grid g3">
          <Field label="Цена за час, BYN" required>
            <input className="input tnum" type="number" value={f.pricePerHour} onChange={(e) => { const v = +e.target.value; setF((s) => ({ ...s, pricePerHour: v, pricePerShift: v * 8, overtimePerHour: Math.round(v * 1.5) })) }} />
          </Field>
          <Field label="Цена за смену 8 ч, BYN">{numIn('pricePerShift')}</Field>
          <Field label="Мин. время аренды, ч">{numIn('minHours')}</Field>
          <Field label="Доставка, BYN/км">{numIn('deliveryPerKm', 0.1)}</Field>
          <Field label="Переработка, BYN/ч">{numIn('overtimePerHour')}</Field>
          <Field label="Машинист">
            <select className="select" value={f.driverId ?? ''} onChange={(e) => set('driverId', e.target.value || undefined)}>
              <option value="">Без машиниста</option>
              {partnerDrivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="muted" style={{ fontSize: 12 }}>Комиссия платформы 10% удерживается из оплаты клиента. Клиент видит цены с НДС.</div>
      </section>

      <section className="pt-fs">
        <h4>Местоположение</h4>
        <div className="grid g3">
          <Field label="Регион">
            <select className="select" value={f.region} onChange={(e) => setF((s) => ({ ...s, region: e.target.value, city: regions[e.target.value][0] }))}>
              {Object.keys(regions).map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Город">
            <select className="select" value={f.city} onChange={(e) => set('city', e.target.value)}>{regions[f.region].map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="Адрес стоянки" required><input className="input" value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="ул. Тимирязева, 67" /></Field>
        </div>
      </section>

      <section className="pt-fs">
        <h4>Фото и документы</h4>
        <div className="pt-photos">
          {Array.from({ length: photos }, (_, i) => (
            <div key={i} className="pt-photo">
              <div><EquipmentArt category={f.category} label={`Фото ${i + 1}`} /></div>
              <button className="pt-photo-x" onClick={() => setPhotos(photos - 1)} aria-label="Удалить фото"><X size={12} /></button>
              {i === 0 && <span className="pt-photo-main">обложка</span>}
            </div>
          ))}
          {photos < 8 && <button className="pt-photo-add" onClick={() => { setPhotos(photos + 1); toast('Фото загружено (демо)') }}><Camera />Добавить фото<span>{photos}/8</span></button>}
        </div>
        <div className="pt-docs">
          {docsList.map((d) => {
            const on = docs.includes(d)
            return (
              <button key={d} className={`pt-docchip ${on ? 'on' : ''}`} onClick={() => setDocs(on ? docs.filter((x) => x !== d) : [...docs, d])}>
                {on ? <Check size={16} /> : <FileText size={16} />}<span className="grow">{d}</span><span className="muted" style={{ fontSize: 12 }}>{on ? 'загружен' : 'загрузить'}</span>
              </button>
            )
          })}
        </div>
      </section>
    </Modal>
  )
}
