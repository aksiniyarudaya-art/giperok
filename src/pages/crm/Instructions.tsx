import { useState } from 'react'
import { BellRing, BookOpen, CheckCircle2, Eye, FilePlus2, Pencil, ShieldCheck, Users } from 'lucide-react'
import { Badge, DataTable, Drawer, Field, KV, Modal, PageHead, Progress, SearchInput, Seg, Stat, date, uid, useList, useToast, type Col } from '../../ui'
import { emp } from '../../data/mock'
import { roleLabels, type Role } from '../../data/types'
import { instructions, type Instruction } from '../../data/crm-b'
import type { CrmPageProps } from './types'
import { AdminActions } from './crm-b-ui'

type Row = Instruction & { blocked?: boolean; readByMe?: boolean }
const allRoles: Role[] = ['manager', 'driver', 'mechanic', 'hr', 'admin']
const meByRole = { manager: 'e1', mechanic: 'e4', hr: 'e6', admin: 'e7' } as const

export default function Instructions({ role }: CrmPageProps) {
  const toast = useToast()
  const canEdit = role === 'manager' || role === 'admin'
  const list = useList<Row>(instructions)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [vis, setVis] = useState('')
  const [req, setReq] = useState<'all' | 'req' | 'opt'>('all')
  const [arch, setArch] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [form, setForm] = useState<Row | null>(null)

  // видимость: админ и менеджер видят всё; остальные — только то, что открыто их роли
  const visibleToMe = list.rows.filter((r) => canEdit || r.roles.includes(role))
  const cats = [...new Set(list.rows.map((r) => r.category))]
  const rows = visibleToMe.filter((r) => !!r.archived === arch).filter((r) =>
    (!q || `${r.title} ${r.body}`.toLowerCase().includes(q.toLowerCase())) && (!cat || r.category === cat) && (!vis || r.roles.includes(vis as Role))
    && (req === 'all' || (req === 'req' ? r.required : !r.required)))
  const cur = list.rows.find((r) => r.id === openId) ?? null
  const save = (r: Row, m?: string) => { list.update(r); if (m) toast(m) }
  const active = visibleToMe.filter((r) => !r.archived)

  const cols: Col<Row>[] = [
    { key: 't', title: 'Инструкция', render: (r) => <div><div className="cb-cell-main">{r.title}</div><div className="cb-cell-sub">{r.category} · v{r.version}</div></div> },
    { key: 'v', title: 'Видимость', hideMobile: true, render: (r) => <div className="cb-chips">{r.roles.map((x) => <span key={x} className="cb-chip">{roleLabels[x]}</span>)}</div> },
    { key: 'r', title: 'Тип', render: (r) => (r.required ? <Badge tone="bad">Обязательная</Badge> : <Badge>Справочная</Badge>) },
    { key: 'u', title: 'Обновлена', nowrap: true, hideMobile: true, render: (r) => <span className="tnum">{date(r.updated)}</span> },
    { key: 'p', title: 'Ознакомлены', render: (r) => <div className="cb-kpi"><Progress value={(r.read / r.total) * 100} tone={r.read === r.total ? 'ok' : r.required && r.read / r.total < 0.7 ? 'bad' : undefined} /><b>{r.read}/{r.total}</b></div> },
    { key: 'a', title: 'Автор', hideMobile: true, render: (r) => emp(r.authorId)?.name.split(' ').slice(0, 2).join(' ') },
  ]

  return (
    <div className="cb-page">
      <PageHead title="Инструкции" sub="Регламенты и инструкции с видимостью по ролям. Обязательные — требуют подтверждения ознакомления."
        actions={canEdit ? <button className="btn btn-primary" onClick={() => setForm({ id: uid('in'), title: '', category: 'Смены', roles: ['driver'], required: false, version: '1.0', updated: '2026-10-13', authorId: meByRole[role], read: 0, total: 10, body: '' })}><FilePlus2 />Добавить инструкцию</button> : undefined} />

      <div className="cb-stats">
        <Stat label="Инструкций" value={active.length} icon={<BookOpen size={16} />} />
        <Stat label="Обязательных" value={active.filter((r) => r.required).length} icon={<ShieldCheck size={16} />} />
        <Stat label="Ознакомлены" value={`${Math.round((active.reduce((a, r) => a + r.read, 0) / Math.max(1, active.reduce((a, r) => a + r.total, 0))) * 100)}%`} icon={<Users size={16} />} delta="по всем сотрудникам" />
        <Stat label="Требуют внимания" value={active.filter((r) => r.required && r.read < r.total).length} icon={<BellRing size={16} />} delta="обязательные, не все ознакомлены" trend="down" />
      </div>

      <div className="stack-sm">
        <div className="toolbar">
          <SearchInput value={q} onChange={setQ} placeholder="Поиск по названию и тексту" />
          <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Категория"><option value="">Все категории</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>
          {canEdit && <select className="select" value={vis} onChange={(e) => setVis(e.target.value)} aria-label="Видимость"><option value="">Видна всем ролям</option>{allRoles.map((r) => <option key={r} value={r}>Видна: {roleLabels[r].toLowerCase()}</option>)}</select>}
        </div>
        <div className="row-between">
          <Seg value={req} onChange={setReq} items={[{ id: 'all', label: 'Все' }, { id: 'req', label: 'Обязательные' }, { id: 'opt', label: 'Справочные' }]} />
          {canEdit && <label className="check" style={{ fontSize: 13, alignItems: 'center' }}><input type="checkbox" style={{ marginTop: 0 }} checked={arch} onChange={(e) => setArch(e.target.checked)} />Архив</label>}
        </div>
      </div>

      <DataTable cols={cols} rows={rows} rowKey={(r) => r.id} onRow={(r) => setOpenId(r.id)} empty="Инструкций не найдено" />

      {cur && (
        <Drawer title={cur.title} sub={<span className="row" style={{ gap: 6 }}>{cur.required ? <Badge tone="bad">Обязательная</Badge> : <Badge>Справочная</Badge>}<span>v{cur.version} от {date(cur.updated)}</span>{cur.blocked && <Badge tone="bad">Заблокирована</Badge>}</span>} onClose={() => setOpenId(null)}
          footer={<>
            {canEdit && <button className="btn btn-secondary" disabled={cur.blocked} onClick={() => setForm(cur)}><Pencil />Обновить</button>}
            {canEdit && <button className="btn btn-secondary" onClick={() => save({ ...cur, required: !cur.required }, cur.required ? 'Инструкция переведена в справочные' : 'Инструкция стала обязательной: сотрудники получили уведомление')}>{cur.required ? 'Снять обязательность' : 'Сделать обязательной'}</button>}
            {cur.readByMe ? <button className="btn btn-ok" disabled><CheckCircle2 />Ознакомлен</button>
              : <button className="btn btn-primary" onClick={() => save({ ...cur, readByMe: true, read: Math.min(cur.total, cur.read + 1) }, 'Ознакомление подтверждено')}><Eye />Ознакомлен</button>}
          </>}>
          <div className="cb-doc-body">{cur.body}</div>
          <KV items={[
            ['Категория', cur.category],
            ['Видимость', <div className="cb-chips">{cur.roles.map((x) => <span key={x} className="cb-chip">{roleLabels[x]}</span>)}</div>],
            ['Автор', emp(cur.authorId)?.name],
            ['Ознакомлены', `${cur.read} из ${cur.total}`],
          ]} />
          <Progress value={(cur.read / cur.total) * 100} tone={cur.read === cur.total ? 'ok' : undefined} />
          {canEdit && cur.read < cur.total && <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => toast(`Напоминание отправлено ${cur.total - cur.read} сотрудникам в приложение и Telegram (демо)`)}><BellRing />Напомнить неознакомленным</button>}
          <AdminActions role={role} blocked={cur.blocked} cancelLabel="Отменить публикацию"
            onCancel={() => { list.remove(cur.id); setOpenId(null); toast('Публикация отменена') }}
            onArchive={() => { save({ ...cur, archived: !cur.archived }, cur.archived ? 'Инструкция восстановлена' : 'Инструкция в архиве'); setOpenId(null) }}
            onBlock={() => save({ ...cur, blocked: !cur.blocked }, cur.blocked ? 'Разблокирована' : 'Заблокирована для изменений')} />
        </Drawer>
      )}

      {form && <InstrForm init={form} isNew={!list.rows.some((r) => r.id === form.id)} onClose={() => setForm(null)}
        onSave={(r, isNew) => {
          if (isNew) { list.add(r); toast('Инструкция опубликована') }
          else { const [a, b] = r.version.split('.').map(Number); list.update({ ...r, version: `${a}.${(b || 0) + 1}`, updated: '2026-10-13', read: r.required ? 0 : r.read }); toast(r.required ? 'Инструкция обновлена, ознакомление запрошено повторно' : 'Инструкция обновлена') }
          setForm(null)
        }} />}
    </div>
  )
}

function InstrForm({ init, isNew, onClose, onSave }: { init: Row; isNew: boolean; onClose: () => void; onSave: (r: Row, isNew: boolean) => void }) {
  const [f, setF] = useState(init)
  const set = (p: Partial<Row>) => setF((x) => ({ ...x, ...p }))
  return (
    <Modal wide title={isNew ? 'Новая инструкция' : `Обновление: ${init.title}`} onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Отмена</button><button className="btn btn-primary" disabled={!f.title.trim() || !f.body.trim() || !f.roles.length} onClick={() => onSave(f, isNew)}>{isNew ? 'Опубликовать' : 'Сохранить новую версию'}</button></>}>
      <div className="grid g2">
        <Field label="Название" required><input className="input" value={f.title} onChange={(e) => set({ title: e.target.value })} /></Field>
        <Field label="Категория"><input className="input" value={f.category} onChange={(e) => set({ category: e.target.value })} list="instr-cats" />
          <datalist id="instr-cats">{['Смены', 'Документы', 'Охрана труда', 'Продажи', 'Ремонт', 'Кадры', 'Финансы'].map((c) => <option key={c} value={c} />)}</datalist></Field>
      </div>
      <Field label="Видимость для ролей" required>
        <div className="cb-toolbar-checks">{allRoles.map((r) => (
          <label key={r} className="check"><input type="checkbox" checked={f.roles.includes(r)} onChange={(e) => set({ roles: e.target.checked ? [...f.roles, r] : f.roles.filter((x) => x !== r) })} />{roleLabels[r]}</label>
        ))}</div>
      </Field>
      <label className="check"><input type="checkbox" checked={f.required} onChange={(e) => set({ required: e.target.checked })} />Обязательная — сотрудники должны подтвердить ознакомление</label>
      <Field label="Текст инструкции" required><textarea className="textarea" rows={8} value={f.body} onChange={(e) => set({ body: e.target.value })} /></Field>
    </Modal>
  )
}
