import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Map as MapIcon, RotateCcw, Scale, SlidersHorizontal } from 'lucide-react'
import { Empty, Field, PageHead, SearchInput, num, plural } from '../../ui'
import { regions } from '../../data/mock'
import { categoryLabels, type EquipmentCategory } from '../../data/types'
import { availableDate } from '../../data/cabinet'
import { EqCard, catalogItems } from './parts'
import { useClient } from './ctx'

type Sort = 'avail' | 'price-asc' | 'price-desc' | 'rating'
const init = { capacity: 0, boom: 0, bucket: 0, priceMax: 300, minHours: 0, region: '', city: '', onlyFree: false }

export default function Catalog() {
  const c = useClient()
  const [sp, setSp] = useSearchParams()
  const cat = (sp.get('cat') ?? '') as EquipmentCategory | ''
  const [q, setQ] = useState(sp.get('q') ?? '')
  const [f, setF] = useState(init)
  const [sort, setSort] = useState<Sort>('avail')
  const [open, setOpen] = useState(false)
  const set = <K extends keyof typeof init>(k: K, v: (typeof init)[K]) => setF((s) => ({ ...s, [k]: v }))
  const setCat = (v: string) => { const n = new URLSearchParams(sp); if (v) n.set('cat', v); else n.delete('cat'); setSp(n, { replace: true }) }

  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    catalogItems.forEach((e) => { m[e.category] = (m[e.category] ?? 0) + 1 })
    return m
  }, [])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const r = catalogItems.filter((e) =>
      (!cat || e.category === cat) &&
      (!s || `${e.title} ${e.short} ${e.city} ${e.address} ${categoryLabels[e.category]}`.toLowerCase().includes(s)) &&
      (!f.capacity || (e.capacity ?? 0) >= f.capacity) &&
      (!f.boom || (e.boom ?? 0) >= f.boom) &&
      (!f.bucket || (e.bucket ?? 0) >= f.bucket) &&
      e.pricePerHour <= f.priceMax &&
      (!f.minHours || e.minHours <= f.minHours) &&
      (!f.region || e.region === f.region) &&
      (!f.city || e.city === f.city) &&
      (!f.onlyFree || e.status === 'Свободна'))
    const av = (x: (typeof r)[number]) => availableDate(x) ?? '0000'
    return r.sort((a, b) =>
      sort === 'price-asc' ? a.pricePerHour - b.pricePerHour
        : sort === 'price-desc' ? b.pricePerHour - a.pricePerHour
          : sort === 'rating' ? b.rating - a.rating
            : av(a).localeCompare(av(b)) || b.rating - a.rating)
  }, [q, cat, f, sort])

  const active = Object.entries(f).filter(([k, v]) => v !== init[k as keyof typeof init]).length
  const free = list.filter((e) => e.status === 'Свободна').length

  const filters = (
    <div className="stack">
      <Field label="Грузоподъёмность, от">
        <select className="select" value={f.capacity} onChange={(e) => set('capacity', +e.target.value)}>
          <option value={0}>Любая</option>{[1, 3, 5, 10, 20, 25, 50].map((v) => <option key={v} value={v}>от {v} т</option>)}
        </select>
      </Field>
      <Field label="Вылет стрелы, от">
        <select className="select" value={f.boom} onChange={(e) => set('boom', +e.target.value)}>
          <option value={0}>Любой</option>{[5, 10, 15, 20, 28, 40].map((v) => <option key={v} value={v}>от {v} м</option>)}
        </select>
      </Field>
      <Field label="Объём ковша, от">
        <select className="select" value={f.bucket} onChange={(e) => set('bucket', +e.target.value)}>
          <option value={0}>Любой</option>{[0.3, 0.5, 1, 1.5, 3].map((v) => <option key={v} value={v}>от {num(v, 1)} м³</option>)}
        </select>
      </Field>
      <Field label={`Цена за час: до ${f.priceMax} BYN`}>
        <input type="range" className="range" min={50} max={300} step={5} value={f.priceMax} onChange={(e) => set('priceMax', +e.target.value)} aria-label="Максимальная цена за час" />
        <div className="row-between muted" style={{ fontSize: 12 }}><span>50</span><span>300 BYN</span></div>
      </Field>
      <Field label="Минимальное время аренды">
        <div className="seg" style={{ width: '100%' }}>
          {[[0, 'Любое'], [2, 'до 2 ч'], [4, 'до 4 ч']].map(([v, l]) => <button key={v} type="button" className={f.minHours === v ? 'on' : ''} onClick={() => set('minHours', v as number)}>{l}</button>)}
        </div>
      </Field>
      <Field label="Регион">
        <select className="select" value={f.region} onChange={(e) => setF((s) => ({ ...s, region: e.target.value, city: '' }))}>
          <option value="">Вся Беларусь</option>{Object.keys(regions).map((r) => <option key={r}>{r}</option>)}
        </select>
      </Field>
      <Field label="Город">
        <select className="select" value={f.city} onChange={(e) => set('city', e.target.value)}>
          <option value="">Все города</option>
          {(f.region ? regions[f.region] : Object.values(regions).flat()).map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <label className="check"><input type="checkbox" checked={f.onlyFree} onChange={(e) => set('onlyFree', e.target.checked)} />Только свободные сейчас</label>
      <button className="btn btn-ghost btn-sm" onClick={() => setF(init)} disabled={!active}><RotateCcw />Сбросить фильтры</button>
    </div>
  )

  return (
    <>
      <PageHead
        title="Каталог техники"
        sub={`${catalogItems.length} ${plural(catalogItems.length, 'машина', 'машины', 'машин')} от проверенных владельцев · цены с НДС`}
        actions={<>
          <Link to="/client/map" className="btn btn-secondary"><MapIcon />На карте</Link>
          {c.compare.length > 0 && <Link to="/client/compare" className="btn btn-dark"><Scale />Сравнить ({c.compare.length})</Link>}
        </>}
      />

      <div className="cl-cats" role="tablist" aria-label="Категории техники">
        <button className={`cl-cat ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>Вся техника<span>{catalogItems.length}</span></button>
        {(Object.keys(categoryLabels) as EquipmentCategory[]).map((k) => (
          <button key={k} className={`cl-cat ${cat === k ? 'on' : ''}`} onClick={() => setCat(k)}>{categoryLabels[k]}<span>{counts[k] ?? 0}</span></button>
        ))}
      </div>

      <div className="cl-catalog">
        <aside className={`card cl-filters ${open ? 'open' : ''}`}>
          <div className="card-head" style={{ marginBottom: 12 }}><h3>Фильтры</h3>{active > 0 && <span className="badge badge-accent plain">{active}</span>}</div>
          {filters}
        </aside>
        <div className="stack" style={{ minWidth: 0 }}>
          <div className="toolbar">
            <SearchInput value={q} onChange={setQ} placeholder="Модель, тип работ или город" />
            <button className="btn btn-secondary cl-filter-btn" onClick={() => setOpen(!open)} aria-expanded={open}><SlidersHorizontal />Фильтры{active ? ` · ${active}` : ''}</button>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Сортировка">
              <option value="avail">Сначала доступные</option>
              <option value="price-asc">Дешевле</option>
              <option value="price-desc">Дороже</option>
              <option value="rating">По рейтингу</option>
            </select>
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            Найдено <b className="tnum">{list.length}</b> · свободно сейчас <b className="tnum" style={{ color: 'var(--ok)' }}>{free}</b>
          </div>
          {list.length
            ? <div className="cl-grid">{list.map((e) => <EqCard key={e.id} e={e} />)}</div>
            : <div className="card"><Empty text="Под эти условия техники нет. Ослабьте фильтры или оставьте заявку — подберём вручную." /></div>}
        </div>
      </div>
    </>
  )
}
