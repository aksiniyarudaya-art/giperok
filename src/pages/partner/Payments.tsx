import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowDownToLine, BellRing, Download, FileText, Paperclip, Upload, Wallet } from 'lucide-react'
import { DataTable, Drawer, Field, KV, Modal, PageHead, Progress, SearchInput, Seg, Stat, StatusBadge, Tabs, date, money, useToast, type Col } from '../../ui'
import type { Deal, Payout } from '../../data/cabinet'
import { payoutBalance, usePartner } from './ctx'

type T = 'deals' | 'payouts' | 'docs'
type Doc = { id: string; name: string; deal: string; date: string; client: string }

export default function Payments() {
  const p = usePartner()
  const toast = useToast()
  const [tab, setTab] = useState<T>('deals')
  const [only, setOnly] = useState<'all' | 'debt'>('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<Deal | null>(null)
  const [req, setReq] = useState<number | null>(null)
  const [docType, setDocType] = useState('')
  const [extraDocs, setExtraDocs] = useState<Doc[]>([])

  const turnover = p.deals.reduce((a, d) => a + d.amount, 0)
  const received = p.deals.reduce((a, d) => a + d.paid, 0)
  const debts = p.deals.reduce((a, d) => a + d.amount - d.paid, 0)
  const fee = p.deals.reduce((a, d) => a + d.fee, 0)
  const balance = payoutBalance(p.deals, p.payouts)
  const eqTitle = (id: string) => p.equipment.find((e) => e.id === id)?.title ?? '—'

  const rows = p.deals.filter((d) => (only === 'all' || d.status !== 'Оплачено') && `${d.number} ${d.client} ${eqTitle(d.equipmentId)}`.toLowerCase().includes(q.trim().toLowerCase()))
  const docs: Doc[] = useMemo(() => [
    ...extraDocs,
    ...p.deals.flatMap((d) => d.docs.map((n, i) => ({ id: `${d.id}-${i}`, name: n, deal: d.number, date: d.date, client: d.client }))),
  ], [p.deals, extraDocs])
  const types = [...new Set(docs.map((d) => d.name))]

  const cols: Col<Deal>[] = [
    { key: 'n', title: 'Сделка', render: (d) => <b className="mono">{d.number}</b>, nowrap: true },
    { key: 'd', title: 'Дата', render: (d) => <span className="tnum">{date(d.date)}</span>, nowrap: true, hideMobile: true },
    { key: 'c', title: 'Клиент', render: (d) => d.client },
    { key: 'e', title: 'Техника', render: (d) => <span className="dim">{eqTitle(d.equipmentId)}</span>, hideMobile: true },
    { key: 'a', title: 'Сумма', render: (d) => <span className="tnum">{money(d.amount)}</span>, align: 'r', nowrap: true },
    { key: 'f', title: 'Комиссия', render: (d) => <span className="tnum muted">−{money(d.fee)}</span>, align: 'r', nowrap: true, hideMobile: true },
    { key: 'p', title: 'Оплачено', render: (d) => <span className="tnum">{money(d.paid)}</span>, align: 'r', nowrap: true, hideMobile: true },
    { key: 'g', title: 'Долг', render: (d) => d.amount - d.paid ? <b className="tnum" style={{ color: 'var(--bad)' }}>{money(d.amount - d.paid)}</b> : <span className="muted">—</span>, align: 'r', nowrap: true },
    { key: 's', title: 'Статус', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'doc', title: 'Док.', render: (d) => <span className="row muted" style={{ gap: 4, flexWrap: 'nowrap' }}><Paperclip size={14} />{d.docs.length}</span>, hideMobile: true },
  ]
  const pcols: Col<Payout>[] = [
    { key: 'd', title: 'Дата', render: (x) => <span className="tnum">{date(x.date)}</span> },
    { key: 'a', title: 'Сумма', render: (x) => <b className="tnum">{money(x.amount)}</b>, align: 'r' },
    { key: 'acc', title: 'Счёт', render: (x) => <span className="mono">{x.account}</span>, hideMobile: true },
    { key: 's', title: 'Статус', render: (x) => <span className={`badge ${x.status === 'Выплачено' ? 'badge-ok' : 'badge-warn'}`}>{x.status}</span> },
  ]
  const dcols: Col<Doc>[] = [
    { key: 'n', title: 'Документ', render: (d) => <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}><FileText size={16} className="muted" />{d.name}</span> },
    { key: 'deal', title: 'Сделка', render: (d) => <span className="mono">{d.deal}</span> },
    { key: 'c', title: 'Клиент', render: (d) => d.client, hideMobile: true },
    { key: 'd', title: 'Дата', render: (d) => <span className="tnum">{date(d.date)}</span>, hideMobile: true },
    { key: 'x', title: '', render: (d) => <button className="btn btn-ghost btn-icon btn-sm" aria-label="Скачать" onClick={(e) => { e.stopPropagation(); toast(`Скачивание: ${d.name} ${d.deal}.pdf`) }}><Download /></button>, align: 'r' },
  ]

  return (
    <>
      <PageHead title="Оплата" sub="Все сделки с суммами, долги клиентов, остаток к выплате и прикреплённые документы"
        actions={<button className="btn btn-primary" disabled={!balance} onClick={() => setReq(balance)}><ArrowDownToLine />Запросить выплату</button>} />
      <div className="grid g4">
        <Stat label="Оборот по сделкам" value={money(turnover)} delta={`${p.deals.length} сделок · комиссия ${money(fee)}`} />
        <Stat label="Получено от клиентов" value={money(received)} delta={<div style={{ marginTop: 4 }}><Progress value={(received / turnover) * 100} tone="ok" /></div>} />
        <Stat label="Долги клиентов" value={<span style={{ color: debts ? 'var(--bad)' : undefined }}>{money(debts)}</span>} delta={`${p.deals.filter((d) => d.status !== 'Оплачено').length} сделки не оплачены полностью`} trend="down" />
        <Stat icon={<Wallet />} label="Остаток к выплате" value={money(balance)} delta="выплаты 5, 15 и 25 числа" trend="up" />
      </div>

      {debts > 0 && (
        <div className="alert alert-warn" style={{ margin: '16px 0 0' }}><AlertTriangle /><div className="grow">Платформа взыскивает долги клиентов самостоятельно. Выплата по неоплаченным сделкам поступит после оплаты клиентом.</div>
          <button className="btn btn-secondary btn-sm" onClick={() => toast('Напоминания отправлены клиентам с долгом')}><BellRing />Напомнить должникам</button></div>
      )}

      <div className="stack" style={{ marginTop: 20 }}>
        <Tabs<T> value={tab} onChange={setTab} items={[
          { id: 'deals', label: 'Сделки', count: p.deals.length },
          { id: 'payouts', label: 'Выплаты', count: p.payouts.length },
          { id: 'docs', label: 'Документы', count: docs.length },
        ]} />
        {tab === 'deals' && <>
          <div className="toolbar">
            <SearchInput value={q} onChange={setQ} placeholder="Сделка, клиент, техника" />
            <Seg value={only} onChange={setOnly} items={[{ id: 'all', label: 'Все' }, { id: 'debt', label: 'С долгом' }]} />
          </div>
          <DataTable cols={cols} rows={rows} rowKey={(d) => d.id} onRow={setOpen} />
        </>}
        {tab === 'payouts' && <DataTable cols={pcols} rows={p.payouts} rowKey={(x) => x.id} />}
        {tab === 'docs' && <>
          <div className="toolbar">
            <select className="select" value={docType} onChange={(e) => setDocType(e.target.value)} aria-label="Тип документа">
              <option value="">Все типы</option>{types.map((t) => <option key={t}>{t}</option>)}
            </select>
            <button className="btn btn-secondary" onClick={() => { setExtraDocs((s) => [{ id: `x${Date.now()}`, name: 'Акт сверки', deal: 'Октябрь 2026', date: '2026-10-13', client: 'Гиперок' }, ...s]); toast('Документ прикреплён') }}><Upload />Прикрепить документ</button>
          </div>
          <DataTable cols={dcols} rows={docs.filter((d) => !docType || d.name === docType)} rowKey={(d) => d.id} />
        </>}
      </div>

      {open && (
        <Drawer title={`Сделка ${open.number}`} sub={open.client} onClose={() => setOpen(null)} footer={open.status !== 'Оплачено' ? <button className="btn btn-secondary" onClick={() => toast('Напоминание об оплате отправлено клиенту')}><BellRing />Напомнить клиенту</button> : undefined}>
          <StatusBadge status={open.status} />
          <KV items={[
            ['Дата', date(open.date)],
            ['Техника', eqTitle(open.equipmentId)],
            ['Сумма сделки', <b className="tnum">{money(open.amount)}</b>],
            ['Комиссия платформы 10%', <span className="tnum">−{money(open.fee)}</span>],
            ['Вам к выплате', <b className="tnum" style={{ color: 'var(--ok)' }}>{money(open.amount - open.fee)}</b>],
            ['Оплачено клиентом', <span className="tnum">{money(open.paid)}</span>],
            ['Долг клиента', <span className="tnum" style={{ color: open.amount - open.paid ? 'var(--bad)' : undefined }}>{money(open.amount - open.paid)}</span>],
          ]} />
          <Progress value={(open.paid / open.amount) * 100} tone={open.paid >= open.amount ? 'ok' : 'bad'} />
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Прикреплённые документы</div>
            <div className="stack-sm">
              {open.docs.map((d) => <div key={d} className="pt-doc"><FileText size={18} /><span className="grow">{d}</span><button className="btn btn-ghost btn-icon btn-sm" aria-label="Скачать" onClick={() => toast(`Скачивание: ${d} ${open.number}.pdf`)}><Download /></button></div>)}
            </div>
          </div>
        </Drawer>
      )}

      {req !== null && (
        <Modal title="Запрос выплаты" onClose={() => setReq(null)} footer={<>
          <button className="btn btn-ghost" onClick={() => setReq(null)}>Отмена</button>
          <button className="btn btn-primary" disabled={req <= 0 || req > balance} onClick={() => { p.addPayout({ id: `pay-${Date.now()}`, date: '2026-10-13', amount: req, account: 'BY02 ALFA •••• 9988', status: 'В обработке' }); toast('Запрос на выплату отправлен в бухгалтерию'); setReq(null); setTab('payouts') }}>Запросить</button>
        </>}>
          <Field label="Сумма, BYN" hint={`Доступно: ${money(balance)}`}><input className="input tnum" type="number" value={req} min={1} max={balance} onChange={(e) => setReq(+e.target.value)} /></Field>
          <Field label="Счёт для выплаты"><select className="select"><option>BY02 ALFA 3012 0000 0000 9988 · Альфа-Банк</option></select></Field>
          <div className="muted" style={{ fontSize: 13 }}>Деньги поступят в ближайший день выплат. Акт и счёт-фактура придут в чат «Бухгалтерия платформы».</div>
        </Modal>
      )}
    </>
  )
}
