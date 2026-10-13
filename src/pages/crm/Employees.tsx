import { useState } from 'react'
import { Ban, Check, GraduationCap, Mail, Pencil, Phone, Plus, ShieldCheck, UserPlus, X } from 'lucide-react'
import type { CrmPageProps, CrmRole } from './types'
import { isAdmin } from './types'
import { Avatar, DataTable, Drawer, Field, KV, Modal, PageHead, SearchInput, Stat, StatusBadge, Tabs, date, uid, useList, useToast, type Col } from '../../ui'
import { emp, employees, sites, site } from '../../data/mock'
import { roleLabels, type Employee, type EmployeeStatus, type HireStage } from '../../data/types'
import { admissions, dismissals, hrReqs, hrStages, userByRole, type Admission, type Dismissal, type HrReq } from '../../data/crm-a'
import { AdminActions } from './Equipment'
import './crm-a.css'

type Group = 'all' | 'manager' | 'driver' | 'mechanic'
type Section = 'staff' | 'requests' | 'admissions' | 'dismissals'
const statuses: EmployeeStatus[] = ['Активный', 'На больничном', 'Отпуск', 'Заблокирован', 'Уволен']
const stages: HireStage[] = ['Кандидат', 'Проверка', 'Оформление', 'Инструктаж', 'Допущен']
const short = (n?: string) => (n ? n.split(' ').slice(0, 2).join(' ') : '—')

export default function Employees({ role }: CrmPageProps) {
  const toast = useToast()
  const canEdit = role === 'hr' || role === 'admin'
  const isMgr = role === 'manager' || role === 'admin'
  const list = useList<Employee>(employees)
  const reqs = useList<HrReq>(hrReqs)
  const adm = useList<Admission>(admissions)
  const dis = useList<Dismissal>(dismissals)
  const [archived, setArchived] = useState<string[]>([])
  const [section, setSection] = useState<Section>('staff')
  const [group, setGroup] = useState<Group>('all')
  const [q, setQ] = useState('')
  const [st, setSt] = useState('')
  const [showArch, setShowArch] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [form, setForm] = useState<Employee | null>(null)
  const [reqForm, setReqForm] = useState<HrReq | null>(null)
  const [admForm, setAdmForm] = useState<Admission | null>(null)

  const visible = list.rows.filter((e) => (showArch ? archived.includes(e.id) : !archived.includes(e.id)))
  const inGroup = (g: Group) => visible.filter((e) => g === 'all' || e.role === g)
  const rows = inGroup(group).filter((e) => (!q || `${e.name} ${e.position} ${e.phone}`.toLowerCase().includes(q.toLowerCase())) && (!st || e.status === st))
  const cur = list.rows.find((e) => e.id === open)
  const newReq = (p: Partial<HrReq> = {}): HrReq => ({ id: uid('hq'), kind: 'Подбор', position: '', reason: '', created: '2026-10-13', deadline: '2026-10-27', stage: 'Найти', authorId: userByRole[role], ...p })

  const cols: Col<Employee>[] = [
    { key: 'n', title: 'Сотрудник', render: (e) => <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}><Avatar name={e.name} size="sm" /><div style={{ minWidth: 0 }}><b>{e.name}</b><div className="muted" style={{ fontSize: 12 }}>{e.position}</div></div></div> },
    { key: 'd', title: 'Подразделение', hideMobile: true, render: (e) => e.department },
    { key: 'r', title: 'Роль', hideMobile: true, render: (e) => roleLabels[e.role] },
    { key: 's', title: 'Статус', render: (e) => <StatusBadge status={e.status} /> },
    { key: 'sh', title: 'Смена / допуск', hideMobile: true, render: (e) => e.hireStage !== 'Допущен' ? <StatusBadge status={e.hireStage} /> : e.shiftState ? <StatusBadge status={e.shiftState} /> : <StatusBadge status="Допущен" /> },
    { key: 'h', title: 'Принят', hideMobile: true, nowrap: true, render: (e) => <span className="tnum">{date(e.hiredAt)}</span> },
    { key: 'p', title: 'Телефон', hideMobile: true, nowrap: true, render: (e) => <span className="mono" style={{ fontSize: 13 }}>{e.phone}</span> },
  ]

  const sections = [
    { id: 'staff' as Section, label: 'Сотрудники', count: visible.length },
    ...(role !== 'mechanic' ? [{ id: 'requests' as Section, label: role === 'hr' ? 'Заявки от менеджеров' : 'Заявки кадровику', count: reqs.rows.filter((r) => r.stage !== 'В работе').length }] : []),
    ...(isMgr ? [
      { id: 'admissions' as Section, label: 'Допуск к объектам', count: adm.rows.filter((a) => a.status === 'Ожидает').length },
      { id: 'dismissals' as Section, label: 'Увольнение / блокировка', count: dis.rows.filter((d) => d.status === 'Ожидает подтверждения').length },
    ] : []),
  ]

  return (
    <div className="stack">
      <PageHead title="Сотрудники" sub={role === 'hr' ? 'Кадровый учёт: карточки, статусы, допуски и инструктажи' : role === 'mechanic' ? 'Команда компании — менеджеры, водители, механики' : 'Команда, заявки на подбор и замену, допуски к объектам'}
        actions={<>
          {canEdit && <button className="btn btn-primary" onClick={() => setForm({ ...employees[7], id: uid('e'), name: '', position: '', phone: '+375 ', email: '', status: 'Активный', hireStage: 'Кандидат', hiredAt: '2026-10-13', contract: '', shiftState: 'Выходной' })}><UserPlus />Добавить сотрудника</button>}
          {role === 'manager' && <button className="btn btn-primary" onClick={() => setReqForm(newReq())}><Plus />Заявка кадровику</button>}
          {role === 'admin' && <button className="btn btn-secondary" onClick={() => setReqForm(newReq())}><Plus />Заявка кадровику</button>}
        </>} />

      <div className="ca-stats">
        <Stat label="Всего в штате" value={visible.filter((e) => e.status !== 'Уволен').length} delta={`${visible.filter((e) => e.role === 'driver').length} водителей`} />
        <Stat label="На смене сегодня" value={visible.filter((e) => e.shiftState === 'На смене').length} delta={`${visible.filter((e) => e.shiftState === 'Не вышел').length} не вышли`} trend="down" />
        <Stat label="Без допуска" value={visible.filter((e) => e.hireStage !== 'Допущен').length} delta="кандидаты и оформление" />
        <Stat label="Больничный / отпуск" value={visible.filter((e) => e.status === 'На больничном' || e.status === 'Отпуск').length} />
      </div>

      {sections.length > 1 && <Tabs value={section} onChange={setSection} items={sections} />}

      {section === 'staff' && <>
        <div className="row-between">
          <div className="seg">{([['all', 'Все'], ['manager', 'Менеджеры'], ['driver', 'Водители'], ['mechanic', 'Механики']] as const).map(([id, l]) => (
            <button key={id} className={group === id ? 'on' : ''} onClick={() => setGroup(id)}>{l} <span className="muted tnum">{inGroup(id).length}</span></button>
          ))}</div>
          {isAdmin(role) && <label className="check" style={{ fontSize: 13 }}><input type="checkbox" checked={showArch} onChange={(e) => setShowArch(e.target.checked)} />Показать архив ({archived.length})</label>}
        </div>
        <div className="toolbar">
          <SearchInput value={q} onChange={setQ} placeholder="ФИО, должность, телефон" />
          <select className="select" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Статус"><option value="">Все статусы</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        <DataTable cols={cols} rows={rows} rowKey={(e) => e.id} onRow={(e) => setOpen(e.id)} empty={showArch ? 'Архив пуст' : 'Сотрудники не найдены'} />
      </>}

      {section === 'requests' && (
        <div className="auto-grid">
          {reqs.rows.map((r) => {
            const si = hrStages.indexOf(r.stage)
            return (
              <div key={r.id} className="card stack-sm">
                <div className="row-between"><span className={`badge ${r.kind === 'Замена' ? 'badge-warn' : 'badge-info'}`}>{r.kind}</span><span className="muted tnum" style={{ fontSize: 12 }}>до {date(r.deadline)}</span></div>
                <b style={{ fontSize: 15 }}>{r.position}</b>
                <div className="muted" style={{ fontSize: 13 }}>{r.reason}{r.replaceId && ` · вместо ${short(emp(r.replaceId)?.name)}`}</div>
                <div className="ca-pipe">{hrStages.map((s, i) => <span key={s} className={i < si ? 'done' : i === si ? 'on' : ''}>{s}</span>)}</div>
                <div style={{ fontSize: 13 }}>{r.candidate ? <>Кандидат: <b>{r.candidate}</b></> : <span className="muted">Кандидат ещё не найден</span>}</div>
                <div className="row-between" style={{ fontSize: 12 }}><span className="muted">Автор: {short(emp(r.authorId)?.name)} · {date(r.created)}</span></div>
                <div className="ca-actions">
                  {canEdit && r.stage !== 'В работе' && <button className="btn btn-primary btn-sm" onClick={() => {
                    const next = hrStages[si + 1]
                    reqs.update({ ...r, stage: next, candidate: r.candidate ?? 'Ярошевич Антон Павлович' }); toast(`Статус заявки: ${next} · менеджер уведомлён`)
                  }}>Далее: {hrStages[si + 1]}</button>}
                  {role !== 'hr' && <button className="btn btn-secondary btn-sm" onClick={() => setReqForm(r)}><Pencil />Изменить</button>}
                  {(role !== 'hr') && r.stage === 'Найти' && <button className="btn btn-ghost btn-sm" onClick={() => { reqs.remove(r.id); toast('Заявка отозвана') }}>Отозвать</button>}
                </div>
                {isAdmin(role) && <AdminActions role={role} what="Заявка кадровику" onCancel={() => reqs.remove(r.id)} onArchive={() => reqs.remove(r.id)} />}
              </div>
            )
          })}
        </div>
      )}

      {section === 'admissions' && (
        <div className="stack">
          <div className="row-between"><span className="muted" style={{ fontSize: 14 }}>Менеджер согласует допуск водителей и механиков к объектам. Без допуска — нет смен на объекте.</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setAdmForm({ id: uid('ad'), empId: 'd1', siteId: 's1', requested: '2026-10-13', note: '', status: 'Ожидает' })}><Plus />Запрос допуска</button></div>
          <DataTable rowKey={(a) => a.id} rows={adm.rows} cols={[
            { key: 'e', title: 'Сотрудник', render: (a) => { const e = emp(a.empId); return <div><b>{e?.name}</b><div className="muted" style={{ fontSize: 12 }}>{e?.position} · {e?.hireStage}</div></div> } },
            { key: 's', title: 'Объект', render: (a) => site(a.siteId)?.name },
            { key: 'n', title: 'Комментарий', hideMobile: true, render: (a) => <span style={{ fontSize: 13 }}>{a.note}</span> },
            { key: 'd', title: 'Дата', hideMobile: true, render: (a) => <span className="tnum">{date(a.requested)}</span> },
            { key: 'st', title: 'Статус', render: (a) => <span className={`badge ${a.status === 'Согласован' ? 'badge-ok' : a.status === 'Отказано' ? 'badge-bad' : 'badge-warn'}`}>{a.status}</span> },
            { key: 'a', title: '', align: 'r', render: (a) => a.status === 'Ожидает' ? <div className="row" style={{ gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
              <button className="btn btn-ok btn-sm" onClick={() => { adm.update({ ...a, status: 'Согласован' }); toast('Допуск согласован · водитель уведомлён в Telegram') }}><Check />Согласовать</button>
              <button className="btn btn-danger btn-sm btn-icon" aria-label="Отказать" onClick={() => { adm.update({ ...a, status: 'Отказано' }); toast('В допуске отказано') }}><X /></button>
            </div> : null },
          ]} />
        </div>
      )}

      {section === 'dismissals' && (
        <div className="stack">
          <span className="muted" style={{ fontSize: 14 }}>Кадровик инициирует, менеджер подтверждает увольнение или блокировку доступа в систему.</span>
          {dis.rows.map((d) => {
            const e = emp(d.empId)
            return (
              <div key={d.id} className="card row" style={{ alignItems: 'flex-start' }}>
                <Avatar name={e?.name ?? ''} />
                <div className="grow stack-sm" style={{ gap: 4 }}>
                  <div className="row" style={{ gap: 8 }}><b>{e?.name}</b><span className={`badge ${d.kind === 'Увольнение' ? 'badge-bad' : 'badge-warn'}`}>{d.kind}</span></div>
                  <div style={{ fontSize: 14 }}>{d.reason}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Инициатор: {d.initiator} · {date(d.date)}</div>
                </div>
                {d.status === 'Ожидает подтверждения' ? <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-danger btn-sm" onClick={() => {
                    dis.update({ ...d, status: 'Подтверждено' })
                    const x = list.rows.find((y) => y.id === d.empId); if (x) list.update({ ...x, status: d.kind === 'Увольнение' ? 'Уволен' : 'Заблокирован', shiftState: 'Выходной' })
                    toast(d.kind === 'Увольнение' ? 'Увольнение подтверждено · доступ закрыт' : 'Доступ заблокирован')
                  }}>Подтвердить</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { dis.update({ ...d, status: 'Отклонено' }); toast('Отклонено, кадровик уведомлён') }}>Отклонить</button>
                </div> : <StatusBadge status={d.status === 'Подтверждено' ? 'Завершено' : 'Отменена'} />}
              </div>
            )
          })}
        </div>
      )}

      {cur && <EmpCard role={role} e={cur} archived={archived.includes(cur.id)} onClose={() => setOpen(null)}
        onEdit={() => setForm(cur)}
        onUpdate={(e, msg) => { list.update(e); toast(msg) }}
        onReplace={() => { setOpen(null); setReqForm(newReq({ kind: 'Замена', position: cur.position, replaceId: cur.id, reason: '' })) }}
        onAdmission={() => { setOpen(null); setAdmForm({ id: uid('ad'), empId: cur.id, siteId: 's1', requested: '2026-10-13', note: '', status: 'Ожидает' }) }}
        onArchive={() => { setArchived(archived.includes(cur.id) ? archived.filter((x) => x !== cur.id) : [...archived, cur.id]); setOpen(null) }} />}

      {form && <EmpForm e={form} isNew={!list.rows.some((x) => x.id === form.id)} onClose={() => setForm(null)} onSave={(e) => {
        if (list.rows.some((x) => x.id === e.id)) list.update(e); else list.add(e)
        setForm(null); toast('Карточка сотрудника сохранена')
      }} />}

      {reqForm && (
        <Modal title={reqs.rows.some((r) => r.id === reqForm.id) ? 'Заявка кадровику' : 'Новая заявка кадровику'} onClose={() => setReqForm(null)} footer={<>
          <button className="btn btn-ghost" onClick={() => setReqForm(null)}>Отмена</button>
          <button className="btn btn-primary" disabled={!reqForm.position} onClick={() => {
            if (reqs.rows.some((r) => r.id === reqForm.id)) reqs.update(reqForm); else reqs.add(reqForm)
            setReqForm(null); setSection('requests'); toast('Заявка отправлена кадровику')
          }}>Отправить</button>
        </>}>
          <Field label="Тип заявки"><div className="seg">{(['Подбор', 'Замена'] as const).map((k) => <button key={k} type="button" className={reqForm.kind === k ? 'on' : ''} onClick={() => setReqForm({ ...reqForm, kind: k })}>{k}</button>)}</div></Field>
          <Field label="Должность" required><input className="input" value={reqForm.position} onChange={(e) => setReqForm({ ...reqForm, position: e.target.value })} placeholder="Например: машинист экскаватора" /></Field>
          {reqForm.kind === 'Замена' && <Field label="Кого заменить"><select className="select" value={reqForm.replaceId ?? ''} onChange={(e) => setReqForm({ ...reqForm, replaceId: e.target.value })}>
            <option value="">—</option>{list.rows.filter((e) => e.role === 'driver' || e.role === 'mechanic').map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>}
          <div className="grid g2">
            <Field label="Срок"><input className="input" type="date" value={reqForm.deadline} onChange={(e) => setReqForm({ ...reqForm, deadline: e.target.value })} /></Field>
            <Field label="Текущий статус"><input className="input" value={reqForm.stage} disabled /></Field>
          </div>
          <Field label="Причина / требования"><textarea className="textarea" value={reqForm.reason} onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })} placeholder="Опыт, категории ВУ, объект, график" /></Field>
        </Modal>
      )}

      {admForm && (
        <Modal title="Допуск к объекту" onClose={() => setAdmForm(null)} footer={<>
          <button className="btn btn-ghost" onClick={() => setAdmForm(null)}>Отмена</button>
          <button className="btn btn-primary" onClick={() => { adm.add({ ...admForm, status: 'Согласован' }); setAdmForm(null); setSection('admissions'); toast('Допуск согласован · сотрудник уведомлён') }}><ShieldCheck />Согласовать допуск</button>
        </>}>
          <Field label="Сотрудник"><select className="select" value={admForm.empId} onChange={(e) => setAdmForm({ ...admForm, empId: e.target.value })}>
            {list.rows.filter((e) => e.role === 'driver' || e.role === 'mechanic').map((e) => <option key={e.id} value={e.id}>{e.name} · {e.hireStage}</option>)}</select></Field>
          <Field label="Объект"><select className="select" value={admForm.siteId} onChange={(e) => setAdmForm({ ...admForm, siteId: e.target.value })}>
            {sites.filter((s) => s.status === 'Текущий').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          {emp(admForm.empId)?.hireStage !== 'Допущен' && <div className="alert alert-warn">Сотрудник ещё не прошёл цепочку приёма у кадровика ({emp(admForm.empId)?.hireStage}). Допуск к объекту вступит в силу после статуса «Допущен».</div>}
          <Field label="Комментарий"><textarea className="textarea" value={admForm.note} onChange={(e) => setAdmForm({ ...admForm, note: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  )
}

function EmpCard({ role, e, archived, onClose, onEdit, onUpdate, onReplace, onAdmission, onArchive }: {
  role: CrmRole; e: Employee; archived: boolean; onClose: () => void; onEdit: () => void; onUpdate: (e: Employee, msg: string) => void
  onReplace: () => void; onAdmission: () => void; onArchive: () => void
}) {
  const canEdit = role === 'hr' || role === 'admin'
  const [status, setStatus] = useState<EmployeeStatus>(e.status)
  return (
    <Drawer title={e.name} sub={`${e.position} · ${roleLabels[e.role]}`} onClose={onClose} footer={<>
      {canEdit && <button className="btn btn-secondary" onClick={onEdit}><Pencil />Редактировать</button>}
      {(role === 'manager' || role === 'admin') && (e.role === 'driver' || e.role === 'mechanic') && <>
        <button className="btn btn-secondary" onClick={onAdmission}><ShieldCheck />Допуск к объекту</button>
        <button className="btn btn-primary" onClick={onReplace}>Заявка на замену</button>
      </>}
    </>}>
      <div className="row"><Avatar name={e.name} size="lg" /><div className="stack-sm" style={{ gap: 6 }}>
        <div className="row" style={{ gap: 6 }}><StatusBadge status={e.status} /><StatusBadge status={e.hireStage} />{e.shiftState && <StatusBadge status={e.shiftState} />}{archived && <StatusBadge status="Архив" />}</div>
        <div className="row" style={{ gap: 6 }}><a className="btn btn-secondary btn-sm" href={`tel:${e.phone}`}><Phone />Позвонить</a><a className="btn btn-ghost btn-sm" href={`mailto:${e.email}`}><Mail />Почта</a></div>
      </div></div>
      <KV items={[
        ['ФИО', e.name],
        ['Должность', e.position],
        ['Подразделение', e.department],
        ['Руководитель', emp(e.supervisorId)?.name ?? (e.role === 'admin' ? '—' : 'Захарова Наталья Викторовна')],
        ['Контакты', <span><span className="mono">{e.phone}</span><br />{e.email}</span>],
        ['Статус', e.status],
        ['Принят на работу', date(e.hiredAt)],
        ['Контракт', `${e.contract || '—'} · срочный, до ${date(`${Number(e.hiredAt.slice(0, 4)) + 3}${e.hiredAt.slice(4)}`)}`],
        ...(e.license ? [['Категории / допуски', e.license] as [string, string]] : []),
        ['Этап приёма', e.hireStage],
        ['Рейтинг · KPI', `${e.rating} ★ · ${e.kpi}%`],
      ]} />
      {canEdit && (
        <div className="card-flat stack-sm">
          <b>Действия кадровика</b>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <select className="select grow" value={status} onChange={(ev) => setStatus(ev.target.value as EmployeeStatus)} aria-label="Статус">{statuses.map((s) => <option key={s}>{s}</option>)}</select>
            <button className="btn btn-dark" onClick={() => onUpdate({ ...e, status }, `Статус изменён: ${status}`)}>Изменить статус</button>
          </div>
          <div className="row">
            <button className="btn btn-danger btn-sm" onClick={() => onUpdate({ ...e, status: 'Заблокирован', shiftState: e.shiftState ? 'Выходной' : undefined }, 'Сотрудник заблокирован · доступ в систему закрыт')}><Ban />Заблокировать</button>
            <button className="btn btn-secondary btn-sm" onClick={() => onUpdate({ ...e, hireStage: e.hireStage === 'Допущен' ? 'Допущен' : 'Инструктаж' }, 'Отправлен на инструктаж · механик и сотрудник уведомлены')}><GraduationCap />Отправить на инструктаж</button>
          </div>
        </div>
      )}
      {isAdmin(role) && <div className="row"><button className="btn btn-ghost btn-sm" onClick={onArchive}>{archived ? 'Вернуть из архива' : 'Архивировать карточку'}</button></div>}
      <AdminActions role={role} what={e.name} onCancel={() => onUpdate({ ...e, status: 'Активный' }, 'Изменения статуса отменены')} onArchive={onArchive} onBlock={() => onUpdate({ ...e, status: 'Заблокирован' }, 'Доступ заблокирован')} />
    </Drawer>
  )
}

function EmpForm({ e, isNew, onClose, onSave }: { e: Employee; isNew: boolean; onClose: () => void; onSave: (e: Employee) => void }) {
  const [f, setF] = useState(e)
  const set = (p: Partial<Employee>) => setF((s) => ({ ...s, ...p }))
  const dept = (r: Employee['role']) => r === 'driver' ? 'Транспортный участок' : r === 'mechanic' ? 'Ремонтная служба' : r === 'hr' ? 'Отдел кадров' : 'Коммерческий отдел'
  return (
    <Modal wide title={isNew ? 'Новый сотрудник' : `Редактировать: ${e.name}`} onClose={onClose} footer={<>
      <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
      <button className="btn btn-primary" disabled={!f.name || !f.position} onClick={() => onSave(f)}>Сохранить</button>
    </>}>
      <div className="grid g2">
        <Field label="ФИО" required><input className="input" value={f.name} onChange={(ev) => set({ name: ev.target.value })} /></Field>
        <Field label="Должность" required><input className="input" value={f.position} onChange={(ev) => set({ position: ev.target.value })} /></Field>
        <Field label="Роль"><select className="select" value={f.role} onChange={(ev) => { const r = ev.target.value as Employee['role']; set({ role: r, department: dept(r) }) }}>
          {(['manager', 'driver', 'mechanic', 'hr'] as const).map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}</select></Field>
        <Field label="Подразделение"><input className="input" value={f.department} onChange={(ev) => set({ department: ev.target.value })} /></Field>
        <Field label="Руководитель"><select className="select" value={f.supervisorId ?? ''} onChange={(ev) => set({ supervisorId: ev.target.value || undefined })}>
          <option value="">—</option>{employees.filter((x) => x.role === 'manager' || x.role === 'admin').map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
        <Field label="Телефон" required><input className="input" value={f.phone} onChange={(ev) => set({ phone: ev.target.value })} /></Field>
        <Field label="E-mail"><input className="input" value={f.email} onChange={(ev) => set({ email: ev.target.value })} /></Field>
        <Field label="Статус"><select className="select" value={f.status} onChange={(ev) => set({ status: ev.target.value as EmployeeStatus })}>{statuses.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Этап приёма"><select className="select" value={f.hireStage} onChange={(ev) => set({ hireStage: ev.target.value as HireStage })}>{stages.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Принят на работу"><input className="input" type="date" value={f.hiredAt} onChange={(ev) => set({ hiredAt: ev.target.value })} /></Field>
        <Field label="Контракт №"><input className="input" value={f.contract} onChange={(ev) => set({ contract: ev.target.value })} placeholder="ТД-120" /></Field>
        {f.role === 'driver' && <Field label="Категории ВУ / удостоверения"><input className="input" value={f.license ?? ''} onChange={(ev) => set({ license: ev.target.value })} /></Field>}
      </div>
    </Modal>
  )
}
