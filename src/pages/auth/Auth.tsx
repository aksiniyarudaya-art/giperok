import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Briefcase, Building2, HardHat, Shield, Smartphone, Truck, UserCog, Users, Wrench } from 'lucide-react'
import { Logo } from '../../layouts/Logo'
import { Field, Modal, Seg, useToast } from '../../ui'
import './auth.css'

function AuthFrame({ children, aside }: { children: React.ReactNode; aside: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-main">
        <div className="auth-top"><Logo /><Link to="/" className="btn btn-ghost btn-sm">На главную</Link></div>
        <div className="auth-body">{children}</div>
      </div>
      <aside className="auth-aside">{aside}</aside>
    </div>
  )
}

const demo = [
  { to: '/client/dashboard', t: 'Клиент (арендатор)', d: 'ООО «СтройМонолит»: каталог, заказы, карта', i: <Truck /> },
  { to: '/partner/dashboard', t: 'Партнёр (арендодатель)', d: 'ООО «ТехноПарк Аренда»: парк, заказы, выплаты', i: <Building2 /> },
  { to: '/crm/manager/dashboard', t: 'CRM · Менеджер', d: 'Сделки, колл-центр, техника, финансы', i: <Briefcase /> },
  { to: '/crm/mechanic/dashboard', t: 'CRM · Механик', d: 'ТО, ремонты, инструктажи', i: <Wrench /> },
  { to: '/crm/hr/dashboard', t: 'CRM · Кадровик', d: 'Приём, допуски, KPI', i: <Users /> },
  { to: '/crm/admin/dashboard', t: 'CRM · Администратор', d: 'Полный доступ ко всем разделам', i: <Shield /> },
  { to: '/driver', t: 'Приложение водителя', d: 'Смена, путевой лист, заявки', i: <Smartphone /> },
]

export function Login() {
  const nav = useNavigate()
  const [mode, setMode] = useState<'phone' | 'email'>('phone')
  return (
    <AuthFrame aside={
      <div className="stack" style={{ gap: 14 }}>
        <div className="eyebrow" style={{ color: 'var(--accent)' }}>Демо-доступ</div>
        <h2 style={{ color: 'var(--ink-fg)' }}>Войдите в любую роль</h2>
        <p style={{ color: 'var(--ink-fg-2)' }}>Все данные в демо-версии примерные. Действия сохраняются только до перезагрузки страницы.</p>
        <div className="auth-demo">
          {demo.map((d) => (
            <Link key={d.to} to={d.to}><span className="auth-demo-i">{d.i}</span><span className="grow"><b>{d.t}</b><small>{d.d}</small></span></Link>
          ))}
        </div>
      </div>
    }>
      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); nav('/client/dashboard') }}>
        <h1>Вход</h1>
        <Seg items={[{ id: 'phone', label: 'По телефону' }, { id: 'email', label: 'По почте' }]} value={mode} onChange={setMode} />
        {mode === 'phone'
          ? <Field label="Номер телефона"><input id="login-phone" className="input" type="tel" defaultValue="+375 29 611-24-80" /></Field>
          : <Field label="Электронная почта"><input id="login-email" className="input" type="email" defaultValue="zakaz@stroymonolit.by" /></Field>}
        <Field label="Пароль"><input id="login-pass" className="input" type="password" defaultValue="demo-password" /></Field>
        <button className="btn btn-primary btn-lg btn-block">Войти</button>
        <p className="muted" style={{ fontSize: 14 }}>Нет аккаунта? <Link to="/register?role=client">Регистрация заказчика</Link> или <Link to="/register?role=partner">владельца техники</Link></p>
      </form>
    </AuthFrame>
  )
}

export function Register() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const toast = useToast()
  const [role, setRole] = useState<'client' | 'partner'>(sp.get('role') === 'partner' ? 'partner' : 'client')
  const [type, setType] = useState<'company' | 'person'>('company')
  const [policy, setPolicy] = useState(false)
  return (
    <AuthFrame aside={
      <div className="stack" style={{ gap: 18 }}>
        <div className="eyebrow" style={{ color: 'var(--accent)' }}>{role === 'client' ? 'Для заказчиков' : 'Для владельцев техники'}</div>
        <h2 style={{ color: 'var(--ink-fg)' }}>{role === 'client' ? 'Заказ спецтехники в 3 клика с гарантией выхода на объект' : 'Управляй своей техникой и получай заказы без диспетчера'}</h2>
        <ul className="auth-list">
          {(role === 'client'
            ? ['Каталог с фильтрами по грузоподъёмности, стреле и ковшу', 'Карта свободных машин рядом с объектом', 'Онлайн-договор, счета и акты с ЭЦП', 'Повтор заказа для типовых объектов в один клик']
            : ['Заказы приходят без диспетчера', 'Загрузка и доходность каждой машины', 'Водители работают в мобильном приложении', 'Выплаты и документы в одном разделе']
          ).map((x) => <li key={x}>{x}</li>)}
        </ul>
        <div className="auth-icons">{role === 'client' ? <HardHat /> : <UserCog />}</div>
      </div>
    }>
      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); toast('Аккаунт создан, код подтверждения отправлен на телефон'); nav(role === 'client' ? '/client/dashboard' : '/partner/dashboard') }}>
        <h1>Регистрация</h1>
        <div className="auth-roles">
          <button type="button" className={role === 'client' ? 'on' : ''} onClick={() => setRole('client')}><Truck /><b>Арендую технику</b><small>Заказчик</small></button>
          <button type="button" className={role === 'partner' ? 'on' : ''} onClick={() => setRole('partner')}><Building2 /><b>Сдаю технику</b><small>Арендодатель</small></button>
        </div>
        <Seg items={[{ id: 'company', label: 'Компания' }, { id: 'person', label: 'Физическое лицо' }]} value={type} onChange={setType} />
        {type === 'company' && <Field label="Название компании" required><input id="reg-company" className="input" required placeholder="ООО «Название»" /></Field>}
        <div className="grid g2" style={{ gap: 14 }}>
          <Field label="ФИО руководителя" required><input id="reg-director" className="input" required placeholder="Фамилия Имя Отчество" /></Field>
          <Field label="ФИО представителя компании" required><input id="reg-rep" className="input" required placeholder="Кто будет работать в кабинете" /></Field>
          <Field label="Номер телефона" required><input id="reg-phone" className="input" type="tel" required placeholder="+375 (__) ___-__-__" /></Field>
          <Field label="Почта" required><input id="reg-email" className="input" type="email" required placeholder="name@company.by" /></Field>
        </div>
        {role === 'client' && <Field label="Юридический адрес" required={type === 'company'}><input id="reg-address" className="input" required={type === 'company'} placeholder="г. Минск, ул. ..., д. ..." /></Field>}
        <div className="grid g2" style={{ gap: 14 }}>
          <Field label="Соцсети"><input id="reg-social" className="input" placeholder="instagram.com/..." /></Field>
          <Field label="Сайт"><input id="reg-site" className="input" placeholder="company.by" /></Field>
        </div>
        <label className="check"><input id="reg-consent" type="checkbox" required />Даю согласие на <button type="button" className="auth-link" onClick={() => setPolicy(true)}>обработку персональных данных</button></label>
        <button className="btn btn-primary btn-lg btn-block">Создать аккаунт</button>
        <p className="muted" style={{ fontSize: 14 }}>Уже зарегистрированы? <Link to="/login">Войти</Link></p>
      </form>
      {policy && (
        <Modal title="Согласие на обработку персональных данных" onClose={() => setPolicy(false)} footer={<button className="btn btn-primary" onClick={() => setPolicy(false)}>Понятно</button>}>
          <p>Регистрируясь, вы даёте ООО «Гиперок» согласие на обработку указанных данных для заключения и исполнения договоров аренды и работы в личном кабинете, в соответствии с Законом РБ № 99-З «О защите персональных данных». Отозвать согласие можно письмом на privacy@giperok.by.</p>
        </Modal>
      )}
    </AuthFrame>
  )
}
