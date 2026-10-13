import { useState } from 'react'
import { CheckCircle2, FileSignature, Globe, Save } from 'lucide-react'
import { Avatar, Field, PageHead, Seg, StatusBadge, useToast } from '../../ui'
import { company } from '../../data/mock'
import { clientSites } from '../../data/cabinet'
import { useClient } from './ctx'

export default function Profile() {
  const c = useClient()
  const toast = useToast()
  const co = company('c1')!
  const [f, setF] = useState({
    type: co.type as 'Компания' | 'Физлицо', name: co.name, director: co.director, representative: co.representative,
    phone: co.phone, email: co.email, legalAddress: co.legalAddress, socials: co.socials ?? '', site: co.site ?? '', unp: co.unp,
  })
  const [notif, setNotif] = useState({ tg: true, email: true, sms: false })
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))

  return (
    <>
      <PageHead title="Профиль" sub="Данные регистрации клиента и настройки уведомлений"
        actions={<button className="btn btn-primary" onClick={() => toast('Профиль сохранён')}><Save />Сохранить</button>} />
      <div className="cl-profile">
        <div className="stack" style={{ minWidth: 0 }}>
          <div className="card stack">
            <div className="card-head" style={{ marginBottom: 0 }}><h3>Регистрационные данные</h3></div>
            <Field label="Тип клиента" required>
              <Seg value={f.type} onChange={(v) => set('type', v)} items={[{ id: 'Компания', label: 'Компания' }, { id: 'Физлицо', label: 'Физлицо' }]} />
            </Field>
            {f.type === 'Компания' && (
              <div className="grid g2">
                <Field label="Название компании" required><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
                <Field label="УНП" hint="9 цифр"><input className="input mono" value={f.unp} onChange={(e) => set('unp', e.target.value)} /></Field>
              </div>
            )}
            <div className="grid g2">
              <Field label="ФИО руководителя" required><input className="input" value={f.director} onChange={(e) => set('director', e.target.value)} /></Field>
              <Field label="ФИО представителя компании" required><input className="input" value={f.representative} onChange={(e) => set('representative', e.target.value)} /></Field>
              <Field label="Номер телефона" required><input className="input" type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
              <Field label="Почта" required><input className="input" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
            </div>
            <Field label={f.type === 'Компания' ? 'Юридический адрес' : 'Адрес регистрации'} required><input className="input" value={f.legalAddress} onChange={(e) => set('legalAddress', e.target.value)} /></Field>
            <div className="grid g2">
              <Field label="Соцсети"><input className="input" value={f.socials} onChange={(e) => set('socials', e.target.value)} placeholder="instagram.com/…" /></Field>
              <Field label="Сайт"><div className="input-icon"><Globe /><input className="input" value={f.site} onChange={(e) => set('site', e.target.value)} placeholder="example.by" /></div></Field>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Мои объекты</h3><span className="muted" style={{ fontSize: 13 }}>для быстрого повтора заказов</span></div>
            <div className="stack-sm">
              {clientSites.map((s) => (
                <div key={s.id} className="cl-doc">
                  <div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div><div className="muted" style={{ fontSize: 12 }}>{s.address}</div></div>
                  {s.typical ? <span className="badge badge-info plain">типовой</span> : <StatusBadge status="Архив" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="stack">
          <div className="card stack" style={{ alignItems: 'center', textAlign: 'center' }}>
            <Avatar name={f.representative} size="lg" />
            <div><div style={{ fontWeight: 700 }}>{f.representative}</div><div className="muted" style={{ fontSize: 13 }}>Представитель · {f.type === 'Компания' ? f.name : 'физлицо'}</div></div>
          </div>
          <div className="card stack">
            <div className="card-head" style={{ marginBottom: 0 }}><h3>Договор с платформой</h3></div>
            {c.hasContract
              ? <div className="alert alert-ok"><CheckCircle2 /><div><b>Договор №ДА-2026/118</b><br />действует до 31.12.2026. Бронирование доступно.</div></div>
              : <>
                <div className="alert alert-warn"><FileSignature /><div>Договора нет — бронирование техники недоступно.</div></div>
                <button className="btn btn-primary" disabled={c.contractRequested} onClick={c.requestContract}>{c.contractRequested ? 'Заявка отправлена' : 'Заключить договор'}</button>
              </>}
          </div>
          <div className="card stack">
            <div className="card-head" style={{ marginBottom: 0 }}><h3>Уведомления</h3></div>
            <label className="check"><input type="checkbox" checked={notif.tg} onChange={(e) => setNotif({ ...notif, tg: e.target.checked })} />Telegram-бот: статусы заказов</label>
            <label className="check"><input type="checkbox" checked={notif.email} onChange={(e) => setNotif({ ...notif, email: e.target.checked })} />E-mail: счета и акты</label>
            <label className="check"><input type="checkbox" checked={notif.sms} onChange={(e) => setNotif({ ...notif, sms: e.target.checked })} />SMS: выезд техники на объект</label>
          </div>
        </aside>
      </div>
    </>
  )
}
