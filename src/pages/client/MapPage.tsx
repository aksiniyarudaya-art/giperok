import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Crosshair, LocateFixed, MapPin, Minus, Navigation, Plus, RefreshCw, X } from 'lucide-react'
import { PageHead, dateShort, money, num, time, useToast } from '../../ui'
import { categoryLabels, categoryOne, type EquipmentCategory } from '../../data/types'
import { mapAddresses, mapCities, mapKm } from '../../data/cabinet'
import { useClient } from './ctx'
import { Rating, catalogItems } from './parts'

const outline = '4,30 8,22 16,18 24,12 34,10 44,6 56,4 66,2 76,4 86,8 92,16 90,24 96,30 94,40 98,50 94,58 96,66 92,76 96,86 88,92 76,90 66,94 54,92 44,94 32,90 20,88 10,90 4,84 6,72 2,60 6,48 2,40'
const roads = [
  '10,80 32,62 50,46 62,40 84,32', // М1
  '50,46 64,64 84,82', // М5
  '50,46 38,38 22,32 9,34', // М6
  '50,46 62,28 76,14', // М3
  '50,46 66,48 82,50', // Р93
  '32,62 60,86 84,82', // М10
  '22,32 32,62',
]
const rivers = ['88,6 86,22 82,40 84,56 80,70 86,92', '4,36 14,40 24,44 36,50 42,58', '20,86 36,80 50,84 62,82 76,88']
const catColor: Record<EquipmentCategory, string> = {
  excavator: 'var(--accent)', crane: 'var(--steel)', loader: 'var(--ok)', dumptruck: 'var(--warn)', bulldozer: 'var(--bad)', manipulator: 'var(--info)', aerial: 'var(--fg-2)',
}

export default function MapPage() {
  const c = useClient()
  const toast = useToast()
  const [me, setMe] = useState(mapAddresses[0])
  const [q, setQ] = useState('')
  const [sugg, setSugg] = useState(false)
  const [radius, setRadius] = useState(100)
  const [cats, setCats] = useState<EquipmentCategory[]>([])
  const [sel, setSel] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [updated, setUpdated] = useState('09:42')

  const free = useMemo(() => catalogItems
    .filter((e) => e.status === 'Свободна' && (!cats.length || cats.includes(e.category)))
    .map((e) => ({ e, km: mapKm(me, e.map) }))
    .sort((a, b) => a.km - b.km), [me, cats])
  const inR = free.filter((x) => !radius || x.km <= radius)
  const selected = free.find((x) => x.e.id === sel)
  const matches = mapAddresses.filter((a) => a.label.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6)
  const toggleCat = (k: EquipmentCategory) => setCats((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]))
  const pick = (a: (typeof mapAddresses)[number]) => { setMe(a); setQ(a.label); setSugg(false); setSel(null); toast(`Точка поиска: ${a.label}`) }
  const latest = catalogItems.reduce((m, e) => (e.lastGeoAt > m ? e.lastGeoAt : m), '')
  const r = radius / 6

  return (
    <>
      <PageHead
        title="Карта свободных машин"
        sub={<span className="row" style={{ gap: 8 }}><span className="cl-live" />Свободно сейчас {free.length} ед. · в радиусе {radius ? `${radius} км` : 'всей страны'}: <b className="tnum">{inR.length}</b></span>}
        actions={<button className="btn btn-secondary" onClick={() => { setUpdated(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })); toast('Позиции техники обновлены') }}><RefreshCw />Обновить</button>}
      />

      <div className="cl-map-tools">
        <div className="cl-addr">
          <div className="input-icon">
            <MapPin />
            <input className="input" value={q} placeholder="Поиск по адресу: город, улица, объект" onFocus={() => setSugg(true)} onBlur={() => setTimeout(() => setSugg(false), 150)}
              onChange={(e) => { setQ(e.target.value); setSugg(true) }}
              onKeyDown={(e) => { if (e.key === 'Enter' && matches[0]) pick(matches[0]) }} aria-label="Адрес" />
          </div>
          {sugg && matches.length > 0 && (
            <div className="cl-sugg" role="listbox">
              {matches.map((a) => <button key={a.label} role="option" onMouseDown={() => pick(a)}><MapPin size={14} />{a.label}</button>)}
            </div>
          )}
        </div>
        <button className="btn btn-secondary" onClick={() => { pick(mapAddresses[0]); setQ('') }}><LocateFixed />Где я</button>
        <select className="select" value={radius} onChange={(e) => setRadius(+e.target.value)} aria-label="Радиус">
          {[25, 50, 100, 200].map((v) => <option key={v} value={v}>Радиус {v} км</option>)}
          <option value={0}>Без ограничения</option>
        </select>
      </div>
      <div className="cl-chips">
        {(Object.keys(categoryLabels) as EquipmentCategory[]).map((k) => (
          <button key={k} className={`cl-chip ${cats.includes(k) ? 'on' : ''}`} onClick={() => toggleCat(k)}><i style={{ background: catColor[k] }} />{categoryLabels[k]}</button>
        ))}
        {cats.length > 0 && <button className="cl-chip" onClick={() => setCats([])}><X size={14} />Все типы</button>}
      </div>

      <div className="cl-map-layout">
        <div className="cl-map card" style={{ padding: 0 }}>
          <div className="cl-map-canvas" style={{ transform: `scale(${zoom})`, transformOrigin: `${me.x}% ${me.y}%` }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <rect width="100" height="100" fill="var(--surface-2)" />
              {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={(i + 1) * 10} x2={(i + 1) * 10} y1="0" y2="100" stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="2 6" />)}
              {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} y1={(i + 1) * 10} y2={(i + 1) * 10} x1="0" x2="100" stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="2 6" />)}
              <polygon points={outline} fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              {rivers.map((p) => <polyline key={p} points={p} fill="none" stroke="var(--steel-soft)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />)}
              {roads.map((p) => <polyline key={p} points={p} fill="none" stroke="var(--accent-soft)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />)}
              {roads.map((p) => <polyline key={p + 'c'} points={p} fill="none" stroke="var(--accent-strong)" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" opacity=".6" />)}
              <ellipse cx="50" cy="46" rx="3.2" ry="3.2" fill="none" stroke="var(--fg-3)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              {radius > 0 && <ellipse cx={me.x} cy={me.y} rx={r} ry={r} fill="var(--accent-soft)" fillOpacity=".45" stroke="var(--accent-strong)" strokeWidth="1.5" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />}
            </svg>
            {mapCities.map((ct) => (
              <span key={ct.name} className={`cl-city ${ct.big ? 'big' : ''}`} style={{ left: `${ct.x}%`, top: `${ct.y}%`, transform: `translate(-50%, 6px) scale(${1 / zoom})` }}>{ct.name}</span>
            ))}
            {free.map(({ e, km }) => (
              <button key={e.id} className={`cl-pin ${sel === e.id ? 'on' : ''} ${radius && km > radius ? 'far' : ''}`} style={{ left: `${e.map.x}%`, top: `${e.map.y}%`, transform: `translate(-50%, -50%) scale(${1 / zoom})`, ['--pin' as string]: catColor[e.category] }}
                onClick={() => setSel(e.id)} aria-label={`${e.title}, ${num(km)} км`}>
                <span>{categoryOne[e.category][0]}</span>
              </button>
            ))}
            <div className="cl-me" style={{ left: `${me.x}%`, top: `${me.y}%`, transform: `translate(-50%, -50%) scale(${1 / zoom})` }}><Navigation size={14} /><em>Вы здесь</em></div>
          </div>

          <div className="cl-map-zoom">
            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setZoom((z) => Math.min(3, z + 0.5))} aria-label="Приблизить"><Plus /></button>
            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} aria-label="Отдалить"><Minus /></button>
            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setZoom(1)} aria-label="Сбросить масштаб"><Crosshair /></button>
          </div>
          <div className="cl-map-note"><Camera size={14} />Последняя гео-метка водителя: {dateShort(latest)}, {time(latest)} · обновлено в {updated}</div>

          {selected && (
            <div className="cl-map-pop">
              <button className="btn btn-ghost btn-icon btn-sm cl-pop-x" onClick={() => setSel(null)} aria-label="Закрыть"><X /></button>
              <div className="eyebrow">{categoryOne[selected.e.category]} · {num(selected.km)} км от вас</div>
              <Link to={`/client/catalog/${selected.e.id}`} className="cl-eq-title">{selected.e.title}</Link>
              <div className="row" style={{ gap: 10, fontSize: 13 }}><Rating value={selected.e.rating} /><span className="dim">{selected.e.address}</span></div>
              <div className="muted" style={{ fontSize: 12 }}>Гео-метка водителя: {dateShort(selected.e.lastGeoAt)}, {time(selected.e.lastGeoAt)} (фото в конце смены)</div>
              <div className="row-between" style={{ marginTop: 6 }}>
                <div className="cl-price"><b className="tnum">{money(selected.e.pricePerHour)}</b><span>/час</span></div>
                <button className="btn btn-primary btn-sm" onClick={() => c.book(selected.e.id)}>Забронировать</button>
              </div>
            </div>
          )}
        </div>

        <aside className="card cl-near">
          <div className="card-head" style={{ marginBottom: 8 }}><h3>Ближайшие</h3><span className="muted" style={{ fontSize: 13 }}>{me.label.split('(')[0]}</span></div>
          <div className="cl-near-list">
            {inR.slice(0, 12).map(({ e, km }) => (
              <button key={e.id} className={`cl-near-item ${sel === e.id ? 'on' : ''}`} onClick={() => setSel(e.id)}>
                <i style={{ background: catColor[e.category] }} />
                <div className="grow">
                  <div className="cl-near-t">{e.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{e.city} · метка {time(e.lastGeoAt)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b className="tnum" style={{ fontSize: 14 }}>{num(km)} км</b>
                  <div className="muted tnum" style={{ fontSize: 12 }}>{money(e.pricePerHour)}/ч</div>
                </div>
              </button>
            ))}
            {!inR.length && <div className="muted" style={{ padding: 16, fontSize: 14 }}>В радиусе {radius} км свободной техники нет — увеличьте радиус.</div>}
          </div>
          <div className="alert alert-info" style={{ fontSize: 12, marginTop: 12 }}><Camera /><div>Позиции обновляются по гео-метке, которую водитель фиксирует в приложении, добавляя фото техники в конце рабочего дня. Схема условная (демо, без внешних карт).</div></div>
        </aside>
      </div>
    </>
  )
}
