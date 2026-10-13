import { useEffect, useState } from 'react'
import {
  AlertTriangle, Banknote, Bell, Camera, CheckCircle2, FileSignature, Fuel, Lock, Mail, MessageCircle, Plus, Send,
  TrendingDown, TrendingUp, Unlock, Wallet, Wrench,
} from 'lucide-react'
import {
  Badge, BarChart, DataTable, Donut, Drawer, Field, KV, Modal, PageHead, Progress, SearchInput, Seg, Stat, StatusBadge, Tabs,
  date, dateShort, money, num, uid, useList, useToast, type Col, EqThumb } from '../../ui'
import { categoryOne } from '../../data/types'
import { companies, company, emp, eq, site, TODAY } from '../../data/mock'
import {
  dealCosts, dealGross, dealIncome, dealPlanIncome, dealRoi, dealSubrent, deals as dealSeed, docFlow, expenses as expSeed, monthly,
  paymentPlan, salaries, salaryTotal, type Deal, type Expense, type PlanPayment,
} from '../../data/crm-b'
import { isAdmin, type CrmPageProps } from './types'
import { AdminActions, Person, Section, shortName } from './crm-b-ui'

type Tab = 'income' | 'expense' | 'salary' | 'debts' | 'plan'
const extraTone: Record<string, 'ok' | 'warn' | 'info' | 'muted' | 'bad'> = { 'Начислено': 'info', 'Выплачено': 'ok', 'На утверждении': 'warn', 'Запланирован': 'muted', 'Утверждён': 'info', 'Исполнен': 'ok', 'Просрочен': 'bad' }
const St = ({ s }: { s: string }) => (extraTone[s] ? <Badge tone={extraTone[s]}>{s}</Badge> : <StatusBadge status={s} />)
const meByRole = { manager: 'e1', mechanic: 'e4', hr: 'e6', admin: 'e7' } as const

export default function Accounting({ role }: CrmPageProps) {
  const toast = useToast()
  const dl = useList<Deal>(dealSeed)
  const [tab, setTab] = useState<Tab>('income')
  const [openId, setOpenId] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<Record<string, boolean>>(() => Object.fromEntries(companies.filter((c) => c.critical).map((c) => [c.id, true])))

  const income = dl.rows.reduce((a, d) => a + dealIncome(d), 0)
  const paid = dl.rows.reduce((a, d) => a + d.paid, 0)
  const gross = dl.rows.reduce((a, d) => a + dealGross(d), 0)
  const costs = dl.rows.reduce((a, d) => a + dealCosts(d), 0)
  const debtTotal = income - paid + companies.reduce((a, c) => a + c.debt, 0)
  const cur = dl.rows.find((d) => d.id === openId) ?? null

  return (
    <div className="cb-page">
      <PageHead title="Бухгалтерия" sub="План и факт по сделкам, расходы, зарплаты, дебиторка и платёжный календарь. Данные факта — из путевых листов." />
      <div className="cb-stats">
        <Stat label="К выставлению (факт)" value={money(income)} icon={<Wallet size={16} />} delta={`по ${dl.rows.length} сделкам`} />
        <Stat label="Поступило" value={money(paid)} icon={<TrendingUp size={16} />} delta={`${Math.round((paid / income) * 100)}% от выставленного`} trend="up" />
        <Stat label="Дебиторка" value={money(debtTotal)} icon={<AlertTriangle size={16} />} delta="включая долги прошлых периодов" trend="down" />
        <Stat label="Валовая прибыль" value={money(gross)} icon={<Banknote size={16} />} delta={`ROI ${Math.round((gross / costs) * 100)}% · маржа ${Math.round((gross / income) * 100)}%`} trend="up" />
      </div>

      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { id: 'income', label: 'Приход (аренда)', count: dl.rows.length },
        { id: 'expense', label: 'Расходы' },
        { id: 'salary', label: isAdmin(role) ? 'Зарплаты' : 'Моя зарплата' },
        { id: 'debts', label: 'Долги', count: dl.rows.filter((d) => d.pay !== 'Оплачено').length },
        { id: 'plan', label: 'План платежей', count: paymentPlan.filter((p) => p.status !== 'Исполнен').length },
      ]} />

      {tab === 'income' && <IncomeTab rows={dl.rows} onOpen={setOpenId} />}
      {tab === 'expense' && <ExpenseTab role={role} />}
      {tab === 'salary' && <SalaryTab role={role} />}
      {tab === 'debts' && <DebtsTab rows={dl.rows} blocked={blocked} setBlocked={setBlocked} onOpen={setOpenId} role={role} />}
      {tab === 'plan' && <PlanTab role={role} />}

      {cur && <DealCard d={cur} role={role} blocked={!!blocked[cur.clientId]} onClose={() => setOpenId(null)} save={(d, m) => { dl.update(d); if (m) toast(m) }} />}
    </div>
  )
}

/* ---------------- Приход ---------------- */
function IncomeTab({ rows, onOpen }: { rows: Deal[]; onOpen: (id: string) => void }) {
  const [q, setQ] = useState('')
  const [pay, setPay] = useState('')
  const [src, setSrc] = useState<'all' | 'own' | 'ext'>('all')
  const list = rows.filter((d) => {
    const hay = `${d.number} ${company(d.clientId)?.name} ${eq(d.equipmentId)?.title} ${site(d.siteId)?.name}`.toLowerCase()
    return (!q || hay.includes(q.toLowerCase())) && (!pay || d.pay === pay) && (src === 'all' || (src === 'own' ? d.own : !d.own))
  })
  const cnt = (p: string) => rows.filter((d) => d.pay === p).length
  const cols: Col<Deal>[] = [
    { key: 'n', title: 'Сделка', nowrap: true, render: (d) => <div><div className="mono cb-cell-main">{d.number}</div><div className="cb-cell-sub">{dateShort(d.date)}</div></div> },
    { key: 'c', title: 'Клиент / объект', render: (d) => <div><div className="cb-cell-main">{company(d.clientId)?.name}</div><div className="cb-cell-sub">{site(d.siteId)?.name}</div></div> },
    { key: 'e', title: 'Техника', hideMobile: true, render: (d) => <EqThumb eq={eq(d.equipmentId)}><div>{eq(d.equipmentId)?.title}</div><Badge tone={d.own ? 'info' : 'accent'}>{d.own ? 'своя' : 'привлечённая'}</Badge></EqThumb> },
    { key: 'h', title: 'План / факт, ч', nowrap: true, hideMobile: true, render: (d) => <span className="tnum">{d.planHours} / <b className={d.factHours > d.planHours ? 'cb-pos' : d.factHours < d.planHours ? 'cb-neg' : ''}>{d.factHours}</b></span> },
    { key: 'i', title: 'Доход', align: 'r', nowrap: true, render: (d) => <b className="tnum">{money(dealIncome(d))}</b> },
    { key: 'p', title: 'Оплата', render: (d) => <StatusBadge status={d.pay} /> },
    { key: 'g', title: 'Валовая', align: 'r', nowrap: true, hideMobile: true, render: (d) => <span className={`tnum ${dealGross(d) >= 0 ? '' : 'cb-neg'}`}>{money(dealGross(d))}</span> },
    { key: 'r', title: 'ROI', align: 'r', hideMobile: true, render: (d) => <span className="tnum">{dealRoi(d)}%</span> },
    { key: 't', title: 'Табель', hideMobile: true, render: (d) => <Badge tone={d.timesheet === 'Подтверждено' ? 'ok' : d.timesheet === 'На проверке' ? 'warn' : 'muted'}>{d.timesheet}</Badge> },
    { key: 'd', title: 'Документы', hideMobile: true, render: (d) => <Badge tone={d.docs === 'Доставлен и прочитан' ? 'ok' : d.docs === 'Не сформированы' ? 'muted' : 'info'}>{d.docs}</Badge> },
  ]
  return (
    <div className="stack">
      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Доход и расходы по месяцам</h3><div className="cb-legend"><span><i style={{ background: 'var(--accent)' }} />Доход</span><span><i style={{ background: 'var(--steel)' }} />Расход</span></div></div>
          <BarChart data={monthly} format={(v) => `${Math.round(v / 1000)}k`} />
        </div>
        <div className="card">
          <div className="card-head"><h3>Статус оплаты сделок</h3><span className="muted" style={{ fontSize: 13 }}>октябрь 2026</span></div>
          <Donut center={String(rows.length)} parts={[
            { label: 'Оплачено', value: cnt('Оплачено'), color: 'var(--ok)' },
            { label: 'Частично', value: cnt('Частично'), color: 'var(--warn)' },
            { label: 'Долг', value: cnt('Долг'), color: 'var(--bad)' },
          ]} />
          <div className="cb-formula" style={{ marginTop: 14 }}>Доход = факт часов × ставка + доставка</div>
        </div>
      </div>
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Сделка, клиент, техника, объект" />
        <select className="select" value={pay} onChange={(e) => setPay(e.target.value)} aria-label="Статус оплаты">
          <option value="">Любая оплата</option><option>Оплачено</option><option>Частично</option><option>Долг</option>
        </select>
        <Seg value={src} onChange={setSrc} items={[{ id: 'all', label: 'Вся техника' }, { id: 'own', label: 'Своя' }, { id: 'ext', label: 'Привлечённая' }]} />
      </div>
      <DataTable cols={cols} rows={list} rowKey={(d) => d.id} onRow={(d) => onOpen(d.id)} />
    </div>
  )
}

/* ---------------- Карточка сделки ---------------- */
function DealCard({ d, role, blocked, onClose, save }: { d: Deal; role: CrmPageProps['role']; blocked: boolean; onClose: () => void; save: (d: Deal, m?: string) => void }) {
  const e = eq(d.equipmentId)!
  const c = company(d.clientId)
  const [fact, setFact] = useState(d.factHours)
  const [paidIn, setPaidIn] = useState(d.paid)
  const [ch, setCh] = useState<Record<string, boolean>>({ 'ЭДО': true, 'Email': true, 'Мессенджер': false })
  const income = dealIncome(d)
  const step = docFlow.indexOf(d.docs)

  // имитация доставки документов: «Отправлены» → «Доставлен» → «Доставлен и прочитан»
  useEffect(() => {
    if (d.docs !== 'Отправлены' && d.docs !== 'Доставлен') return
    const t = setTimeout(() => save({ ...d, docs: d.docs === 'Отправлены' ? 'Доставлен' : 'Доставлен и прочитан' }, d.docs === 'Доставлен' ? `Клиент прочитал счёт и акт по ${d.number}` : undefined), 1800)
    return () => clearTimeout(t)
  }, [d.docs]) // eslint-disable-line react-hooks/exhaustive-deps

  const setPay = (paid: number) => {
    const pay: Deal['pay'] = paid >= income ? 'Оплачено' : paid > 0 ? 'Частично' : 'Долг'
    save({ ...d, paid, pay }, `Оплата утверждена: ${pay.toLowerCase()} (${money(paid)})`)
  }

  return (
    <Drawer title={`Сделка ${d.number}`} sub={<span className="row" style={{ gap: 6 }}><StatusBadge status={d.pay} />{c?.critical && <Badge tone="bad">Критический долг</Badge>}</span>} onClose={onClose}>
      {d.notices.length > 0 && (
        <div className="alert alert-warn"><Bell /><div className="stack-sm" style={{ gap: 4 }}>{d.notices.map((n, i) => <div key={i}>{n}</div>)}</div></div>
      )}
      {blocked && <div className="alert alert-bad"><Lock /><div>Клиент в статусе «Критический долг»: назначение техники на его объекты заблокировано до подтверждения финансового директора.</div></div>}

      <KV items={[
        ['Клиент', <span>{c?.name}<div className="cb-cell-sub">УНП {c?.unp}</div></span>],
        ['Объект', site(d.siteId)?.name],
        ['Техника', <span>{categoryOne[e.category]} {e.title} · <span className="mono">{e.plate}</span> <Badge tone={d.own ? 'info' : 'accent'}>{d.own ? 'своя' : 'привлечённая'}</Badge></span>],
        ['Дата', date(d.date)],
      ]} />

      <div className="grid g2">
        <div className="cb-box soft">
          <span className="eyebrow">План · условия для клиента</span>
          <div className="cb-line"><span>Часы</span><b>{d.planHours} ч</b></div>
          <div className="cb-line"><span>Ставка</span><b>{money(d.rate)}/ч</b></div>
          <div className="cb-line"><span>Доставка</span><b>{money(d.delivery)}</b></div>
          <div className="cb-line total"><span>Сумма по плану</span><b>{money(dealPlanIncome(d))}</b></div>
        </div>
        <div className="cb-box">
          <span className="eyebrow">Факт · путевые листы</span>
          {d.own ? (
            <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
              <div className="cb-photo"><Camera /></div>
              <div className="stack-sm" style={{ gap: 2, fontSize: 13 }}>
                <b>ПЛ_{d.number}.jpg</b>
                <span className="muted">Фото от водителя {shortName(emp(e.driverId)?.name ?? '')}</span>
                <span className="muted">Распознано: {d.factHours} ч (демо)</span>
              </div>
            </div>
          ) : (
            <Field label="Факт часов (ввод менеджера)" hint="Привлечённая техника: по табелю подрядчика">
              <div className="row" style={{ gap: 8 }}>
                <input type="number" className="input" style={{ width: 100 }} value={fact} onChange={(x) => setFact(Number(x.target.value))} />
                <button className="btn btn-secondary btn-sm" disabled={fact === d.factHours} onClick={() => save({ ...d, factHours: fact }, 'Факт часов сохранён')}>Сохранить</button>
              </div>
            </Field>
          )}
          <div className="cb-line"><span>Источник</span><b style={{ fontWeight: 600 }}>{d.factSource}</b></div>
          <div className="cb-line total"><span>Факт часов</span><b className={d.factHours > d.planHours ? 'cb-pos' : d.factHours < d.planHours ? 'cb-neg' : ''}>{d.factHours} ч ({d.factHours - d.planHours >= 0 ? '+' : ''}{d.factHours - d.planHours})</b></div>
        </div>
      </div>

      <Section title="Доход" icon={<TrendingUp size={16} />}>
        <div className="cb-formula">{d.factHours} ч × {money(d.rate)} + {money(d.delivery)} доставка = {money(income)}</div>
        <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
          <Field label="Поступило, BYN"><input type="number" className="input" style={{ width: 140 }} value={paidIn} onChange={(x) => setPaidIn(Number(x.target.value))} /></Field>
          <button className="btn btn-primary" onClick={() => setPay(paidIn)}><CheckCircle2 />Утвердить оплату</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setPaidIn(income); setPay(income) }}>Оплачено полностью</button>
        </div>
        <div className="stack-sm" style={{ gap: 4 }}>
          <div className="row-between" style={{ fontSize: 13 }}><span className="muted">Оплачено {money(d.paid)} из {money(income)}</span><StatusBadge status={d.pay} /></div>
          <Progress value={(d.paid / income) * 100} tone={d.pay === 'Оплачено' ? 'ok' : d.pay === 'Долг' ? 'bad' : undefined} />
        </div>
      </Section>

      <Section title="Расходы и маржинальность" icon={<TrendingDown size={16} />}>
        <div className="cb-box soft">
          {!d.own && <><div className="cb-line"><span>Субаренда</span><b>{money(dealSubrent(d))}</b></div>
            <div className="cb-formula">{d.factHours} ч × {money(d.contractorRate)} + {money(d.contractorDelivery)} доставка подрядчика</div></>}
          {d.own && <div className="cb-line"><span>ЗП водителя (сдельно)</span><b>{money(d.salary)}</b></div>}
          <div className="cb-line"><span>Топливо {d.fuelOurs ? '(за наш счёт)' : '(за счёт клиента)'}</span><b>{d.fuelOurs ? money(d.fuel) : '—'}</b></div>
          <div className="cb-line total"><span>Прямые расходы</span><b>{money(dealCosts(d))}</b></div>
          <div className="cb-line"><span>Валовая прибыль</span><b className={dealGross(d) >= 0 ? 'cb-pos' : 'cb-neg'}>{money(dealGross(d))}</b></div>
          <div className="cb-line"><span>ROI сделки</span><b>{dealRoi(d)}%</b></div>
          <div className="cb-line"><span>Маржа</span><b>{Math.round((dealGross(d) / income) * 100)}%</b></div>
        </div>
      </Section>

      <Section title="Табель, счёт и акт с ЭЦП" icon={<FileSignature size={16} />}
        extra={<Badge tone={d.timesheet === 'Подтверждено' ? 'ok' : d.timesheet === 'На проверке' ? 'warn' : 'muted'}>Табель: {d.timesheet}</Badge>}>
        {d.timesheet !== 'Подтверждено' && (
          <div className="alert alert-info"><FileSignature /><div>Кнопка «Сформировать документы» станет активной, когда табель будет подтверждён.
            <div style={{ marginTop: 8 }}><button className="btn btn-sm btn-secondary" onClick={() => save({ ...d, timesheet: 'Подтверждено' }, 'Табель подтверждён')}>Подтвердить табель</button></div></div></div>
        )}
        <div className="cb-steps">{docFlow.map((s, i) => <div key={s} className={`cb-step ${i < step ? 'done' : i === step ? (i === docFlow.length - 1 ? 'done' : 'cur') : ''}`}>{s}</div>)}</div>
        {step === 0 && <button className="btn btn-primary" disabled={d.timesheet !== 'Подтверждено'} onClick={() => save({ ...d, docs: 'Сформированы' }, `Сформированы счёт и акт: ${d.factHours} ч × ${money(d.rate)} + доставка`)}><FileSignature />Сформировать документы</button>}
        {(step === 1 || step === 2) && (
          <div className="stack-sm">
            <div className="cb-chips"><span className="cb-chip">Счёт № {d.number.replace('А-', 'СЧ-')} · {money(income)}</span><span className="cb-chip">Акт № {d.number.replace('А-', 'АКТ-')}</span></div>
            <div className="cb-toolbar-checks">{[['ЭДО', <FileSignature key="i" size={14} />], ['Email', <Mail key="i" size={14} />], ['Мессенджер', <MessageCircle key="i" size={14} />]].map(([k, ic]) => (
              <label key={k as string} className="check"><input type="checkbox" checked={ch[k as string]} onChange={(x) => setCh({ ...ch, [k as string]: x.target.checked })} />{ic}{k}</label>
            ))}</div>
            <div className="row" style={{ gap: 8 }}>
              {step === 1 && <button className="btn btn-secondary" onClick={() => save({ ...d, docs: 'Подписаны ЭЦП' }, 'Документы подписаны ЭЦП')}>Подписать ЭЦП</button>}
              <button className="btn btn-primary" disabled={!Object.values(ch).some(Boolean)} onClick={() => {
                const via = Object.keys(ch).filter((k) => ch[k]).join(', ')
                save({ ...d, docs: 'Отправлены', channel: via }, `Счёт и акт подписаны ЭЦП и отправлены клиенту: ${via}`)
              }}><Send />Подписать и отправить одной кнопкой</button>
            </div>
          </div>
        )}
        {step >= 3 && <div className="row" style={{ gap: 8, fontSize: 14 }}><StatusBadge status={d.docs} /><span className="muted">через {d.channel}</span></div>}
      </Section>

      <Section title="Уведомления клиенту" icon={<Bell size={16} />}>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-secondary" disabled={d.pay === 'Оплачено'} onClick={() => save({ ...d, notices: [...d.notices, `13.10 — напоминание об оплате отправлено (${c?.email})`] }, 'Напоминание клиенту отправлено по email и в мессенджер')}><Bell />Отправить напоминание клиенту</button>
        </div>
      </Section>

      <AdminActions role={role} cancelLabel="Отменить оплату"
        onCancel={() => save({ ...d, paid: 0, pay: 'Долг' }, 'Утверждение оплаты отменено')}
        onArchive={() => save(d, 'Сделка перенесена в архив бухгалтерии')}
        onBlock={() => save(d, 'Изменения по сделке заблокированы')} />
    </Drawer>
  )
}

/* ---------------- Расходы ---------------- */
function ExpenseTab({ role }: { role: CrmPageProps['role'] }) {
  const toast = useToast()
  const list = useList<Expense>(expSeed)
  const [kind, setKind] = useState<'all' | Expense['kind']>('all')
  const [add, setAdd] = useState<Expense | null>(null)
  const sum = (k: Expense['kind']) => list.rows.filter((e) => e.kind === k).reduce((a, e) => a + e.amount, 0)
  const rows = list.rows.filter((e) => kind === 'all' || e.kind === kind)
  const cols: Col<Expense>[] = [
    { key: 'd', title: 'Дата', nowrap: true, render: (e) => <span className="tnum">{dateShort(e.date)}</span> },
    { key: 'k', title: 'Статья', render: (e) => <Badge tone={e.kind === 'Субаренда' ? 'accent' : e.kind === 'Топливо' ? 'info' : 'warn'}>{e.kind}</Badge> },
    { key: 't', title: 'Описание', render: (e) => <div><div className="cb-cell-main">{e.title}</div><div className="cb-cell-sub">{e.counterparty}</div></div> },
    { key: 'a', title: 'Сумма', align: 'r', nowrap: true, render: (e) => <b className="tnum">{money(e.amount)}</b> },
    { key: 's', title: 'Статус', render: (e) => <StatusBadge status={e.status} /> },
    { key: 'x', title: '', align: 'r', render: (e) => (
      <div className="row" style={{ gap: 4, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
        {e.status !== 'Оплачено' && <button className="btn btn-secondary btn-sm" onClick={() => { list.update({ ...e, status: 'Оплачено' }); toast('Оплата расхода утверждена') }}>Утвердить</button>}
        {isAdmin(role) && <button className="btn btn-ghost btn-sm" onClick={() => { list.remove(e.id); toast('Расход отменён администратором') }}>Отменить</button>}
      </div>
    ) },
  ]
  return (
    <div className="stack">
      <div className="cb-stats">
        <Stat label="Субаренда" value={money(sum('Субаренда'))} icon={<Wallet size={16} />} delta="факт часов × ставка подрядчика + доставка" />
        <Stat label="Топливо" value={money(sum('Топливо'))} icon={<Fuel size={16} />} delta="топливные карты и заправщик" />
        <Stat label="Ремонт" value={money(sum('Ремонт'))} icon={<Wrench size={16} />} delta="запчасти и сервис" />
      </div>
      <div className="row-between">
        <Seg value={kind} onChange={setKind} items={[{ id: 'all', label: 'Все' }, { id: 'Субаренда', label: 'Субаренда' }, { id: 'Топливо', label: 'Топливо' }, { id: 'Ремонт', label: 'Ремонт' }]} />
        <button className="btn btn-primary" onClick={() => setAdd({ id: uid('ex'), date: TODAY, kind: kind === 'all' ? 'Топливо' : kind, title: '', counterparty: '', amount: 0, status: 'Ожидает оплаты' })}><Plus />Добавить расход</button>
      </div>
      <DataTable cols={cols} rows={rows} rowKey={(e) => e.id} />
      {add && (
        <Modal title="Новый расход" onClose={() => setAdd(null)} footer={<><button className="btn btn-secondary" onClick={() => setAdd(null)}>Отмена</button>
          <button className="btn btn-primary" disabled={!add.title || !add.amount} onClick={() => { list.add(add); setAdd(null); toast('Расход добавлен') }}>Сохранить</button></>}>
          <div className="grid g2">
            <Field label="Статья"><select className="select" value={add.kind} onChange={(e) => setAdd({ ...add, kind: e.target.value as Expense['kind'] })}><option>Субаренда</option><option>Топливо</option><option>Ремонт</option></select></Field>
            <Field label="Дата"><input type="date" className="input" value={add.date} onChange={(e) => setAdd({ ...add, date: e.target.value })} /></Field>
          </div>
          <Field label="Описание" required><input className="input" value={add.title} onChange={(e) => setAdd({ ...add, title: e.target.value })} /></Field>
          <div className="grid g2">
            <Field label="Контрагент"><input className="input" value={add.counterparty} onChange={(e) => setAdd({ ...add, counterparty: e.target.value })} /></Field>
            <Field label="Сумма, BYN" required><input type="number" className="input" value={add.amount || ''} onChange={(e) => setAdd({ ...add, amount: Number(e.target.value) })} /></Field>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ---------------- Зарплаты ---------------- */
function SalaryTab({ role }: { role: CrmPageProps['role'] }) {
  const toast = useToast()
  const list = useList(salaries)
  const [grp, setGrp] = useState<'all' | 'manager' | 'driver' | 'mechanic'>('all')
  if (!isAdmin(role)) {
    const s = list.rows.find((x) => x.employeeId === meByRole[role])
    const e = emp(meByRole[role])!
    return (
      <div className="stack">
        <div className="alert alert-info"><Lock /><div>Зарплаты других сотрудников видит только администратор. Здесь — ваш расчёт за октябрь 2026.</div></div>
        {s && (
          <div className="card stack" style={{ maxWidth: 640 }}>
            <Person name={e.name} sub={e.position} size="lg" />
            <div className="cb-box soft">
              <div className="cb-line"><span>Оклад</span><b>{money(s.base)}</b></div>
              <div className="cb-line"><span>Отработано</span><b>{s.hours} ч</b></div>
              <div className="cb-line"><span>Переработка ×1,5</span><b>{s.overtime} ч · {money(Math.round(s.overtime * (s.base / 168) * 1.5))}</b></div>
              <div className="cb-line"><span>Бонусы KPI ({e.kpi}%)</span><b className="cb-pos">+{money(s.bonus)}</b></div>
              <div className="cb-line"><span>Штрафы</span><b className={s.fines ? 'cb-neg' : ''}>−{money(s.fines)}</b></div>
              <div className="cb-line total"><span>К выплате</span><b>{money(salaryTotal(s))}</b></div>
            </div>
            <div className="row-between"><span className="muted" style={{ fontSize: 13 }}>Аванс 15.10, расчёт 30.10</span><St s={s.status} /></div>
          </div>
        )}
      </div>
    )
  }
  const rows = list.rows.filter((s) => grp === 'all' || emp(s.employeeId)?.role === grp)
  const cols: Col<(typeof salaries)[number]>[] = [
    { key: 'e', title: 'Сотрудник', render: (s) => { const e = emp(s.employeeId)!; return <Person name={e.name} sub={e.position} /> } },
    { key: 'b', title: 'Оклад', align: 'r', nowrap: true, hideMobile: true, render: (s) => <span className="tnum">{money(s.base)}</span> },
    { key: 'h', title: 'Часы / перераб.', align: 'r', nowrap: true, hideMobile: true, render: (s) => <span className="tnum">{s.hours} / {s.overtime ? <b className="cb-neg">{s.overtime}</b> : 0}</span> },
    { key: 'bn', title: 'Бонусы', align: 'r', nowrap: true, hideMobile: true, render: (s) => <span className="tnum cb-pos">+{num(s.bonus)}</span> },
    { key: 'f', title: 'Штрафы', align: 'r', nowrap: true, hideMobile: true, render: (s) => (s.fines ? <span className="tnum cb-neg">−{num(s.fines)}</span> : <span className="muted">—</span>) },
    { key: 't', title: 'К выплате', align: 'r', nowrap: true, render: (s) => <b className="tnum">{money(salaryTotal(s))}</b> },
    { key: 's', title: 'Статус', render: (s) => <St s={s.status} /> },
    { key: 'x', title: '', align: 'r', render: (s) => s.status === 'На утверждении'
      ? <button className="btn btn-secondary btn-sm" onClick={() => { list.update({ ...s, status: 'Начислено' }); toast('Начисление утверждено') }}>Утвердить</button>
      : s.status === 'Начислено' ? <button className="btn btn-ghost btn-sm" onClick={() => { list.update({ ...s, status: 'Выплачено' }); toast('Отмечено как выплачено') }}>Выплатить</button> : null },
  ]
  const total = rows.reduce((a, s) => a + salaryTotal(s), 0)
  return (
    <div className="stack">
      <div className="row-between">
        <Seg value={grp} onChange={setGrp} items={[{ id: 'all', label: 'Все' }, { id: 'manager', label: 'Менеджеры' }, { id: 'driver', label: 'Водители' }, { id: 'mechanic', label: 'Механики' }]} />
        <div className="row" style={{ gap: 8 }}><span className="muted">Фонд оплаты:</span><b className="tnum">{money(total)}</b>
          <button className="btn btn-primary btn-sm" onClick={() => { list.setRows((r) => r.map((s) => (s.status === 'На утверждении' ? { ...s, status: 'Начислено' } : s))); toast('Все начисления утверждены') }}>Утвердить все</button></div>
      </div>
      <DataTable cols={cols} rows={rows} rowKey={(s) => s.id} />
    </div>
  )
}

/* ---------------- Долги ---------------- */
function DebtsTab({ rows, blocked, setBlocked, onOpen, role }: { rows: Deal[]; blocked: Record<string, boolean>; setBlocked: (f: (b: Record<string, boolean>) => Record<string, boolean>) => void; onOpen: (id: string) => void; role: CrmPageProps['role'] }) {
  const toast = useToast()
  const [confirm, setConfirm] = useState<string | null>(null)
  const [fd, setFd] = useState({ name: 'Захарова Н. В.', reason: '', ok: false })
  const [critical, setCritical] = useState<Record<string, boolean>>(() => Object.fromEntries(companies.map((c) => [c.id, !!c.critical])))
  const debtors = companies.filter((c) => c.kind === 'tenant').map((c) => {
    const ds = rows.filter((d) => d.clientId === c.id && d.pay !== 'Оплачено')
    const sum = c.debt + ds.reduce((a, d) => a + dealIncome(d) - d.paid, 0)
    const oldest = ds.reduce((a, d) => (d.date < a ? d.date : a), TODAY)
    return { c, ds, sum, overdue: Math.max(0, Math.round((new Date(TODAY).getTime() - new Date(oldest).getTime()) / 864e5) - 5) + (c.debt ? 30 : 0) }
  }).filter((x) => x.sum > 0).sort((a, b) => b.sum - a.sum)

  return (
    <div className="stack">
      <div className="alert alert-warn"><AlertTriangle /><div>При статусе <b>«Критический долг»</b> система блокирует назначение техники на объекты клиента. Снять блокировку можно только с подтверждением финансового директора.</div></div>
      {debtors.map(({ c, ds, sum, overdue }) => (
        <div key={c.id} className="card stack">
          <div className="row-between">
            <div><div className="cb-cell-main" style={{ fontSize: 16 }}>{c.name}</div><div className="cb-cell-sub">УНП {c.unp} · {c.representative} · {c.phone}</div></div>
            <div className="row" style={{ gap: 8 }}>
              {critical[c.id] ? <StatusBadge status="Критический долг" /> : <StatusBadge status="Долг" />}
              {blocked[c.id] ? <Badge tone="bad">Назначения заблокированы</Badge> : <Badge tone="ok">Назначения разрешены</Badge>}
            </div>
          </div>
          <div className="grid g3">
            <div><div className="eyebrow">Задолженность</div><b className="tnum cb-neg" style={{ fontSize: 22 }}>{money(sum)}</b></div>
            <div><div className="eyebrow">Просрочка</div><b className="tnum" style={{ fontSize: 22 }}>{overdue} дн.</b></div>
            <div><div className="eyebrow">Неоплаченных сделок</div><b className="tnum" style={{ fontSize: 22 }}>{ds.length}</b></div>
          </div>
          {ds.length > 0 && <div className="cb-chips">{ds.map((d) => <button key={d.id} className="cb-chip" style={{ border: 0, cursor: 'pointer' }} onClick={() => onOpen(d.id)}>{d.number} · {money(dealIncome(d) - d.paid)}</button>)}</div>}
          {c.debt > 0 && <div className="cb-sub">Включая долг прошлых периодов: {money(c.debt)}</div>}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => toast(`Напоминание отправлено: ${c.email} и мессенджер представителя`)}><Bell />Отправить напоминание клиенту</button>
            {!critical[c.id]
              ? <button className="btn btn-danger btn-sm" onClick={() => { setCritical({ ...critical, [c.id]: true }); setBlocked((b) => ({ ...b, [c.id]: true })); toast('Статус «Критический долг» установлен, назначения заблокированы') }}><Lock />Критический долг</button>
              : blocked[c.id]
                ? <button className="btn btn-ok btn-sm" onClick={() => { setConfirm(c.id); setFd({ ...fd, ok: false, reason: '' }) }}><Unlock />Разблокировать (фин. директор)</button>
                : <button className="btn btn-secondary btn-sm" onClick={() => { setBlocked((b) => ({ ...b, [c.id]: true })); toast('Назначения снова заблокированы') }}><Lock />Заблокировать снова</button>}
            {isAdmin(role) && critical[c.id] && <button className="btn btn-ghost btn-sm" onClick={() => { setCritical({ ...critical, [c.id]: false }); setBlocked((b) => ({ ...b, [c.id]: false })); toast('Статус «Критический долг» снят администратором') }}>Снять статус</button>}
          </div>
        </div>
      ))}
      {confirm && (
        <Modal title="Подтверждение финансового директора" onClose={() => setConfirm(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setConfirm(null)}>Отмена</button>
            <button className="btn btn-primary" disabled={!fd.ok || !fd.reason.trim()} onClick={() => { setBlocked((b) => ({ ...b, [confirm]: false })); setConfirm(null); toast('Блокировка снята с подтверждением фин. директора') }}>Подтвердить</button></>}>
          <p className="dim">Клиент: <b>{company(confirm)?.name}</b>. Разблокировка позволит назначать технику на объекты клиента несмотря на критический долг.</p>
          <Field label="Финансовый директор"><input className="input" value={fd.name} onChange={(e) => setFd({ ...fd, name: e.target.value })} /></Field>
          <Field label="Основание" required><textarea className="textarea" rows={3} value={fd.reason} onChange={(e) => setFd({ ...fd, reason: e.target.value })} placeholder="Гарантийное письмо, график погашения…" /></Field>
          <label className="check"><input type="checkbox" checked={fd.ok} onChange={(e) => setFd({ ...fd, ok: e.target.checked })} />Подтверждаю решение (подпись ЭЦП, демо)</label>
        </Modal>
      )}
    </div>
  )
}

/* ---------------- План платежей ---------------- */
function PlanTab({ role }: { role: CrmPageProps['role'] }) {
  const toast = useToast()
  const list = useList<PlanPayment>(paymentPlan)
  const [dir, setDir] = useState<'all' | PlanPayment['dir']>('all')
  const [add, setAdd] = useState<PlanPayment | null>(null)
  const rows = [...list.rows].sort((a, b) => a.date.localeCompare(b.date)).filter((p) => dir === 'all' || p.dir === dir)
  const open = list.rows.filter((p) => p.status !== 'Исполнен')
  const inS = open.filter((p) => p.dir === 'Поступление').reduce((a, p) => a + p.amount, 0)
  const outS = open.filter((p) => p.dir === 'Платёж').reduce((a, p) => a + p.amount, 0)
  const cols: Col<PlanPayment>[] = [
    { key: 'd', title: 'Дата', nowrap: true, render: (p) => <span className="tnum">{date(p.date)}</span> },
    { key: 'r', title: 'Направление', render: (p) => <Badge tone={p.dir === 'Поступление' ? 'ok' : 'info'}>{p.dir}</Badge> },
    { key: 'c', title: 'Контрагент / назначение', render: (p) => <div><div className="cb-cell-main">{p.counterparty}</div><div className="cb-cell-sub">{p.purpose}</div></div> },
    { key: 'a', title: 'Сумма', align: 'r', nowrap: true, render: (p) => <b className={`tnum ${p.dir === 'Поступление' ? 'cb-pos' : ''}`}>{p.dir === 'Поступление' ? '+' : '−'}{money(p.amount)}</b> },
    { key: 's', title: 'Статус', render: (p) => <St s={p.status} /> },
    { key: 'x', title: '', align: 'r', render: (p) => (
      <div className="row" style={{ gap: 4, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
        {p.status === 'Запланирован' && <button className="btn btn-secondary btn-sm" onClick={() => { list.update({ ...p, status: 'Утверждён' }); toast('Платёж утверждён') }}>Утвердить</button>}
        {(p.status === 'Утверждён' || p.status === 'Просрочен') && <button className="btn btn-ghost btn-sm" onClick={() => { list.update({ ...p, status: 'Исполнен' }); toast('Отмечено как исполнено') }}>Исполнен</button>}
        {isAdmin(role) && p.status !== 'Исполнен' && <button className="btn btn-ghost btn-sm" onClick={() => { list.remove(p.id); toast('Платёж отменён') }}>Отменить</button>}
      </div>
    ) },
  ]
  return (
    <div className="stack">
      <div className="cb-stats">
        <Stat label="Ожидаемые поступления" value={money(inS)} icon={<TrendingUp size={16} />} trend="up" />
        <Stat label="Запланированные платежи" value={money(outS)} icon={<TrendingDown size={16} />} trend="down" />
        <Stat label="Сальдо" value={<span className={inS - outS >= 0 ? 'cb-pos' : 'cb-neg'}>{money(inS - outS)}</span>} icon={<Wallet size={16} />} />
      </div>
      <div className="row-between">
        <Seg value={dir} onChange={setDir} items={[{ id: 'all', label: 'Все' }, { id: 'Поступление', label: 'Поступления' }, { id: 'Платёж', label: 'Платежи' }]} />
        <button className="btn btn-primary" onClick={() => setAdd({ id: uid('pp'), date: '2026-10-20', dir: 'Платёж', counterparty: '', purpose: '', amount: 0, status: 'Запланирован' })}><Plus />Добавить платёж</button>
      </div>
      <DataTable cols={cols} rows={rows} rowKey={(p) => p.id} />
      {add && (
        <Modal title="Новый платёж в плане" onClose={() => setAdd(null)} footer={<><button className="btn btn-secondary" onClick={() => setAdd(null)}>Отмена</button>
          <button className="btn btn-primary" disabled={!add.counterparty || !add.amount} onClick={() => { list.add(add); setAdd(null); toast('Платёж добавлен в план') }}>Сохранить</button></>}>
          <Seg value={add.dir} onChange={(v) => setAdd({ ...add, dir: v })} items={[{ id: 'Поступление', label: 'Поступление' }, { id: 'Платёж', label: 'Платёж' }]} />
          <div className="grid g2">
            <Field label="Дата"><input type="date" className="input" value={add.date} onChange={(e) => setAdd({ ...add, date: e.target.value })} /></Field>
            <Field label="Сумма, BYN" required><input type="number" className="input" value={add.amount || ''} onChange={(e) => setAdd({ ...add, amount: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Контрагент" required><input className="input" value={add.counterparty} onChange={(e) => setAdd({ ...add, counterparty: e.target.value })} /></Field>
          <Field label="Назначение"><input className="input" value={add.purpose} onChange={(e) => setAdd({ ...add, purpose: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  )
}
