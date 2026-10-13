import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { CheckCircle2, Inbox, Search, X } from 'lucide-react'
import { initials } from './format'

export * from './format'
export { EquipmentArt, EqThumb, equipmentPhoto, brandPhoto } from './EquipmentArt'
export { BarChart, Donut, LineChart, Sparkline } from './charts'

/* ---------- Badge ---------- */
export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'accent' | 'muted'
export function Badge({ tone = 'muted', children, plain }: { tone?: Tone; children: ReactNode; plain?: boolean }) {
  return <span className={`badge badge-${tone}${plain ? ' plain' : ''}`}>{children}</span>
}

/** Единая карта цветов статусов: передайте текст статуса — получите цвет. */
const toneMap: Record<string, Tone> = {
  'свободна': 'ok', 'свободная': 'ok', 'активный': 'ok', 'оплачено': 'ok', 'выполнен': 'ok', 'выполнена': 'ok', 'выполненные': 'ok',
  'завершена': 'ok', 'завершён': 'ok', 'завершено': 'ok', 'закрыта': 'ok', 'допущен': 'ok', 'подписан': 'ok', 'оригинал получен': 'ok',
  'работает': 'ok', 'на смене': 'ok', 'пройден': 'ok', 'принята': 'info', 'решение': 'info', 'проверена': 'ok', 'текущий': 'ok',
  'в работе': 'accent', 'в рейсе': 'accent', 'арендована': 'accent', 'забронирована': 'info', 'начата': 'accent', 'начатая': 'accent',
  'новая': 'info', 'новый': 'info', 'новые': 'info', 'отправлена': 'info', 'на подписи у клиента': 'warn', 'в офисе': 'info',
  'на модерации': 'warn', 'ожидает оплаты': 'warn', 'частично': 'warn', 'на то': 'warn', 'в ремонте': 'warn', 'то': 'warn',
  'больничный': 'warn', 'на больничном': 'warn', 'отпуск': 'muted', 'выходной': 'muted', 'кандидат': 'info', 'проверка': 'warn',
  'оформлен': 'info', 'оформление': 'info', 'инструктаж': 'warn', 'ожидание запчастей': 'warn', 'просрочен': 'bad', 'просрочено': 'bad',
  'долг': 'bad', 'критический долг': 'bad', 'заблокирован': 'bad', 'уволен': 'muted', 'отклонена': 'bad', 'отклонённая': 'bad',
  'отменена': 'muted', 'отменённые': 'muted', 'не вышел': 'bad', 'замена': 'warn', 'перерасход': 'bad', 'скрытая': 'muted', 'архив': 'muted',
  'простаивает': 'muted', 'не пройден': 'bad', 'нарушение': 'bad', 'доставлен и прочитан': 'ok',
}
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={toneMap[status.toLowerCase()] ?? 'muted'}>{status}</Badge>
}

/* ---------- Avatar ---------- */
const hues = ['var(--steel-soft)', 'var(--accent-soft)', 'var(--ok-soft)', 'var(--warn-soft)', 'var(--info-soft)']
export function Avatar({ name, size }: { name: string; size?: 'sm' | 'lg' }) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length
  return <span className={`avatar ${size ?? ''}`} style={{ background: hues[h] }} aria-hidden>{initials(name)}</span>
}

/* ---------- Page header ---------- */
export function PageHead({ title, sub, actions, photo }: { title: string; sub?: ReactNode; actions?: ReactNode; photo?: string }) {
  if (photo) return (
    <div className="page-hero">
      <div className="page-hero-body">
        <h1>{title}</h1>{sub && <p>{sub}</p>}
        {actions && <div className="row page-hero-actions">{actions}</div>}
      </div>
      <div className="page-hero-photo" aria-hidden><img src={photo} alt="" decoding="async" /></div>
    </div>
  )
  return (
    <div className="page-head">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {actions && <div className="row">{actions}</div>}
    </div>
  )
}

/* ---------- Stat ---------- */
export function Stat({ label, value, delta, trend, icon }: { label: string; value: ReactNode; delta?: ReactNode; trend?: 'up' | 'down'; icon?: ReactNode }) {
  return (
    <div className="stat">
      <div className="k">{icon}{label}</div>
      <div className="v">{value}</div>
      {delta && <div className={`d ${trend ?? ''}`}>{delta}</div>}
    </div>
  )
}

/* ---------- Tabs ---------- */
export function Tabs<T extends string>({ items, value, onChange }: { items: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={`tab ${value === t.id ? 'on' : ''}`} onClick={() => onChange(t.id)}>
          {t.label}{t.count !== undefined && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Seg<T extends string>({ items, value, onChange }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {items.map((t) => <button key={t.id} type="button" className={value === t.id ? 'on' : ''} onClick={() => onChange(t.id)}>{t.label}</button>)}
    </div>
  )
}

/* ---------- Search input ---------- */
export function SearchInput({ value, onChange, placeholder = 'Поиск' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="input-icon">
      <Search />
      <input className="input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} />
    </div>
  )
}

/* ---------- Field ---------- */
export function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label className={required ? 'req' : ''}>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

/* ---------- Data table ---------- */
export type Col<T> = { key: string; title: string; render: (row: T) => ReactNode; align?: 'r'; nowrap?: boolean; hideMobile?: boolean }
export function DataTable<T>({ cols, rows, onRow, empty = 'Ничего не найдено', rowKey }: { cols: Col<T>[]; rows: T[]; onRow?: (r: T) => void; empty?: string; rowKey: (r: T) => string }) {
  if (!rows.length) return <div className="table-wrap"><Empty text={empty} /></div>
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr>{cols.map((c) => <th key={c.key} className={`${c.align ?? ''} ${c.hideMobile ? 'hide-mobile' : ''}`}>{c.title}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className={onRow ? 'clickable' : ''} onClick={onRow ? () => onRow(r) : undefined}>
              {cols.map((c) => <td key={c.key} className={`${c.align ?? ''} ${c.nowrap ? 'nowrap' : ''} ${c.hideMobile ? 'hide-mobile' : ''}`}>{c.render(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Empty({ text, icon }: { text: string; icon?: ReactNode }) {
  return <div className="empty">{icon ?? <Inbox />}<span>{text}</span></div>
}

/* ---------- Modal / Drawer ---------- */
function useEsc(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
}

export function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEsc(onClose)
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h3>{title}</h3><button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Закрыть"><X /></button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ title, onClose, children, footer, sub }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; sub?: ReactNode }) {
  useEsc(onClose)
  return (
    <div className="overlay drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><div><h3>{title}</h3>{sub && <div className="muted" style={{ fontSize: 13 }}>{sub}</div>}</div><button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Закрыть"><X /></button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </aside>
    </div>
  )
}

/* ---------- KV list ---------- */
export function KV({ items }: { items: [string, ReactNode][] }) {
  return <dl className="kv">{items.map(([k, v]) => [<dt key={k + 't'}>{k}</dt>, <dd key={k + 'd'}>{v ?? '—'}</dd>])}</dl>
}

/* ---------- Toasts ---------- */
const ToastCtx = createContext<(msg: string) => void>(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([])
  const push = useCallback((msg: string) => {
    const id = Date.now() + Math.random()
    setItems((s) => [...s, { id, msg }])
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">{items.map((t) => <div key={t.id} className="toast"><CheckCircle2 />{t.msg}</div>)}</div>
    </ToastCtx.Provider>
  )
}

/* ---------- Progress ---------- */
export function Progress({ value, tone }: { value: number; tone?: 'ok' | 'bad' }) {
  return <div className={`bar ${tone ?? ''}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
}

/** Простое локальное состояние списка для демо: добавить / изменить / удалить. */
export function useList<T extends { id: string }>(initial: T[]) {
  const [rows, setRows] = useState(initial)
  return {
    rows,
    setRows,
    add: (r: T) => setRows((s) => [r, ...s]),
    update: (r: T) => setRows((s) => s.map((x) => (x.id === r.id ? r : x))),
    remove: (id: string) => setRows((s) => s.filter((x) => x.id !== id)),
  }
}

export const uid = (p = 'id') => `${p}-${Math.random().toString(36).slice(2, 8)}`
