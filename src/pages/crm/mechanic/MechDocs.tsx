import { useMemo, useState } from 'react'
import { Camera, Download, FilePlus2, FileSignature, FileText, Paperclip, Plus, Send, ShoppingCart, Trash2, Wallet } from 'lucide-react'
import type { CrmPageProps } from '../types'
import { DataTable, Drawer, Field, KV, Modal, PageHead, SearchInput, Stat, Tabs, date, money, uid, useToast, type Col } from '../../../ui'
import { TODAY } from '../../../data/mock'
import {
  docTotal, docsStore, fleetStore, mechDocTypes, repairsStore, useStore, useStoreList,
  type Attachment, type MechDoc, type MechDocType, type Part,
} from '../../../data/crm-c'
import { Uploader, XBadge, empShort, eqPlate, eqTitle } from './parts'

type Tab = 'all' | 'parts' | 'acts' | 'bills' | 'media'
const tabOf = (t: MechDocType): Tab => t === 'Заказ запчастей' ? 'parts' : t === 'Счёт на оплату' ? 'bills' : t === 'Фотофиксация' || t === 'Видеофиксация' ? 'media' : 'acts'
const prefix: Record<MechDocType, string> = { 'Заказ запчастей': 'ЗЗ', 'Акт дефектации': 'АД', 'Акт выполненных работ': 'АВР', 'Счёт на оплату': 'СЧ', 'Фотофиксация': 'ФФ', 'Видеофиксация': 'ВФ' }

export default function MechDocs({ role }: CrmPageProps) {
  const toast = useToast()
  const docs = useStoreList(docsStore)
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [create, setCreate] = useState<MechDocType | null>(null)

  const rows = useMemo(() => docs.rows.filter((d) => (tab === 'all' || tabOf(d.type) === tab) && (!q || `${d.number} ${d.type} ${d.supplier ?? ''} ${eqTitle(d.equipmentId)}`.toLowerCase().includes(q.toLowerCase()))), [docs.rows, tab, q])
  const cnt = (t: Tab) => docs.rows.filter((d) => t === 'all' || tabOf(d.type) === t).length
  const pay = docs.rows.filter((d) => d.pay === 'Ожидает оплаты')

  const cols: Col<MechDoc>[] = [
    { key: 'n', title: 'Документ', render: (d) => <div><div style={{ fontWeight: 600 }}>{d.type}</div><div className="cx-mini mono">{d.number}</div></div> },
    { key: 'd', title: 'Дата', nowrap: true, hideMobile: true, render: (d) => date(d.date) },
    { key: 'e', title: 'Техника', hideMobile: true, render: (d) => d.equipmentId ? <div>{eqTitle(d.equipmentId)}<div className="cx-mini mono">{eqPlate(d.equipmentId)}</div></div> : '—' },
    { key: 's', title: 'Подпись', render: (d) => <XBadge s={d.status} /> },
    { key: 'p', title: 'Оплата', hideMobile: true, render: (d) => d.pay === 'Не требуется' ? <span className="dim">—</span> : <XBadge s={d.pay} /> },
    { key: 'a', title: 'Сумма', align: 'r', nowrap: true, render: (d) => docTotal(d) ? <span className="tnum">{money(docTotal(d))}</span> : <span className="dim">—</span> },
    { key: 'f', title: 'Файлы', align: 'r', hideMobile: true, render: (d) => d.attachments.length ? <span className="row" style={{ gap: 4, justifyContent: 'flex-end' }}><Paperclip size={14} />{d.attachments.length}</span> : <span className="dim">0</span> },
  ]

  const d = docs.rows.find((x) => x.id === openId)

  return (
    <>
      <PageHead title="Документооборот" sub="Заказ запчастей, акты, счета на оплату, фото- и видеофиксация неисправностей"
        actions={<>
          <button className="btn btn-secondary" onClick={() => setCreate('Фотофиксация')}><Camera />Фото / видео</button>
          <button className="btn btn-secondary" onClick={() => setCreate('Заказ запчастей')}><ShoppingCart />Заказ запчастей</button>
          <button className="btn btn-primary" onClick={() => setCreate('Акт дефектации')}><FilePlus2 />Сформировать документ</button>
        </>} />

      <div className="cx-stats">
        <Stat icon={<FileSignature />} label="Ждут подписи" value={docs.rows.filter((x) => x.status === 'На подписи').length} />
        <Stat icon={<Wallet />} label="Ожидают оплаты" value={pay.length} delta={money(pay.reduce((a, x) => a + docTotal(x), 0))} />
        <Stat icon={<FileText />} label="Черновики" value={docs.rows.filter((x) => x.status === 'Черновик').length} />
        <Stat icon={<Camera />} label="Медиафайлов" value={docs.rows.reduce((a, x) => a + x.attachments.filter((f) => f.kind !== 'file').length, 0)} />
      </div>

      <div className="card stack">
        <div className="toolbar">
          <Tabs value={tab} onChange={setTab} items={[
            { id: 'all', label: 'Все', count: cnt('all') }, { id: 'parts', label: 'Заказы запчастей', count: cnt('parts') }, { id: 'acts', label: 'Акты', count: cnt('acts') },
            { id: 'bills', label: 'Счета', count: cnt('bills') }, { id: 'media', label: 'Фото и видео', count: cnt('media') },
          ]} />
          <div className="grow" />
          <SearchInput value={q} onChange={setQ} placeholder="№, поставщик, техника" />
        </div>
        <DataTable cols={cols} rows={rows} rowKey={(x) => x.id} onRow={(x) => setOpenId(x.id)} />
      </div>

      {d && (
        <Drawer title={`${d.type} ${d.number}`} sub={`от ${date(d.date)}`} onClose={() => setOpenId(null)}
          footer={<div className="row-between" style={{ width: '100%' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { docs.remove(d.id); setOpenId(null); toast('Документ удалён') }}><Trash2 />Удалить</button>
            <div className="cx-btns">
              <button className="btn btn-secondary btn-sm" onClick={() => toast(`PDF «${d.number}» сформирован (демо)`)}><Download />PDF</button>
              {d.status === 'Черновик' && <button className="btn btn-secondary btn-sm" onClick={() => { docs.patch(d.id, { status: 'На подписи' }); toast('Документ отправлен на подпись') }}><Send />На подпись</button>}
              {d.status !== 'Подписан' && <button className="btn btn-primary btn-sm" onClick={() => { docs.patch(d.id, { status: 'Подписан', signedBy: role === 'admin' ? 'e7' : 'e4' }); toast('Документ подписан ЭЦП механика (демо)') }}><FileSignature />Подписать</button>}
              {d.status === 'Подписан' && d.pay === 'Ожидает оплаты' && <button className="btn btn-ok btn-sm" onClick={() => toast('Документ передан в бухгалтерию на оплату')}><Wallet />В бухгалтерию</button>}
            </div>
          </div>}>
          <div className="stack">
            <KV items={[
              ['Тип', d.type], ['Статус', <XBadge key="s" s={d.status} />], ['Оплата', d.pay === 'Не требуется' ? 'Не требуется' : <XBadge key="p" s={d.pay} />],
              ['Техника', d.equipmentId ? `${eqTitle(d.equipmentId)} · ${eqPlate(d.equipmentId)}` : '—'],
              ['Ремонт / ТО', repairsStore.get().find((r) => r.id === d.repairId)?.number ?? '—'],
              ['Поставщик / исполнитель', d.supplier ?? '—'], ['Подписал', d.signedBy ? empShort(d.signedBy) : '—'],
            ]} />
            {d.note && <div className="card-flat">{d.note}</div>}
            {!!d.items.length && <div className="cx-sec">
              <div className="cx-sec-h"><h4>Позиции</h4></div>
              <div className="table-wrap"><table className="table"><thead><tr><th>Наименование</th><th className="r">Кол-во</th><th className="r">Цена</th><th className="r">Сумма</th></tr></thead>
                <tbody>{d.items.map((p) => <tr key={p.id}><td>{p.name}</td><td className="r tnum">{p.qty}</td><td className="r tnum nowrap">{money(p.price)}</td><td className="r tnum nowrap">{money(p.qty * p.price)}</td></tr>)}</tbody></table></div>
              <div className="cx-total"><span className="muted">Итого</span><b>{money(docTotal(d))}</b></div>
            </div>}
            <div className="cx-sec">
              <div className="cx-sec-h"><h4>Материалы</h4><span className="cx-mini">{d.attachments.length} файл(ов)</span></div>
              <Uploader files={d.attachments} onChange={(f) => { docs.patch(d.id, { attachments: f }); if (f.length > d.attachments.length) toast('Материалы приложены к документу') }} />
            </div>
          </div>
        </Drawer>
      )}

      {create && <CreateDoc type={create} onClose={() => setCreate(null)} onSave={(doc) => { docs.add(doc); setCreate(null); setOpenId(doc.id); toast(`Сформирован ${doc.type.toLowerCase()} ${doc.number}`) }} />}
    </>
  )
}

function CreateDoc({ type, onClose, onSave }: { type: MechDocType; onClose: () => void; onSave: (d: MechDoc) => void }) {
  const fleet = useStore(fleetStore)
  const repairs = useStore(repairsStore)
  const [v, setV] = useState({ type, equipmentId: fleet[0]?.id ?? '', repairId: '', supplier: '', note: '' })
  const [items, setItems] = useState<Part[]>(type === 'Заказ запчастей' ? [{ id: uid('p'), name: '', qty: 1, price: 0 }] : [])
  const [files, setFiles] = useState<Attachment[]>([])
  const media = v.type === 'Фотофиксация' || v.type === 'Видеофиксация'
  const withItems = v.type === 'Заказ запчастей' || v.type === 'Счёт на оплату' || v.type === 'Акт выполненных работ'
  const ok = media ? files.length > 0 : withItems ? items.some((i) => i.name.trim()) : v.note.trim().length > 2
  const save = (sign: boolean) => {
    const sum = items.filter((i) => i.name.trim())
    const t: MechDocType = media && files.every((f) => f.kind === 'video') ? 'Видеофиксация' : media ? 'Фотофиксация' : v.type
    onSave({
      id: uid('md'), number: `${prefix[t]}-${340 + docsStore.get().length}`, type: t, date: TODAY, equipmentId: v.equipmentId || undefined, repairId: v.repairId || undefined,
      supplier: v.supplier || undefined, items: sum, note: v.note, status: sign ? 'Подписан' : 'Черновик', signedBy: sign ? 'e4' : undefined,
      pay: withItems && v.type !== 'Акт выполненных работ' ? 'Ожидает оплаты' : 'Не требуется',
      attachments: files,
    })
  }
  return (
    <Modal wide title="Сформировать документ" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Отмена</button><button className="btn btn-secondary" disabled={!ok} onClick={() => save(false)}>Сохранить черновик</button><button className="btn btn-primary" disabled={!ok} onClick={() => save(true)}><FileSignature />Сформировать и подписать</button></>}>
      <div className="stack">
        <div className="grid g2">
          <Field label="Тип документа" required><select className="select" value={v.type} onChange={(e) => setV({ ...v, type: e.target.value as MechDocType })}>{mechDocTypes.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Техника"><select className="select" value={v.equipmentId} onChange={(e) => setV({ ...v, equipmentId: e.target.value })}><option value="">Без привязки</option>{fleet.map((u) => <option key={u.id} value={u.id}>{eqTitle(u.id)} · {eqPlate(u.id)}</option>)}</select></Field>
          <Field label="Карточка ТО / ремонта"><select className="select" value={v.repairId} onChange={(e) => setV({ ...v, repairId: e.target.value })}><option value="">Не выбрана</option>{repairs.filter((r) => !v.equipmentId || r.equipmentId === v.equipmentId).map((r) => <option key={r.id} value={r.id}>{r.number} · {r.title}</option>)}</select></Field>
          {!media && <Field label="Поставщик / исполнитель"><input className="input" value={v.supplier} onChange={(e) => setV({ ...v, supplier: e.target.value })} placeholder="Например, ООО «ГидроТехСервис»" /></Field>}
        </div>
        {withItems && <div className="cx-sec">
          <div className="cx-sec-h"><h4>Позиции</h4><button className="btn btn-ghost btn-sm" onClick={() => setItems([...items, { id: uid('p'), name: '', qty: 1, price: 0 }])}><Plus />Строка</button></div>
          <div className="table-wrap"><table className="table cx-parts"><thead><tr><th>Наименование</th><th className="r">Кол-во</th><th className="r">Цена, BYN</th><th /></tr></thead>
            <tbody>{items.map((p) => <tr key={p.id}>
              <td style={{ minWidth: 170 }}><input className="input" value={p.name} placeholder="Запчасть / работа" onChange={(e) => setItems(items.map((x) => x.id === p.id ? { ...x, name: e.target.value } : x))} /></td>
              <td style={{ width: 80 }}><input className="input tnum" type="number" min="0" value={p.qty} onChange={(e) => setItems(items.map((x) => x.id === p.id ? { ...x, qty: Number(e.target.value) } : x))} /></td>
              <td style={{ width: 110 }}><input className="input tnum" type="number" min="0" value={p.price} onChange={(e) => setItems(items.map((x) => x.id === p.id ? { ...x, price: Number(e.target.value) } : x))} /></td>
              <td><button className="btn btn-ghost btn-sm btn-icon" aria-label="Удалить" onClick={() => setItems(items.filter((x) => x.id !== p.id))}><Trash2 /></button></td>
            </tr>)}</tbody></table></div>
          <div className="cx-total"><span className="muted">Итого</span><b>{money(items.reduce((a, p) => a + p.qty * p.price, 0))}</b></div>
        </div>}
        <Field label={media ? 'Что зафиксировано' : 'Комментарий / содержание'} required={!media && !withItems}><textarea className="textarea" value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} /></Field>
        <Field label={media ? 'Фото и видео' : 'Приложить материалы'} required={media} hint="Файлы остаются в браузере — это демонстрация загрузки с превью">
          <Uploader files={files} onChange={setFiles} accept={media ? 'image/*,video/*' : 'image/*,video/*,.pdf'} />
        </Field>
        {!!files.length && media && <div className="cx-mini">Тип документа определится автоматически: {files.every((f) => f.kind === 'video') ? 'видеофиксация' : 'фотофиксация'}.</div>}
      </div>
    </Modal>
  )
}
