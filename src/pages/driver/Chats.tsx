import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera, MapPin, Paperclip, Phone, Plus, Search, Send, Users } from 'lucide-react'
import { Avatar, Field } from '../../ui'
import { chatContacts } from '../../data/driver'
import { CheckRow, Layer, Sheet } from './kit'
import { useDriver } from './store'

const nowT = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

export default function Chats() {
  const nav = useNavigate()
  const { threads, setThreads, toast } = useDriver()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'direct' | 'group'>('all')
  const [create, setCreate] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [name, setName] = useState('')
  const list = threads
    .filter((t) => filter === 'all' || (filter === 'group' ? t.group : !t.group))
    .filter((t) => !q || t.title.toLowerCase().includes(q.toLowerCase()))

  const createChat = () => {
    const people = chatContacts.filter((c) => picked.includes(c.id))
    const group = people.length > 1
    const id = `c-${Date.now()}`
    setThreads((s) => [{ id, title: group ? name || people.map((p) => p.name.split(' ')[0]).join(', ') : people[0].name, sub: group ? `Группа · ${people.length + 1} участника` : people[0].position, group, msgs: [] }, ...s])
    setCreate(false); setPicked([]); setName('')
    toast(group ? 'Групповой чат создан' : 'Чат создан')
    nav(`/driver/chats/${id}`)
  }

  return (
    <div className="drv-pad stack drv-pb">
      <div className="input-icon"><Search /><input className="input drv-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по чатам" aria-label="Поиск по чатам" /></div>
      <div className="drv-chips">
        {([['all', 'Все'], ['direct', 'Личные'], ['group', 'Группы']] as const).map(([id, l]) => (
          <button key={id} type="button" className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>{l}</button>
        ))}
      </div>
      <div className="drv-list">
        {list.map((t) => {
          const last = t.msgs[t.msgs.length - 1]
          return (
            <button key={t.id} type="button" className="drv-row drv-chatrow" onClick={() => { setThreads((s) => s.map((x) => (x.id === t.id ? { ...x, unread: 0 } : x))); nav(`/driver/chats/${t.id}`) }}>
              {t.group ? <span className="avatar" style={{ background: 'var(--accent-soft)', color: 'var(--warn)' }}><Users size={18} /></span> : <Avatar name={t.title} />}
              <span className="drv-row-main">
                <span className="row-between" style={{ flexWrap: 'nowrap' }}><span className="drv-row-title drv-ellipsis">{t.title}</span><span className="drv-time">{last?.at}</span></span>
                <span className="row-between" style={{ flexWrap: 'nowrap' }}>
                  <span className="drv-row-sub drv-ellipsis">{last ? `${last.me ? 'Вы: ' : t.group ? last.from.split(' ')[0] + ': ' : ''}${last.text}` : t.sub}</span>
                  {t.unread ? <span className="drv-unread">{t.unread}</span> : null}
                </span>
              </span>
            </button>
          )
        })}
        {list.length === 0 && <div className="drv-empty"><b>Чаты не найдены</b></div>}
      </div>

      <Layer><button type="button" className="drv-fab" onClick={() => setCreate(true)}><Plus />Новый чат</button></Layer>

      {create && (
        <Sheet title="Новый чат" sub="Выберите одного собеседника или нескольких для группы" onClose={() => setCreate(false)}
          footer={<button className="btn btn-primary btn-lg btn-block" disabled={!picked.length} onClick={createChat}>{picked.length > 1 ? `Создать группу (${picked.length + 1})` : 'Начать чат'}</button>}>
          {picked.length > 1 && <Field label="Название группы"><input className="input drv-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Объект Ждановичи 15.10" /></Field>}
          <div className="drv-list">
            {chatContacts.map((c) => (
              <CheckRow key={c.id} checked={picked.includes(c.id)} onChange={(v) => setPicked((s) => (v ? [...s, c.id] : s.filter((x) => x !== c.id)))} title={c.name} sub={c.position} />
            ))}
          </div>
        </Sheet>
      )}
    </div>
  )
}

export function ChatThreadView() {
  const { id } = useParams()
  const { threads, setThreads, toast } = useDriver()
  const t = threads.find((x) => x.id === id)
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [t?.msgs.length])
  if (!t) return <div className="drv-empty"><b>Чат не найден</b></div>

  const push = (m: { text: string; file?: string }) => setThreads((s) => s.map((x) => (x.id === t.id ? { ...x, unread: 0, msgs: [...x.msgs, { from: 'Вы', me: true, at: nowT(), ...m }] } : x)))
  const send = () => {
    if (!text.trim()) return
    push({ text: text.trim() })
    setText('')
    if (!t.group) {
      setTimeout(() => setThreads((s) => s.map((x) => (x.id === t.id ? { ...x, msgs: [...x.msgs, { from: t.title, text: 'Принято, спасибо.', at: nowT() }] } : x))), 1600)
    }
  }

  return (
    <div className="drv-thread">
      <div className="drv-thread-head">
        <span className="drv-sub">{t.sub}</span>
        {!t.group && <button type="button" className="drv-link-btn" onClick={() => toast('Звонок через IP-телефонию (демо)')}><Phone size={14} />Позвонить</button>}
      </div>
      <div className="drv-msgs">
        <div className="drv-day">Сегодня</div>
        {t.msgs.length === 0 && <div className="drv-empty"><b>Начните переписку</b><span>Сообщения сохраняются и видны менеджеру по объекту.</span></div>}
        {t.msgs.map((m, i) => (
          <div key={i} className={`drv-msg ${m.me ? 'me' : ''}`}>
            {!m.me && t.group && <div className="drv-msg-from">{m.from}</div>}
            {m.text}
            {m.file && <div className="drv-msg-file"><Paperclip size={14} />{m.file}</div>}
            <div className="drv-msg-t">{m.at}</div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <Layer>
        <form className="drv-compose" onSubmit={(e) => { e.preventDefault(); send() }}>
          <button type="button" className="drv-iconbtn" aria-label="Фото" onClick={() => push({ text: 'Фото с объекта', file: 'IMG_2201.jpg' })}><Camera /></button>
          <button type="button" className="drv-iconbtn" aria-label="Геопозиция" onClick={() => push({ text: 'Моя геопозиция: ЖК «Сокол», ул. Брилевская, 35 (демо)' })}><MapPin /></button>
          <input className="input drv-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение" aria-label="Сообщение" />
          <button className="drv-send" aria-label="Отправить" disabled={!text.trim()}><Send /></button>
        </form>
      </Layer>
    </div>
  )
}
