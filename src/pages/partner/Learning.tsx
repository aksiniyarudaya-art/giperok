import { useEffect, useState } from 'react'
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Pause, Play, PlayCircle } from 'lucide-react'
import { Modal, PageHead, Progress, Seg, useToast } from '../../ui'
import { lessons, type Lesson } from '../../data/cabinet'

/** Схематичный «скриншот» интерфейса кабинета с подсветкой нужного элемента. */
export function Screenshot({ kind, step = 0 }: { kind: Lesson['shot']; step?: number }) {
  const hi = (i: number) => (i === step ? 'hi' : '')
  return (
    <div className="pt-shot" aria-hidden>
      <div className="pt-shot-bar"><i /><i /><i /><span>giperok.by/partner</span></div>
      <div className="pt-shot-body">
        <div className="pt-shot-side">{[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={i === { dashboard: 0, catalog: 1, form: 1, orders: 2, payout: 4, chat: 5 }[kind] ? 'on' : ''} />)}</div>
        <div className="pt-shot-main">
          {kind === 'dashboard' && <>
            <div className={`pt-shot-row ${hi(0)}`}>{[0, 1, 2, 3].map((i) => <b key={i} className="pt-shot-stat" />)}</div>
            <div className={`pt-shot-row ${hi(1)}`}><b className="pt-shot-chart" /><b className="pt-shot-chart sm" /></div>
            <div className={`pt-shot-bell ${hi(2)}`} />
          </>}
          {kind === 'form' && <>
            <div className={`pt-shot-row ${hi(0)}`}><b className="pt-shot-btn" /></div>
            <div className={`pt-shot-grid ${hi(1)}`}>{[0, 1, 2, 3, 4, 5].map((i) => <b key={i} className="pt-shot-input" />)}</div>
            <div className={`pt-shot-row ${hi(2)}`}>{[0, 1, 2, 3].map((i) => <b key={i} className="pt-shot-photo" />)}</div>
            <div className={`pt-shot-grid ${hi(3)}`}>{[0, 1, 2].map((i) => <b key={i} className="pt-shot-input" />)}</div>
            <div className={`pt-shot-row end ${hi(4)}`}><b className="pt-shot-btn" /></div>
          </>}
          {kind === 'orders' && <>
            <div className={`pt-shot-row ${hi(0)}`}>{[0, 1, 2, 3].map((i) => <b key={i} className="pt-shot-tab" />)}</div>
            <div className={`pt-shot-list ${hi(1)}`}>{[0, 1, 2].map((i) => <b key={i} className="pt-shot-line" />)}</div>
            <div className="pt-shot-row end"><b className={`pt-shot-btn ghost ${hi(3)}`} /><b className={`pt-shot-btn ${hi(2)}`} /></div>
          </>}
          {kind === 'payout' && <>
            <div className={`pt-shot-row ${hi(0)}`}>{[0, 1, 2].map((i) => <b key={i} className="pt-shot-tab" />)}</div>
            <div className={`pt-shot-row ${hi(1)}`}>{[0, 1, 2, 3].map((i) => <b key={i} className="pt-shot-stat" />)}</div>
            <div className={`pt-shot-row end ${hi(2)}`}><b className="pt-shot-btn" /></div>
            <div className={`pt-shot-list ${hi(3)}`}>{[0, 1, 2].map((i) => <b key={i} className="pt-shot-line" />)}</div>
          </>}
          {kind === 'catalog' && <>
            <div className={`pt-shot-phone ${hi(0)} ${hi(1)}`}><b className="pt-shot-photo" /><b className="pt-shot-btn" /></div>
            <div className={`pt-shot-map ${hi(2)}`}>{[[20, 30], [55, 60], [70, 25], [35, 70]].map(([x, y]) => <i key={x} style={{ left: `${x}%`, top: `${y}%` }} />)}</div>
          </>}
          {kind === 'chat' && <>
            <div className={`pt-shot-list ${hi(0)}`}>{[0, 1].map((i) => <b key={i} className="pt-shot-line" />)}</div>
            <div className={`pt-shot-msgs ${hi(1)}`}><b /><b className="me" /><b /></div>
            <div className={`pt-shot-input wide ${hi(2)}`} />
          </>}
        </div>
      </div>
    </div>
  )
}

export default function Learning() {
  const toast = useToast()
  const [kind, setKind] = useState<'all' | 'video' | 'guide'>('all')
  const [done, setDone] = useState<string[]>(['ls1'])
  const [open, setOpen] = useState<Lesson | null>(null)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(0)

  useEffect(() => {
    if (!playing || !open) return
    const t = setInterval(() => setPos((x) => {
      const n = x + 100 / (open.minutes * 6)
      if (n >= 100) { setPlaying(false); return 100 }
      return n
    }), 250)
    return () => clearInterval(t)
  }, [playing, open])

  const cur = open?.kind === 'video' ? Math.min(open.steps.length - 1, Math.floor((pos / 100) * open.steps.length)) : step
  const list = lessons.filter((l) => kind === 'all' || l.kind === kind)
  const start = (l: Lesson) => { setOpen(l); setStep(0); setPos(0); setPlaying(false) }
  const finish = () => { if (open && !done.includes(open.id)) { setDone([...done, open.id]); toast('Урок пройден') } setOpen(null) }

  return (
    <>
      <PageHead title="Обучение" sub="Видео и пошаговые инструкции: как пользоваться кабинетом партнёра" />
      <div className="card pt-learn-head">
        <div className="grow">
          <div style={{ fontWeight: 700 }}>Ваш прогресс: {done.length} из {lessons.length} уроков</div>
          <div style={{ marginTop: 8, maxWidth: 420 }}><Progress value={(done.length / lessons.length) * 100} tone="ok" /></div>
        </div>
        <Seg value={kind} onChange={setKind} items={[{ id: 'all', label: 'Все' }, { id: 'video', label: 'Видео' }, { id: 'guide', label: 'Инструкции' }]} />
      </div>
      <div className="pt-lessons">
        {list.map((l) => (
          <button key={l.id} className="card pt-lesson" onClick={() => start(l)}>
            <div className="pt-lesson-cover">
              <Screenshot kind={l.shot} step={-1} />
              <span className="pt-lesson-play">{l.kind === 'video' ? <PlayCircle /> : <BookOpen />}</span>
              <span className="pt-lesson-dur">{l.kind === 'video' ? `${l.minutes}:00` : `${l.steps.length} шагов`}</span>
            </div>
            <div className="stack-sm" style={{ padding: '14px 16px 16px' }}>
              <div className="row-between"><span className="eyebrow">{l.kind === 'video' ? 'Видео' : 'Инструкция'} · {l.minutes} мин</span>{done.includes(l.id) && <CheckCircle2 size={18} style={{ color: 'var(--ok)' }} />}</div>
              <b>{l.title}</b>
              <span className="muted" style={{ fontSize: 13 }}>{l.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {open && (
        <Modal wide title={open.title} onClose={() => setOpen(null)} footer={<>
          {open.kind === 'guide' && <>
            <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ChevronLeft />Назад</button>
            {step < open.steps.length - 1
              ? <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Далее<ChevronRight /></button>
              : <button className="btn btn-ok" onClick={finish}><CheckCircle2 />Готово</button>}
          </>}
          {open.kind === 'video' && <button className="btn btn-ok" onClick={finish}><CheckCircle2 />Отметить просмотренным</button>}
        </>}>
          <div className="pt-player">
            <Screenshot kind={open.shot} step={cur} />
            {open.kind === 'video' && <>
              <button className="pt-player-btn" onClick={() => { if (pos >= 100) setPos(0); setPlaying(!playing) }} aria-label={playing ? 'Пауза' : 'Воспроизвести'}>{playing ? <Pause /> : <Play />}</button>
              <div className="pt-player-bar"><span style={{ width: `${pos}%` }} /></div>
              <span className="pt-player-time tnum">{Math.floor((pos / 100) * open.minutes)}:{String(Math.floor(((pos / 100) * open.minutes * 60) % 60)).padStart(2, '0')} / {open.minutes}:00</span>
            </>}
          </div>
          <ol className="pt-steps">
            {open.steps.map((s, i) => <li key={s} className={i === cur ? 'on' : i < cur ? 'done' : ''} onClick={() => { setStep(i); if (open.kind === 'video') { setPos((i / open.steps.length) * 100 + 1) } }}><span>{i + 1}</span>{s}</li>)}
          </ol>
        </Modal>
      )}
    </>
  )
}
