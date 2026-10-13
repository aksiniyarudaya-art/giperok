import { useState } from 'react'
import { MessagesSquare, Users } from 'lucide-react'
import { Field, Modal, PageHead, SearchInput, Seg, Stat, useToast } from '../../ui'
import { ChatPanel, type ChatThread } from '../../ui/Chat'
import { emp, employees } from '../../data/mock'
import { roleLabels } from '../../data/types'
import { chatSeed } from '../../data/crm-b'
import type { CrmPageProps } from './types'
import { shortName } from './crm-b-ui'
import './crm-b.css'

const meByRole = { manager: 'e1', mechanic: 'e4', hr: 'e6', admin: 'e7' } as const

export default function Chats({ role }: CrmPageProps) {
  const toast = useToast()
  const me = emp(meByRole[role])!
  const [threads, setThreads] = useState<ChatThread[]>(() => chatSeed.filter((t) => t.title !== me.name))
  const [ver, setVer] = useState(0)
  const [kind, setKind] = useState<'all' | 'personal' | 'group'>('all')
  const [create, setCreate] = useState(false)

  const shown = threads.filter((t) => kind === 'all' || (kind === 'group' ? t.group : !t.group))
  return (
    <div className="cb-page">
      <PageHead title="Чаты" sub="Личные и групповые чаты со всеми сотрудниками: менеджеры, водители, механики, кадры." />
      <div className="cb-stats">
        <Stat label="Диалогов" value={threads.length} icon={<MessagesSquare size={16} />} />
        <Stat label="Групповых" value={threads.filter((t) => t.group).length} icon={<Users size={16} />} />
        <Stat label="Непрочитанных" value={threads.reduce((a, t) => a + (t.unread ?? 0), 0)} icon={<MessagesSquare size={16} />} />
      </div>
      <Seg value={kind} onChange={(v) => { setKind(v); setVer((x) => x + 1) }} items={[{ id: 'all', label: 'Все' }, { id: 'personal', label: 'Личные' }, { id: 'group', label: 'Групповые' }]} />
      <ChatPanel key={`${kind}-${ver}`} threads={shown} allowCreate onCreate={() => setCreate(true)} />
      {create && <NewChat meId={me.id} onClose={() => setCreate(false)} onCreate={(t) => {
        setThreads((ts) => [t, ...ts]); setKind('all'); setVer((x) => x + 1); setCreate(false)
        toast(t.group ? `Групповой чат «${t.title}» создан` : `Чат с ${t.title} создан`)
      }} />}
    </div>
  )
}

function NewChat({ meId, onClose, onCreate }: { meId: string; onClose: () => void; onCreate: (t: ChatThread) => void }) {
  const [type, setType] = useState<'personal' | 'group'>('personal')
  const [title, setTitle] = useState('')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string[]>([])
  const people = employees.filter((e) => e.id !== meId && e.status !== 'Уволен' && (!q || `${e.name} ${e.position}`.toLowerCase().includes(q.toLowerCase())))
  const toggle = (id: string) => setSel((s) => (type === 'personal' ? [id] : s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const ok = type === 'personal' ? sel.length === 1 : sel.length >= 2 && title.trim()
  const submit = () => {
    if (type === 'personal') {
      const e = emp(sel[0])!
      onCreate({ id: `ch-${Date.now()}`, title: e.name, sub: e.position, msgs: [] })
    } else {
      onCreate({ id: `ch-${Date.now()}`, title: title.trim(), sub: `${sel.length + 1} участников: ${sel.slice(0, 3).map((id) => shortName(emp(id)!.name)).join(', ')}${sel.length > 3 ? '…' : ''}`, group: true,
        msgs: [{ from: 'Система', text: `Чат создан. Участники: ${sel.map((id) => shortName(emp(id)!.name)).join(', ')}`, at: 'сейчас' }] })
    }
  }
  return (
    <Modal title="Новый чат" onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Отмена</button><button className="btn btn-primary" disabled={!ok} onClick={submit}>Создать чат</button></>}>
      <Seg value={type} onChange={(v) => { setType(v); setSel([]) }} items={[{ id: 'personal', label: 'Личный' }, { id: 'group', label: 'Групповой' }]} />
      {type === 'group' && <Field label="Название чата" required><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Объект «ЖК Сокол»" /></Field>}
      <Field label={type === 'personal' ? 'Собеседник' : `Участники (выбрано ${sel.length})`} hint={type === 'group' ? 'Минимум 2 участника' : undefined}>
        <SearchInput value={q} onChange={setQ} placeholder="Поиск сотрудника" />
      </Field>
      <div className="cb-people">
        {people.map((e) => (
          <label key={e.id}>
            <input type={type === 'personal' ? 'radio' : 'checkbox'} name="chat-people" checked={sel.includes(e.id)} onChange={() => toggle(e.id)} />
            <div className="grow"><div style={{ fontWeight: 600 }}>{e.name}</div><div className="cb-cell-sub">{e.position} · {roleLabels[e.role]}</div></div>
          </label>
        ))}
      </div>
    </Modal>
  )
}
