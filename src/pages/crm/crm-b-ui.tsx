/* Общие мелкие компоненты разделов CRM 9–16. */
import type { ReactNode } from 'react'
import { Archive, Ban, Lock, Undo2 } from 'lucide-react'
import { Avatar } from '../../ui'
import { isAdmin, type CrmRole } from './types'
import './crm-b.css'

/** Панель администратора: «Отменить / Архивировать / Заблокировать». Показывается только админу. */
export function AdminActions({ role, onCancel, onArchive, onBlock, blocked, cancelLabel = 'Отменить' }: {
  role: CrmRole; onCancel?: () => void; onArchive?: () => void; onBlock?: () => void; blocked?: boolean; cancelLabel?: string
}) {
  if (!isAdmin(role)) return null
  return (
    <div className="cb-adm">
      <span className="eyebrow">Администратор</span>
      {onCancel && <button className="btn btn-secondary btn-sm" onClick={onCancel}><Undo2 />{cancelLabel}</button>}
      {onArchive && <button className="btn btn-secondary btn-sm" onClick={onArchive}><Archive />Архивировать</button>}
      {onBlock && <button className={`btn btn-sm ${blocked ? 'btn-ok' : 'btn-danger'}`} onClick={onBlock}>{blocked ? <Lock /> : <Ban />}{blocked ? 'Разблокировать' : 'Заблокировать'}</button>}
    </div>
  )
}

export function Person({ name, sub, size }: { name: string; sub?: ReactNode; size?: 'sm' | 'lg' }) {
  return (
    <div className="cb-person">
      <Avatar name={name} size={size ?? 'sm'} />
      <div><div className="cb-cell-main">{name}</div>{sub && <div className="cb-cell-sub">{sub}</div>}</div>
    </div>
  )
}

export function Section({ title, icon, children, extra }: { title: string; icon?: ReactNode; children: ReactNode; extra?: ReactNode }) {
  return (
    <section className="cb-section">
      <div className="row-between"><h4 className="row" style={{ gap: 8 }}>{icon}{title}</h4>{extra}</div>
      {children}
    </section>
  )
}

export const shortName = (full: string) => {
  const [f, n, p] = full.split(' ')
  return n ? `${f} ${n[0]}.${p ? ` ${p[0]}.` : ''}` : full
}
