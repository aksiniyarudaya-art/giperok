import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Award, Banknote, BadgeCheck, Briefcase, CalendarDays, Camera, CheckCircle2, CircleX, FileText, GraduationCap, IdCard, LogOut, Mail, Phone, Send, ShieldAlert, TrendingUp, UserCog, Wallet } from 'lucide-react'
import { Avatar, Badge, money, Progress, Seg, Tabs, type Tone } from '../../ui'
import { bonuses, kpis, me, monthSummary, myHr, myManager, payouts, violations, type Briefing, type DriverDoc } from '../../data/driver'
import { Group, PhotoSlot, Row, Sheet, Switch } from './kit'
import { useDriver } from './store'

type Tab = 'me' | 'docs' | 'brief' | 'kpi'
const d = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('ru-RU') : '—')
const daysLeft = (iso: string) => Math.round((new Date(iso).getTime() - new Date('2026-10-13').getTime()) / 86400000)
const docTone: Record<DriverDoc['status'], Tone> = { 'Проверен': 'ok', 'На проверке': 'info', 'Истекает': 'warn', 'Просрочен': 'bad' }
const briefTone: Record<Briefing['status'], Tone> = { 'Пройден': 'ok', 'Назначен': 'info', 'Просрочен': 'bad' }

export default function Profile() {
  const loc = useLocation()
  const [tab, setTab] = useState<Tab>((loc.state as { tab?: Tab } | null)?.tab ?? 'me')
  return (
    <div className="drv-pad stack drv-pb">
      <div className="drv-segwrap">
        <Seg value={tab} onChange={setTab} items={[{ id: 'me', label: 'Профиль' }, { id: 'docs', label: 'Документы' }, { id: 'brief', label: 'Инструктажи' }, { id: 'kpi', label: 'KPI' }]} />
      </div>
      {tab === 'me' && <MeTab />}
      {tab === 'docs' && <DocsTab />}
      {tab === 'brief' && <BriefTab />}
      {tab === 'kpi' && <KpiTab />}
    </div>
  )
}

function MeTab() {
  const { toast, session } = useDriver()
  const [photo, setPhoto] = useState<string>()
  const [tg, setTg] = useState(true)
  const [push, setPush] = useState(true)
  const ref = useRef<HTMLInputElement>(null)
  const state = session.phase === 'active' ? 'На смене' : session.phase === 'done' ? 'Смена завершена' : 'Не на смене'
  return (
    <>
      <div className="drv-profile">
        <button type="button" className="drv-ava" onClick={() => ref.current?.click()} aria-label="Сменить фото">
          {photo ? <img src={photo} alt={me.name} /> : <Avatar name={me.name} size="lg" />}
          <span><Camera /></span>
        </button>
        <input ref={ref} type="file" accept="image/*" capture="user" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPhoto(URL.createObjectURL(f)); toast('Фото обновлено') } }} />
        <h2 className="drv-h2">{me.name}</h2>
        <div className="dim">{me.position} · {me.department}</div>
        <div className="row" style={{ justifyContent: 'center', gap: 6 }}>
          <Badge tone="ok">{me.status}</Badge>
          <Badge tone={session.phase === 'active' ? 'accent' : 'muted'}>{state}</Badge>
          <Badge tone="info" plain>★ {String(me.rating).replace('.', ',')}</Badge>
        </div>
      </div>
      <Group title="Контакты">
        <Row icon={<Phone />} title={me.phone} sub="Рабочий телефон" onClick={() => toast('Номер скопирован')} chevron={false} />
        <Row icon={<Mail />} title={me.email} sub="Почта" chevron={false} />
        <Row icon={<Send />} title="Telegram-бот Гиперок" sub="Подключён · @giperok_driver_bot" right={<Badge tone="ok" plain>онлайн</Badge>} chevron={false} />
      </Group>
      <Group title="Работа">
        <Row icon={<CalendarDays />} title={`С ${d(me.hiredAt)}`} sub="Дата начала работы" chevron={false} />
        <Row icon={<Briefcase />} title={me.contract} sub="Трудовой договор" chevron={false} />
        <Row icon={<UserCog />} title={myManager.name} sub="Руководитель · менеджер" chevron={false} />
        <Row icon={<IdCard />} title={me.license ?? '—'} sub="Категории" chevron={false} />
      </Group>
      <Group title="Настройки">
        <Row icon={<Send />} title="Дублировать в Telegram" right={<Switch checked={tg} onChange={setTg} label="Telegram" />} chevron={false} />
        <Row icon={<BadgeCheck />} title="Push-уведомления" right={<Switch checked={push} onChange={setPush} label="Push" />} chevron={false} />
      </Group>
      <Link to="/" className="btn btn-secondary btn-lg btn-block"><LogOut />Выйти из приложения</Link>
    </>
  )
}

function DocsTab() {
  const { docs, setDocs, toast } = useDriver()
  const [open, setOpen] = useState<DriverDoc | null>(null)
  const [scan, setScan] = useState<string>()
  const checked = docs.filter((x) => x.status === 'Проверен').length
  return (
    <>
      <div className="drv-card">
        <div className="row-between"><b>Проверено кадровиком</b><span className="tnum">{checked} из {docs.length}</span></div>
        <Progress value={(checked / docs.length) * 100} tone="ok" />
        <span className="drv-row-sub">Проверяет: {myHr.name}</span>
      </div>
      {docs.some((x) => x.status === 'Истекает') && <div className="alert alert-warn"><AlertTriangle />Медицинская справка истекает через {daysLeft('2026-11-02')} дн. Без действующей справки допуск к смене будет приостановлен.</div>}
      <Group title="Документы и допуски">
        {docs.map((x) => (
          <Row key={x.id} onClick={() => { setOpen(x); setScan(undefined) }} icon={<FileText />} tone={docTone[x.status] as 'ok' | 'warn' | 'bad' | 'info'}
            title={x.title} sub={`${x.extra ? x.extra + ' · ' : ''}до ${d(x.until)}`} right={<Badge tone={docTone[x.status]}>{x.status}</Badge>} />
        ))}
      </Group>
      {open && (
        <Sheet title={open.title} sub={open.number} onClose={() => setOpen(null)}
          footer={<button className="btn btn-primary btn-lg btn-block" disabled={!scan} onClick={() => {
            setDocs((s) => s.map((x) => (x.id === open.id ? { ...x, status: 'На проверке', checkedBy: undefined, issued: '2026-10-13', until: open.title.includes('Мед') ? '2027-10-13' : x.until } : x)))
            toast('Отправлено кадровику на проверку'); setOpen(null)
          }}>Отправить на проверку</button>}>
          <dl className="kv">
            <dt>Номер</dt><dd className="mono">{open.number}</dd>
            {open.extra && <><dt>Категории / сведения</dt><dd>{open.extra}</dd></>}
            <dt>Выдан</dt><dd>{d(open.issued)}</dd>
            <dt>Действует до</dt><dd>{d(open.until)} · {daysLeft(open.until)} дн.</dd>
            <dt>Статус проверки</dt><dd><Badge tone={docTone[open.status]}>{open.status}</Badge></dd>
            <dt>Проверил</dt><dd>{open.checkedBy ?? 'ожидает кадровика'}</dd>
          </dl>
          <div className="drv-slots two">
            <PhotoSlot label="Новая версия · лицевая" value={scan} onChange={setScan} kind="doc" />
          </div>
          <button type="button" className="drv-link-btn" onClick={() => setScan('demo:doc')}>Заполнить демо-фото</button>
        </Sheet>
      )}
    </>
  )
}

type BTab = 'req' | 'extra' | 'passed' | 'overdue'
function BriefTab() {
  const nav = useNavigate()
  const { briefings } = useDriver()
  const [tab, setTab] = useState<BTab>(briefings.some((b) => b.status === 'Просрочен') ? 'overdue' : 'req')
  const groups: Record<BTab, Briefing[]> = {
    req: briefings.filter((b) => b.kind === 'Обязательный'),
    extra: briefings.filter((b) => b.kind === 'Внеплановый'),
    passed: briefings.filter((b) => b.status === 'Пройден'),
    overdue: briefings.filter((b) => b.status === 'Просрочен'),
  }
  const toDo = briefings.filter((b) => b.status !== 'Пройден').length
  return (
    <>
      <div className="drv-tiles">
        <div><span>К прохождению</span><b className="tnum">{toDo}</b></div>
        <div><span>Пройдено</span><b className="tnum">{groups.passed.length}</b></div>
        <div><span>Просрочено</span><b className="tnum">{groups.overdue.length}</b></div>
      </div>
      <Tabs value={tab} onChange={setTab} items={[
        { id: 'req', label: 'Обязательные', count: groups.req.length }, { id: 'extra', label: 'Внеплановые', count: groups.extra.length },
        { id: 'passed', label: 'Пройденные', count: groups.passed.length }, { id: 'overdue', label: 'Просроченные', count: groups.overdue.length },
      ]} />
      <div className="drv-list">
        {groups[tab].length === 0 && <div className="drv-empty"><CheckCircle2 /><b>Всё пройдено</b></div>}
        {groups[tab].map((b) => (
          <Row key={b.id} onClick={() => nav(`/driver/briefing/${b.id}`)} icon={<GraduationCap />} tone={b.status === 'Пройден' ? 'ok' : b.status === 'Просрочен' ? 'bad' : 'info'}
            title={b.title}
            sub={b.status === 'Пройден' ? `Пройден ${d(b.passedAt)} · ${b.score} · провёл ${short(b.by)}` : `${b.kind} · до ${d(b.due)} · назначил ${short(b.by)}`}
            right={<Badge tone={briefTone[b.status]}>{b.status}</Badge>} />
        ))}
      </div>
    </>
  )
}
const short = (n: string) => { const [f, i, o] = n.split(' '); return `${f} ${i?.[0] ?? ''}.${o?.[0] ?? ''}.` }

export function BriefingRun() {
  const { id } = useParams()
  const nav = useNavigate()
  const { briefings, setBriefings, toast, setNotices } = useDriver()
  const b = briefings.find((x) => x.id === id)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState(false)
  const [agree, setAgree] = useState(false)
  if (!b) return <div className="drv-empty"><b>Инструктаж не найден</b></div>
  const allAnswered = b.quiz.every((_, i) => answers[i] !== undefined)
  const correct = b.quiz.filter((q, i) => answers[i] === q.correct).length
  const passed = checked && correct === b.quiz.length

  const confirm = () => {
    setBriefings((s) => s.map((x) => (x.id === b.id ? { ...x, status: 'Пройден', passedAt: '2026-10-13', score: `${correct}/${b.quiz.length}` } : x)))
    setNotices((s) => s.map((n) => (n.kind === 'brief' && n.to?.endsWith(b.id) ? { ...n, read: true } : n)))
    toast('Ознакомление подтверждено · механик получил отметку')
    nav('/driver/profile', { state: { tab: 'brief' }, replace: true })
  }

  return (
    <div className="drv-pad stack drv-pb">
      <div>
        <div className="row" style={{ gap: 6 }}><Badge tone={b.kind === 'Обязательный' ? 'accent' : 'info'}>{b.kind}</Badge><Badge tone={briefTone[b.status]}>{b.status}</Badge></div>
        <h2 className="drv-h2" style={{ marginTop: 10 }}>{b.title}</h2>
        <div className="dim" style={{ marginTop: 4 }}>Провёл/назначил: {b.by} · срок до {d(b.due)}</div>
      </div>
      {b.status === 'Пройден' && <div className="alert alert-ok"><CheckCircle2 />Пройден {d(b.passedAt)}, проверка знаний: {b.score}. Ниже — текст для повторения.</div>}
      {b.status === 'Просрочен' && <div className="alert alert-bad"><ShieldAlert />Срок прохождения истёк {d(b.due)}. Пройдите инструктаж — иначе допуск к смене может быть ограничен.</div>}

      <article className="drv-article">
        {b.text.map((p, i) => <p key={i}><span className="drv-article-n">{i + 1}</span>{p}</p>)}
      </article>

      <Group title={`Проверка знаний · ${b.quiz.length} вопроса`} flush>
        <div className="stack">
          {b.quiz.map((q, i) => (
            <div key={i} className="drv-quiz">
              <b>{i + 1}. {q.q}</b>
              {q.options.map((o, j) => {
                const sel = answers[i] === j
                const state = checked ? (j === q.correct && sel ? 'ok' : sel ? 'bad' : '') : sel ? 'sel' : ''
                return (
                  <button key={j} type="button" className={`drv-opt ${state}`} disabled={checked && passed} onClick={() => { setAnswers((s) => ({ ...s, [i]: j })); setChecked(false) }}>
                    <span className="drv-radio" />{o}
                    {checked && sel && (j === q.correct ? <CheckCircle2 /> : <CircleX />)}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </Group>

      {!checked || !passed ? (
        <>
          {checked && !passed && <div className="alert alert-bad"><CircleX />Верно {correct} из {b.quiz.length}. Перечитайте текст и исправьте ответы.</div>}
          <button className="btn btn-dark btn-lg btn-block" disabled={!allAnswered} onClick={() => setChecked(true)}>Проверить ответы</button>
        </>
      ) : (
        <div className="drv-card stack">
          <div className="alert alert-ok"><CheckCircle2 />Все ответы верны: {correct}/{b.quiz.length}</div>
          <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />С инструктажем ознакомлен, обязуюсь выполнять требования</label>
          <button className="btn btn-primary btn-lg btn-block" disabled={!agree || b.status === 'Пройден'} onClick={confirm}>{b.status === 'Пройден' ? 'Уже подтверждено' : 'Подтвердить ознакомление'}</button>
        </div>
      )}
    </div>
  )
}

function KpiTab() {
  const { toast } = useDriver()
  const [adv, setAdv] = useState(false)
  const fines = violations.reduce((a, v) => a + v.fine, 0)
  const bonusSum = bonuses.reduce((a, b) => a + b.amount, 0)
  return (
    <>
      <div className="drv-card drv-money">
        <span className="eyebrow">Октябрь 2026 · начислено на 13.10</span>
        <b className="tnum">{money(monthSummary.accrued)}</b>
        <div className="drv-money-row">
          <span>{monthSummary.hours} ч работы</span><span>{String(monthSummary.repairHours).replace('.', ',')} ч ремонтных</span><span>{monthSummary.shifts} смен</span>
        </div>
      </div>
      <Group title="KPI месяца" flush>
        <div className="drv-card stack">
          {kpis.map((k) => {
            const pct = k.unit === '%' ? k.value : (k.value / 5) * 100
            const ok = k.value >= k.target
            return (
              <div key={k.id} className="stack-sm">
                <div className="row-between"><span>{k.label}</span><b className="tnum">{String(k.value).replace('.', ',')}{k.unit} <small className="muted">/ цель {String(k.target).replace('.', ',')}{k.unit}</small></b></div>
                <Progress value={pct} tone={ok ? 'ok' : 'bad'} />
              </div>
            )
          })}
        </div>
      </Group>
      <Group title="Нарушения эксплуатации и штрафы" action={<span className="drv-time">−{money(fines)}</span>}>
        {violations.map((v) => (
          <Row key={v.id} icon={<ShieldAlert />} tone={v.fine ? 'bad' : 'warn'} title={v.text} sub={`${d(v.date)} · ${short(v.by)}`} right={<span className={`tnum ${v.fine ? 'drv-neg' : 'muted'}`}>{v.fine ? `−${v.fine}` : v.status}</span>} chevron={false} />
        ))}
      </Group>
      <Group title="Бонусы" action={<span className="drv-time">+{money(bonusSum)}</span>}>
        {bonuses.map((b) => <Row key={b.id} icon={<Award />} tone="ok" title={b.text} sub={d(b.date)} right={<span className="tnum drv-pos">+{b.amount}</span>} chevron={false} />)}
      </Group>
      <Group title="Аванс и выплаты">
        {payouts.map((p) => (
          <Row key={p.id} icon={p.kind === 'Аванс' ? <Wallet /> : <Banknote />} tone={p.status === 'Выплачено' ? undefined : 'accent'}
            title={`${p.kind} · ${p.period}`} sub={`${d(p.date)} · ${p.status}`} right={<b className="tnum">{money(p.amount)}</b>} chevron={false} />
        ))}
      </Group>
      <button className="btn btn-secondary btn-lg btn-block" disabled={adv} onClick={() => { setAdv(true); toast('Запрос на досрочный аванс отправлен менеджеру') }}>
        <TrendingUp />{adv ? 'Запрос отправлен' : 'Запросить аванс досрочно'}
      </button>
    </>
  )
}
