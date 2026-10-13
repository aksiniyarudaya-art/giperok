import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, BadgeCheck, Building2, CalendarClock, ChevronDown, Clock3, FileCheck2, Gauge, Heart, MapPin, Phone, Search,
  ShieldCheck, Smartphone, Star, Truck, Wallet,
} from 'lucide-react'
import { Logo } from '../../layouts/Logo'
import { EquipmentArt, Modal, money, useToast } from '../../ui'
import { equipment, regions } from '../../data/mock'
import { categoryLabels, categoryOne, type EquipmentCategory } from '../../data/types'
import './landing.css'

type Audience = 'tenant' | 'owner'

function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="l-header">
      <div className="l-wrap l-header-in">
        <Logo />
        <nav className="l-nav hide-mobile">
          <a href="#catalog">Каталог</a>
          <a href="#how">Как это работает</a>
          <a href="#owners">Владельцам техники</a>
          <a href="#contacts">Контакты</a>
        </nav>
        <div className="row" style={{ gap: 8 }}>
          <Link to="/login" className="btn btn-ghost btn-sm">Войти</Link>
          <div className="l-reg">
            <button className="btn btn-dark btn-sm" onClick={() => setOpen(!open)} aria-expanded={open}>Регистрация <ChevronDown size={16} /></button>
            {open && (
              <div className="l-reg-menu" onMouseLeave={() => setOpen(false)}>
                <Link to="/register?role=client"><Truck size={18} /><span><b>Арендую технику</b><small>Для застройщиков, подрядчиков и частных лиц</small></span></Link>
                <Link to="/register?role=partner"><Building2 size={18} /><span><b>Сдаю технику</b><small>Для владельцев парков и частных машин</small></span></Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

const copy: Record<Audience, { h: string; p: string; cta: string; to: string }> = {
  tenant: {
    h: 'Заказ спецтехники в 3 клика с гарантией выхода на объект',
    p: 'Экскаваторы, краны, самосвалы и погрузчики по всей Беларуси. Цена смены видна сразу, договор и документы подписываются онлайн, а если машина не вышла, мы заменим её за 2 часа.',
    cta: 'Подобрать технику', to: '/client/catalog',
  },
  owner: {
    h: 'Управляй своей техникой и получай заказы без диспетчера',
    p: 'Добавьте машины в каталог, а заказы, документы и оплату платформа возьмёт на себя. Вы видите загрузку парка, выручку по каждой единице и работу водителей в одном кабинете.',
    cta: 'Добавить технику', to: '/register?role=partner',
  },
}

function Hero({ aud, setAud }: { aud: Audience; setAud: (a: Audience) => void }) {
  const nav = useNavigate()
  const [cat, setCat] = useState<EquipmentCategory | ''>('')
  const [city, setCity] = useState('Минск')
  const c = copy[aud]
  const free = equipment.filter((e) => e.status === 'Свободна').slice(0, 3)
  return (
    <section className="l-hero">
      <div className="l-wrap l-hero-in">
        <div className="l-hero-text">
          <div className="l-aud" role="tablist" aria-label="Для кого">
            <button role="tab" aria-selected={aud === 'tenant'} className={aud === 'tenant' ? 'on' : ''} onClick={() => setAud('tenant')}>Арендую технику</button>
            <button role="tab" aria-selected={aud === 'owner'} className={aud === 'owner' ? 'on' : ''} onClick={() => setAud('owner')}>Сдаю технику</button>
          </div>
          <h1 key={aud} className="l-h1">{c.h}</h1>
          <p className="l-sub">{c.p}</p>
          {aud === 'tenant' ? (
            <form className="l-search" onSubmit={(e) => { e.preventDefault(); nav('/client/catalog') }}>
              <label className="l-search-f">
                <span>Техника</span>
                <select id="hero-cat" value={cat} onChange={(e) => setCat(e.target.value as EquipmentCategory)}>
                  <option value="">Любая</option>
                  {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="l-search-f">
                <span>Город</span>
                <select id="hero-city" value={city} onChange={(e) => setCity(e.target.value)}>
                  {Object.values(regions).flat().map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="l-search-f">
                <span>Дата</span>
                <input id="hero-date" type="date" defaultValue="2026-10-14" />
              </label>
              <button className="btn btn-primary btn-lg"><Search />Найти</button>
            </form>
          ) : (
            <div className="row">
              <Link to={c.to} className="btn btn-primary btn-lg">{c.cta}<ArrowRight /></Link>
              <a href="#owner-lead" className="btn btn-secondary btn-lg">Рассчитать доход</a>
            </div>
          )}
          <div className="l-trust">
            <span><ShieldCheck size={16} />Замена за 2 часа или компенсация</span>
            <span><FileCheck2 size={16} />Договор и акты с ЭЦП</span>
            <span><Wallet size={16} />Оплата по факту часов</span>
          </div>
        </div>

        <div className="l-board" aria-label="Свободная техника рядом">
          <div className="l-board-head">
            <span className="l-live"><i />Свободны сейчас · {city}</span>
            <span className="mono muted">13.10 · 07:12</span>
          </div>
          {free.map((e, i) => (
            <Link key={e.id} to={`/client/catalog/${e.id}`} className="l-ticket" style={{ animationDelay: `${i * 90}ms` }}>
              <div className="l-ticket-art"><EquipmentArt category={e.category} /></div>
              <div className="grow">
                <div className="l-ticket-cat">{categoryOne[e.category]}</div>
                <div className="l-ticket-title">{e.title}</div>
                <div className="l-ticket-meta">
                  <span className="mono">{e.plate}</span>
                  {e.bucket && <span>ковш {e.bucket} м³</span>}
                  {e.boom && <span>стрела {e.boom} м</span>}
                  {e.capacity && !e.bucket && <span>{e.capacity} т</span>}
                </div>
              </div>
              <div className="l-ticket-price"><small>смена от</small><b>{money(e.pricePerShift)}</b></div>
            </Link>
          ))}
          <div className="l-board-foot">
            <BadgeCheck size={18} />
            <span>Выход на объект <b>ЖК «Сокол»</b> в 07:30 подтверждён водителем</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Numbers() {
  const items: [string, string][] = [
    ['640+', 'единиц техники в каталоге'],
    ['98,6%', 'выходов на объект в срок'],
    ['2 часа', 'максимальное время замены'],
    ['6 областей', 'Беларуси, от Бреста до Витебска'],
  ]
  return (
    <section className="l-numbers">
      <div className="l-wrap l-numbers-in">
        {items.map(([v, k]) => <div key={k}><b>{v}</b><span>{k}</span></div>)}
      </div>
    </section>
  )
}

function Catalog() {
  const [cat, setCat] = useState<EquipmentCategory | 'all'>('all')
  const [q, setQ] = useState('')
  const [onlyFree, setOnlyFree] = useState(false)
  const [maxPrice, setMaxPrice] = useState(300)
  const [fav, setFav] = useState<string[]>([])
  const list = useMemo(() => equipment
    .filter((e) => cat === 'all' || e.category === cat)
    .filter((e) => !onlyFree || e.status === 'Свободна')
    .filter((e) => e.pricePerHour <= maxPrice)
    .filter((e) => (e.title + e.city).toLowerCase().includes(q.toLowerCase()))
    .slice(0, 6), [cat, q, onlyFree, maxPrice])
  return (
    <section className="l-section" id="catalog">
      <div className="l-wrap">
        <div className="l-sec-head">
          <div><div className="eyebrow">Каталог</div><h2>Техника с понятной ценой смены</h2></div>
          <Link to="/client/catalog" className="btn btn-secondary">Весь каталог<ArrowRight /></Link>
        </div>
        <div className="l-cats">
          <button className={cat === 'all' ? 'on' : ''} onClick={() => setCat('all')}>Вся техника</button>
          {(Object.keys(categoryLabels) as EquipmentCategory[]).map((k) => (
            <button key={k} className={cat === k ? 'on' : ''} onClick={() => setCat(k)}>{categoryLabels[k]}</button>
          ))}
        </div>
        <div className="l-filters">
          <div className="input-icon grow"><Search /><input id="cat-q" className="input" placeholder="Марка, модель или город" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <label className="l-range">
            <span>Цена до <b className="tnum">{maxPrice} BYN/ч</b></span>
            <input id="cat-price" className="range" type="range" min={60} max={300} step={10} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} />
          </label>
          <label className="check"><input id="cat-free" type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} />Только свободная сейчас</label>
        </div>
        <div className="l-grid">
          {list.map((e) => (
            <article key={e.id} className="l-card">
              <div className="l-card-img">
                <EquipmentArt category={e.category} label={e.title} />
                <button className={`l-fav ${fav.includes(e.id) ? 'on' : ''}`} aria-label="В избранное" onClick={() => setFav((f) => f.includes(e.id) ? f.filter((x) => x !== e.id) : [...f, e.id])}><Heart size={18} /></button>
                {e.status !== 'Свободна' && <span className="l-card-flag">Доступна с {e.availableFrom ? new Date(e.availableFrom).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '20 октября'}</span>}
              </div>
              <div className="l-card-body">
                <div className="row-between"><span className="eyebrow">{categoryOne[e.category]}</span><span className="l-rating"><Star size={14} />{e.rating}<small>({e.reviews})</small></span></div>
                <h3>{e.title}</h3>
                <p className="muted l-card-desc">{e.short}</p>
                <div className="l-specs">
                  {e.capacity !== undefined && <span><Gauge size={14} />{e.capacity} т</span>}
                  {e.boom !== undefined && <span>стрела {e.boom} м</span>}
                  {e.bucket !== undefined && <span>ковш {e.bucket} м³</span>}
                  <span><Clock3 size={14} />от {e.minHours} ч</span>
                </div>
                <div className="l-addr"><MapPin size={14} />{e.address}</div>
                <div className="row-between l-card-foot">
                  <div><small className="muted">от</small> <b className="l-price">{e.pricePerHour} BYN</b><small className="muted">/час</small></div>
                  <Link to={`/client/catalog/${e.id}`} className={`btn btn-sm ${e.status === 'Свободна' ? 'btn-primary' : 'btn-secondary'}`}>{e.status === 'Свободна' ? 'Забронировать' : 'Подробнее'}</Link>
                </div>
              </div>
            </article>
          ))}
          {!list.length && <div className="empty" style={{ gridColumn: '1/-1' }}>По этим фильтрам техники нет. Попробуйте поднять цену или выбрать другую категорию.</div>}
        </div>
      </div>
    </section>
  )
}

function How() {
  const steps = [
    { t: 'Выберите технику', d: 'Фильтры по грузоподъёмности, вылету стрелы и объёму ковша. Цена смены, доставки и переработки считается сразу.', i: <Search /> },
    { t: 'Укажите объект и время', d: 'Адрес площадки, дата и время подачи. Мы проверим подъезд, ограничения и закрепим машиниста с допуском.', i: <CalendarClock /> },
    { t: 'Подтвердите бронь', d: 'Договор подписывается онлайн один раз. Водитель подтверждает выход, а вы видите статус в кабинете.', i: <BadgeCheck /> },
  ]
  return (
    <section className="l-section l-how" id="how">
      <div className="l-wrap">
        <div className="l-sec-head"><div><div className="eyebrow">Как это работает</div><h2>Три клика от заявки до техники на площадке</h2></div></div>
        <ol className="l-steps">
          {steps.map((s, i) => (
            <li key={s.t}>
              <div className="l-step-n">{i + 1}</div>
              <div className="l-step-i">{s.i}</div>
              <h3>{s.t}</h3>
              <p className="muted">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="l-guarantee">
          <ShieldCheck size={36} />
          <div className="grow">
            <h3>Гарантия выхода на объект</h3>
            <p>Каждый выход подтверждается машинистом в приложении с гео-меткой и фото техники. Если машина не приехала к согласованному времени, мы бесплатно подаём замену в течение 2 часов или компенсируем смену.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Owners() {
  const perks = [
    { t: 'Заказы без диспетчера', d: 'Заявки приходят в кабинет, вы принимаете их одной кнопкой.', i: <Truck /> },
    { t: 'Загрузка парка в процентах', d: 'Видно, какая машина простаивает, а какая приносит больше всего.', i: <Gauge /> },
    { t: 'Водители в приложении', d: 'Смены, путевые листы, фото техники и заправки без звонков.', i: <Smartphone /> },
    { t: 'Деньги по графику', d: 'Сделки, долги и остаток к выплате с закрывающими документами.', i: <Wallet /> },
  ]
  return (
    <section className="l-section l-owners" id="owners">
      <div className="l-wrap l-owners-in">
        <div className="stack" style={{ gap: 20 }}>
          <div className="eyebrow" style={{ color: 'var(--accent)' }}>Владельцам техники</div>
          <h2 style={{ color: 'var(--ink-fg)' }}>Управляй своей техникой и получай заказы без диспетчера</h2>
          <div className="l-perks">
            {perks.map((p) => <div key={p.t}><span>{p.i}</span><b>{p.t}</b><p>{p.d}</p></div>)}
          </div>
          <div className="row"><Link to="/register?role=partner" className="btn btn-primary btn-lg">Стать партнёром<ArrowRight /></Link><Link to="/partner/dashboard" className="btn btn-ghost btn-lg" style={{ color: 'var(--ink-fg)' }}>Посмотреть кабинет</Link></div>
        </div>
        <div className="l-mini-dash" aria-label="Пример кабинета партнёра">
          <div className="row-between"><b>Загрузка парка · октябрь</b><span className="badge badge-ok">+12%</span></div>
          {[['JCB JS220LC', 92], ['Ивановец КС-45717-1', 78], ['МАЗ 6501C9', 64], ['Bobcat S650', 31]].map(([n, v]) => (
            <div key={n as string} className="l-load">
              <div className="row-between"><span>{n}</span><b className="tnum">{v}%</b></div>
              <div className="bar"><span style={{ width: `${v}%`, background: (v as number) < 40 ? 'var(--bad)' : 'var(--accent)' }} /></div>
            </div>
          ))}
          <div className="l-mini-row"><span>К выплате 20.10</span><b className="tnum">18 640 BYN</b></div>
        </div>
      </div>
    </section>
  )
}

function Leads({ onConsent }: { onConsent: () => void }) {
  const toast = useToast()
  const [units, setUnits] = useState(3)
  const [kind, setKind] = useState<EquipmentCategory>('excavator')
  const avg = Math.round(equipment.filter((e) => e.category === kind).reduce((a, e) => a + e.pricePerHour, 0) / Math.max(1, equipment.filter((e) => e.category === kind).length))
  const income = Math.round(avg * 8 * 19 * units * 0.82)
  return (
    <section className="l-section" id="leads">
      <div className="l-wrap l-leads">
        <form className="l-lead l-lead-client" onSubmit={(e) => { e.preventDefault(); toast('Чек-лист и промокод отправлены на почту') }}>
          <div className="eyebrow">Для заказчиков</div>
          <h3>Чек-лист «Площадка готова к технике» и −10% на первую смену</h3>
          <p className="muted">14 пунктов, которые проверяет прораб перед приездом крана или экскаватора: подъезд, грунт, ЛЭП, пропуска. Промокод придёт вместе с файлом.</p>
          <div className="l-lead-form">
            <input id="lead-c-email" className="input" type="email" required placeholder="Рабочая почта" />
            <button className="btn btn-dark">Получить</button>
          </div>
          <label className="check"><input id="lead-c-consent" type="checkbox" required />Согласен на <button type="button" className="l-link" onClick={onConsent}>обработку персональных данных</button></label>
        </form>
        <form className="l-lead l-lead-owner" id="owner-lead" onSubmit={(e) => { e.preventDefault(); toast('Расчёт доходности отправлен, менеджер свяжется в течение часа') }}>
          <div className="eyebrow">Для владельцев техники</div>
          <h3>Сколько ваша техника заработает на платформе</h3>
          <div className="g2 grid" style={{ gap: 12 }}>
            <label className="field"><span className="label">Тип техники</span>
              <select id="lead-o-kind" className="select" value={kind} onChange={(e) => setKind(e.target.value as EquipmentCategory)}>
                {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="field"><span className="label">Количество единиц</span>
              <input id="lead-o-units" className="input" type="number" min={1} max={200} value={units} onChange={(e) => setUnits(Math.max(1, +e.target.value))} />
            </label>
          </div>
          <div className="l-income"><span>Ориентировочный доход в месяц</span><b className="tnum">{money(income)}</b><small>19 смен по 8 часов, средняя ставка {avg} BYN/ч, за вычетом комиссии</small></div>
          <div className="l-lead-form">
            <input id="lead-o-phone" className="input" type="tel" required placeholder="+375 (__) ___-__-__" />
            <button className="btn btn-primary">Получить расчёт</button>
          </div>
          <label className="check"><input id="lead-o-consent" type="checkbox" required />Согласен на <button type="button" className="l-link" onClick={onConsent}>обработку персональных данных</button></label>
        </form>
      </div>
    </section>
  )
}

function Feedback({ onConsent }: { onConsent: () => void }) {
  const toast = useToast()
  const [sent, setSent] = useState(false)
  return (
    <section className="l-section" id="contacts">
      <div className="l-wrap l-feedback">
        <div className="stack">
          <div className="eyebrow">Обратная связь</div>
          <h2>Не нашли нужную технику? Подберём за 15 минут</h2>
          <p className="muted" style={{ maxWidth: 460 }}>Опишите задачу: что нужно сделать, где и когда. Менеджер перезвонит, предложит варианты и посчитает смету.</p>
          <div className="l-contacts">
            <div><Phone size={18} /><span><b className="tnum">+375 17 388-00-00</b><small>ежедневно 07:00–22:00</small></span></div>
            <div><MapPin size={18} /><span><b>Минск, ул. Олешева, 9</b><small>офис и диспетчерская</small></span></div>
          </div>
        </div>
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); setSent(true); toast('Заявка принята, перезвоним в течение 15 минут') }}>
          {sent ? (
            <div className="empty"><BadgeCheck /><b style={{ color: 'var(--fg)' }}>Заявка принята</b><span>Менеджер перезвонит в течение 15 минут.</span><button type="button" className="btn btn-secondary btn-sm" onClick={() => setSent(false)}>Отправить ещё</button></div>
          ) : (
            <>
              <div className="grid g2" style={{ gap: 12 }}>
                <label className="field"><span className="label req">Имя</span><input id="fb-name" className="input" required placeholder="Как к вам обращаться" /></label>
                <label className="field"><span className="label req">Телефон</span><input id="fb-phone" className="input" type="tel" required placeholder="+375 (__) ___-__-__" /></label>
              </div>
              <label className="field"><span className="label">Задача</span><textarea id="fb-text" className="textarea" placeholder="Например: котлован 12×18 м, глубина 3 м, Минск, Брилевская, с 20 октября" /></label>
              <label className="check"><input id="fb-consent" type="checkbox" required />Даю согласие на <button type="button" className="l-link" onClick={onConsent}>обработку персональных данных</button> в соответствии с Законом РБ № 99-З</label>
              <button className="btn btn-primary btn-lg">Отправить заявку</button>
            </>
          )}
        </form>
      </div>
    </section>
  )
}

function Footer({ onConsent }: { onConsent: () => void }) {
  return (
    <footer className="l-footer">
      <div className="l-wrap l-footer-in">
        <div className="stack" style={{ gap: 12 }}>
          <Logo inverted />
          <p style={{ maxWidth: 300 }}>Платформа аренды спецтехники с гарантией выхода на объект.</p>
        </div>
        <div className="l-fcol"><b>Заказчикам</b><Link to="/client/catalog">Каталог техники</Link><Link to="/client/map">Карта свободных машин</Link><Link to="/client/calculator">Калькулятор смены</Link><Link to="/register?role=client">Регистрация</Link></div>
        <div className="l-fcol"><b>Владельцам</b><Link to="/register?role=partner">Стать партнёром</Link><Link to="/partner/learning">Обучение</Link><Link to="/driver">Приложение водителя</Link></div>
        <div className="l-fcol"><b>Компания</b><Link to="/crm/manager/dashboard">Вход для сотрудников</Link><button className="l-link" onClick={onConsent}>Политика обработки персональных данных</button><span>ООО «СпецХаб», УНП 193000001</span></div>
      </div>
      <div className="l-wrap l-copy">© 2026 СпецХаб. Минск, ул. Олешева, 9 · +375 17 388-00-00</div>
    </footer>
  )
}

export default function Landing() {
  const [aud, setAud] = useState<Audience>('tenant')
  const [consent, setConsent] = useState(false)
  const show = () => setConsent(true)
  return (
    <div className="landing">
      <Header />
      <Hero aud={aud} setAud={setAud} />
      <Numbers />
      <Catalog />
      <How />
      <Owners />
      <Leads onConsent={show} />
      <Feedback onConsent={show} />
      <Footer onConsent={show} />
      {consent && (
        <Modal title="Согласие на обработку персональных данных" onClose={() => setConsent(false)} footer={<button className="btn btn-primary" onClick={() => setConsent(false)}>Понятно</button>}>
          <p>Отправляя форму, вы даёте ООО «СпецХаб» (УНП 193000001) согласие на обработку персональных данных: имени, телефона, адреса электронной почты и сведений о компании.</p>
          <p>Цель обработки: подбор техники, заключение и исполнение договора аренды, информирование о статусе заказа. Срок действия согласия: 3 года или до его отзыва.</p>
          <p>Вы можете отозвать согласие, написав на privacy@spechub.by. Обработка ведётся в соответствии с Законом Республики Беларусь от 07.05.2021 № 99-З «О защите персональных данных».</p>
        </Modal>
      )}
    </div>
  )
}
