import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Brush, CheckCircle2, Coffee, FastForward, Flag, Hammer, Info, LocateFixed, MapPin, MapPinCheck, Navigation, Play, ScanLine, ShieldAlert, Sparkles, Square, Wrench } from 'lucide-react'
import { EquipmentArt, Field, num, StatusBadge } from '../../ui'
import { myEq, myMechanic, photoSlots, tmcList, todayShift, waybills } from '../../data/driver'
import { CheckRow, Group, Layer, MediaPicker, PhotoSlot, Steps, Switch } from './kit'
import { dur, freshSession, hhmm, nowIso, shiftTimes, useDriver, useNow, type ShiftEvent, type ShiftSession, type WorkState } from './store'

const STEP_LABELS = ['Приём', 'Путевой лист', 'Смена', 'Сдача']

export default function ShiftFlow() {
  const nav = useNavigate()
  const { session, setSession } = useDriver()
  useEffect(() => {
    if (session.phase === 'idle') setSession((s) => ({ ...s, phase: 'active', step: 1 }))
  }, [session.phase, setSession])

  if (session.phase === 'done') return <DoneScreen onHome={() => nav('/driver')} />
  const set = (p: Partial<ShiftSession>) => setSession((s) => ({ ...s, ...p }))
  return (
    <div className="drv-flow">
      <div className="drv-flow-steps">
        <Steps step={session.step} labels={STEP_LABELS} onPick={(n) => set({ step: n as ShiftSession['step'] })} />
      </div>
      <div className="drv-pad stack drv-flow-body">
        {session.step === 1 && <StepAccept />}
        {session.step === 2 && <StepWaybill />}
        {session.step === 3 && <StepShift />}
        {session.step === 4 && <StepFinish />}
      </div>
    </div>
  )
}

function Foot({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <Layer>
      <div className="drv-flow-foot">
        {hint && <div className="drv-flow-hint">{hint}</div>}
        <div className="row" style={{ flexWrap: 'nowrap' }}>{children}</div>
      </div>
    </Layer>
  )
}

/* ---------------- Шаг 1. Приём техники ---------------- */
function StepAccept() {
  const { session, setSession, addRequest, updateRequest, requests, nextNum, toast } = useDriver()
  const [desc, setDesc] = useState('')
  const [media, setMedia] = useState<string[]>([])
  const set = (p: Partial<ShiftSession>) => setSession((s) => ({ ...s, ...p }))
  const tmcDone = tmcList.filter((t) => session.tmc[t.id]).length
  const photosDone = photoSlots.filter((p) => session.photos[p.id]).length
  const toReq = requests.find((r) => r.id === session.toRequestId)
  const toResolved = toReq?.status === 'Решение'
  const groups = [...new Set(tmcList.map((t) => t.group))]

  const ready = tmcDone === tmcList.length && photosDone === photoSlots.length && (session.needTo === false || (session.needTo === true && toResolved))
  const missing = [
    tmcDone < tmcList.length && `ТМЦ ${tmcDone}/${tmcList.length}`,
    photosDone < photoSlots.length && `фото ${photosDone}/${photoSlots.length}`,
    session.needTo === null && 'ответ про ТО',
    session.needTo === true && !toReq && 'заявка на ТО',
    session.needTo === true && toReq && !toResolved && 'решение механика',
  ].filter(Boolean).join(' · ')

  const sendTo = () => {
    const id = `q${Date.now()}`
    addRequest({ id, num: nextNum(), type: 'ТО', createdAt: nowIso(), status: 'Отправлена', eqId: myEq.id, description: desc, media: [...media, ...Object.keys(session.photos).map((k) => `360_${k}.jpg`)], history: [{ status: 'Отправлена', at: nowIso() }] })
    set({ toRequestId: id })
    toast('Заявка на ТО отправлена механику')
  }
  const mechOk = () => {
    if (!toReq) return
    updateRequest({ ...toReq, status: 'Решение', decision: 'Осмотрел по фото: работа разрешена, контроль уровня масла каждые 4 м/ч.', history: [...toReq.history, { status: 'Принята', at: nowIso(), by: myMechanic.name }, { status: 'Решение', at: nowIso(), by: myMechanic.name }] })
    toast('Механик допустил технику к работе')
  }

  return (
    <>
      <div className="drv-flow-eq">
        <div className="drv-eqcard-img"><EquipmentArt seed={myEq.id} category={myEq.category} label={myEq.title} /></div>
        <div className="grow"><b>{myEq.title}</b><div className="mono dim">{myEq.plate}</div><div className="drv-row-sub">{todayShift.site.name} · {todayShift.start}–{todayShift.end}</div></div>
      </div>

      <Group title={`Чек-лист ТМЦ · ${tmcDone}/${tmcList.length}`} action={<button className="drv-link-btn" onClick={() => set({ tmc: Object.fromEntries(tmcList.map((t) => [t.id, tmcDone < tmcList.length])) })}>{tmcDone < tmcList.length ? 'Отметить всё' : 'Снять все'}</button>} flush>
        <div className="stack-sm">
          {groups.map((g) => (
            <div key={g} className="drv-list">
              <div className="drv-list-cap">{g}</div>
              {tmcList.filter((t) => t.group === g).map((t) => (
                <CheckRow key={t.id} checked={!!session.tmc[t.id]} onChange={(v) => set({ tmc: { ...session.tmc, [t.id]: v } })} title={t.name} />
              ))}
            </div>
          ))}
        </div>
      </Group>

      <Group title={`Фото-фиксация 360° · ${photosDone}/${photoSlots.length}`} action={<button className="drv-link-btn" onClick={() => set({ photos: Object.fromEntries(photoSlots.map((p) => [p.id, `demo:${p.id}`])) })}>Заполнить демо-фото</button>} flush>
        <div className="drv-slots">
          {photoSlots.map((p) => (
            <PhotoSlot key={p.id} label={p.label} kind={p.id === 'moto' ? 'moto' : undefined} value={session.photos[p.id]}
              onChange={(v) => setSession((s) => ({ ...s, photos: { ...s.photos, [p.id]: v ?? '' } }))} />
          ))}
        </div>
        <p className="muted drv-note">Камера телефона откроется сразу. Фото сохраняются с временем и геометкой.</p>
      </Group>

      <Group title="Нужно ТО?" flush>
        <div className="drv-yn">
          <button type="button" className={session.needTo === false ? 'on ok' : ''} onClick={() => set({ needTo: false })}><CheckCircle2 />Нет, техника исправна</button>
          <button type="button" className={session.needTo === true ? 'on warn' : ''} onClick={() => set({ needTo: true })}><Wrench />Да, нужно ТО</button>
        </div>
        {session.needTo === true && !toReq && (
          <div className="drv-card stack">
            <Field label="Описание проблемы" required><textarea className="textarea drv-input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Что обнаружили при осмотре" /></Field>
            <Field label="Фото / видео"><MediaPicker items={media} onChange={setMedia} /></Field>
            <span className="drv-row-sub">Фото 360° прикрепятся к заявке автоматически.</span>
            <button className="btn btn-dark btn-lg btn-block" disabled={desc.trim().length < 4} onClick={sendTo}><Wrench />Создать заявку на ТО</button>
          </div>
        )}
        {toReq && (
          <div className="drv-card stack-sm">
            <div className="row-between"><b>Заявка {toReq.num}</b><StatusBadge status={toReq.status} /></div>
            <span className="drv-row-sub">{toReq.description}</span>
            {toResolved ? <div className="alert alert-ok"><CheckCircle2 />{toReq.decision}</div>
              : <>
                <div className="alert alert-warn"><Info />Ожидайте решения механика — без допуска начинать смену нельзя.</div>
                <button type="button" className="drv-demo-btn" onClick={mechOk}><Sparkles />Демо: механик допустил к работе</button>
              </>}
          </div>
        )}
      </Group>

      <Foot hint={!ready ? `Осталось: ${missing}` : undefined}>
        <button className="btn btn-primary btn-lg btn-block" disabled={!ready} onClick={() => { set({ step: 2 }); toast('Техника принята · акт приёма сформирован') }}>
          Принять технику <Play />
        </button>
      </Foot>
    </>
  )
}

/* ---------------- Шаг 2. Цифровой путевой лист ---------------- */
function StepWaybill() {
  const { session, setSession, toast } = useDriver()
  const wb = session.wb
  const setWb = (p: Partial<ShiftSession['wb']>) => setSession((s) => ({ ...s, wb: { ...s.wb, ...p } }))
  const [scanning, setScanning] = useState(false)
  const [manual, setManual] = useState({ date: '2026-10-13', number: '', moto: '' })
  const plan = waybills[0]
  const bothPhotos = !!wb.front && !!wb.back

  useEffect(() => {
    if (!bothPhotos || wb.recognized) return
    setScanning(true)
    const t = setTimeout(() => {
      setScanning(false)
      setWb({ recognized: true, date: '13.10.2026', number: plan.number, moto: num(plan.motoStart, 1) })
    }, 1400)
    return () => clearTimeout(t)
  }, [bothPhotos, wb.recognized]) // eslint-disable-line react-hooks/exhaustive-deps

  const quality = wb.blurry ? 38 : 96
  const canAccept = bothPhotos && wb.recognized && !wb.blurry && !scanning
  const mismatch = manual.moto !== '' && Number(manual.moto.replace(',', '.').replace(/\s/g, '')) !== Math.round(plan.motoStart * 10) / 10
  const retake = () => { setWb({ front: undefined, back: undefined, recognized: false, blurry: false }); toast('Переснимите обе стороны путевого листа') }

  const accept = () => {
    const at = Date.now() + session.shift
    setSession((s) => ({
      ...s, step: 3, wb: { ...s.wb, accepted: true }, startedAt: at, state: 'none',
      events: [{ id: 'e0', kind: 'start', at, label: 'Смена запущена', note: `ПЛ ${plan.number} принят` }],
    }))
    toast('Путевой лист принят · таймер смены запущен')
  }

  return (
    <>
      <Group title="Фото бумажного путевого листа" flush>
        <div className="drv-slots two">
          <PhotoSlot label="Лицевая сторона" kind="doc" value={wb.front} blurry={wb.blurry && !!wb.front} onChange={(v) => setWb({ front: v, recognized: false })} />
          <PhotoSlot label="Оборотная сторона" kind="doc" value={wb.back} blurry={wb.blurry && !!wb.back} onChange={(v) => setWb({ back: v, recognized: false })} />
        </div>
        <div className="row-between">
          <button className="drv-link-btn" onClick={() => setWb({ front: 'demo:f', back: 'demo:b', recognized: false })}>Заполнить демо-фото</button>
          <label className="row drv-demo-switch" style={{ gap: 8 }}>
            <span>Фото размыто (демо)</span>
            <Switch checked={wb.blurry} onChange={(v) => setWb({ blurry: v })} label="Фото размыто (демо)" />
          </label>
        </div>
      </Group>

      {bothPhotos && (
        <Group title="Распознавание" flush>
          <div className="drv-card stack">
            {scanning ? (
              <div className="drv-scan"><ScanLine /><span>Распознаём дату, номер и моточасы…</span></div>
            ) : (
              <>
                <div className="row-between">
                  <span className="dim">Качество фото</span>
                  <b className={wb.blurry ? 'drv-neg' : 'drv-pos'}>{quality}% · {wb.blurry ? 'размыто' : 'чётко'}</b>
                </div>
                <div className={`bar ${wb.blurry ? 'bad' : 'ok'}`}><span style={{ width: `${quality}%` }} /></div>
                <dl className="kv">
                  <dt>Дата</dt><dd className="mono">{wb.blurry ? '— не читается' : wb.date}</dd>
                  <dt>Номер ПЛ</dt><dd className="mono">{wb.blurry ? '— не читается' : wb.number}</dd>
                  <dt>Нач. моточасы</dt><dd className="mono">{wb.blurry ? '— не читается' : wb.moto}</dd>
                </dl>
                {wb.blurry && (
                  <div className="alert alert-bad"><AlertTriangle /><div><b>Фото размыто — кнопка «Принять заявку» заблокирована.</b><br />Переснимите лист при хорошем освещении, без бликов и тени, чтобы дата, номер и моточасы читались.</div></div>
                )}
                {wb.blurry && <button className="btn btn-secondary btn-lg btn-block" onClick={retake}>Переснять путевой лист</button>}
              </>
            )}
          </div>
        </Group>
      )}

      <Group title="Показания вручную · для сверки" flush>
        <div className="drv-card stack">
          <div className="drv-2col">
            <Field label="Дата"><input type="date" className="input drv-input" value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} /></Field>
            <Field label="Номер ПЛ"><input className="input drv-input mono" value={manual.number} placeholder={plan.number} onChange={(e) => setManual({ ...manual, number: e.target.value })} /></Field>
          </div>
          <Field label="Моточасы на начало" hint={`По данным системы: ${num(plan.motoStart, 1)}`}>
            <input className="input drv-input mono" inputMode="decimal" value={manual.moto} placeholder={num(plan.motoStart, 1)} onChange={(e) => setManual({ ...manual, moto: e.target.value })} />
          </Field>
          {mismatch && <div className="alert alert-warn"><Info />Показания расходятся с данными системы — уйдут на модерацию менеджеру.</div>}
          <button className="btn btn-secondary btn-lg btn-block" disabled={!manual.moto || wb.manualSent} onClick={() => { setWb({ manualSent: true }); toast('Показания отправлены менеджеру на модерацию') }}>
            {wb.manualSent ? 'Отправлено на модерацию' : 'Отправить показания на сверку'}
          </button>
        </div>
      </Group>

      <Foot hint={!bothPhotos ? 'Сфотографируйте обе стороны путевого листа' : wb.blurry ? 'Заблокировано: фото размыто, переснимите' : scanning ? 'Идёт распознавание…' : undefined}>
        <button className="btn btn-secondary btn-lg" onClick={() => setSession((s) => ({ ...s, step: 1 }))}>Назад</button>
        <button className="btn btn-primary btn-lg grow" disabled={!canAccept} onClick={accept}>Принять заявку</button>
      </Foot>
    </>
  )
}

/* ---------------- Шаг 3. Смена ---------------- */
const stateLabel: Record<WorkState, string> = { none: 'Выезд на объект', arrived: 'На объекте', working: 'Работа', paused: 'Пауза / обед', repair: 'Ремонт (простой)', finished: 'Работа завершена' }

function StepShift() {
  const { session, setSession, toast } = useDriver()
  const now = useNow()
  const t = shiftTimes(session, now)
  const [farDemo, setFarDemo] = useState(false)
  const [locating, setLocating] = useState(false)
  const s = session.state

  /** Закрыть идущий интервал паузы/ремонта. */
  const close = (x: ShiftSession): Partial<ShiftSession> => {
    if (!x.markAt) return {}
    const d = Date.now() + x.shift - x.markAt
    if (x.state === 'paused') return { pauseMs: x.pauseMs + d, markAt: undefined }
    if (x.state === 'repair') return { repairMs: x.repairMs + d, markAt: undefined }
    return {}
  }
  const go = (state: WorkState, e: Omit<ShiftEvent, 'id' | 'at'>, mark?: boolean) => {
    setSession((x) => ({ ...x, ...close(x), state, markAt: mark ? Date.now() + x.shift : undefined, stoppedAt: state === 'finished' ? Date.now() + x.shift : undefined, events: [{ ...e, id: `e${Date.now()}`, at: Date.now() + x.shift }, ...x.events] }))
  }

  const geoCheck = (andArrive?: boolean) => {
    setLocating(true)
    setTimeout(() => {
      setLocating(false)
      const dist = farDemo ? 4700 : 120
      const ok = dist <= 300
      const label = ok ? `Вы в ${dist} м от объекта ✓` : `Вы в ${String(dist / 1000).replace('.', ',')} км от объекта`
      setSession((x) => ({
        ...x, geo: { dist, ok },
        ...(andArrive ? { state: 'arrived' as WorkState } : {}),
        events: [
          { id: `g${Date.now()}`, kind: 'geo', at: Date.now() + x.shift, label: ok ? 'Гео-метка совпала с объектом' : 'Гео-метка не совпала (анти-фрод)', note: label, warn: !ok },
          ...(andArrive ? [{ id: `a${Date.now()}`, kind: 'arrived' as const, at: Date.now() + x.shift, label: 'Прибыл на объект', note: todayShift.site.name }] : []),
          ...x.events,
        ],
      }))
      if (ok) toast(label)
      else toast('Координаты не совпадают — менеджер получит уведомление', 'warn')
    }, 900)
  }

  return (
    <>
      <div className={`drv-timer s-${s}`}>
        <span className="drv-timer-state">{stateLabel[s]}</span>
        <span className="drv-timer-v mono">{dur(t.work)}</span>
        <span className="drv-timer-sub">Всего {dur(t.total, false)} · пауза {dur(t.pause, false)} · ремонт {dur(t.repair, false)}</span>
        <button type="button" className="drv-ff" onClick={() => setSession((x) => ({ ...x, shift: x.shift + 3600000 }))}><FastForward />+1 ч (демо)</button>
      </div>

      <div className={`drv-geo ${session.geo ? (session.geo.ok ? 'ok' : 'bad') : ''}`}>
        <span className="drv-row-ic">{session.geo?.ok === false ? <ShieldAlert /> : session.geo ? <MapPinCheck /> : <LocateFixed />}</span>
        <div className="grow">
          <b>{locating ? 'Определяем координаты…' : session.geo ? (session.geo.ok ? `Вы в ${session.geo.dist} м от объекта ✓` : `Вы в ${String(session.geo.dist / 1000).replace('.', ',')} км от объекта`) : 'Гео-метка не проверена'}</b>
          <span className="drv-row-sub">{session.geo?.ok === false ? 'Анти-фрод: отметка уйдёт менеджеру на проверку, время может быть не засчитано' : `${todayShift.site.address} · допуск 300 м`}</span>
        </div>
        <button type="button" className="drv-iconbtn" onClick={() => geoCheck()} aria-label="Сверить координаты" disabled={locating}><Navigation /></button>
      </div>
      <label className="row drv-demo-switch" style={{ justifyContent: 'space-between' }}>
        <span>Имитировать: далеко от объекта (демо)</span>
        <Switch checked={farDemo} onChange={setFarDemo} label="Далеко от объекта" />
      </label>

      <div className="drv-acts">
        <button type="button" className="drv-act" disabled={s !== 'none' || locating} onClick={() => geoCheck(true)}><MapPin /><span>Прибыл на объект</span></button>
        <button type="button" className="drv-act primary" disabled={!(s === 'arrived' || s === 'paused' || s === 'repair')} onClick={() => go('working', { kind: s === 'arrived' ? 'work' : 'resume', label: s === 'arrived' ? 'Начал работу' : 'Продолжил работу' })}><Play /><span>{s === 'paused' || s === 'repair' ? 'Продолжить работу' : 'Начал работу'}</span></button>
        <button type="button" className={`drv-act ${s === 'paused' ? 'on' : ''}`} disabled={s !== 'working'} onClick={() => go('paused', { kind: 'pause', label: 'Пауза / обед' }, true)}><Coffee /><span>Пауза / Обед</span></button>
        <button type="button" className={`drv-act ${s === 'repair' ? 'on' : ''}`} disabled={s !== 'working'} onClick={() => { go('repair', { kind: 'repair', label: 'Простой: ремонт', note: 'Часы идут отдельно как «Ремонтные»', warn: true }, true); toast('Ремонтные часы считаются отдельно от рабочих') }}><Hammer /><span>Ремонт / простой</span></button>
        <button type="button" className="drv-act danger wide" disabled={!(s === 'working' || s === 'paused' || s === 'repair')} onClick={() => go('finished', { kind: 'finish', label: 'Завершил работу' })}><Square /><span>Завершил работу</span></button>
      </div>

      <Group title="Журнал смены">
        {session.events.map((e) => (
          <div key={e.id} className={`drv-ev ${e.warn ? 'warn' : ''}`}>
            <span className="mono">{hhmm(e.at)}</span>
            <div className="grow"><b>{e.label}</b>{e.note && <span className="drv-row-sub">{e.note}</span>}</div>
          </div>
        ))}
      </Group>

      <Foot hint={s !== 'finished' ? 'Сдача техники доступна после «Завершил работу»' : undefined}>
        <button className="btn btn-primary btn-lg btn-block" disabled={s !== 'finished'} onClick={() => setSession((x) => ({ ...x, step: 4 }))}><Flag />К сдаче техники</button>
      </Foot>
    </>
  )
}

/* ---------------- Шаг 4. Завершение ---------------- */
function StepFinish() {
  const { session, setSession, toast, setCompleted, setNotices } = useDriver()
  const now = useNow()
  const t = shiftTimes(session, now)
  const plan = waybills[0]
  const motoStart = plan.motoStart
  const [cleanup, setCleanup] = useState<Record<string, string | undefined>>({})
  const [ret, setRet] = useState<Record<string, string | undefined>>({})
  const [endMoto, setEndMoto] = useState(session.endMoto || String(Math.round((motoStart + t.work / 3600000) * 10) / 10).replace('.', ','))
  const [endKm, setEndKm] = useState(session.endKm || '0')
  const endNum = Number(endMoto.replace(',', '.').replace(/\s/g, ''))
  const okMoto = endNum >= motoStart
  const cleanSlots = [{ id: 'place', label: 'Рабочее место' }, { id: 'area', label: 'Территория у техники' }]
  const retSlots = [{ id: 'park', label: 'Техника на стоянке' }, { id: 'moto', label: 'Счётчик моточасов' }]
  const ready = cleanSlots.every((x) => cleanup[x.id]) && retSlots.every((x) => ret[x.id]) && okMoto && endKm !== ''

  const finish = () => {
    const at = Date.now() + session.shift
    setSession((x) => ({ ...x, phase: 'done', finishedAt: at, endMoto, endKm, cleanup: Object.values(cleanup) as string[], returned: Object.values(ret) as string[], events: [{ id: 'fin', kind: 'finish', at, label: 'Смена завершена', note: `Моточасы ${endMoto}` }, ...x.events] }))
    setCompleted((c) => c + 1)
    setNotices((s) => [{ id: `n${at}`, kind: 'shift', title: 'Смена 13.10 закрыта', text: 'Путевой лист и фотоотчёт переданы менеджеру', at: nowIso(), read: true, to: '/driver/shifts' }, ...s])
    toast('Смена завершена · отчёт отправлен менеджеру')
  }

  return (
    <>
      <Group title="Уборка рабочего места · фотоотчёт" flush>
        <div className="drv-slots two">
          {cleanSlots.map((x) => <PhotoSlot key={x.id} label={x.label} value={cleanup[x.id]} onChange={(v) => setCleanup((s) => ({ ...s, [x.id]: v }))} />)}
        </div>
      </Group>
      <Group title="Возврат техники · фото" flush>
        <div className="drv-slots two">
          {retSlots.map((x) => <PhotoSlot key={x.id} label={x.label} kind={x.id === 'moto' ? 'moto' : undefined} value={ret[x.id]} onChange={(v) => setRet((s) => ({ ...s, [x.id]: v }))} />)}
        </div>
        <button className="drv-link-btn" onClick={() => { setCleanup({ place: 'demo:p', area: 'demo:a' }); setRet({ park: 'demo:k', moto: 'demo:m' }) }}>Заполнить демо-фото</button>
      </Group>
      <Group title="Конечные показания" flush>
        <div className="drv-card drv-2col">
          <Field label="Моточасы" hint={`Начало: ${num(motoStart, 1)}`}><input className="input drv-input mono" inputMode="decimal" value={endMoto} onChange={(e) => setEndMoto(e.target.value)} /></Field>
          <Field label="Пробег (перегон), км"><input className="input drv-input mono" inputMode="numeric" value={endKm} onChange={(e) => setEndKm(e.target.value.replace(/\D/g, ''))} /></Field>
        </div>
        {!okMoto && <div className="alert alert-bad"><AlertTriangle />Конечные моточасы не могут быть меньше начальных.</div>}
      </Group>
      <Group title="Итог смены" flush>
        <div className="drv-summary">
          <div><span>Отработано</span><b className="mono">{dur(t.work, false)}</b></div>
          <div><span>Пауза / обед</span><b className="mono">{dur(t.pause, false)}</b></div>
          <div className="repair"><span>Ремонтные часы</span><b className="mono">{dur(t.repair, false)}</b><small>отдельно от рабочих · не для счёта клиенту</small></div>
          <div><span>Наработка</span><b className="mono">{okMoto ? num(endNum - motoStart, 1) : '—'} м/ч</b></div>
        </div>
      </Group>
      <Foot hint={!ready ? 'Нужны 4 фото и конечные показания' : undefined}>
        <button className="btn btn-secondary btn-lg" onClick={() => setSession((x) => ({ ...x, step: 3 }))}>Назад</button>
        <button className="btn btn-primary btn-lg grow" disabled={!ready} onClick={finish}><Flag />Завершить смену</button>
      </Foot>
    </>
  )
}

function DoneScreen({ onHome }: { onHome: () => void }) {
  const { session, setSession } = useDriver()
  const now = useNow()
  const t = shiftTimes(session, now)
  return (
    <div className="drv-pad stack drv-done">
      <div className="drv-done-ic"><CheckCircle2 /></div>
      <h2 className="drv-h2" style={{ textAlign: 'center' }}>Смена завершена</h2>
      <p className="dim" style={{ textAlign: 'center' }}>{todayShift.site.name} · ПЛ {session.wb.number || waybills[0].number}. Путевой лист, фото уборки и возврата техники переданы менеджеру.</p>
      <div className="drv-summary">
        <div><span>Отработано</span><b className="mono">{dur(t.work, false)}</b></div>
        <div><span>Пауза</span><b className="mono">{dur(t.pause, false)}</b></div>
        <div className="repair"><span>Ремонтные часы</span><b className="mono">{dur(t.repair, false)}</b><small>в табеле отдельно</small></div>
        <div><span>Моточасы</span><b className="mono">{session.endMoto}</b></div>
      </div>
      <Group title="Журнал">
        {session.events.slice(0, 8).map((e) => (
          <div key={e.id} className={`drv-ev ${e.warn ? 'warn' : ''}`}><span className="mono">{hhmm(e.at)}</span><div className="grow"><b>{e.label}</b>{e.note && <span className="drv-row-sub">{e.note}</span>}</div></div>
        ))}
      </Group>
      <button className="btn btn-primary btn-lg btn-block" onClick={onHome}>На главную</button>
      <button className="drv-link-btn" style={{ alignSelf: 'center' }} onClick={() => setSession(freshSession())}>
        <Brush size={14} />Сбросить демо и пройти смену заново
      </button>
    </div>
  )
}
