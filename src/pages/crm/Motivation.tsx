import { useState } from 'react'
import { Award, CheckCircle2, Gift, Gavel, Pencil, Plus, Star, Target, Trophy } from 'lucide-react'
import { Badge, DataTable, Drawer, Field, KV, Modal, PageHead, Progress, Seg, Stat, Tabs, date, money, num, uid, useList, useToast, type Col } from '../../ui'
import { emp, TODAY } from '../../data/mock'
import { motivation, motivationEvents, motivationUnits, type MotivationEvent, type MotivationRow } from '../../data/crm-b'
import { isAdmin, type CrmPageProps } from './types'
import { AdminActions, Person, Section } from './crm-b-ui'

type Grp = 'manager' | 'driver' | 'mechanic'
type Row = MotivationRow & { blocked?: boolean; archived?: boolean }
const grpLabel: Record<Grp, string> = { manager: 'Менеджеры', driver: 'Водители', mechanic: 'Механики' }
const roleOf = (r: { employeeId: string }) => emp(r.employeeId)!.role as Grp

export default function Motivation({ role }: CrmPageProps) {
  const toast = useToast()
  const list = useList<Row>(motivation)
  const ev = useList<MotivationEvent>(motivationEvents)
  const [grp, setGrp] = useState<Grp>(role === 'mechanic' ? 'driver' : 'manager')
  const [period, setPeriod] = useState<'month' | 'quarter'>('month')
  const [openId, setOpenId] = useState<string | null>(null)
  const [evForm, setEvForm] = useState<MotivationEvent | null>(null)
  const [kpiForm, setKpiForm] = useState<Row | null>(null)

  const canEdit = (g: Grp) => role === 'manager' || role === 'admin' || (role === 'mechanic' && g === 'driver')
  const evOf = (id: string) => ev.rows.filter((e) => e.employeeId === id)
  const score = (r: Row) => r.kpi + evOf(r.employeeId).reduce((a, e) => a + e.points, 0) * 0.5 + (r.rating - 4) * 10
  const bonusOf = (r: Row) => r.bonus + evOf(r.employeeId).filter((e) => e.kind === 'Бонус').reduce((a, e) => a + e.amount, 0)
  const finesOf = (r: Row) => r.fines + evOf(r.employeeId).filter((e) => e.kind === 'Штраф').reduce((a, e) => a + e.amount, 0)
  const k = period === 'quarter' ? 3 : 1

  const rows = list.rows.filter((r) => roleOf(r) === grp && !r.archived).sort((a, b) => score(b) - score(a))
  const groupRows = list.rows.filter((r) => roleOf(r) === grp)
  const cur = list.rows.find((r) => r.id === openId) ?? null
  const unit = motivationUnits[grp]

  const cols: Col<Row>[] = [
    { key: 'r', title: '#', render: (r) => { const i = rows.indexOf(r); return <span className={`cb-rank ${i < 3 ? `r${i + 1}` : ''}`}>{i + 1}</span> } },
    { key: 'e', title: 'Сотрудник', render: (r) => { const e = emp(r.employeeId)!; return <Person name={e.name} sub={<>{e.position}{r.blocked && <> · <Badge tone="bad">Заблокирован</Badge></>}</>} /> } },
    { key: 'k', title: 'KPI', render: (r) => <div className="cb-kpi"><Progress value={r.kpi} tone={r.kpi >= 90 ? 'ok' : r.kpi < 75 ? 'bad' : undefined} /><b>{r.kpi}%</b></div> },
    { key: 'p', title: 'План / факт', nowrap: true, hideMobile: true, render: (r) => <div><span className="tnum">{num(r.fact * k)} / {num(r.plan * k)}</span><div className="cb-cell-sub">{unit}</div></div> },
    { key: 'rt', title: 'Рейтинг', nowrap: true, render: (r) => <span className="row" style={{ gap: 4 }}><Star size={14} style={{ color: 'var(--accent-strong)' }} /><b className="tnum">{r.rating.toFixed(1)}</b></span> },
    { key: 'b', title: 'Бонусы', align: 'r', nowrap: true, hideMobile: true, render: (r) => <span className="tnum cb-pos">+{money(bonusOf(r) * k)}</span> },
    { key: 'f', title: 'Штрафы', align: 'r', nowrap: true, hideMobile: true, render: (r) => (finesOf(r) ? <span className="tnum cb-neg">−{money(finesOf(r) * k)}</span> : <span className="muted">—</span>) },
    { key: 's', title: 'Баллы', align: 'r', render: (r) => <b className="tnum">{Math.round(score(r))}</b> },
    { key: 'a', title: 'KPI', hideMobile: true, render: (r) => (r.approved ? <Badge tone="ok">Утверждён</Badge> : <Badge tone="warn">На утверждении</Badge>) },
  ]

  const allActive = list.rows.filter((r) => !r.archived)
  const newEvent = (employeeId?: string, kind: MotivationEvent['kind'] = 'Бонус'): MotivationEvent =>
    ({ id: uid('me'), employeeId: employeeId ?? rows[0]?.employeeId ?? '', date: TODAY, kind, amount: kind === 'Бонус' ? 50 : 40, points: kind === 'Бонус' ? 5 : -5, reason: '' })

  return (
    <div className="cb-page">
      <PageHead title="Мотивация" sub="Рейтинг сотрудников по ролям: KPI, бонусы и штрафы. Изменения передаются в расчёт зарплаты."
        actions={canEdit(grp) ? <button className="btn btn-primary" onClick={() => setEvForm(newEvent())}><Plus />Бонус или штраф</button> : undefined} />

      <div className="cb-stats">
        <Stat label="Средний KPI" value={`${Math.round(allActive.reduce((a, r) => a + r.kpi, 0) / allActive.length)}%`} icon={<Target size={16} />} />
        <Stat label="Бонусы за месяц" value={money(allActive.reduce((a, r) => a + bonusOf(r), 0))} icon={<Gift size={16} />} trend="up" />
        <Stat label="Штрафы за месяц" value={money(allActive.reduce((a, r) => a + finesOf(r), 0))} icon={<Gavel size={16} />} trend="down" />
        <Stat label="KPI на утверждении" value={allActive.filter((r) => !r.approved).length} icon={<Award size={16} />} delta={isAdmin(role) ? 'утверждает администратор' : 'ожидают администратора'} />
      </div>

      <div className="row-between">
        <Tabs<Grp> value={grp} onChange={setGrp} items={(['manager', 'driver', 'mechanic'] as Grp[]).map((g) => ({ id: g, label: grpLabel[g], count: list.rows.filter((r) => roleOf(r) === g && !r.archived).length }))} />
        <Seg value={period} onChange={setPeriod} items={[{ id: 'month', label: 'Октябрь' }, { id: 'quarter', label: 'IV квартал' }]} />
      </div>
      {!canEdit(grp) && <div className="alert alert-info"><Trophy /><div>Просмотр. {role === 'mechanic' ? 'Механик редактирует мотивацию только водителей.' : 'Редактирование доступно менеджеру и администратору.'}</div></div>}

      {rows.length >= 3 && (
        <div className="grid g3">
          {rows.slice(0, 3).map((r, i) => { const e = emp(r.employeeId)!; return (
            <button key={r.id} className="card" style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }} onClick={() => setOpenId(r.id)}>
              <span className={`cb-rank r${i + 1}`}>{i + 1}</span>
              <div className="grow"><div className="cb-cell-main">{e.name.split(' ').slice(0, 2).join(' ')}</div><div className="cb-cell-sub">KPI {r.kpi}% · ★ {r.rating.toFixed(1)} · {Math.round(score(r))} баллов</div></div>
              {i === 0 && <Trophy size={20} style={{ color: 'var(--accent-strong)' }} />}
            </button>
          ) })}
        </div>
      )}

      <DataTable cols={cols} rows={rows} rowKey={(r) => r.id} onRow={(r) => setOpenId(r.id)} />

      <div className="card">
        <div className="card-head"><h3>Журнал бонусов и штрафов · {grpLabel[grp].toLowerCase()}</h3></div>
        <div className="cb-list">
          {ev.rows.filter((e) => groupRows.some((r) => r.employeeId === e.employeeId)).map((e) => (
            <div key={e.id}>{e.kind === 'Бонус' ? <Gift style={{ color: 'var(--ok)' }} /> : <Gavel style={{ color: 'var(--bad)' }} />}
              <div className="grow"><div><b>{emp(e.employeeId)?.name.split(' ').slice(0, 2).join(' ')}</b> — {e.reason}</div><div className="cb-cell-sub">{date(e.date)} · {e.points > 0 ? '+' : ''}{e.points} баллов</div></div>
              <b className={`tnum ${e.kind === 'Бонус' ? 'cb-pos' : 'cb-neg'}`}>{e.kind === 'Бонус' ? '+' : '−'}{money(e.amount)}</b>
              {(isAdmin(role)) && <button className="btn btn-ghost btn-sm" onClick={() => { ev.remove(e.id); toast('Запись отменена') }}>Отменить</button>}
            </div>
          ))}
          {!ev.rows.some((e) => groupRows.some((r) => r.employeeId === e.employeeId)) && <div className="muted">Записей пока нет</div>}
        </div>
      </div>

      {cur && (() => { const e = emp(cur.employeeId)!; const g = roleOf(cur); return (
        <Drawer title={e.name} sub={e.position} onClose={() => setOpenId(null)}
          footer={canEdit(g) ? <>
            <button className="btn btn-secondary" onClick={() => setKpiForm(cur)}><Pencil />Редактировать KPI</button>
            <button className="btn btn-secondary" onClick={() => setEvForm(newEvent(cur.employeeId, 'Штраф'))}><Gavel />Штраф</button>
            <button className="btn btn-primary" onClick={() => setEvForm(newEvent(cur.employeeId, 'Бонус'))}><Gift />Бонус</button>
          </> : undefined}>
          <div className="grid g2">
            <div className="cb-box soft"><span className="eyebrow">KPI</span><b style={{ fontSize: 28 }} className="tnum">{cur.kpi}%</b><Progress value={cur.kpi} tone={cur.kpi >= 90 ? 'ok' : cur.kpi < 75 ? 'bad' : undefined} /></div>
            <div className="cb-box soft"><span className="eyebrow">Рейтинг</span><b style={{ fontSize: 28 }} className="tnum">★ {cur.rating.toFixed(1)}</b><span className="cb-sub">место {rows.indexOf(cur) + 1} из {rows.length}</span></div>
          </div>
          <KV items={[
            ['План', `${num(cur.plan)} ${motivationUnits[g]}`], ['Факт', `${num(cur.fact)} ${motivationUnits[g]}`],
            ['Бонусы', <span className="cb-pos">+{money(bonusOf(cur))}</span>], ['Штрафы', finesOf(cur) ? <span className="cb-neg">−{money(finesOf(cur))}</span> : '—'],
            ['Итог к зарплате', <b>{bonusOf(cur) - finesOf(cur) >= 0 ? '+' : '−'}{money(Math.abs(bonusOf(cur) - finesOf(cur)))}</b>],
            ['Статус KPI', cur.approved ? <Badge tone="ok">Утверждён</Badge> : <Badge tone="warn">На утверждении</Badge>],
          ]} />
          {isAdmin(role) && !cur.approved && <button className="btn btn-ok" style={{ alignSelf: 'flex-start' }} onClick={() => { list.update({ ...cur, approved: true }); toast('KPI утверждён администратором') }}><CheckCircle2 />Утвердить KPI</button>}
          <Section title="История" icon={<Award size={16} />}>
            <div className="cb-list">{evOf(cur.employeeId).length ? evOf(cur.employeeId).map((x) => (
              <div key={x.id}>{x.kind === 'Бонус' ? <Gift style={{ color: 'var(--ok)' }} /> : <Gavel style={{ color: 'var(--bad)' }} />}<div className="grow">{x.reason}<div className="cb-cell-sub">{date(x.date)}</div></div><b className={`tnum ${x.kind === 'Бонус' ? 'cb-pos' : 'cb-neg'}`}>{x.kind === 'Бонус' ? '+' : '−'}{money(x.amount)}</b></div>
            )) : <div className="muted">Бонусов и штрафов в этом месяце нет</div>}</div>
          </Section>
          <AdminActions role={role} blocked={cur.blocked} cancelLabel="Сбросить начисления"
            onCancel={() => { ev.setRows((rs) => rs.filter((x) => x.employeeId !== cur.employeeId)); toast('Бонусы и штрафы за месяц отменены') }}
            onArchive={() => { list.update({ ...cur, archived: true }); setOpenId(null); toast('Сотрудник убран из рейтинга (архив)') }}
            onBlock={() => { list.update({ ...cur, blocked: !cur.blocked }); toast(cur.blocked ? 'Начисления разблокированы' : 'Начисления заблокированы') }} />
        </Drawer>
      ) })()}

      {evForm && (
        <Modal title={evForm.kind === 'Бонус' ? 'Начислить бонус' : 'Назначить штраф'} onClose={() => setEvForm(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setEvForm(null)}>Отмена</button>
            <button className="btn btn-primary" disabled={!evForm.reason.trim() || !evForm.employeeId} onClick={() => { ev.add(evForm); setEvForm(null); toast(`${evForm.kind} сохранён и учтён в расчёте зарплаты`) }}>Сохранить</button></>}>
          <Seg value={evForm.kind} onChange={(v) => setEvForm({ ...evForm, kind: v, points: v === 'Бонус' ? Math.abs(evForm.points) : -Math.abs(evForm.points) })} items={[{ id: 'Бонус', label: 'Бонус' }, { id: 'Штраф', label: 'Штраф' }]} />
          <Field label="Сотрудник" required>
            <select className="select" value={evForm.employeeId} onChange={(e) => setEvForm({ ...evForm, employeeId: e.target.value })}>
              {list.rows.filter((r) => canEdit(roleOf(r))).map((r) => <option key={r.id} value={r.employeeId}>{emp(r.employeeId)!.name} · {grpLabel[roleOf(r)].toLowerCase()}</option>)}
            </select>
          </Field>
          <div className="grid g2">
            <Field label="Сумма, BYN"><input type="number" className="input" value={evForm.amount} onChange={(e) => setEvForm({ ...evForm, amount: Number(e.target.value) })} /></Field>
            <Field label="Баллы рейтинга"><input type="number" className="input" value={evForm.points} onChange={(e) => setEvForm({ ...evForm, points: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Основание" required><textarea className="textarea" rows={3} value={evForm.reason} onChange={(e) => setEvForm({ ...evForm, reason: e.target.value })} placeholder={evForm.kind === 'Бонус' ? 'Перевыполнение плана, смена без замечаний…' : 'Опоздание, невыход, нарушение регламента…'} /></Field>
        </Modal>
      )}

      {kpiForm && (
        <Modal title={`KPI: ${emp(kpiForm.employeeId)!.name}`} onClose={() => setKpiForm(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setKpiForm(null)}>Отмена</button>
            <button className="btn btn-primary" onClick={() => { list.update({ ...kpiForm, approved: isAdmin(role) ? kpiForm.approved : false }); setKpiForm(null); toast(isAdmin(role) ? 'KPI сохранён' : 'KPI сохранён и отправлен на утверждение администратору') }}>Сохранить</button></>}>
          <div className="grid g2">
            <Field label={`План, ${motivationUnits[roleOf(kpiForm)]}`}><input type="number" className="input" value={kpiForm.plan} onChange={(e) => { const plan = Number(e.target.value); setKpiForm({ ...kpiForm, plan, kpi: Math.min(150, Math.round((kpiForm.fact / Math.max(1, plan)) * 100)) }) }} /></Field>
            <Field label={`Факт, ${motivationUnits[roleOf(kpiForm)]}`}><input type="number" className="input" value={kpiForm.fact} onChange={(e) => { const fact = Number(e.target.value); setKpiForm({ ...kpiForm, fact, kpi: Math.min(150, Math.round((fact / Math.max(1, kpiForm.plan)) * 100)) }) }} /></Field>
            <Field label="KPI, %" hint="Считается из плана и факта, можно скорректировать"><input type="number" className="input" value={kpiForm.kpi} onChange={(e) => setKpiForm({ ...kpiForm, kpi: Number(e.target.value) })} /></Field>
            <Field label="Рейтинг (1–5)"><input type="number" step="0.1" min={1} max={5} className="input" value={kpiForm.rating} onChange={(e) => setKpiForm({ ...kpiForm, rating: Number(e.target.value) })} /></Field>
          </div>
        </Modal>
      )}
    </div>
  )
}
