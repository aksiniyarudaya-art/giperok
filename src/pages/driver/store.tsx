import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ChatThread } from '../../ui/Chat'
import {
  briefingsSeed, chatThreads, docsSeed, notices as noticesSeed, requestsSeed,
  type Briefing, type DriverDoc, type DriverRequest, type Notice,
} from '../../data/driver'

/* ---------- Рабочая смена (сессия) ---------- */
export type ShiftEvent = { id: string; kind: 'start' | 'arrived' | 'work' | 'pause' | 'resume' | 'repair' | 'repair-end' | 'finish' | 'geo' | 'info'; at: number; label: string; note?: string; warn?: boolean }
export type WorkState = 'none' | 'arrived' | 'working' | 'paused' | 'repair' | 'finished'
export type ShiftSession = {
  phase: 'idle' | 'active' | 'done'
  step: 1 | 2 | 3 | 4
  tmc: Record<string, boolean>
  photos: Record<string, string>
  needTo: boolean | null
  toRequestId?: string
  wb: { front?: string; back?: string; blurry: boolean; recognized: boolean; accepted: boolean; date: string; number: string; moto: string; manualSent: boolean }
  startedAt?: number
  state: WorkState
  pauseMs: number
  repairMs: number
  markAt?: number
  /** смещение «демо-времени», мс */
  shift: number
  events: ShiftEvent[]
  geo?: { dist: number; ok: boolean }
  cleanup: string[]
  returned: string[]
  endMoto: string
  endKm: string
  finishedAt?: number
  /** момент «Завершил работу» — таймер останавливается */
  stoppedAt?: number
}
export const freshSession = (): ShiftSession => ({
  phase: 'idle', step: 1, tmc: {}, photos: {}, needTo: null,
  wb: { blurry: false, recognized: false, accepted: false, date: '', number: '', moto: '', manualSent: false },
  state: 'none', pauseMs: 0, repairMs: 0, shift: 0, events: [], cleanup: [], returned: [], endMoto: '', endKm: '',
})

type Ctx = {
  requests: DriverRequest[]
  setRequests: React.Dispatch<React.SetStateAction<DriverRequest[]>>
  addRequest: (r: DriverRequest) => void
  updateRequest: (r: DriverRequest) => void
  removeRequest: (id: string) => void
  docs: DriverDoc[]
  setDocs: React.Dispatch<React.SetStateAction<DriverDoc[]>>
  briefings: Briefing[]
  setBriefings: React.Dispatch<React.SetStateAction<Briefing[]>>
  notices: Notice[]
  setNotices: React.Dispatch<React.SetStateAction<Notice[]>>
  threads: ChatThread[]
  setThreads: React.Dispatch<React.SetStateAction<ChatThread[]>>
  session: ShiftSession
  setSession: React.Dispatch<React.SetStateAction<ShiftSession>>
  completed: number
  setCompleted: React.Dispatch<React.SetStateAction<number>>
  toast: (msg: string, tone?: 'ok' | 'warn') => void
  toasts: { id: number; msg: string; tone: 'ok' | 'warn' }[]
  nextNum: () => string
}

const DriverCtx = createContext<Ctx | null>(null)
export const useDriver = () => {
  const c = useContext(DriverCtx)
  if (!c) throw new Error('DriverCtx')
  return c
}

export function DriverProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState(requestsSeed)
  const [docs, setDocs] = useState(docsSeed)
  const [briefings, setBriefings] = useState(briefingsSeed)
  const [notices, setNotices] = useState(noticesSeed)
  const [threads, setThreads] = useState(chatThreads)
  const [session, setSession] = useState<ShiftSession>(freshSession)
  const [completed, setCompleted] = useState(0)
  const [toasts, setToasts] = useState<Ctx['toasts']>([])
  const counter = useRef(125)

  const toast = useCallback((msg: string, tone: 'ok' | 'warn' = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((s) => [...s, { id, msg, tone }])
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 3000)
  }, [])

  const value = useMemo<Ctx>(() => ({
    requests, setRequests,
    addRequest: (r) => setRequests((s) => [r, ...s]),
    updateRequest: (r) => setRequests((s) => s.map((x) => (x.id === r.id ? r : x))),
    removeRequest: (id) => setRequests((s) => s.filter((x) => x.id !== id)),
    docs, setDocs, briefings, setBriefings, notices, setNotices, threads, setThreads,
    session, setSession, completed, setCompleted, toast, toasts,
    nextNum: () => `З-${counter.current++}`,
  }), [requests, docs, briefings, notices, threads, session, completed, toast, toasts])

  return <DriverCtx.Provider value={value}>{children}</DriverCtx.Provider>
}

/* ---------- Хелперы ---------- */
export const nowIso = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  // Демо-дата приложения — 13.10.2026, время — текущее.
  return `2026-10-13T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
export const hhmm = (ms: number) => new Date(ms).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
export const dur = (ms: number, withSec = true) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return withSec ? `${p(h)}:${p(m)}:${p(ss)}` : `${h} ч ${p(m)} мин`
}
export const hoursStr = (h: number) => `${String(h).replace('.', ',')} ч`

/** Группы заявок по вкладкам. */
export type ReqTab = 'new' | 'work' | 'done' | 'cancel' | 'archive'
export const reqBucket = (r: DriverRequest): ReqTab => {
  if (r.archived) return 'archive'
  if (r.status === 'Отправлена') return 'new'
  if (r.status === 'Отменена' || r.status === 'Отклонена') return 'cancel'
  if (r.status === 'Решение' || r.status === 'Выполнена') return 'done'
  return 'work'
}

/** Текущее время с обновлением раз в секунду. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

/** Расчёт времени смены: всего, работа, пауза, ремонт (ремонтные часы — отдельно от рабочих). */
export function shiftTimes(s: ShiftSession, now: number) {
  if (!s.startedAt) return { total: 0, work: 0, pause: 0, repair: 0 }
  const end = s.stoppedAt ?? s.finishedAt ?? now + s.shift
  const live = s.markAt ? end - s.markAt : 0
  const pause = s.pauseMs + (s.state === 'paused' ? live : 0)
  const repair = s.repairMs + (s.state === 'repair' ? live : 0)
  const total = end - s.startedAt
  return { total, pause, repair, work: Math.max(0, total - pause - repair) }
}
