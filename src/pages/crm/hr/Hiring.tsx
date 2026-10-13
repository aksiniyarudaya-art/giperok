import { useMemo, useState } from 'react'
import { Ban, CalendarOff, Check, CheckCheck, ClipboardCheck, FileCheck2, FileWarning, Lock, Plus, Send, ShieldAlert, Timer, Trash2, UserMinus, UserPlus } from 'lucide-react'
import type { CrmPageProps } from '../types'
import {
  Avatar, Badge, DataTable, Drawer, Field, KV, Modal, PageHead, Progress, SearchInput, Seg, Stat, Tabs, date, daysBetween, uid, useToast, type Col,
} from '../../../ui'
import { TODAY, emp, employees } from '../../../data/mock'
import type { HireStage } from '../../../data/types'
import {
  absencesStore, dismissChecklist, dismissalsStore, hireGroups, hireStages, hireStore, makeHireChecklist, personDocsStore, repairHoursStore, useStoreList,
  type Absence, type HireCard, type PersonDoc,
} from '../../../data/crm-c'
import { Checklist, Kanban, NextBtn, Steps, XBadge, empShort, eqTitle, hrs } from '../mechanic/parts'

type Tab = 'funnel' | 'docs' | 'absence' | 'dismiss' | 'hours'

const allDone = (h: HireCard) => h.checklist.every((c) => c.done)

export default function Hiring({ role }: CrmPageProps) {
  const toast = useToast()
  const hire = useStoreList(hireStore)
  const docs = useStoreList(personDocsStore)
  const abs = useStoreList(absencesStore)
  const dis = useStoreList(dismissalsStore)
  const rh = useStoreList(repairHoursStore)
  const [tab, setTab] = useState<Tab>('funnel')
  const [openId, setOpenId] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<HireCard | null>(null)
  const [addCand, setAddCand] = useState(false)

  const move = (h: HireCard, to: HireStage) => {
    if (to === 'Допущен' && !allDone(h)) { setBlocked(h); return }
    hire.patch(h.id, { stage: to })
    toast(to === 'Допущен' ? `${h.name} допущен(а): открыты смены, техника и доступ в приложение` : to === 'Инструктаж' ? `${h.name} отправлен(а) на инструктаж — механик получил задачу` : `${h.name}: ${to}`)
  }

  const inProcess = hire.rows.filter((h) => h.stage !== 'Допущен').length
  const expired = docs.rows.filter((d) => d.expires < TODAY).length
  const onCheck = docs.rows.filter((d) => d.status === 'На проверке').length
  const rhWait = rh.rows.filter((h) => h.status === 'Согласовано механиком' || h.status === 'Подтверждено кадровиком').length

  return (
    <>
      <PageHead title="Приём и увольнение" sub="Кандидат → Проверка → Оформление → Инструктаж → Допуск. Документы, отпуска, увольнения, ремонтные часы"
        actions={<>
          <button className="btn btn-secondary" onClick={() => setTab('dismiss')}><UserMinus />Увольнение</button>
          <button className="btn btn-primary" onClick={() => setAddCand(true)}><UserPlus />Кандидат</button>
        </>} />

      <div className="cx-stats">
        <Stat icon={<UserPlus />} label="Кандидаты в процессе" value={inProcess} />
        <Stat icon={<FileCheck2 />} label="Документы на проверке" value={onCheck} />
        <Stat icon={<FileWarning />} label="Просроченные документы" value={expired} trend="down" />
        <Stat icon={<Timer />} label="Ремонтные часы к обработке" value={rhWait} />
      </div>

      <div className="stack">
        <Tabs value={tab} onChange={setTab} items={[
          { id: 'funnel', label: 'Воронка приёма', count: hire.rows.length },
          { id: 'docs', label: 'Проверка документов', count: onCheck },
          { id: 'absence', label: 'Отпуска и больничные', count: abs.rows.filter((a) => a.status !== 'Закрыт').length },
          { id: 'dismiss', label: 'Увольнение', count: dis.rows.filter((d) => d.status === 'В процессе').length },
          { id: 'hours', label: 'Ремонтные часы', count: rhWait },
        ]} />

        {tab === 'funnel' && <>
          <div className="alert alert-info"><ShieldAlert /><span><b>Без статуса «Допущен» у сотрудника нет смен, техники и доступа в систему.</b> Перевести в «Допущен» можно только после завершения всего чек-листа оформления. Перетаскивайте карточки между колонками или используйте кнопку этапа.</span></div>
          <Kanban columns={hireStages} items={hire.rows} colOf={(h) => h.stage} onMove={move} onOpen={(h) => setOpenId(h.id)}
            hint={(s) => s === 'Допущен' ? 'Только с завершённым чек-листом' : 'Перетащите карточку сюда'}
            render={(h) => {
              const d = h.checklist.filter((c) => c.done).length
              return <>
                <div className="row" style={{ flexWrap: 'nowrap' }}><Avatar name={h.name} size="sm" /><div style={{ minWidth: 0 }}><div className="cx-card-t">{h.name}</div><div className="cx-card-s">{h.position}</div></div></div>
                <div className="stack-sm" style={{ gap: 4 }}><Progress value={(d / h.checklist.length) * 100} tone={d === h.checklist.length ? 'ok' : undefined} /><span className="cx-mini">Чек-лист {d}/{h.checklist.length}</span></div>
                <div className="cx-card-foot"><span>{h.source}</span><NextBtn steps={hireStages} value={h.stage} onMove={(s) => move(h, s)} /></div>
              </>
            }} />
        </>}

        {tab === 'docs' && <DocsTab />}
        {tab === 'absence' && <AbsenceTab />}
        {tab === 'dismiss' && <DismissTab />}
        {tab === 'hours' && <HoursTab />}
      </div>

      {openId && <HireDrawer id={openId} onClose={() => setOpenId(null)} onMove={move} />}

      {blocked && <Modal title="Нельзя допустить сотрудника" onClose={() => setBlocked(null)}
        footer={<><button className="btn btn-ghost" onClick={() => setBlocked(null)}>Понятно</button><button className="btn btn-primary" onClick={() => { setOpenId(blocked.id); setBlocked(null) }}>Открыть чек-лист</button></>}>
        <div className="stack">
          <div className="alert alert-bad"><Lock /><span>Чек-лист оформления не завершён: {blocked.checklist.filter((c) => !c.done).length} пункт(ов). Пока сотрудник не «Допущен», ему не назначаются смены и техника, а вход в приложение закрыт.</span></div>
          <ul className="cx-note" style={{ paddingLeft: 18 }}>{blocked.checklist.filter((c) => !c.done).map((c) => <li key={c.id}>{c.group}: {c.text}</li>)}</ul>
        </div>
      </Modal>}

      {addCand && <AddCandidate onClose={() => setAddCand(false)} onSave={(h) => { hire.add(h); setAddCand(false); toast('Кандидат добавлен. Ссылка на загрузку документов отправлена в Telegram (демо)') }} />}
    </>
  )
}

/* ---------- Карточка кандидата ---------- */
function HireDrawer({ id, onClose, onMove }: { id: string; onClose: () => void; onMove: (h: HireCard, s: HireStage) => void }) {
  const toast = useToast()
  const hire = useStoreList(hireStore)
  const h = hire.rows.find((x) => x.id === id)
  if (!h) return null
  const d = h.checklist.filter((c) => c.done).length
  const idx = hireStages.indexOf(h.stage)
  const next = hireStages[idx + 1]
  const empDocs = personDocsStore.get().filter((x) => x.empId === h.empId)
  return (
    <Drawer title={h.name} sub={`${h.position} · ${h.phone}`} onClose={onClose}
      footer={<div className="row-between" style={{ width: '100%' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => { hire.remove(h.id); onClose(); toast('Кандидат исключён из воронки') }}><Trash2 />Отказать</button>
        <div className="cx-btns">
          {h.stage !== 'Инструктаж' && h.stage !== 'Допущен' && <button className="btn btn-secondary btn-sm" onClick={() => onMove(h, 'Инструктаж')}><Send />На инструктаж</button>}
          {next && <button className={`btn btn-sm ${next === 'Допущен' ? 'btn-ok' : 'btn-primary'}`} disabled={next === 'Допущен' && !allDone(h)} title={next === 'Допущен' && !allDone(h) ? 'Завершите чек-лист' : ''} onClick={() => onMove(h, next)}>{next === 'Допущен' ? <><CheckCheck />Допустить</> : <>Далее: {next}</>}</button>}
        </div>
      </div>}>
      <div className="stack">
        <Steps steps={hireStages} value={h.stage} onChange={(s) => onMove(h, s)} isDisabled={(s) => s === 'Допущен' && !allDone(h)} />
        {h.stage !== 'Допущен'
          ? <div className="alert alert-warn"><Lock /><span>Сотрудник не допущен: смены, техника и доступ в систему недоступны.</span></div>
          : <div className="alert alert-ok"><CheckCheck /><span>Допущен — доступ к сменам, технике и приложению открыт.</span></div>}
        <KV items={[['Источник', h.source], ['В воронке с', date(h.createdAt)], ['Комментарий', h.note || '—']]} />
        <div className="cx-sec">
          <div className="cx-sec-h"><h4>Чек-лист оформления</h4><span className="cx-mini tnum">{d}/{h.checklist.length}</span></div>
          <Progress value={(d / h.checklist.length) * 100} tone={d === h.checklist.length ? 'ok' : undefined} />
          {hireGroups.map((g) => {
            const items = h.checklist.filter((c) => c.group === g)
            const gd = items.filter((c) => c.done).length
            return (
              <div key={g} className="cx-group">
                <div className="cx-group-h"><span>{g}</span>{gd === items.length ? <Badge tone="ok">готово</Badge> : <span className="cx-mini tnum">{gd}/{items.length}</span>}</div>
                <Checklist items={items} onToggle={(cid) => hire.patch(h.id, { checklist: h.checklist.map((c) => (c.id === cid ? { ...c, done: !c.done } : c)) })} />
              </div>
            )
          })}
        </div>
        {!!empDocs.length && <div className="cx-sec">
          <div className="cx-sec-h"><h4>Документы, загруженные в приложении</h4></div>
          {empDocs.map((x) => <div key={x.id} className="row-between card-flat"><div><b>{x.type}</b> <span className="cx-mini">{x.number} · до {date(x.expires)}</span></div><div className="row">{x.expires < TODAY && <Badge tone="bad">просрочен</Badge>}<XBadge s={x.status} /></div></div>)}
        </div>}
      </div>
    </Drawer>
  )
}

function AddCandidate({ onClose, onSave }: { onClose: () => void; onSave: (h: HireCard) => void }) {
  const [v, setV] = useState({ name: '', position: 'Водитель самосвала', phone: '+375 ', source: 'rabota.by', note: '' })
  const ok = v.name.trim().split(' ').length >= 2 && v.phone.length > 8
  return (
    <Modal title="Новый кандидат" onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Отмена</button><button className="btn btn-primary" disabled={!ok} onClick={() => onSave({ id: uid('hc'), name: v.name.trim(), position: v.position, phone: v.phone, source: v.source, stage: 'Кандидат', createdAt: TODAY, checklist: makeHireChecklist(0), note: v.note })}>Добавить</button></>}>
      <div className="stack">
        <Field label="ФИО" required><input className="input" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Фамилия Имя Отчество" /></Field>
        <div className="grid g2">
          <Field label="Должность" required><select className="select" value={v.position} onChange={(e) => setV({ ...v, position: e.target.value })}>{['Водитель самосвала', 'Машинист экскаватора', 'Машинист автокрана', 'Машинист погрузчика', 'Водитель манипулятора', 'Машинист автовышки', 'Механик', 'Менеджер по аренде'].map((p) => <option key={p}>{p}</option>)}</select></Field>
          <Field label="Телефон" required><input className="input" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} /></Field>
        </div>
        <Field label="Источник"><select className="select" value={v.source} onChange={(e) => setV({ ...v, source: e.target.value })}>{['rabota.by', 'Заявка менеджера', 'Рекомендация', 'Повторный приём'].map((p) => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Комментарий"><textarea className="textarea" value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} style={{ minHeight: 70 }} /></Field>
      </div>
    </Modal>
  )
}

/* ---------- Проверка документов ---------- */
function DocsTab() {
  const toast = useToast()
  const docs = useStoreList(personDocsStore)
  const [f, setF] = useState<'all' | 'check' | 'expired' | 'soon'>('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<PersonDoc | null>(null)
  const [comment, setComment] = useState('')
  const left = (d: PersonDoc) => daysBetween(TODAY, d.expires)
  const rows = useMemo(() => docs.rows.filter((d) => {
    if (q && !(emp(d.empId)?.name ?? '').toLowerCase().includes(q.toLowerCase())) return false
    if (f === 'check') return d.status === 'На проверке'
    if (f === 'expired') return left(d) < 0
    if (f === 'soon') return left(d) >= 0 && left(d) <= 30
    return true
  }).sort((a, b) => a.expires.localeCompare(b.expires)), [docs.rows, f, q])
  const cols: Col<PersonDoc>[] = [
    { key: 'e', title: 'Сотрудник', render: (d) => <div className="row" style={{ flexWrap: 'nowrap' }}><Avatar name={emp(d.empId)?.name ?? ''} size="sm" /><span className="nowrap">{empShort(d.empId)}</span></div> },
    { key: 't', title: 'Документ', render: (d) => <div><b>{d.type}</b><div className="cx-mini">{d.detail}</div></div> },
    { key: 'n', title: 'Номер', hideMobile: true, nowrap: true, render: (d) => <span className="mono">{d.number}</span> },
    { key: 'i', title: 'Выдан', hideMobile: true, nowrap: true, render: (d) => date(d.issued) },
    { key: 'x', title: 'Действует до', nowrap: true, render: (d) => { const l = left(d); return <div><div className={l < 0 ? 'cx-bad' : l <= 30 ? 'cx-warn' : ''}>{date(d.expires)}</div>{l < 0 ? <Badge tone="bad">просрочен</Badge> : l <= 30 ? <span className="cx-mini cx-warn">{l} дн.</span> : null}</div> } },
    { key: 's', title: 'Проверка', render: (d) => <XBadge s={d.status} /> },
  ]
  return (
    <div className="card stack">
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Сотрудник" />
        <Seg value={f} onChange={setF} items={[{ id: 'all', label: 'Все' }, { id: 'check', label: 'На проверке' }, { id: 'expired', label: 'Просроченные' }, { id: 'soon', label: 'Истекают ≤30 дн.' }]} />
      </div>
      <div className="cx-note">Документы загружают сами водители в приложении: паспорт, ВУ с категориями, медсправка. Просроченные подсвечены — с ними сотрудник не допускается к сменам.</div>
      <DataTable cols={cols} rows={rows} rowKey={(d) => d.id} onRow={(d) => { setOpen(d); setComment(d.comment ?? '') }} />
      {open && <Modal title={`${open.type} · ${empShort(open.empId)}`} onClose={() => setOpen(null)}
        footer={<>
          <button className="btn btn-ghost" onClick={() => { toast('Запрос на повторную загрузку отправлен водителю (демо)'); setOpen(null) }}><Send />Запросить заново</button>
          <button className="btn btn-danger" disabled={comment.trim().length < 3} onClick={() => { docs.patch(open.id, { status: 'Отклонён', comment }); setOpen(null); toast('Документ отклонён, водитель увидит причину в приложении') }}><Ban />Отклонить</button>
          <button className="btn btn-ok" onClick={() => { docs.patch(open.id, { status: 'Проверен', comment }); setOpen(null); toast('Документ проверен') }}><Check />Проверен</button>
        </>}>
        <div className="stack">
          <div className="eq-img" style={{ aspectRatio: '16 / 9', display: 'grid', placeItems: 'center', color: 'var(--fg-3)' }}><div className="stack-sm" style={{ alignItems: 'center' }}><FileCheck2 size={36} /><span className="cx-mini">Скан загружен {date(open.uploadedAt)} · {open.type.toLowerCase()}.jpg</span></div></div>
          {open.expires < TODAY && <div className="alert alert-bad"><FileWarning /><span>Срок действия истёк {date(open.expires)}. Сотрудник не может выходить на смену до обновления документа.</span></div>}
          <KV items={[['Номер', open.number], ['Сведения', open.detail], ['Выдан', date(open.issued)], ['Действует до', date(open.expires)], ['Статус', <XBadge key="s" s={open.status} />]]} />
          <Field label="Комментарий проверки" hint="Обязателен при отклонении"><textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} style={{ minHeight: 70 }} /></Field>
        </div>
      </Modal>}
    </div>
  )
}

/* ---------- Отпуска и больничные ---------- */
function AbsenceTab() {
  const toast = useToast()
  const abs = useStoreList(absencesStore)
  const [f, setF] = useState<'all' | Absence['kind']>('all')
  const [add, setAdd] = useState(false)
  const [v, setV] = useState({ empId: 'd1', kind: 'Отпуск' as Absence['kind'], from: TODAY, to: TODAY, note: '' })
  const rows = abs.rows.filter((a) => f === 'all' || a.kind === f)
  const cols: Col<Absence>[] = [
    { key: 'e', title: 'Сотрудник', render: (a) => <div className="row" style={{ flexWrap: 'nowrap' }}><Avatar name={emp(a.empId)?.name ?? ''} size="sm" /><div><div className="nowrap">{empShort(a.empId)}</div><div className="cx-mini">{emp(a.empId)?.position}</div></div></div> },
    { key: 'k', title: 'Тип', render: (a) => <XBadge s={a.kind === 'Больничный' ? 'Больничный' : a.kind} /> },
    { key: 'p', title: 'Период', nowrap: true, render: (a) => <div>{date(a.from)} — {date(a.to)}<div className="cx-mini">{daysBetween(a.from, a.to) + 1} дн.</div></div> },
    { key: 'n', title: 'Основание', hideMobile: true, render: (a) => a.note || '—' },
    { key: 's', title: 'Статус', render: (a) => <XBadge s={a.status} /> },
    { key: 'a', title: '', align: 'r', render: (a) => a.status === 'На согласовании'
      ? <div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}><button className="btn btn-ok btn-sm" onClick={() => { abs.patch(a.id, { status: 'Согласовано' }); toast('Согласовано. Менеджер увидит отсутствие в графике смен') }}><Check /></button><button className="btn btn-ghost btn-sm" onClick={() => { abs.remove(a.id); toast('Заявка отклонена') }}>Отклонить</button></div>
      : a.status === 'Открыт' ? <button className="btn btn-secondary btn-sm" onClick={() => { abs.patch(a.id, { status: 'Закрыт', to: TODAY }); toast('Больничный закрыт, сотрудник снова доступен для смен') }}>Закрыть</button> : null },
  ]
  return (
    <div className="card stack">
      <div className="toolbar">
        <Seg value={f} onChange={setF} items={[{ id: 'all', label: 'Все' }, { id: 'Отпуск', label: 'Отпуска' }, { id: 'Больничный', label: 'Больничные' }, { id: 'Выходной', label: 'Выходные' }]} />
        <div className="grow" />
        <button className="btn btn-primary" onClick={() => setAdd(true)}><CalendarOff />Добавить</button>
      </div>
      <DataTable cols={cols} rows={rows} rowKey={(a) => a.id} />
      {add && <Modal title="Отпуск / больничный" onClose={() => setAdd(false)} footer={<><button className="btn btn-ghost" onClick={() => setAdd(false)}>Отмена</button><button className="btn btn-primary" disabled={v.to < v.from} onClick={() => { abs.add({ id: uid('a'), ...v, status: v.kind === 'Больничный' ? 'Открыт' : 'Согласовано' }); setAdd(false); toast('Запись добавлена в учёт отсутствий') }}>Сохранить</button></>}>
        <div className="stack">
          <Field label="Сотрудник" required><select className="select" value={v.empId} onChange={(e) => setV({ ...v, empId: e.target.value })}>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
          <Field label="Тип" required><div><Seg value={v.kind} onChange={(k) => setV({ ...v, kind: k })} items={(['Отпуск', 'Больничный', 'Выходной', 'Отгул'] as const).map((k) => ({ id: k, label: k }))} /></div></Field>
          <div className="grid g2"><Field label="С" required><input className="input" type="date" value={v.from} onChange={(e) => setV({ ...v, from: e.target.value })} /></Field><Field label="По" required><input className="input" type="date" value={v.to} onChange={(e) => setV({ ...v, to: e.target.value })} /></Field></div>
          <Field label="Основание"><input className="input" value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} placeholder="№ листка нетрудоспособности, приказ…" /></Field>
        </div>
      </Modal>}
    </div>
  )
}

/* ---------- Увольнение ---------- */
function DismissTab() {
  const toast = useToast()
  const dis = useStoreList(dismissalsStore)
  const [add, setAdd] = useState(false)
  const [v, setV] = useState({ empId: 'd5', date: '2026-10-27', reason: 'По собственному желанию' })
  return (
    <div className="stack">
      <div className="row-between"><div className="cx-note">Увольнение закрывается только после сдачи материальной ответственности и подписания всех документов. После завершения доступ блокируется автоматически.</div>
        <button className="btn btn-primary" onClick={() => setAdd(true)}><UserMinus />Оформить увольнение</button></div>
      <div className="grid g2">
        {dis.rows.map((x) => {
          const d = x.checklist.filter((c) => c.done).length
          const full = d === x.checklist.length
          return (
            <section key={x.id} className="card stack">
              <div className="row-between"><div className="row" style={{ flexWrap: 'nowrap' }}><Avatar name={x.name} /><div><b>{x.name}</b><div className="cx-mini">{x.position} · последний день {date(x.date)}</div></div></div><XBadge s={x.status} /></div>
              <div className="cx-mini">{x.reason}</div>
              <Progress value={(d / x.checklist.length) * 100} tone={full ? 'ok' : undefined} />
              {(['Материальная ответственность', 'Документы', 'Доступы'] as const).map((g) => (
                <div key={g} className="cx-group">
                  <div className="cx-group-h"><span>{g}</span><span className="cx-mini tnum">{x.checklist.filter((c) => c.group === g && c.done).length}/{x.checklist.filter((c) => c.group === g).length}</span></div>
                  <Checklist items={x.checklist.filter((c) => c.group === g)} disabled={x.status === 'Завершено'} onToggle={(cid) => dis.patch(x.id, { checklist: x.checklist.map((c) => (c.id === cid ? { ...c, done: !c.done } : c)) })} />
                </div>
              ))}
              {x.status === 'В процессе' && <button className="btn btn-primary" disabled={!full} onClick={() => { dis.patch(x.id, { status: 'Завершено' }); toast('Увольнение оформлено, доступ в приложение и CRM заблокирован, расчёт передан в бухгалтерию') }}><Lock />{full ? 'Завершить увольнение' : `Осталось пунктов: ${x.checklist.length - d}`}</button>}
            </section>
          )
        })}
      </div>
      {add && <Modal title="Оформить увольнение" onClose={() => setAdd(false)} footer={<><button className="btn btn-ghost" onClick={() => setAdd(false)}>Отмена</button><button className="btn btn-primary" onClick={() => { const e = emp(v.empId)!; dis.add({ id: uid('x'), empId: e.id, name: e.name, position: e.position, date: v.date, reason: v.reason, status: 'В процессе', checklist: dismissChecklist(0) }); setAdd(false); toast('Увольнение открыто. Механику отправлена задача на приём техники и ТМЦ') }}>Создать чек-лист</button></>}>
        <div className="stack">
          <Field label="Сотрудник" required><select className="select" value={v.empId} onChange={(e) => setV({ ...v, empId: e.target.value })}>{employees.filter((e) => e.status !== 'Уволен').map((e) => <option key={e.id} value={e.id}>{e.name} · {e.position}</option>)}</select></Field>
          <div className="grid g2">
            <Field label="Последний рабочий день" required><input className="input" type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} /></Field>
            <Field label="Основание" required><select className="select" value={v.reason} onChange={(e) => setV({ ...v, reason: e.target.value })}>{['По собственному желанию', 'По соглашению сторон', 'Истечение срока контракта', 'Нарушение трудовой дисциплины'].map((r) => <option key={r}>{r}</option>)}</select></Field>
          </div>
        </div>
      </Modal>}
    </div>
  )
}

/* ---------- Ремонтные часы ---------- */
function HoursTab() {
  const toast = useToast()
  const rh = useStoreList(repairHoursStore)
  const confirmable = rh.rows.filter((h) => h.status === 'Согласовано механиком')
  const transferable = rh.rows.filter((h) => h.status === 'Подтверждено кадровиком')
  return (
    <div className="card stack">
      <div className="row-between">
        <div className="cx-note">Ремонтные часы согласует механик, кадровик подтверждает факт и передаёт данные в KPI и бухгалтерию. Клиенту эти часы не выставляются — только для ЗП.</div>
        <div className="cx-btns">
          <button className="btn btn-secondary btn-sm" disabled={!confirmable.length} onClick={() => { rh.set((p) => p.map((h) => (h.status === 'Согласовано механиком' ? { ...h, status: 'Подтверждено кадровиком' } : h))); toast(`Подтверждено записей: ${confirmable.length}`) }}><ClipboardCheck />Подтвердить все</button>
          <button className="btn btn-primary btn-sm" disabled={!transferable.length} onClick={() => { rh.set((p) => p.map((h) => (h.status === 'Подтверждено кадровиком' ? { ...h, status: 'Передано в бухгалтерию' } : h))); toast(`Передано в KPI и бухгалтерию: ${transferable.reduce((a, h) => a + h.hours, 0)} ч`) }}><Send />В KPI и бухгалтерию</button>
        </div>
      </div>
      <DataTable rowKey={(h) => h.id} rows={rh.rows} cols={[
        { key: 'e', title: 'Сотрудник', render: (h) => <div className="row" style={{ flexWrap: 'nowrap' }}><Avatar name={emp(h.empId)?.name ?? ''} size="sm" /><span className="nowrap">{empShort(h.empId)}</span></div> },
        { key: 'd', title: 'Дата', nowrap: true, hideMobile: true, render: (h) => date(h.date) },
        { key: 'q', title: 'Техника / работы', hideMobile: true, render: (h) => <div>{eqTitle(h.equipmentId)}<div className="cx-mini">{h.note}</div></div> },
        { key: 'h', title: 'Часы', align: 'r', render: (h) => <b className="tnum">{hrs(h.hours)}</b> },
        { key: 's', title: 'Статус', render: (h) => <XBadge s={h.status} /> },
        { key: 'a', title: '', align: 'r', render: (h) => h.status === 'Согласовано механиком'
          ? <button className="btn btn-ok btn-sm nowrap" onClick={() => { rh.patch(h.id, { status: 'Подтверждено кадровиком' }); toast('Факт ремонтных часов подтверждён') }}><Check />Подтвердить</button>
          : h.status === 'Подтверждено кадровиком' ? <button className="btn btn-secondary btn-sm nowrap" onClick={() => { rh.patch(h.id, { status: 'Передано в бухгалтерию' }); toast('Данные переданы в KPI и бухгалтерию') }}><Send />Передать</button>
            : h.status === 'На согласовании' ? <span className="cx-mini">ждёт механика</span> : null },
      ]} />
      <div className="cx-total"><span className="muted">Подтверждено и передано за период</span><b>{hrs(rh.rows.filter((h) => h.status === 'Подтверждено кадровиком' || h.status === 'Передано в бухгалтерию').reduce((a, h) => a + h.hours, 0))}</b></div>
      <div className="hide-mobile cx-mini"><Plus size={12} /> Новые записи появляются автоматически, когда механик закрывает ремонт «силами водителя» или согласует часы в карточке водителя.</div>
    </div>
  )
}
