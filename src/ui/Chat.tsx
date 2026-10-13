import { useState } from 'react'
import { Paperclip, Plus, Send, Users } from 'lucide-react'
import { Avatar } from './index'

export type ChatMsg = { from: string; me?: boolean; text: string; at: string; file?: string }
export type ChatThread = { id: string; title: string; sub?: string; group?: boolean; unread?: number; msgs: ChatMsg[] }

/** Универсальный чат: список диалогов + переписка. Используется во всех кабинетах. */
export function ChatPanel({ threads: initial, allowCreate, onCreate }: { threads: ChatThread[]; allowCreate?: boolean; onCreate?: () => void }) {
  const [threads, setThreads] = useState(initial)
  const [active, setActive] = useState(initial[0]?.id)
  const [text, setText] = useState('')
  const cur = threads.find((t) => t.id === active)
  const send = () => {
    if (!text.trim() || !cur) return
    const now = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    setThreads((ts) => ts.map((t) => (t.id === cur.id ? { ...t, msgs: [...t.msgs, { from: 'Вы', me: true, text, at: now }] } : t)))
    setText('')
  }
  return (
    <div className="chat">
      <div className="chat-list">
        {allowCreate && (
          <div style={{ padding: 12, borderBottom: '1px solid var(--line)' }}>
            <button className="btn btn-secondary btn-sm btn-block" onClick={onCreate}><Plus />Новый чат</button>
          </div>
        )}
        {threads.map((t) => (
          <div key={t.id} className={`chat-item ${t.id === active ? 'on' : ''}`} onClick={() => setActive(t.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setActive(t.id)}>
            {t.group ? <span className="avatar sm" style={{ background: 'var(--accent-soft)', color: 'var(--warn)' }}><Users size={14} /></span> : <Avatar name={t.title} size="sm" />}
            <div className="grow">
              <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
              <div className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.msgs[t.msgs.length - 1]?.text ?? t.sub}</div>
            </div>
            {t.unread ? <span className="badge badge-accent plain">{t.unread}</span> : null}
          </div>
        ))}
      </div>
      <div className="chat-main">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontWeight: 600 }}>{cur?.title}</div>
          {cur?.sub && <div className="muted" style={{ fontSize: 12 }}>{cur.sub}</div>}
        </div>
        <div className="chat-msgs">
          {cur?.msgs.map((m, i) => (
            <div key={i} className={`msg ${m.me ? 'me' : ''}`}>
              {!m.me && cur.group && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--steel)' }}>{m.from}</div>}
              {m.text}
              {m.file && <div className="row" style={{ gap: 6, marginTop: 6, fontSize: 13, fontWeight: 600 }}><Paperclip size={14} />{m.file}</div>}
              <div className="t">{m.at}</div>
            </div>
          ))}
        </div>
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send() }}>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Прикрепить файл"><Paperclip /></button>
          <input id="chat-text" className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение" />
          <button className="btn btn-primary btn-icon" aria-label="Отправить"><Send /></button>
        </form>
      </div>
    </div>
  )
}
