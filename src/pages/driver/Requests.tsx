import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, Archive, CalendarOff, Check, CircleStop, Fuel, Hammer, Info, Mic, Pencil, Play, Plus, Sparkles, Thermometer, Trash2, TreePalm, Undo2, Wrench } from 'lucide-react'
import { Field, StatusBadge, Tabs } from '../../ui'
import { assignments, myEq, myManager, myMechanic, reqTypes, todayShift, type DriverRequest, type ReqStatus, type ReqType } from '../../data/driver'
import { eq } from '../../data/mock'
import { Layer, MediaPicker, PhotoSlot, Sheet } from './kit'
import { nowIso, reqBucket, useDriver, type ReqTab } from './store'

export const typeIcon: Record<ReqType, React.ReactNode> = {
  'ТО': <Wrench />, 'Ремонт': <Hammer />, 'Заправка': <Fuel />, 'Факт заправки': <Fuel />, 'Больничный': <Thermometer />, 'Отпуск': <TreePalm />, 'Выходной': <CalendarOff />,
}
const typeTitle: Record<ReqType, string> = {
  'ТО': 'Заявка на ТО', 'Ремонт': 'Заявка на ремонт', 'Заправка': 'Нужна заправка', 'Факт заправки': 'Факт заправки', 'Больничный': 'Больничный', 'Отпуск': 'Отпуск', 'Выходной': 'Выходной',
}
const fmt = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const fmtD = (iso?: string) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '')
const isLeave = (t: ReqType) => t === 'Больничный' || t === 'Отпуск' || t === 'Выходной'

/** Путь статусов для визуальной шкалы. */
const flow = (r: DriverRequest): string[] => {
  if (r.type === 'ТО') return ['Отправлена', 'Принята', 'В работе', 'Решение']
  if (r.type === 'Ремонт') return ['Отправлена', 'Принята', r.status === 'Отправлена' || r.status === 'Принята' ? 'Ремонт' : (['Ожидание запчастей', 'Ремонт силами водителя', 'Выезд сервиса'].includes(r.status) ? r.status : 'Ремонт'), 'Выполнена']
  if (r.type === 'Факт заправки') return ['Отправлена', 'Выполнена']
  if (r.type === 'Заправка') return ['Отправлена', 'Принята', 'Выполнена']
  return ['Отправлена', 'Принята', 'Решение']
}
/** Демо: следующий шаг обработки заявки механиком/менеджером. */
const advance = (r: DriverRequest): { status: ReqStatus; by: string; decision?: string; repairHours?: number } | null => {
  const mech = r.type === 'ТО' || r.type === 'Ремонт'
  const by = mech ? myMechanic.name : myManager.name
  const s = r.status
  if (r.type === 'Ремонт') {
    if (s === 'Отправлена') return { status: 'Принята', by }
    if (s === 'Принята') return { status: 'Выезд сервиса', by }
    if (s === 'Ожидание запчастей') return { status: 'Ремонт силами водителя', by }
    if (s === 'Выезд сервиса' || s === 'Ремонт силами водителя' || s === 'В работе') return { status: 'Выполнена', by, repairHours: r.repairHours ?? 1.5, decision: 'Неисправность устранена. Время простоя отмечено в табеле как «Ремонтные» (не для счёта клиенту, оплачивается в ЗП).' }
    return null
  }
  if (r.type === 'ТО') {
    if (s === 'Отправлена') return { status: 'Принята', by }
    if (s === 'Принята') return { status: 'В работе', by }
    if (s === 'В работе') return { status: 'Решение', by, decision: 'Подтянуты соединения, течь устранена. Работа разрешена, контроль уровня масла каждые 4 м/ч.' }
    return null
  }
  if (r.type === 'Факт заправки') return s === 'Отправлена' ? { status: 'Выполнена', by, decision: 'Сверено с топливной картой и моточасами — расхождений нет.' } : null
  if (r.type === 'Заправка') {
    if (s === 'Отправлена') return { status: 'Принята', by }
    if (s === 'Принята') return { status: 'Выполнена', by, decision: `Топливозаправщик прибудет на ${todayShift.site.name} к 12:30.` }
    return null
  }
  if (s === 'Отправлена') return { status: 'Принята', by }
  if (s === 'Принята') return { status: 'Решение', by, decision: r.type === 'Больничный' ? 'Учтено в табеле. Замена на смены назначена.' : 'Согласовано. Замена на смены назначена менеджером.' }
  return null
}

export default function Requests() {
  const loc = useLocation()
  const nav = useNavigate()
  const { requests } = useDriver()
  const [tab, setTab] = useState<ReqTab>('new')
  const [picker, setPicker] = useState(false)
  const [form, setForm] = useState<{ type: ReqType; edit?: DriverRequest } | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const open = requests.find((r) => r.id === openId)

  // Быстрые действия с главной/карточки техники: сразу открыть форму нужного типа.
  useEffect(() => {
    const st = loc.state as { create?: ReqType } | null
    if (st?.create) { setForm({ type: st.create }); nav('.', { replace: true, state: null }) }
  }, [loc.state, nav])

  const count = (t: ReqTab) => requests.filter((r) => reqBucket(r) === t).length
  const list = requests.filter((r) => reqBucket(r) === tab)

  return (
    <div className="stack drv-pb">
      <div className="drv-tabs-sticky">
        <Tabs value={tab} onChange={setTab} items={[
          { id: 'new', label: 'Новые', count: count('new') }, { id: 'work', label: 'В работе', count: count('work') },
          { id: 'done', label: 'Завершённые', count: count('done') }, { id: 'cancel', label: 'Отменённые', count: count('cancel') },
          { id: 'archive', label: 'Архив', count: count('archive') },
        ]} />
      </div>
      <div className="drv-pad stack">
        {list.length === 0 && (
          <div className="drv-empty"><Sparkles /><b>Здесь пусто</b><span>Создайте заявку на ТО, ремонт, заправку, больничный, отпуск или выходной.</span></div>
        )}
        {list.map((r) => (
          <button key={r.id} type="button" className="drv-req" onClick={() => setOpenId(r.id)}>
            <span className={`drv-row-ic t-${r.type === 'Ремонт' ? 'bad' : r.type === 'ТО' ? 'warn' : r.type.includes('аправ') ? 'info' : 'accent'}`}>{typeIcon[r.type]}</span>
            <span className="drv-row-main">
              <span className="row-between"><span className="drv-row-title">{typeTitle[r.type]}</span><StatusBadge status={r.status} /></span>
              <span className="drv-row-sub">{r.num} · {fmt(r.createdAt)}{r.dateFrom ? ` · ${fmtD(r.dateFrom)}${r.dateTo && r.dateTo !== r.dateFrom ? `–${fmtD(r.dateTo)}` : ''}` : ''}</span>
              {(r.description || r.comment || r.volume) && <span className="drv-req-text">{r.description ?? (r.volume ? `${r.volume} л` : r.comment)}</span>}
              {r.decision && (r.status === 'Решение' || r.status === 'Выполнена') && <span className="drv-req-dec"><Check />{r.decision}</span>}
            </span>
          </button>
        ))}
      </div>

      <Layer>
        <button type="button" className="drv-fab" onClick={() => setPicker(true)}><Plus />Создать заявку</button>
      </Layer>

      {picker && (
        <Sheet title="Новая заявка" sub="Выберите тип" onClose={() => setPicker(false)}>
          <div className="drv-typegrid">
            {reqTypes.map((t) => (
              <button key={t.id} type="button" onClick={() => { setPicker(false); setForm({ type: t.id }) }}>
                <span className="drv-row-ic t-accent">{typeIcon[t.id]}</span>
                <b>{t.title}</b><small>{t.sub}</small>
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {form && <RequestForm type={form.type} edit={form.edit} onClose={() => setForm(null)} onDone={(t) => { setForm(null); setTab(t) }} />}
      {open && <RequestCard r={open} onClose={() => setOpenId(null)} onEdit={() => { setOpenId(null); setForm({ type: open.type, edit: open }) }} />}
    </div>
  )
}

/* ---------------- Карточка заявки ---------------- */
function RequestCard({ r, onClose, onEdit }: { r: DriverRequest; onClose: () => void; onEdit: () => void }) {
  const { updateRequest, removeRequest, toast, setNotices } = useDriver()
  const steps = flow(r)
  const curIdx = Math.max(0, steps.indexOf(r.status))
  const idx = r.status === 'В работе' && r.type === 'Ремонт' ? 2 : curIdx
  const bucket = reqBucket(r)
  const nxt = advance(r)
  const cancelled = bucket === 'cancel'

  const doAdvance = () => {
    if (!nxt) return
    const upd: DriverRequest = { ...r, status: nxt.status, decision: nxt.decision ?? r.decision, repairHours: nxt.repairHours ?? r.repairHours, history: [...r.history, { status: nxt.status, at: nowIso(), by: nxt.by }] }
    updateRequest(upd)
    if (nxt.decision) {
      setNotices((s) => [{ id: `n${Date.now()}`, kind: 'request', title: `Заявка ${r.num}: решение`, text: nxt.decision!, at: nowIso(), to: '/driver/requests' }, ...s])
      toast('Получено решение по заявке')
    } else toast(`Статус: ${nxt.status}`)
  }

  return (
    <Sheet title={`${typeTitle[r.type]} · ${r.num}`} sub={`Создана ${fmt(r.createdAt)}`} onClose={onClose}
      footer={
        <>
          {bucket === 'new' && <button className="btn btn-danger btn-lg" onClick={() => { removeRequest(r.id); toast('Заявка удалена'); onClose() }}><Trash2 />Удалить</button>}
          {bucket === 'new' && <button className="btn btn-secondary btn-lg grow" onClick={onEdit}><Pencil />Редактировать</button>}
          {bucket === 'work' && <button className="btn btn-secondary btn-lg grow" onClick={() => { updateRequest({ ...r, status: 'Отменена', history: [...r.history, { status: 'Отменена', at: nowIso(), by: 'Вы' }] }); toast('Заявка отменена'); onClose() }}><Undo2 />Отменить заявку</button>}
          {(bucket === 'done' || bucket === 'cancel') && <button className="btn btn-secondary btn-lg grow" onClick={() => { updateRequest({ ...r, archived: true }); toast('Перенесено в архив'); onClose() }}><Archive />В архив</button>}
          {bucket === 'archive' && <button className="btn btn-secondary btn-lg grow" onClick={() => { updateRequest({ ...r, archived: false }); toast('Возвращено из архива') }}><Undo2 />Вернуть из архива</button>}
        </>
      }>
      <div className="row-between"><StatusBadge status={r.status} /><span className="muted">{r.history[r.history.length - 1]?.by ?? 'ожидает ответа'}</span></div>

      {!cancelled && (
        <ol className="drv-track">
          {steps.map((s, i) => <li key={s + i} className={i < idx ? 'done' : i === idx ? 'on' : ''}><span />{s}</li>)}
        </ol>
      )}

      {r.decision && (r.status === 'Решение' || r.status === 'Выполнена') && (
        <div className="alert alert-ok"><Check /><div><b>Решение</b><br />{r.decision}</div></div>
      )}

      <dl className="kv">
        <dt>Тип</dt><dd>{typeTitle[r.type]}</dd>
        <dt>Дата и время</dt><dd>{fmt(r.createdAt)}</dd>
        {r.eqId && <><dt>Техника</dt><dd>{eq(r.eqId)?.title} · {eq(r.eqId)?.plate}</dd></>}
        {r.dateFrom && <><dt>Период</dt><dd>{fmtD(r.dateFrom)}{r.dateTo && r.dateTo !== r.dateFrom ? ` — ${fmtD(r.dateTo)}` : ''}</dd></>}
        {r.description && <><dt>Проблема</dt><dd>{r.description}</dd></>}
        {r.volume && <><dt>Объём</dt><dd>{r.volume} л</dd></>}
        {r.comment && <><dt>Комментарий</dt><dd>{r.comment}</dd></>}
        {r.audioSec ? <><dt>Аудио</dt><dd>Голосовой комментарий · 0:{String(r.audioSec).padStart(2, '0')}</dd></> : null}
        {r.repairHours ? <><dt>Ремонтные часы</dt><dd>{String(r.repairHours).replace('.', ',')} ч · отдельно от рабочих</dd></> : null}
      </dl>
      {r.media.length > 0 && <div className="drv-media">{r.media.map((m) => <span key={m} className="drv-chip">{m}</span>)}</div>}
      {r.type === 'Ремонт' && <div className="alert alert-info"><Info />Механик открывает карточку машины и нажимает «Начать ремонт» — время простоя фиксируется и идёт в табель как «Ремонтные» часы: не выставляются клиенту, но учитываются в зарплате.</div>}

      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>История</div>
        <ul className="drv-hist">
          {[...r.history].reverse().map((h, i) => <li key={i}><b>{h.status}</b><span>{fmt(h.at)}{h.by ? ` · ${h.by}` : ''}</span></li>)}
        </ul>
      </div>
      {nxt && <button type="button" className="drv-demo-btn" onClick={doAdvance}><Sparkles />Демо: ответ {r.type === 'ТО' || r.type === 'Ремонт' ? 'механика' : 'менеджера'} → «{nxt.status}»</button>}
    </Sheet>
  )
}

/* ---------------- Форма заявки ---------------- */
function RequestForm({ type, edit, onClose, onDone }: { type: ReqType; edit?: DriverRequest; onClose: () => void; onDone: (t: ReqTab) => void }) {
  const { addRequest, updateRequest, nextNum, toast, requests } = useDriver()
  const [eqId, setEqId] = useState(edit?.eqId ?? myEq.id)
  const [desc, setDesc] = useState(edit?.description ?? '')
  const [media, setMedia] = useState<string[]>(edit?.media ?? [])
  const [from, setFrom] = useState(edit?.dateFrom ?? (type === 'Больничный' ? '2026-10-13' : '2026-10-20'))
  const [to, setTo] = useState(edit?.dateTo ?? (type === 'Отпуск' ? '2026-10-30' : type === 'Больничный' ? '2026-10-13' : '2026-10-20'))
  const [comment, setComment] = useState(edit?.comment ?? '')
  const [fuelMode, setFuelMode] = useState<'need' | 'fact'>(type === 'Факт заправки' ? 'fact' : 'need')
  const [volume, setVolume] = useState(edit?.volume ? String(edit.volume) : '')
  const [receipt, setReceipt] = useState<string>()
  const [moto, setMoto] = useState<string>()
  const [audio, setAudio] = useState(edit?.audioSec ?? 0)
  const [rec, setRec] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearInterval(timer.current), [])

  const toggleRec = () => {
    if (rec) { window.clearInterval(timer.current); setRec(false); return }
    setAudio(0); setRec(true)
    timer.current = window.setInterval(() => setAudio((s) => (s >= 59 ? s : s + 1)), 1000)
  }
  const fuel = type === 'Заправка' || type === 'Факт заправки'
  const eqOptions = [myEq, ...assignments.slice(1).map((a) => eq(a.eqId)!).filter(Boolean)]

  const submit = (override?: Partial<DriverRequest>) => {
    const realType: ReqType = fuel ? (fuelMode === 'fact' ? 'Факт заправки' : 'Заправка') : type
    const base: DriverRequest = {
      id: edit?.id ?? `q${Date.now()}`, num: edit?.num ?? nextNum(), type: realType, createdAt: edit?.createdAt ?? nowIso(), status: edit?.status ?? 'Отправлена',
      eqId: isLeave(type) ? undefined : eqId, description: desc || undefined, media, comment: comment || undefined,
      dateFrom: isLeave(type) ? from : undefined, dateTo: isLeave(type) ? (type === 'Выходной' ? from : to) : undefined,
      volume: realType === 'Факт заправки' ? Number(volume) : undefined, audioSec: type === 'Ремонт' && audio ? audio : undefined,
      history: edit?.history ?? [{ status: 'Отправлена', at: nowIso() }], ...override,
    }
    if (edit) { updateRequest(base); toast('Заявка обновлена') }
    else { addRequest(base); toast(realType === 'Заправка' ? 'Заявка отправлена менеджеру' : isLeave(type) ? 'Заявка отправлена менеджеру и в отдел кадров' : realType === 'Факт заправки' ? 'Факт заправки отправлен на сверку' : 'Заявка отправлена механику') }
    onDone('new')
  }

  const fuelPending = requests.some((r) => r.type === 'Заправка' && r.status === 'Отправлена')
  const valid = isLeave(type) ? !!from && (type === 'Выходной' || to >= from)
    : fuel ? (fuelMode === 'need' || (Number(volume) > 0 && !!receipt && !!moto))
    : desc.trim().length > 3

  return (
    <Sheet title={edit ? `Редактировать ${edit.num}` : typeTitle[type]} sub={isLeave(type) ? 'Уйдёт менеджеру и кадровику' : fuel ? 'Уйдёт менеджеру' : 'Уйдёт механику'} onClose={onClose}
      footer={fuel && fuelMode === 'need' ? undefined : <button className="btn btn-primary btn-lg btn-block" disabled={!valid || rec} onClick={() => submit()}>{edit ? 'Сохранить' : 'Отправить заявку'}</button>}>
      {fuel && !edit && (
        <div className="drv-segwrap"><div className="seg">
          <button type="button" className={fuelMode === 'need' ? 'on' : ''} onClick={() => setFuelMode('need')}>Нужна заправка</button>
          <button type="button" className={fuelMode === 'fact' ? 'on' : ''} onClick={() => setFuelMode('fact')}>Факт заправки</button>
        </div></div>
      )}

      {!isLeave(type) && !(fuel && fuelMode === 'need') && (
        <Field label="Техника">
          <select className="select drv-input" value={eqId} onChange={(e) => setEqId(e.target.value)}>
            {eqOptions.map((e) => <option key={e.id} value={e.id}>{e.title} · {e.plate}</option>)}
          </select>
        </Field>
      )}

      {(type === 'ТО' || type === 'Ремонт') && (
        <>
          <Field label={type === 'ТО' ? 'Описание проблемы' : 'Что сломалось'} required>
            <textarea className="textarea drv-input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={type === 'ТО' ? 'Например: подтекание масла под поворотной платформой' : 'Например: порван рукав гидравлики стрелы, техника остановлена'} />
          </Field>
          <Field label={type === 'Ремонт' ? 'Фото / видео поломки' : 'Фото / видео'}>
            <MediaPicker items={media} onChange={setMedia} />
            <button type="button" className="drv-link-btn" onClick={() => setMedia((m) => [...m, `IMG_${2100 + m.length}.jpg`, `VID_${2101 + m.length}.mp4`])}>Добавить демо-файлы</button>
          </Field>
        </>
      )}

      {type === 'Ремонт' && (
        <>
          <Field label="Аудиокомментарий">
            <div className={`drv-rec ${rec ? 'on' : ''}`}>
              <button type="button" className="drv-rec-btn" onClick={toggleRec} aria-label={rec ? 'Остановить запись' : 'Начать запись'}>{rec ? <CircleStop /> : <Mic />}</button>
              <div className="grow">
                <b className="mono">0:{String(audio).padStart(2, '0')}</b>
                <span className="drv-row-sub">{rec ? 'Идёт запись… нажмите, чтобы остановить' : audio ? 'Запись сохранена' : 'Нажмите и опишите поломку голосом'}</span>
              </div>
              {rec && <span className="drv-wave" aria-hidden>{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ animationDelay: `${i * 70}ms` }} />)}</span>}
              {!rec && audio > 0 && <button type="button" className="drv-iconbtn" aria-label="Прослушать" onClick={() => toast('Воспроизведение (демо)')}><Play /></button>}
              {!rec && audio > 0 && <button type="button" className="drv-iconbtn" aria-label="Удалить запись" onClick={() => setAudio(0)}><Trash2 /></button>}
            </div>
          </Field>
          <div className="drv-statuses">
            <span className="eyebrow">Механик выберет режим ремонта</span>
            <div className="row" style={{ gap: 6 }}><StatusBadge status="Ожидание запчастей" /><span className="badge badge-info">Ремонт силами водителя</span><span className="badge badge-accent">Выезд сервиса</span></div>
          </div>
          <div className="alert alert-info"><Info />Часы ремонта фиксируются отдельно от рабочих: в табеле — «Ремонтные», клиенту не выставляются, в зарплате учитываются.</div>
        </>
      )}

      {fuel && fuelMode === 'need' && (
        <div className="stack">
          <p className="dim">Менеджер получит заявку с вашей геопозицией и объектом <b>{todayShift.site.name}</b> и направит топливозаправщик.</p>
          <button type="button" className="drv-big accent" disabled={fuelPending && !edit} onClick={() => submit()}>
            <Fuel />{fuelPending ? 'Заявка уже отправлена' : 'Нужна заправка'}
          </button>
          <Field label="Комментарий (необязательно)"><input className="input drv-input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Остаток ~1/4 бака" /></Field>
        </div>
      )}

      {fuel && fuelMode === 'fact' && (
        <>
          <Field label="Объём заправки, л" required>
            <input className="input drv-input mono" inputMode="decimal" value={volume} onChange={(e) => setVolume(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="180" />
          </Field>
          <div className="drv-slots two">
            <PhotoSlot label="Чек / счётчик ТЗ" value={receipt} onChange={setReceipt} kind="doc" />
            <PhotoSlot label="Моточасы при заправке" value={moto} onChange={setMoto} kind="moto" />
          </div>
          <button type="button" className="drv-link-btn" onClick={() => { setReceipt('demo:r'); setMoto('demo:m'); if (!volume) setVolume('180') }}>Заполнить демо-фото</button>
          <p className="muted drv-note">Объём сверяется с топливной картой и расходом по моточасам.</p>
        </>
      )}

      {isLeave(type) && (
        <>
          <div className="drv-2col">
            <Field label={type === 'Выходной' ? 'Дата' : 'С'} required><input type="date" className="input drv-input" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            {type !== 'Выходной' && <Field label="По" required><input type="date" className="input drv-input" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></Field>}
          </div>
          <Field label="Комментарий"><textarea className="textarea drv-input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={type === 'Больничный' ? 'Например: ОРВИ, листок нетрудоспособности оформлен' : 'Причина'} /></Field>
          {type === 'Больничный' && (
            <Field label="Справка / листок нетрудоспособности"><MediaPicker items={media} onChange={setMedia} accept="image/*" label="Сфотографировать" /></Field>
          )}
          {type !== 'Больничный' && <div className="alert alert-warn"><AlertTriangle />Смены на эти даты менеджер передаст другому водителю после согласования.</div>}
        </>
      )}
    </Sheet>
  )
}
