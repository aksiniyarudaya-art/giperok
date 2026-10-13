/* Общие компоненты и действия для страниц механика и кадровика. */
import { useRef, useState, type ReactNode } from 'react'
import { ChevronRight, FileText, Film, ImagePlus, Paperclip, X } from 'lucide-react'
import { Badge, StatusBadge, uid, type Tone } from '../../../ui'
import { emp, eq } from '../../../data/mock'
import {
  NOW, fleetStore, repairsStore, requestsStore, toTemplate,
  type Attachment, type DriverRequest, type Repair,
} from '../../../data/crm-c'
import './crmc.css'

/* ---------- Бейдж статуса с расширенной картой цветов ---------- */
const extra: Record<string, Tone> = {
  'на объекте': 'accent', 'отправлена': 'info', 'запланирован': 'info', 'проведён': 'ok', 'отменён': 'muted', 'ожидает': 'muted',
  'отказ': 'bad', 'на подписи': 'warn', 'черновик': 'muted', 'не требуется': 'muted', 'на проверке': 'warn', 'проверен': 'ok', 'отклонён': 'bad',
  'на согласовании': 'warn', 'согласовано': 'ok', 'согласовано механиком': 'info', 'подтверждено кадровиком': 'ok', 'передано в бухгалтерию': 'muted',
  'отклонено': 'bad', 'утверждено': 'ok', 'утверждён': 'ok', 'открыт': 'warn', 'закрыт': 'muted', 'в процессе': 'warn', 'ремонт силами водителя': 'info',
  'выезд сервиса': 'accent', 'плановое то': 'info', 'внеплановый ремонт': 'warn', 'первичный': 'info', 'повторный': 'muted', 'внеплановый': 'warn',
  'бонус': 'ok', 'штраф': 'bad', 'высокая': 'bad', 'средняя': 'warn', 'низкая': 'muted', 'истекает': 'warn',
}
export function XBadge({ s }: { s: string }) {
  const t = extra[s.toLowerCase()]
  return t ? <Badge tone={t}>{s}</Badge> : <StatusBadge status={s} />
}

/* ---------- Имена ---------- */
export const shortName = (full?: string) => {
  if (!full) return '—'
  const [f, i, o] = full.split(' ')
  return `${f} ${i ? i[0] + '.' : ''}${o ? ' ' + o[0] + '.' : ''}`.trim()
}
export const empShort = (id?: string) => shortName(emp(id)?.name)
export const eqTitle = (id?: string) => { const e = eq(id); return e ? `${e.brand} ${e.model}` : '—' }
export const eqPlate = (id?: string) => eq(id)?.plate ?? ''
export const hrs = (h: number) => `${h.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ч`
export const dt = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

/* ---------- Иконка в плашке ---------- */
export function Ico({ children, tone }: { children: ReactNode; tone?: Tone }) {
  return <span className={`cx-ico ${tone ?? ''}`}>{children}</span>
}

/* ---------- Строка списка ---------- */
export function LItem({ icon, title, sub, right, onClick }: { icon?: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void }) {
  return (
    <div className={`cx-li ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      {icon}
      <div className="cx-li-main"><div className="cx-li-t">{title}</div>{sub && <div className="cx-li-s">{sub}</div>}</div>
      {right && <div className="cx-li-r" onClick={(e) => e.stopPropagation()}>{right}</div>}
    </div>
  )
}

/* ---------- Панель дашборда ---------- */
export function Panel({ icon, tone, title, count, action, children }: { icon: ReactNode; tone?: Tone; title: string; count?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card cx-panel">
      <div className="card-head">
        <div className="cx-panel-title"><Ico tone={tone}>{icon}</Ico><h3>{title}</h3>{count !== undefined && <Badge tone={tone ?? 'muted'} plain>{count}</Badge>}</div>
        {action}
      </div>
      <div className="cx-list">{children}</div>
    </section>
  )
}
export function MoreBtn({ onClick, children = 'Все' }: { onClick: () => void; children?: ReactNode }) {
  return <button className="btn btn-ghost btn-sm" onClick={onClick}>{children}<ChevronRight /></button>
}

/* ---------- Шаги статуса ---------- */
export function Steps<T extends string>({ steps, value, onChange, isDisabled }: { steps: readonly T[]; value: T; onChange?: (v: T) => void; isDisabled?: (v: T) => boolean }) {
  const idx = steps.indexOf(value)
  return (
    <div className="cx-steps">
      {steps.map((s, i) => (
        <button key={s} type="button" className={`cx-step ${i < idx ? 'done' : ''} ${i === idx ? 'on' : ''}`} disabled={!onChange || isDisabled?.(s)} onClick={() => onChange?.(s)}>{s}</button>
      ))}
    </div>
  )
}

/* ---------- Канбан ---------- */
export function Kanban<T extends { id: string }, S extends string>({ columns, items, colOf, onMove, render, onOpen, hint }: {
  columns: readonly S[]; items: T[]; colOf: (t: T) => S; onMove: (t: T, to: S) => void; render: (t: T) => ReactNode; onOpen: (t: T) => void; hint?: (s: S) => string
}) {
  const [drag, setDrag] = useState<string | null>(null)
  const [over, setOver] = useState<S | null>(null)
  return (
    <div className="cx-kanban" style={{ ['--cols' as string]: columns.length }}>
      {columns.map((c) => {
        const list = items.filter((t) => colOf(t) === c)
        return (
          <div key={c} className={`cx-col ${over === c ? 'over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setOver(c) }}
            onDragLeave={() => setOver((o) => (o === c ? null : o))}
            onDrop={(e) => { e.preventDefault(); const t = items.find((x) => x.id === drag); setOver(null); setDrag(null); if (t && colOf(t) !== c) onMove(t, c) }}>
            <div className="cx-col-head"><span>{c}</span><span className="n tnum">{list.length}</span></div>
            {list.map((t) => (
              <div key={t.id} className={`cx-card ${drag === t.id ? 'drag' : ''}`} draggable
                onDragStart={(e) => { setDrag(t.id); e.dataTransfer.effectAllowed = 'move' }} onDragEnd={() => { setDrag(null); setOver(null) }}
                onClick={() => onOpen(t)}>
                {render(t)}
              </div>
            ))}
            {!list.length && <div className="cx-col-hint">{hint?.(c) ?? 'Перетащите карточку сюда'}</div>}
          </div>
        )
      })}
    </div>
  )
}
/** Кнопка «на следующий этап» внутри карточки канбана (для мобильных, где нет drag-n-drop). */
export function NextBtn<S extends string>({ steps, value, onMove }: { steps: readonly S[]; value: S; onMove: (s: S) => void }) {
  const i = steps.indexOf(value)
  if (i < 0 || i >= steps.length - 1) return null
  return <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onMove(steps[i + 1]) }} title={`Перевести: ${steps[i + 1]}`}>{steps[i + 1]}<ChevronRight /></button>
}

/* ---------- Чек-лист ---------- */
export function Checklist({ items, onToggle, disabled }: { items: { id: string; text: string; done: boolean }[]; onToggle: (id: string) => void; disabled?: boolean }) {
  return (
    <div className="cx-checks">
      {items.map((c) => (
        <label key={c.id} className={`cx-ck ${c.done ? 'done' : ''}`}>
          <input type="checkbox" checked={c.done} disabled={disabled} onChange={() => onToggle(c.id)} /><span>{c.text}</span>
        </label>
      ))}
    </div>
  )
}

/* ---------- Загрузка файлов с превью ---------- */
export function FileTile({ a, onRemove }: { a: Attachment; onRemove?: () => void }) {
  return (
    <div className="cx-file" title={a.name}>
      {a.kind === 'photo' && a.url ? <img src={a.url} alt={a.name} /> : a.kind === 'video' && a.url ? <video src={a.url} muted controls playsInline /> : a.kind === 'video' ? <Film /> : a.kind === 'photo' ? <ImagePlus /> : <FileText />}
      {a.kind === 'video' && <span className="tag">ВИДЕО</span>}
      <span className="nm">{a.name}</span>
      {onRemove && <button type="button" className="rm" onClick={onRemove} aria-label="Удалить файл"><X /></button>}
    </div>
  )
}
export function Uploader({ files, onChange, accept = 'image/*,video/*,.pdf', label = 'Добавить фото, видео или документ' }: { files: Attachment[]; onChange: (f: Attachment[]) => void; accept?: string; label?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const add = (list: FileList | null) => {
    if (!list) return
    const next: Attachment[] = [...list].map((f) => ({
      id: uid('f'), name: f.name, size: f.size,
      kind: f.type.startsWith('image/') ? 'photo' : f.type.startsWith('video/') ? 'video' : 'file',
      url: f.type.startsWith('image/') || f.type.startsWith('video/') ? URL.createObjectURL(f) : undefined,
    }))
    onChange([...files, ...next])
    if (ref.current) ref.current.value = ''
  }
  return (
    <div className="stack-sm">
      <label className="cx-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files) }}>
        <Paperclip size={18} /><span>{label}</span><span className="cx-mini">JPG, PNG, MP4, PDF · можно несколько</span>
        <input ref={ref} type="file" multiple accept={accept} onChange={(e) => add(e.target.files)} />
      </label>
      {!!files.length && <div className="cx-files">{files.map((a) => <FileTile key={a.id} a={a} onRemove={() => onChange(files.filter((x) => x.id !== a.id))} />)}</div>}
    </div>
  )
}

/* ---------- Действия механика над стором ---------- */
/** Принять заявку водителя: создаёт карточку ТО/ремонта со статусом «Новая». */
export function acceptRequest(q: DriverRequest): Repair {
  const existing = repairsStore.get().find((r) => r.id === q.repairId)
  if (existing) { requestsStore.set((p) => p.map((x) => (x.id === q.id ? { ...x, status: 'Принята' } : x))); return existing }
  const num = 2048 + repairsStore.get().length
  const r: Repair = {
    id: uid('r'), number: q.type === 'ТО' ? `ТО-${num}` : `Р-${num}`, kind: q.type === 'ТО' ? 'Плановое ТО' : 'Внеплановый ремонт',
    equipmentId: q.equipmentId, driverId: q.driverId, title: q.text.split(/[.,]/)[0], diagnosis: `Со слов водителя: ${q.text}`,
    source: 'Заявка водителя', status: 'Новая', planned: NOW.slice(0, 10),
    checklist: (q.type === 'ТО' ? toTemplate : ['Осмотр и диагностика', 'Устранение неисправности', 'Проверка после ремонта']).map((t, i) => ({ id: `c${i}`, text: t, done: false })),
    parts: [], conclusion: '',
  }
  repairsStore.set((p) => [r, ...p])
  requestsStore.set((p) => p.map((x) => (x.id === q.id ? { ...x, status: 'Принята', repairId: r.id } : x)))
  return r
}
/** «Начать ремонт»: фиксирует начало простоя, техника → «В ремонте». */
export function startRepair(equipmentId: string, title: string, diagnosis: string, sub?: Repair['sub'], driverId?: string): Repair {
  const open = repairsStore.get().find((r) => r.equipmentId === equipmentId && r.status !== 'Закрыта' && r.kind === 'Внеплановый ремонт')
  let r: Repair
  if (open) {
    r = { ...open, status: 'В работе', sub: sub ?? open.sub, downtimeStart: open.downtimeStart ?? NOW, diagnosis: diagnosis || open.diagnosis }
    repairsStore.set((p) => p.map((x) => (x.id === r.id ? r : x)))
  } else {
    r = {
      id: uid('r'), number: `Р-${2048 + repairsStore.get().length}`, kind: 'Внеплановый ремонт', equipmentId, driverId, title, diagnosis,
      source: 'Осмотр механика', status: 'В работе', sub, planned: NOW.slice(0, 10), downtimeStart: NOW,
      checklist: ['Осмотр и диагностика', 'Устранение неисправности', 'Проверка после ремонта'].map((t, i) => ({ id: `c${i}`, text: t, done: false })), parts: [], conclusion: '',
    }
    repairsStore.set((p) => [r, ...p])
  }
  fleetStore.set((p) => p.map((u) => (u.id === equipmentId ? { ...u, state: 'В ремонте', repairStartedAt: r.downtimeStart, repairId: r.id } : u)))
  return r
}
/** «Закрыть ремонт»: фиксирует конец простоя и заключение, техника → «Свободна». */
export function closeRepair(id: string, conclusion: string) {
  const r = repairsStore.get().find((x) => x.id === id)
  if (!r) return
  repairsStore.set((p) => p.map((x) => (x.id === id ? { ...x, status: 'Закрыта', conclusion: conclusion || x.conclusion, downtimeEnd: x.downtimeStart ? NOW : undefined, checklist: x.checklist.map((c) => ({ ...c, done: true })) } : x)))
  fleetStore.set((p) => p.map((u) => (u.id === r.equipmentId && u.repairId === id ? { ...u, state: 'Свободна', repairStartedAt: undefined, repairId: undefined, faults: [], ...(r.kind === 'Плановое ТО' ? { lastTo: NOW.slice(0, 10) } : {}) } : u)))
  if (r.kind === 'Плановое ТО') fleetStore.set((p) => p.map((u) => (u.id === r.equipmentId ? { ...u, lastTo: NOW.slice(0, 10) } : u)))
  requestsStore.set((p) => p.map((q) => (q.repairId === id ? { ...q, status: 'Решение', answer: conclusion } : q)))
}
