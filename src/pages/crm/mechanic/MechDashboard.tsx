import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarClock, Check, FileText, Inbox, ShieldCheck, Timer, Wrench, X } from 'lucide-react'
import type { CrmPageProps } from '../types'
import { Avatar, Badge, PageHead, Stat, money, time, useToast, equipmentPhoto } from '../../../ui'
import { TODAY, emp } from '../../../data/mock'
import {
  NOW, briefingsStore, docTotal, docsStore, fleetStore, repairHoursStore, repairsStore, requestsStore, hoursBetween, useStore, useStoreList,
} from '../../../data/crm-c'
import { Ico, LItem, MoreBtn, Panel, XBadge, acceptRequest, dt, empShort, eqPlate, eqTitle, hrs, shortName } from './parts'

export default function MechDashboard({ role }: CrmPageProps) {
  const nav = useNavigate()
  const go = (p: string) => nav(`/crm/${role}/${p}`)
  const toast = useToast()
  const fleet = useStore(fleetStore)
  const repairs = useStore(repairsStore)
  const reqs = useStoreList(requestsStore)
  const briefs = useStore(briefingsStore)
  const docs = useStore(docsStore)
  const rh = useStoreList(repairHoursStore)
  const me = emp('e4')!

  const inRepair = fleet.filter((u) => u.state === 'В ремонте')
  const toToday = repairs.filter((r) => r.kind === 'Плановое ТО' && r.status !== 'Закрыта' && r.planned === TODAY)
  const toOverdue = repairs.filter((r) => r.kind === 'Плановое ТО' && r.status !== 'Закрыта' && r.planned < TODAY)
  const fleetOverdue = fleet.filter((u) => u.nextTo < TODAY && !repairs.some((r) => r.equipmentId === u.id && r.kind === 'Плановое ТО' && r.status !== 'Закрыта'))
  const newReqs = reqs.rows.filter((q) => q.status === 'Отправлена')
  const todayBriefs = briefs.filter((b) => b.date.slice(0, 10) === TODAY && b.status !== 'Отменён')
  const payDocs = docs.filter((d) => d.pay === 'Ожидает оплаты')
  const paySum = payDocs.reduce((a, d) => a + docTotal(d), 0)
  const rhPending = rh.rows.filter((h) => h.status === 'На согласовании')
  const downtime = inRepair.reduce((a, u) => a + (u.repairStartedAt ? hoursBetween(u.repairStartedAt, NOW) : 0), 0)

  const accept = (id: string) => {
    const q = reqs.rows.find((x) => x.id === id)!
    const r = acceptRequest(q)
    toast(`Заявка принята, создана карточка ${r.number}. Водитель уведомлён в Telegram (демо)`)
  }

  return (
    <>
      <PageHead photo={equipmentPhoto('dumptruck', 'mech')} title="Дашборд механика" sub={`${shortName(me.name)} · ${me.position} · вторник, 13 октября 2026`}
        actions={<><button className="btn btn-secondary" onClick={() => go('briefings')}><ShieldCheck />Инструктажи</button><button className="btn btn-primary" onClick={() => go('repairs')}><Wrench />Доска ТО и ремонтов</button></>} />

      <div className="cx-stats" style={{ ['--n' as string]: 5 }}>
        <div className="cx-click" onClick={() => go('equipment')}><Stat icon={<Wrench />} label="Техника в ремонте" value={inRepair.length} delta={`простой ${hrs(Math.round(downtime))}`} trend="down" /></div>
        <div className="cx-click" onClick={() => go('repairs')}><Stat icon={<CalendarClock />} label="ТО сегодня / просрочено" value={<>{toToday.length}<span className="dim"> / </span><span className="cx-bad">{toOverdue.length + fleetOverdue.length}</span></>} delta="по графику ТО" /></div>
        <div className="cx-click" onClick={() => go('drivers')}><Stat icon={<Inbox />} label="Заявки от водителей" value={newReqs.length} delta={`всего активных: ${reqs.rows.filter((q) => q.status !== 'Решение' && q.status !== 'Отклонена').length}`} /></div>
        <div className="cx-click" onClick={() => go('briefings')}><Stat icon={<ShieldCheck />} label="Инструктажи сегодня" value={todayBriefs.length} delta={`${todayBriefs.reduce((a, b) => a + b.participants.length, 0)} водителей`} /></div>
        <div className="cx-click" onClick={() => go('docs')}><Stat icon={<FileText />} label="Документы к оплате" value={payDocs.length} delta={money(paySum)} /></div>
      </div>

      <div className="grid g2">
        <Panel icon={<Inbox />} tone="info" title="Заявки от водителей" count={newReqs.length} action={<MoreBtn onClick={() => go('drivers')}>Водители</MoreBtn>}>
          {newReqs.length ? newReqs.map((q) => (
            <LItem key={q.id} icon={<Avatar name={emp(q.driverId)?.name ?? ''} size="sm" />}
              title={<>{q.type === 'ТО' ? 'Заявка на ТО' : 'Заявка на ремонт'} · {eqTitle(q.equipmentId)}</>}
              sub={<>{empShort(q.driverId)} · {time(q.createdAt)} · «{q.text}»{q.media.length ? ` · ${q.media.join(', ')}` : ''}</>}
              right={<>
                <button className="btn btn-ok btn-sm" onClick={() => accept(q.id)}><Check />Принять</button>
                <button className="btn btn-ghost btn-sm btn-icon" aria-label="Отклонить" onClick={() => { reqs.patch(q.id, { status: 'Отклонена', answer: 'Отклонено механиком' }); toast('Заявка отклонена, водитель уведомлён') }}><X /></button>
              </>} />
          )) : <div className="cx-note" style={{ padding: '12px 0' }}>Новых заявок нет — все приняты в работу.</div>}
        </Panel>

        <Panel icon={<Wrench />} tone="warn" title="Техника в ремонте" count={inRepair.length} action={<MoreBtn onClick={() => go('equipment')}>Парк</MoreBtn>}>
          {inRepair.map((u) => {
            const r = repairs.find((x) => x.id === u.repairId)
            return (
              <LItem key={u.id} onClick={() => go('repairs')} icon={<Ico tone="warn"><Timer /></Ico>}
                title={<>{eqTitle(u.id)} <span className="dim mono">{eqPlate(u.id)}</span></>}
                sub={<>{r ? `${r.number} · ${r.title}` : 'Ремонт'} · с {dt(u.repairStartedAt ?? NOW)}</>}
                right={<>{r?.sub && <XBadge s={r.sub} />}<Badge tone="bad" plain>{hrs(Math.round(hoursBetween(u.repairStartedAt ?? NOW, NOW)))}</Badge></>} />
            )
          })}
        </Panel>

        <Panel icon={<CalendarClock />} tone="accent" title="ТО сегодня и просроченные" count={toToday.length + toOverdue.length + fleetOverdue.length} action={<MoreBtn onClick={() => go('repairs')}>График</MoreBtn>}>
          {[...toOverdue, ...toToday].map((r) => (
            <LItem key={r.id} onClick={() => go('repairs')} icon={<Ico tone={r.planned < TODAY ? 'bad' : 'accent'}>{r.planned < TODAY ? <AlertTriangle /> : <CalendarClock />}</Ico>}
              title={<>{r.number} · {eqTitle(r.equipmentId)}</>} sub={<>{r.title} · водитель {empShort(r.driverId)}</>}
              right={r.planned < TODAY ? <Badge tone="bad">Просрочено с {r.planned.slice(8, 10)}.{r.planned.slice(5, 7)}</Badge> : <XBadge s={r.status} />} />
          ))}
          {fleetOverdue.map((u) => (
            <LItem key={u.id} onClick={() => go('repairs')} icon={<Ico tone="bad"><AlertTriangle /></Ico>}
              title={<>{u.toKind} · {eqTitle(u.id)}</>} sub="Карточка ТО ещё не создана" right={<Badge tone="bad">Просрочено с {u.nextTo.slice(8, 10)}.{u.nextTo.slice(5, 7)}</Badge>} />
          ))}
        </Panel>

        <Panel icon={<ShieldCheck />} tone="ok" title="Инструктажи на сегодня" count={todayBriefs.length} action={<MoreBtn onClick={() => go('briefings')}>Журнал</MoreBtn>}>
          {todayBriefs.map((b) => {
            const done = b.participants.filter((p) => p.state === 'Пройден').length
            return (
              <LItem key={b.id} onClick={() => go('briefings')} icon={<Ico tone="ok"><ShieldCheck /></Ico>}
                title={<>{time(b.date)} · {b.topic}</>} sub={<>{b.kind} · {b.participants.map((p) => empShort(p.empId)).join(', ')}</>}
                right={<><span className="cx-mini tnum">{done}/{b.participants.length}</span><XBadge s={b.status} /></>} />
            )
          })}
        </Panel>

        <Panel icon={<FileText />} tone="warn" title="Документы (оплаты)" count={payDocs.length} action={<MoreBtn onClick={() => go('docs')}>Документооборот</MoreBtn>}>
          {payDocs.map((d) => (
            <LItem key={d.id} onClick={() => go('docs')} icon={<Ico tone="muted"><FileText /></Ico>}
              title={<>{d.type} {d.number}</>} sub={<>{d.supplier ?? '—'} · {eqTitle(d.equipmentId)}</>}
              right={<><span className="tnum" style={{ fontWeight: 600 }}>{money(docTotal(d))}</span><XBadge s={d.status} /></>} />
          ))}
          <div className="cx-total" style={{ marginTop: 8 }}><span className="muted">Итого к оплате</span><b>{money(paySum)}</b></div>
        </Panel>

        <Panel icon={<Timer />} tone="info" title="Ремонтные часы на согласовании" count={rhPending.length} action={<MoreBtn onClick={() => go('drivers')}>Водители</MoreBtn>}>
          {rhPending.length ? rhPending.map((h) => (
            <LItem key={h.id} icon={<Avatar name={emp(h.empId)?.name ?? ''} size="sm" />} title={<>{empShort(h.empId)} · {hrs(h.hours)}</>} sub={<>{eqTitle(h.equipmentId)} · {h.note}</>}
              right={<button className="btn btn-secondary btn-sm" onClick={() => { rh.patch(h.id, { status: 'Согласовано механиком' }); toast('Ремонтные часы согласованы и переданы кадровику') }}><Check />Согласовать</button>} />
          )) : <div className="cx-note" style={{ padding: '12px 0' }}>Все ремонтные часы согласованы.</div>}
          <div className="cx-note" style={{ marginTop: 8 }}>Ремонтные часы не выставляются клиенту — они идут в табель отдельно и учитываются в зарплате.</div>
        </Panel>
      </div>
    </>
  )
}
