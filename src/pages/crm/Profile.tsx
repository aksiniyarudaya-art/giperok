import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Building2, Camera, Mail, MapPinned, Pencil, Phone, Send, Truck, Users } from 'lucide-react'
import type { CrmPageProps } from './types'
import { isAdmin } from './types'
import { BarChart, Field, KV, Modal, PageHead, Progress, Seg, StatusBadge, date, initials, money, plural, useToast, Avatar } from '../../ui'
import { emp } from '../../data/mock'
import { categoryOne } from '../../data/types'
import { kpiByRole, responsibility, salaryHistory, salaryParts, userByRole } from '../../data/crm-a'
import './crm-a.css'

type WorkStatus = 'Работает' | 'Больничный' | 'Отпуск'

export default function Profile({ role }: CrmPageProps) {
  const toast = useToast()
  const me = emp(userByRole[role])!
  const [status, setStatus] = useState<WorkStatus>('Работает')
  const [contacts, setContacts] = useState({ phone: me.phone, email: me.email, tg: `@${me.email.split('@')[0]}_giperok`, extra: '' })
  const [edit, setEdit] = useState(false)
  const [draft, setDraft] = useState(contacts)
  const [tab, setTab] = useState<'sites' | 'staff' | 'eq' | 'clients'>('sites')
  const showResp = role === 'manager' || role === 'admin'
  const resp = responsibility(me.id)
  const kpi = kpiByRole[role]
  const kpiTotal = Math.round(kpi.reduce((a, k) => a + Math.min(k.pct, 120) * k.weight, 0) / 100)
  const parts = salaryParts(me.salary, kpiTotal)
  const net = parts.reduce((a, p) => a + p.v, 0)
  const base = `/crm/${role}`
  const years = 2026 - Number(me.hiredAt.slice(0, 4))

  return (
    <div className="stack">
      <PageHead title="Профиль" sub={`${me.position} · ${me.department}`}
        actions={<button className="btn btn-secondary" onClick={() => { setDraft(contacts); setEdit(true) }}><Pencil />Редактировать</button>} />

      <div className="card">
        <div className="ca-profile">
          <div className="ca-photo" aria-label="Фото">
            {initials(me.name)}
            <button className="btn btn-secondary btn-icon btn-sm" aria-label="Загрузить фото" onClick={() => toast('Фото обновлено (демо)')}><Camera /></button>
          </div>
          <div className="grow stack-sm" style={{ minWidth: 220 }}>
            <div className="eyebrow">{me.position}</div>
            <h2 style={{ fontSize: 22 }}>{me.name}</h2>
            <div className="row" style={{ gap: 8 }}>
              <StatusBadge status={status} />
              <span className="badge badge-ok plain">Допуск: {me.hireStage}</span>
              <span className="muted" style={{ fontSize: 13 }}>Табельный договор {me.contract}</span>
            </div>
          </div>
          <div className="stack-sm">
            <span className="label">Статус</span>
            <Seg items={[{ id: 'Работает', label: 'Работает' }, { id: 'Больничный', label: 'Больничный' }, { id: 'Отпуск', label: 'Отпуск' }]} value={status}
              onChange={(v) => { setStatus(v as WorkStatus); toast(v === 'Работает' ? 'Статус: работает' : `Статус «${v}» — кадровик и руководитель уведомлены`) }} />
          </div>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Контакты и работа</h3></div>
          <KV items={[
            ['ФИО', me.name],
            ['Должность', me.position],
            ['Подразделение', me.department],
            ['Руководитель', me.supervisorId ? emp(me.supervisorId)?.name : role === 'admin' ? '—' : 'Захарова Н. В.'],
            ['Телефон', <a href={`tel:${contacts.phone}`} className="mono">{contacts.phone}</a>],
            ['E-mail', contacts.email],
            ['Telegram', contacts.tg],
            ['Дата начала работы', <span className="tnum">{date(me.hiredAt)} · {years} {plural(years, 'год', 'года', 'лет')}</span>],
          ]} />
          <div className="row" style={{ marginTop: 16, gap: 8 }}>
            <a className="btn btn-secondary btn-sm" href={`tel:${contacts.phone}`}><Phone />Позвонить</a>
            <a className="btn btn-secondary btn-sm" href={`mailto:${contacts.email}`}><Mail />Написать</a>
            <button className="btn btn-ghost btn-sm" onClick={() => toast('Telegram-бот привязан (демо)')}><Send />Привязать бот</button>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>KPI и эффективность</h3>
            <span className={`badge ${kpiTotal >= 100 ? 'badge-ok' : kpiTotal >= 85 ? 'badge-warn' : 'badge-bad'}`}>Итог {kpiTotal}%</span>
          </div>
          <div className="stack-sm">
            {kpi.map((k) => (
              <div key={k.name} className="stack-sm" style={{ gap: 4 }}>
                <div className="row-between" style={{ fontSize: 13 }}>
                  <span><b>{k.name}</b> <span className="muted">· вес {k.weight}%</span></span>
                  <span className="tnum">{k.fact} <span className="muted">/ {k.plan}</span></span>
                </div>
                <Progress value={Math.min(100, k.pct)} tone={k.pct >= 100 ? 'ok' : k.pct < 80 ? 'bad' : undefined} />
              </div>
            ))}
          </div>
          {isAdmin(role) && <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>Как администратор вы утверждаете KPI сотрудников в разделе «Мотивация».</p>}
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Зарплата · октябрь</h3><span className="mono tnum" style={{ fontWeight: 700 }}>{money(net)}</span></div>
          <div className="ca-list">
            {parts.map((p) => (
              <div key={p.name} className="ca-li"><span className="grow">{p.name}</span><span className={`tnum ${p.v < 0 ? 'muted' : ''}`}>{p.v < 0 ? '−' : ''}{money(Math.abs(p.v))}</span></div>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Зарплату видите только вы и администратор.</p>
        </div>
        <div className="card">
          <div className="card-head"><h3>Начисления за 6 месяцев</h3></div>
          <BarChart data={salaryHistory.map((s) => ({ ...s, value: Math.round(s.value * me.salary / 3200) }))} height={180} format={(v) => `${Math.round(v / 100) / 10}к`} />
        </div>
      </div>

      {showResp && (
        <div className="card">
          <div className="card-head"><h3>Ответственность</h3><span className="muted" style={{ fontSize: 13 }}>{isAdmin(role) ? 'Администратор: вся компания' : 'Закреплено за вами'}</span></div>
          <div className="ca-split" style={{ marginBottom: 16 }}>
            {([
              ['sites', 'Объекты', resp.sites.length, <MapPinned size={14} />],
              ['staff', 'Сотрудники', resp.staff.length, <Users size={14} />],
              ['eq', 'Техника', resp.eqs.length, <Truck size={14} />],
              ['clients', 'Клиенты', resp.clients.length, <Briefcase size={14} />],
            ] as const).map(([id, l, n, ic]) => (
              <button key={id} onClick={() => setTab(id)} style={{ outline: tab === id ? '2px solid var(--accent)' : undefined, borderRadius: 'var(--r)' }}>
                <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r)', padding: '10px 12px' }}>
                  <div className="n">{n}</div><div className="l">{ic}{l}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="ca-list">
            {tab === 'sites' && resp.sites.map((s) => (
              <Link key={s.id} to={`${base}/sites`} className="ca-li click" style={{ color: 'inherit', textDecoration: 'none' }}>
                <MapPinned size={18} className="muted" />
                <div className="grow"><div className="t">{s.name}</div><div className="s">{s.address}</div></div>
                <StatusBadge status={s.status} />
              </Link>
            ))}
            {tab === 'staff' && resp.staff.slice(0, 12).map((e) => (
              <div key={e.id} className="ca-li">
                <Avatar name={e.name} size="sm" />
                <div className="grow"><div className="t">{e.name}</div><div className="s">{e.position}</div></div>
                <StatusBadge status={e.shiftState ?? e.status} />
              </div>
            ))}
            {tab === 'eq' && resp.eqs.slice(0, 12).map((e) => (
              <div key={e.id} className="ca-li">
                <Truck size={18} className="muted" />
                <div className="grow"><div className="t">{e.title}</div><div className="s">{categoryOne[e.category]} · <span className="mono">{e.plate}</span></div></div>
                <span className="badge plain">{e.own ? 'Своя' : 'Привлечённая'}</span>
              </div>
            ))}
            {tab === 'clients' && resp.clients.map((c) => (
              <Link key={c.id} to={`${base}/tenants`} className="ca-li click" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Building2 size={18} className="muted" />
                <div className="grow"><div className="t">{c.name}</div><div className="s">УНП {c.unp} · {c.phone}</div></div>
                {c.debt > 0 ? <StatusBadge status={c.critical ? 'Критический долг' : 'Долг'} /> : <StatusBadge status="Активный" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {edit && (
        <Modal title="Редактировать контакты" onClose={() => setEdit(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setEdit(false)}>Отмена</button><button className="btn btn-primary" onClick={() => { setContacts(draft); setEdit(false); toast('Профиль сохранён') }}>Сохранить</button></>}>
          <Field label="Телефон" required><input className="input" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field>
          <Field label="E-mail"><input className="input" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
          <Field label="Telegram"><input className="input" value={draft.tg} onChange={(e) => setDraft({ ...draft, tg: e.target.value })} /></Field>
          <Field label="ФИО и должность" hint="Меняет кадровик по заявлению"><input className="input" value={`${me.name} · ${me.position}`} disabled /></Field>
        </Modal>
      )}
    </div>
  )
}
