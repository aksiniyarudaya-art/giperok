import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Camera, ChevronRight, ImagePlus, RefreshCw, Video, X } from 'lucide-react'
import { EquipmentArt } from '../../ui'
import { myEq } from '../../data/driver'

/* ---------- Слой поверх экрана «телефона» (листы, FAB) ---------- */
export function Layer({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null)
  useEffect(() => { setEl(document.getElementById('drv-layer')) }, [])
  return el ? createPortal(children, el) : null
}

/* ---------- Bottom sheet (внутри «телефона») ---------- */
export function Sheet({ title, sub, onClose, children, footer }: { title: string; sub?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <Layer>
    <div className="drv-sheet-ov" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drv-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drv-sheet-grip" aria-hidden />
        <div className="drv-sheet-head">
          <div className="grow"><h3>{title}</h3>{sub && <div className="drv-sub">{sub}</div>}</div>
          <button className="drv-iconbtn" onClick={onClose} aria-label="Закрыть"><X /></button>
        </div>
        <div className="drv-sheet-body">{children}</div>
        {footer && <div className="drv-sheet-foot">{footer}</div>}
      </div>
    </div>
    </Layer>
  )
}

/* ---------- Группа списка ---------- */
export function Group({ title, action, children, flush }: { title?: ReactNode; action?: ReactNode; children: ReactNode; flush?: boolean }) {
  return (
    <section className="drv-group">
      {(title || action) && <div className="drv-group-head"><span>{title}</span>{action}</div>}
      <div className={flush ? '' : 'drv-list'}>{children}</div>
    </section>
  )
}

export function Row({ icon, title, sub, right, onClick, tone, chevron }: {
  icon?: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void; tone?: 'ok' | 'warn' | 'bad' | 'info' | 'accent'; chevron?: boolean
}) {
  const inner = (
    <>
      {icon && <span className={`drv-row-ic ${tone ? `t-${tone}` : ''}`}>{icon}</span>}
      <span className="drv-row-main">
        <span className="drv-row-title">{title}</span>
        {sub && <span className="drv-row-sub">{sub}</span>}
      </span>
      {right && <span className="drv-row-right">{right}</span>}
      {(chevron ?? !!onClick) && <ChevronRight className="drv-chev" />}
    </>
  )
  return onClick
    ? <button type="button" className="drv-row" onClick={onClick}>{inner}</button>
    : <div className="drv-row">{inner}</div>
}

/* ---------- Переключатель ---------- */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`drv-switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <span />
    </button>
  )
}

/* ---------- Чек-бокс-строка (крупная тач-цель) ---------- */
export function CheckRow({ checked, onChange, title, sub }: { checked: boolean; onChange: (v: boolean) => void; title: ReactNode; sub?: ReactNode }) {
  return (
    <label className={`drv-check ${checked ? 'on' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="drv-check-box" aria-hidden />
      <span className="drv-row-main"><span className="drv-row-title">{title}</span>{sub && <span className="drv-row-sub">{sub}</span>}</span>
    </label>
  )
}

/* ---------- Фото: демо-превью ---------- */
export function DemoPhoto({ label, kind }: { label: string; kind?: string }) {
  return (
    <div className="drv-demo-photo">
      {kind === 'doc' ? (
        <div className="drv-demo-doc" aria-hidden>
          <b>ПУТЕВОЙ ЛИСТ</b>
          {[80, 64, 92, 50, 76, 70].map((w, i) => <span key={i} style={{ width: `${w}%` }} />)}
        </div>
      ) : kind === 'moto' ? (
        <div className="drv-demo-moto mono" aria-hidden>{String(Math.round(myEq.motoHours)).padStart(6, '0')}<small>м/ч</small></div>
      ) : (
        <EquipmentArt seed={myEq.id} category={myEq.category} label={label} />
      )}
      <span className="drv-demo-tag">демо</span>
    </div>
  )
}

/** Слот фото: камера телефона (capture=environment) + превью. value — objectURL или «demo:...». */
export function PhotoSlot({ label, value, onChange, kind, accept = 'image/*', blurry }: { label: string; value?: string; onChange: (v?: string) => void; kind?: string; accept?: string; blurry?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  const isVideo = value?.startsWith('video:')
  return (
    <div className={`drv-slot ${value ? 'has' : ''} ${blurry ? 'blurry' : ''}`}>
      <input ref={ref} type="file" accept={accept} capture="environment" hidden onChange={(e) => {
        const f = e.target.files?.[0]
        if (f) onChange((f.type.startsWith('video') ? 'video:' : '') + URL.createObjectURL(f))
        e.target.value = ''
      }} />
      {value ? (
        <div className="drv-slot-prev">
          {value.startsWith('demo:') ? <DemoPhoto label={label} kind={kind} />
            : isVideo ? <video src={value.slice(6)} muted playsInline />
            : <img src={value} alt={label} />}
          <button type="button" className="drv-slot-re" onClick={() => ref.current?.click()} aria-label={`Переснять: ${label}`}><RefreshCw /></button>
        </div>
      ) : (
        <button type="button" className="drv-slot-empty" onClick={() => ref.current?.click()}>
          {accept.includes('video') ? <Video /> : <Camera />}
        </button>
      )}
      <span className="drv-slot-label">{label}</span>
    </div>
  )
}

/** Список прикреплённых медиа с кнопкой добавления. */
export function MediaPicker({ items, onChange, accept = 'image/*,video/*', label = 'Добавить фото/видео' }: { items: string[]; onChange: (v: string[]) => void; accept?: string; label?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="drv-media">
      <input ref={ref} type="file" accept={accept} capture="environment" multiple hidden onChange={(e) => {
        const fs = Array.from(e.target.files ?? [])
        onChange([...items, ...fs.map((f) => f.name || 'Фото.jpg')])
        e.target.value = ''
      }} />
      {items.map((m, i) => (
        <span key={i} className="drv-chip">
          {/\.(mp4|mov)$/i.test(m) ? <Video /> : <ImagePlus />}{m}
          <button type="button" aria-label="Убрать" onClick={() => onChange(items.filter((_, j) => j !== i))}><X /></button>
        </span>
      ))}
      <button type="button" className="drv-chip add" onClick={() => ref.current?.click()}><Camera />{label}</button>
    </div>
  )
}

/* ---------- Шаги мастера ---------- */
export function Steps({ step, labels, onPick }: { step: number; labels: string[]; onPick?: (n: number) => void }) {
  return (
    <ol className="drv-steps">
      {labels.map((l, i) => (
        <li key={l} className={i + 1 < step ? 'done' : i + 1 === step ? 'on' : ''}>
          <button type="button" disabled={!onPick || i + 1 > step} onClick={() => onPick?.(i + 1)}><span>{i + 1}</span>{l}</button>
        </li>
      ))}
    </ol>
  )
}
