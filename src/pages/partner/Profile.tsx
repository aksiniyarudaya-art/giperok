import { useState } from 'react'
import { BadgeCheck, Download, FileText, Globe, Save, Star } from 'lucide-react'
import { Avatar, Field, KV, PageHead, Seg, useToast } from '../../ui'
import { company } from '../../data/mock'
import { usePartner } from './ctx'

export default function Profile() {
  const toast = useToast()
  const p = usePartner()
  const co = company('l1')!
  const [f, setF] = useState({
    type: co.type as 'Компания' | 'Физлицо', name: co.name, director: co.director, representative: co.representative,
    phone: co.phone, email: co.email, socials: co.socials ?? 'instagram.com/technopark.by', site: co.site ?? '', unp: co.unp, bank: co.bank,
  })
  const [notif, setNotif] = useState({ orders: true, pay: true, tg: true })
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))

  return (
    <>
      <PageHead title="Профиль арендодателя" sub="Регистрационные данные, реквизиты для выплат и уведомления"
        actions={<button className="btn btn-primary" onClick={() => toast('Профиль сохранён')}><Save />Сохранить</button>} />
      <div className="pt-profile">
        <div className="stack" style={{ minWidth: 0 }}>
          <div className="card stack">
            <div className="card-head" style={{ marginBottom: 0 }}><h3>Регистрационные данные</h3></div>
            <Field label="Тип" required><Seg value={f.type} onChange={(v) => set('type', v)} items={[{ id: 'Компания', label: 'Компания' }, { id: 'Физлицо', label: 'Физлицо / ИП' }]} /></Field>
            {f.type === 'Компания' && <Field label="Название компании" required><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>}
            <div className="grid g2">
              <Field label="ФИО руководителя" required><input className="input" value={f.director} onChange={(e) => set('director', e.target.value)} /></Field>
              <Field label="ФИО представителя компании" required><input className="input" value={f.representative} onChange={(e) => set('representative', e.target.value)} /></Field>
              <Field label="Номер телефона" required><input className="input" type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
              <Field label="Почта" required><input className="input" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
              <Field label="Соцсети"><input className="input" value={f.socials} onChange={(e) => set('socials', e.target.value)} /></Field>
              <Field label="Сайт"><div className="input-icon"><Globe /><input className="input" value={f.site} onChange={(e) => set('site', e.target.value)} /></div></Field>
            </div>
          </div>
          <div className="card stack">
            <div className="card-head" style={{ marginBottom: 0 }}><h3>Реквизиты для выплат</h3></div>
            <div className="grid g2">
              <Field label="УНП"><input className="input mono" value={f.unp} onChange={(e) => set('unp', e.target.value)} /></Field>
              <Field label="Расчётный счёт и банк"><input className="input mono" value={f.bank} onChange={(e) => set('bank', e.target.value)} /></Field>
            </div>
            <Field label="Юридический адрес"><input className="input" defaultValue={co.legalAddress} /></Field>
          </div>
        </div>
        <aside className="stack">
          <div className="card stack" style={{ alignItems: 'center', textAlign: 'center' }}>
            <Avatar name={f.name} size="lg" />
            <div><div style={{ fontWeight: 700 }}>{f.type === 'Компания' ? f.name : f.director}</div><div className="muted" style={{ fontSize: 13 }}>{f.representative}, представитель</div></div>
            <div className="row" style={{ justifyContent: 'center' }}><span className="badge badge-ok"><BadgeCheck size={14} />Проверенный партнёр</span><span className="badge badge-accent plain"><Star size={12} />4.9</span></div>
          </div>
          <div className="card">
            <KV items={[
              ['Техники', `${p.equipment.length} ед.`],
              ['Партнёр с', '14.03.2024'],
              ['Выполнено заказов', '920'],
              ['Выход в срок', '97%'],
            ]} />
          </div>
          <div className="card stack-sm">
            <div className="card-head" style={{ marginBottom: 4 }}><h3>Документы</h3></div>
            {['Договор оферты партнёра №П-2024/031', 'Свидетельство о регистрации', 'Доверенность представителя'].map((d) => (
              <div key={d} className="pt-doc"><FileText size={18} /><span className="grow" style={{ fontSize: 13 }}>{d}</span><button className="btn btn-ghost btn-icon btn-sm" aria-label="Скачать" onClick={() => toast(`Скачивание: ${d}.pdf`)}><Download /></button></div>
            ))}
          </div>
          <div className="card stack">
            <div className="card-head" style={{ marginBottom: 0 }}><h3>Уведомления</h3></div>
            <label className="check"><input type="checkbox" checked={notif.orders} onChange={(e) => setNotif({ ...notif, orders: e.target.checked })} />Новые заказы — push и SMS</label>
            <label className="check"><input type="checkbox" checked={notif.pay} onChange={(e) => setNotif({ ...notif, pay: e.target.checked })} />Оплаты и выплаты — e-mail</label>
            <label className="check"><input type="checkbox" checked={notif.tg} onChange={(e) => setNotif({ ...notif, tg: e.target.checked })} />Дублировать в Telegram-бот</label>
          </div>
        </aside>
      </div>
    </>
  )
}
