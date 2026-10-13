import { useState } from 'react'
import { AlertTriangle, Bell, CheckCircle2, Clock, FileCheck2, FileText, Inbox, Plus, Send, Stamp } from 'lucide-react'
import { Badge, DataTable, Drawer, Field, KV, Modal, PageHead, SearchInput, Seg, Stat, StatusBadge, Tabs, date, money, uid, useList, useToast, type Col } from '../../ui'
import { emp, employees, TODAY } from '../../data/mock'
import { delayDays, documents, type DocReturn, type DocRow, type DocType } from '../../data/crm-b'
import type { CrmPageProps } from './types'
import { AdminActions, shortName } from './crm-b-ui'

type Tab = 'all' | 'contracts' | 'Счёт' | 'Акт' | 'Протокол разногласий'
type CSub = 'all' | 'Договор с арендатором' | 'Договор с арендодателем' | 'Трудовой договор'
const statuses: DocReturn[] = ['На подписи у клиента', 'В офисе', 'Оригинал получен']
const isContract = (t: DocType) => t.startsWith('Договор') || t === 'Трудовой договор'
const responsibles = employees.filter((e) => ['manager', 'hr', 'admin'].includes(e.role))
type Row = DocRow & { blocked?: boolean }

export default function Docs({ role }: CrmPageProps) {
  const toast = useToast()
  const list = useList<Row>(documents)
  const [tab, setTab] = useState<Tab>('all')
  const [sub, setSub] = useState<CSub>('all')
  const [q, setQ] = useState('')
  const [st, setSt] = useState('')
  const [resp, setResp] = useState('')
  const [onlyLate, setOnlyLate] = useState(false)
  const [showArch, setShowArch] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [form, setForm] = useState<Row | null>(null)

  const base = list.rows.filter((d) => !!d.archived === showArch)
  const inTab = (d: Row) => tab === 'all' || (tab === 'contracts' ? isContract(d.type) && (sub === 'all' || d.type === sub) : d.type === tab)
  const rows = base.filter(inTab).filter((d) => {
    const hay = `${d.number} ${d.counterparty} ${d.orderNumber ?? ''} ${d.type}`.toLowerCase()
    return (!q || hay.includes(q.toLowerCase())) && (!st || d.status === st) && (!resp || d.responsibleId === resp) && (!onlyLate || delayDays(d) > 0)
  }).sort((a, b) => delayDays(b) - delayDays(a))
  const active = list.rows.filter((d) => !d.archived)
  const late = active.filter((d) => d.status !== 'Оригинал получен' && delayDays(d) > 0)
  const cur = list.rows.find((d) => d.id === openId) ?? null
  const save = (d: Row, m?: string) => { list.update(d); if (m) toast(m) }

  const cols: Col<Row>[] = [
    { key: 'n', title: 'Документ', render: (d) => <div><div className="cb-cell-main mono">{d.number}</div><div className="cb-cell-sub">{d.type}{d.orderNumber ? ` · ${d.orderNumber}` : ''}</div></div> },
    { key: 'c', title: 'Контрагент', render: (d) => <div><div>{d.counterparty}</div>{d.amount ? <div className="cb-cell-sub tnum">{money(d.amount)}</div> : null}</div> },
    { key: 'i', title: 'Выдан', nowrap: true, hideMobile: true, render: (d) => <span className="tnum">{date(d.issued)}</span> },
    { key: 'du', title: 'Срок возврата', nowrap: true, hideMobile: true, render: (d) => <span className="tnum">{date(d.due)}</span> },
    { key: 'r', title: 'Возвращён', nowrap: true, hideMobile: true, render: (d) => (d.returned ? <span className="tnum">{date(d.returned)}</span> : <span className="muted">—</span>) },
    { key: 'l', title: 'Задержка', align: 'r', nowrap: true, render: (d) => { const n = delayDays(d); return n ? <Badge tone={d.returned ? 'warn' : 'bad'}>{n} дн.</Badge> : <span className="muted">—</span> } },
    { key: 's', title: 'Статус', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'p', title: 'Ответственный', hideMobile: true, render: (d) => shortName(emp(d.responsibleId)?.name ?? '—') },
    { key: 'a', title: 'Утверждён', hideMobile: true, render: (d) => (d.approved ? <Badge tone="ok">Да</Badge> : <Badge tone="warn">Нет</Badge>) },
  ]

  return (
    <div className="cb-page">
      <PageHead title="Документооборот" sub={`Договоры, счета, акты и протоколы разногласий. Контроль возврата оригиналов: задержка считается автоматически на ${date(TODAY)}.`}
        actions={<button className="btn btn-primary" onClick={() => setForm({ id: uid('doc'), number: `Д-2026/${200 + list.rows.length}`, type: 'Договор с арендатором', counterparty: '', issued: TODAY, due: '2026-10-20', status: 'На подписи у клиента', responsibleId: role === 'hr' ? 'e6' : 'e1', approved: false })}><Plus />Добавить документ</button>} />

      <div className="cb-stats">
        <Stat label="На подписи у клиента" value={active.filter((d) => d.status === 'На подписи у клиента').length} icon={<Send size={16} />} />
        <Stat label="В офисе" value={active.filter((d) => d.status === 'В офисе').length} icon={<Inbox size={16} />} />
        <Stat label="Оригинал получен" value={active.filter((d) => d.status === 'Оригинал получен').length} icon={<FileCheck2 size={16} />} />
        <Stat label="Просрочен возврат" value={late.length} icon={<AlertTriangle size={16} />} delta={`всего ${late.reduce((a, d) => a + delayDays(d), 0)} дн. задержки`} trend="down" />
      </div>

      {late.length > 0 && (
        <div className="alert alert-bad"><Clock /><div><b>Не возвращены оригиналы:</b> {late.slice(0, 3).map((d) => `${d.number} (${d.counterparty}, ${delayDays(d)} дн.)`).join('; ')}{late.length > 3 ? ` и ещё ${late.length - 3}` : ''}.</div></div>
      )}

      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { id: 'all', label: 'Все', count: base.length },
        { id: 'contracts', label: 'Договоры', count: base.filter((d) => isContract(d.type)).length },
        { id: 'Счёт', label: 'Счета', count: base.filter((d) => d.type === 'Счёт').length },
        { id: 'Акт', label: 'Акты', count: base.filter((d) => d.type === 'Акт').length },
        { id: 'Протокол разногласий', label: 'Протоколы разногласий', count: base.filter((d) => d.type === 'Протокол разногласий').length },
      ]} />
      {tab === 'contracts' && <Seg<CSub> value={sub} onChange={setSub} items={[{ id: 'all', label: 'Все договоры' }, { id: 'Договор с арендатором', label: 'С арендаторами' }, { id: 'Договор с арендодателем', label: 'С арендодателями' }, { id: 'Трудовой договор', label: 'С сотрудниками' }]} />}

      <div className="stack-sm">
        <div className="toolbar">
          <SearchInput value={q} onChange={setQ} placeholder="Номер, контрагент, заказ" />
          <select className="select" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Статус возврата"><option value="">Любой статус</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
          <select className="select" value={resp} onChange={(e) => setResp(e.target.value)} aria-label="Ответственный"><option value="">Все ответственные</option>{responsibles.map((e) => <option key={e.id} value={e.id}>{shortName(e.name)}</option>)}</select>
        </div>
        <div className="cb-toolbar-checks">
          <label className="check"><input type="checkbox" checked={onlyLate} onChange={(e) => setOnlyLate(e.target.checked)} />Только с задержкой</label>
          <label className="check"><input type="checkbox" checked={showArch} onChange={(e) => setShowArch(e.target.checked)} />Показать архив</label>
        </div>
      </div>

      <DataTable cols={cols} rows={rows} rowKey={(d) => d.id} onRow={(d) => setOpenId(d.id)} empty="Документы не найдены" />

      {cur && (
        <Drawer title={`${cur.type} ${cur.number}`} sub={<span className="row" style={{ gap: 6 }}><StatusBadge status={cur.status} />{cur.approved && <Badge tone="ok">Утверждён</Badge>}{cur.blocked && <Badge tone="bad">Заблокирован</Badge>}</span>} onClose={() => setOpenId(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setForm(cur)}>Редактировать</button>
            {!cur.approved && <button className="btn btn-primary" onClick={() => save({ ...cur, approved: true }, 'Документ утверждён')}><Stamp />Утвердить</button>}
          </>}>
          <KV items={[
            ['Тип', cur.type], ['Контрагент', cur.counterparty], ['Заказ', cur.orderNumber ?? '—'], ['Сумма', cur.amount ? money(cur.amount) : '—'],
            ['Дата выдачи', date(cur.issued)], ['Срок возврата', date(cur.due)], ['Дата возврата', cur.returned ? date(cur.returned) : 'не возвращён'],
            ['Задержка', delayDays(cur) ? <b className="cb-neg">{delayDays(cur)} дн.{cur.returned ? '' : ' (продолжается)'}</b> : 'нет'],
            ['Ответственный', emp(cur.responsibleId)?.name],
          ]} />
          <div className="cb-box soft">
            <span className="eyebrow">Контроль возврата оригинала</span>
            <div className="cb-steps">{statuses.map((s, i) => <div key={s} className={`cb-step ${statuses.indexOf(cur.status) > i || cur.status === 'Оригинал получен' ? 'done' : statuses.indexOf(cur.status) === i ? 'cur' : ''}`}>{s}</div>)}</div>
            <div className="row" style={{ gap: 8 }}>
              {statuses.map((s) => <button key={s} className={`btn btn-sm ${cur.status === s ? 'btn-dark' : 'btn-secondary'}`} disabled={cur.blocked}
                onClick={() => save({ ...cur, status: s, returned: s === 'Оригинал получен' ? cur.returned ?? TODAY : undefined }, `Статус: ${s.toLowerCase()}`)}>{s}</button>)}
            </div>
            <Field label="Ответственный">
              <select className="select" value={cur.responsibleId} onChange={(e) => save({ ...cur, responsibleId: e.target.value }, 'Ответственный назначен')}>{responsibles.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
            </Field>
            {cur.status !== 'Оригинал получен' && <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => toast(`Напоминание о возврате оригинала отправлено: ${cur.counterparty}`)}><Bell />Напомнить контрагенту</button>}
          </div>
          <div className="cb-list">
            <div><FileText /><span className="grow">{cur.number}.pdf · подписан ЭЦП отправителя</span><button className="btn btn-ghost btn-sm" onClick={() => toast('Файл скачан (демо)')}>Скачать</button></div>
            {cur.status === 'Оригинал получен' && <div><CheckCircle2 style={{ color: 'var(--ok)' }} /><span className="grow">Скан оригинала с подписью контрагента</span></div>}
          </div>
          <AdminActions role={role} blocked={cur.blocked} cancelLabel="Отменить документ"
            onCancel={() => { list.remove(cur.id); setOpenId(null); toast('Документ отменён') }}
            onArchive={() => save({ ...cur, archived: !cur.archived }, cur.archived ? 'Документ восстановлен из архива' : 'Документ в архиве')}
            onBlock={() => save({ ...cur, blocked: !cur.blocked }, cur.blocked ? 'Документ разблокирован' : 'Документ заблокирован для изменений')} />
        </Drawer>
      )}

      {form && <DocForm init={form} isNew={!list.rows.some((d) => d.id === form.id)} onClose={() => setForm(null)}
        onSave={(d) => { if (list.rows.some((x) => x.id === d.id)) { list.update(d); toast('Документ сохранён') } else { list.add(d); toast('Документ добавлен') } setForm(null) }} />}
    </div>
  )
}

function DocForm({ init, isNew, onClose, onSave }: { init: Row; isNew: boolean; onClose: () => void; onSave: (d: Row) => void }) {
  const [f, setF] = useState(init)
  const set = (p: Partial<Row>) => setF((x) => ({ ...x, ...p }))
  const types: DocType[] = ['Договор с арендатором', 'Договор с арендодателем', 'Трудовой договор', 'Счёт', 'Акт', 'Протокол разногласий']
  return (
    <Modal title={isNew ? 'Новый документ' : `Редактирование ${init.number}`} onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Отмена</button><button className="btn btn-primary" disabled={!f.counterparty.trim()} onClick={() => onSave(f)}>Сохранить</button></>}>
      <div className="grid g2">
        <Field label="Тип"><select className="select" value={f.type} onChange={(e) => set({ type: e.target.value as DocType })}>{types.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Номер"><input className="input mono" value={f.number} onChange={(e) => set({ number: e.target.value })} /></Field>
      </div>
      <Field label={f.type === 'Трудовой договор' ? 'Сотрудник' : 'Контрагент'} required><input className="input" value={f.counterparty} onChange={(e) => set({ counterparty: e.target.value })} /></Field>
      <div className="grid g2">
        <Field label="Дата выдачи"><input type="date" className="input" value={f.issued} onChange={(e) => set({ issued: e.target.value })} /></Field>
        <Field label="Срок возврата"><input type="date" className="input" value={f.due} onChange={(e) => set({ due: e.target.value })} /></Field>
        <Field label="Сумма, BYN"><input type="number" className="input" value={f.amount ?? ''} onChange={(e) => set({ amount: Number(e.target.value) || undefined })} /></Field>
        <Field label="Статус"><select className="select" value={f.status} onChange={(e) => set({ status: e.target.value as DocReturn })}>{statuses.map((s) => <option key={s}>{s}</option>)}</select></Field>
      </div>
      <Field label="Ответственный"><select className="select" value={f.responsibleId} onChange={(e) => set({ responsibleId: e.target.value })}>{responsibles.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
    </Modal>
  )
}
