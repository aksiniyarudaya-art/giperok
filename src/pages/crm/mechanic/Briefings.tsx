import { useMemo, useState } from 'react'
import { AlertOctagon, BookOpenCheck, CalendarCheck, Check, ClipboardX, FileSignature, Plus, Send, ShieldCheck, Trash2, X } from 'lucide-react'
import type { CrmPageProps } from '../types'
import { Avatar, Badge, DataTable, Drawer, Field, KV, Modal, PageHead, Progress, Seg, Stat, Tabs, date, daysBetween, time, uid, useToast, type Col } from '../../../ui'
import { TODAY, drivers, emp } from '../../../data/mock'
import {
  BRIEF_VALID_DAYS, NOW, briefingsStore, mandatoryMatrix, mandatoryTopics, useStoreList,
  type BriefKind, type Briefing, type PartState,
} from '../../../data/crm-c'
import { XBadge, dt, empShort } from './parts'

type Tab = 'journal' | 'matrix'
type KindF = 'all' | BriefKind

export default function Briefings({ role }: CrmPageProps) {
  const toast = useToast()
  const list = useStoreList(briefingsStore)
  const [tab, setTab] = useState<Tab>('journal')
  const [kind, setKind] = useState<KindF>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [create, setCreate] = useState<null | Partial<Briefing>>(null)
  const [matrix, setMatrix] = useState(mandatoryMatrix)

  const rows = useMemo(() => [...list.rows].filter((b) => kind === 'all' || b.kind === kind).sort((a, b) => b.date.localeCompare(a.date)), [list.rows, kind])
  const today = list.rows.filter((b) => b.date.slice(0, 10) === TODAY && b.status !== 'Отменён')
  const refusals = list.rows.flatMap((b) => b.participants).filter((p) => p.state === 'Отказ' || p.state === 'Не пройден').length
  const cellState = (d: string | null) => !d ? 'none' : daysBetween(d, TODAY) > BRIEF_VALID_DAYS ? 'bad' : 'ok'
  const overdueCnt = Object.values(matrix).flat().filter((d) => d && cellState(d) === 'bad').length
  const missingCnt = Object.values(matrix).flat().filter((d) => !d).length

  const cols: Col<Briefing>[] = [
    { key: 'd', title: 'Дата', nowrap: true, render: (b) => <div><div>{date(b.date)}</div><div className="cx-mini">{time(b.date)}</div></div> },
    { key: 'k', title: 'Вид', render: (b) => <XBadge s={b.kind} /> },
    { key: 't', title: 'Тема', render: (b) => <div><div style={{ fontWeight: 600 }}>{b.topic}</div><div className="cx-mini hide-mobile">{b.reason}</div></div> },
    { key: 'w', title: 'Для кого', hideMobile: true, render: (b) => <div className="row" style={{ gap: 4 }}>{b.participants.slice(0, 4).map((p) => <Avatar key={p.empId} name={emp(p.empId)?.name ?? ''} size="sm" />)}{b.participants.length > 4 && <span className="cx-mini">+{b.participants.length - 4}</span>}</div> },
    { key: 'p', title: 'Прохождение', hideMobile: true, render: (b) => { const n = b.participants.filter((p) => p.state === 'Пройден').length; return <div style={{ minWidth: 90 }}><div className="cx-mini tnum">{n} из {b.participants.length}</div><Progress value={(n / b.participants.length) * 100} tone={n === b.participants.length ? 'ok' : undefined} /></div> } },
    { key: 's', title: 'Статус', render: (b) => <div className="stack-sm" style={{ gap: 4 }}><XBadge s={b.status} />{b.participants.some((p) => p.state === 'Отказ') && <XBadge s="Отказ" />}</div> },
  ]

  const b = list.rows.find((x) => x.id === openId)

  return (
    <>
      <PageHead title="Инструктажи" sub="Первичные, повторные и внеплановые (после инцидента) инструктажи водителей"
        actions={<button className="btn btn-primary" onClick={() => setCreate({})}><Plus />Назначить инструктаж</button>} />

      <div className="cx-stats" style={{ ['--n' as string]: 5 }}>
        <Stat icon={<CalendarCheck />} label="Сегодня" value={today.length} delta={`${today.reduce((a, x) => a + x.participants.length, 0)} участников`} />
        <Stat icon={<ShieldCheck />} label="Запланировано" value={list.rows.filter((x) => x.status === 'Запланирован').length} />
        <Stat icon={<BookOpenCheck />} label="Проведено" value={list.rows.filter((x) => x.status === 'Проведён').length} />
        <Stat icon={<ClipboardX />} label="Отказы / не сдали" value={refusals} trend="down" />
        <Stat icon={<AlertOctagon />} label="Обязательные: просрочено" value={overdueCnt} delta={`не пройдено: ${missingCnt}`} trend="down" />
      </div>

      <div className="card stack">
        <div className="toolbar">
          <Tabs value={tab} onChange={setTab} items={[{ id: 'journal', label: 'Журнал инструктажей', count: list.rows.length }, { id: 'matrix', label: 'Обязательные темы' }]} />
          <div className="grow" />
          {tab === 'journal' && <Seg value={kind} onChange={setKind} items={[{ id: 'all', label: 'Все' }, { id: 'Первичный', label: 'Первичные' }, { id: 'Повторный', label: 'Повторные' }, { id: 'Внеплановый', label: 'Внеплановые' }]} />}
        </div>

        {tab === 'journal' && <DataTable cols={cols} rows={rows} rowKey={(x) => x.id} onRow={(x) => setOpenId(x.id)} />}

        {tab === 'matrix' && <>
          <div className="cx-note">Обязательные инструктажи для водителей (часть 3 ТЗ). Срок действия — {BRIEF_VALID_DAYS} дней; просроченные выделены красным. Водитель видит их в приложении как обязательные / пройденные / просроченные.</div>
          <div className="table-wrap"><table className="table cx-mx">
            <thead><tr><th>Водитель</th>{mandatoryTopics.map((t, i) => <th key={t} className="c" title={t}>{i + 1}. {t.split(' (')[0]}</th>)}<th className="r" /></tr></thead>
            <tbody>{drivers.map((d) => {
              const cells = matrix[d.id] ?? mandatoryTopics.map(() => null)
              const need = cells.map((c, i) => (cellState(c) !== 'ok' ? i : -1)).filter((i) => i >= 0)
              return <tr key={d.id}>
                <td><div style={{ fontWeight: 600 }} className="nowrap">{empShort(d.id)}</div><div className="cx-mini">{cells.filter((c) => cellState(c) === 'ok').length}/{mandatoryTopics.length} актуальны</div></td>
                {cells.map((c, i) => <td key={i} className="c"><span className={`cx-cell ${cellState(c)}`} title={mandatoryTopics[i]}>{!c ? '—' : cellState(c) === 'bad' ? 'просрочен' : `${c.slice(8, 10)}.${c.slice(5, 7)}`}</span></td>)}
                <td className="r">{need.length ? <button className="btn btn-secondary btn-sm nowrap" onClick={() => setCreate({ kind: d.hireStage === 'Допущен' ? 'Повторный' : 'Первичный', topic: mandatoryTopics[need[0]], participants: [{ empId: d.id, state: 'Ожидает' }], reason: d.hireStage === 'Допущен' ? 'Истёк срок обязательного инструктажа' : 'Приём на работу — цепочка допуска' })}>Назначить ({need.length})</button> : <Badge tone="ok">Всё актуально</Badge>}</td>
              </tr>
            })}</tbody>
          </table></div>
          <ol className="cx-note cx-topics">{mandatoryTopics.map((t) => <li key={t}>{t}</li>)}</ol>
        </>}
      </div>

      {b && <BriefDrawer b={b} role={role} onClose={() => setOpenId(null)} onDone={(passedIds) => {
        const idx = mandatoryTopics.indexOf(b.topic)
        if (idx >= 0 && passedIds.length) setMatrix((m) => { const n = { ...m }; passedIds.forEach((id) => { n[id] = [...(n[id] ?? mandatoryTopics.map(() => null))]; n[id][idx] = TODAY }); return n })
      }} />}
      {create && <CreateModal init={create} onClose={() => setCreate(null)} onSave={(x) => { list.add(x); setCreate(null); setOpenId(x.id); toast('Инструктаж назначен — водители получили уведомление в приложении и Telegram (демо)') }} />}
    </>
  )
}

function BriefDrawer({ b, role, onClose, onDone }: { b: Briefing; role: string; onClose: () => void; onDone: (passed: string[]) => void }) {
  const toast = useToast()
  const list = useStoreList(briefingsStore)
  const [noteFor, setNoteFor] = useState<{ empId: string; state: PartState } | null>(null)
  const [note, setNote] = useState('')
  const setP = (empId: string, state: PartState, n?: string) => list.patch(b.id, { participants: b.participants.map((p) => (p.empId === empId ? { ...p, state, signedAt: state === 'Пройден' ? NOW : undefined, note: n ?? (state === 'Пройден' ? undefined : p.note) } : p)) })
  const marked = b.participants.every((p) => p.state !== 'Ожидает')
  const finished = b.status !== 'Запланирован'
  const conductor = role === 'admin' ? 'e7' : b.conductedBy

  return (
    <Drawer title={b.topic} sub={<>{b.kind} инструктаж · {dt(b.date)}</>} onClose={onClose}
      footer={<div className="row-between" style={{ width: '100%' }}>
        {!finished ? <button className="btn btn-ghost btn-sm" onClick={() => { list.patch(b.id, { status: 'Отменён' }); toast('Инструктаж отменён') }}><X />Отменить</button> : <button className="btn btn-ghost btn-sm" onClick={() => { list.remove(b.id); onClose(); toast('Запись удалена') }}><Trash2 />Удалить</button>}
        <div className="cx-btns">
          {!finished && <button className="btn btn-secondary btn-sm" onClick={() => toast('Напоминание отправлено участникам (демо)')}><Send />Напомнить</button>}
          {!finished && <button className="btn btn-primary btn-sm" disabled={!marked || !b.conductorSigned} title={!marked ? 'Отметьте всех участников' : !b.conductorSigned ? 'Нужна подпись проводящего' : ''}
            onClick={() => { list.patch(b.id, { status: 'Проведён' }); onDone(b.participants.filter((p) => p.state === 'Пройден').map((p) => p.empId)); toast('Инструктаж проведён и закрыт. Результаты переданы кадровику') }}><Check />Провести и закрыть</button>}
        </div>
      </div>}>
      <div className="stack">
        <KV items={[
          ['Вид', <XBadge key="k" s={b.kind} />], ['Статус', <XBadge key="s" s={b.status} />], ['Тема', b.topic], ['Причина', b.reason],
          ['Для кого', `${b.participants.length} ${b.participants.length === 1 ? 'водитель' : 'водителя(ей)'}`], ['Проводит', empShort(conductor)],
        ]} />

        <div className="cx-sec">
          <div className="cx-sec-h"><h4>Участники и прохождение</h4><span className="cx-mini tnum">{b.participants.filter((p) => p.state === 'Пройден').length}/{b.participants.length} пройдено</span></div>
          {b.participants.map((p) => (
            <div key={p.empId} className="card-flat stack-sm">
              <div className="row-between">
                <div className="row" style={{ flexWrap: 'nowrap' }}><Avatar name={emp(p.empId)?.name ?? ''} size="sm" /><div><b>{emp(p.empId)?.name}</b><div className="cx-mini">{p.signedAt ? `Подпись водителя: ${dt(p.signedAt)}` : 'Подпись водителя: нет'}</div></div></div>
                <XBadge s={p.state} />
              </div>
              {p.note && <div className="cx-mini cx-bad">{p.note}</div>}
              {!finished && <div className="cx-btns">
                <button className={`btn btn-sm ${p.state === 'Пройден' ? 'btn-ok' : 'btn-secondary'}`} onClick={() => { setP(p.empId, 'Пройден'); toast('Прохождение отмечено, водитель подтвердил ознакомление') }}><Check />Пройден</button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setNoteFor({ empId: p.empId, state: 'Не пройден' }); setNote('') }}>Не сдал</button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setNoteFor({ empId: p.empId, state: 'Отказ' }); setNote('') }}><AlertOctagon />Отказ / нарушение</button>
              </div>}
            </div>
          ))}
          {!finished && <AddParticipant exclude={b.participants.map((p) => p.empId)} onAdd={(id) => list.patch(b.id, { participants: [...b.participants, { empId: id, state: 'Ожидает' }] })} />}
        </div>

        <div className="cx-sec">
          <div className="cx-sec-h"><h4>Подписи</h4></div>
          <div className="row-between card-flat">
            <div><b>Проводящий: {empShort(conductor)}</b><div className="cx-mini">{b.conductorSigned ? 'Подписано электронной подписью' : 'Ожидает подписи'}</div></div>
            {b.conductorSigned ? <Badge tone="ok">Подписано</Badge> : <button className="btn btn-primary btn-sm" onClick={() => { list.patch(b.id, { conductorSigned: true }); toast('Лист инструктажа подписан') }}><FileSignature />Подписать</button>}
          </div>
          <div className="cx-mini">Подписи водителей ставятся в приложении при подтверждении ознакомления.</div>
        </div>
      </div>

      {noteFor && <Modal title={noteFor.state === 'Отказ' ? 'Зафиксировать отказ / нарушение' : 'Инструктаж не пройден'} onClose={() => setNoteFor(null)}
        footer={<><button className="btn btn-ghost" onClick={() => setNoteFor(null)}>Отмена</button><button className="btn btn-danger" disabled={note.trim().length < 3} onClick={() => { setP(noteFor.empId, noteFor.state, note); setNoteFor(null); toast(noteFor.state === 'Отказ' ? 'Отказ зафиксирован. Менеджер и кадровик уведомлены, допуск ограничен' : 'Результат зафиксирован, назначьте повторное прохождение') }}>Зафиксировать</button></>}>
        <Field label="Комментарий" required hint="Попадёт в карточку водителя и в отчёт кадровику"><textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder={noteFor.state === 'Отказ' ? 'Например: отказался подписывать лист ознакомления' : 'Например: 3 ошибки из 10 в проверке знаний'} /></Field>
      </Modal>}
    </Drawer>
  )
}

function AddParticipant({ exclude, onAdd }: { exclude: string[]; onAdd: (id: string) => void }) {
  const opts = drivers.filter((d) => !exclude.includes(d.id))
  if (!opts.length) return null
  return (
    <select className="select" value="" onChange={(e) => e.target.value && onAdd(e.target.value)} aria-label="Добавить участника">
      <option value="">+ Добавить водителя</option>{opts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
    </select>
  )
}

function CreateModal({ init, onClose, onSave }: { init: Partial<Briefing>; onClose: () => void; onSave: (b: Briefing) => void }) {
  const [kind, setKind] = useState<BriefKind>(init.kind ?? 'Повторный')
  const [topic, setTopic] = useState(init.topic ?? mandatoryTopics[0])
  const [custom, setCustom] = useState('')
  const [reason, setReason] = useState(init.reason ?? '')
  const [when, setWhen] = useState(`${TODAY}T15:00`)
  const [ids, setIds] = useState<string[]>(init.participants?.map((p) => p.empId) ?? [])
  const finalTopic = topic === '__custom' ? custom.trim() : topic
  const ok = ids.length > 0 && finalTopic && (kind !== 'Внеплановый' || reason.trim().length > 3)
  return (
    <Modal wide title="Назначить инструктаж" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Отмена</button><button className="btn btn-primary" disabled={!ok} onClick={() => onSave({ id: uid('b'), kind, topic: finalTopic, reason: reason || (kind === 'Первичный' ? 'Приём на работу' : 'Плановый повторный инструктаж'), date: `${when}:00`, status: 'Запланирован', conductedBy: 'e4', conductorSigned: false, participants: ids.map((empId) => ({ empId, state: 'Ожидает' })) })}>Назначить</button></>}>
      <div className="stack">
        <Field label="Вид инструктажа" required><div><Seg value={kind} onChange={setKind} items={[{ id: 'Первичный', label: 'Первичный' }, { id: 'Повторный', label: 'Повторный' }, { id: 'Внеплановый', label: 'Внеплановый (после инцидента)' }]} /></div></Field>
        <div className="grid g2">
          <Field label="Тема" required><select className="select" value={topic} onChange={(e) => setTopic(e.target.value)}>{mandatoryTopics.map((t) => <option key={t}>{t}</option>)}<option value="__custom">Другая тема…</option></select></Field>
          <Field label="Дата и время" required><input className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></Field>
        </div>
        {topic === '__custom' && <Field label="Своя тема" required><input className="input" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Например, работа вблизи ЛЭП" /></Field>}
        <Field label="Причина" required={kind === 'Внеплановый'} hint={kind === 'Внеплановый' ? 'Опишите инцидент, после которого проводится инструктаж' : undefined}>
          <textarea className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} style={{ minHeight: 70 }} />
        </Field>
        <Field label={`Для кого (${ids.length})`} required>
          <div className="grid g2" style={{ gap: 6 }}>{drivers.map((d) => (
            <label key={d.id} className="check"><input type="checkbox" checked={ids.includes(d.id)} onChange={() => setIds((s) => s.includes(d.id) ? s.filter((x) => x !== d.id) : [...s, d.id])} /><span>{d.name} <span className="cx-mini">· {d.hireStage === 'Допущен' ? d.position : d.hireStage}</span></span></label>
          ))}</div>
        </Field>
      </div>
    </Modal>
  )
}
