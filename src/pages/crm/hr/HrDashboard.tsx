import { useNavigate } from 'react-router-dom'
import { CalendarOff, Check, ClipboardCheck, FileWarning, Gauge, ShieldOff, Timer, UserPlus } from 'lucide-react'
import type { CrmPageProps } from '../types'
import { Avatar, Badge, PageHead, Progress, Stat, date, daysBetween, useToast } from '../../../ui'
import { TODAY, emp, employees } from '../../../data/mock'
import {
  absencesStore, calcKpi, hireStages, hireStore, kpiStore, personDocsStore, repairHoursStore, useStore, useStoreList,
} from '../../../data/crm-c'
import { Ico, LItem, MoreBtn, Panel, XBadge, empShort, hrs, shortName } from '../mechanic/parts'

export default function HrDashboard({ role }: CrmPageProps) {
  const nav = useNavigate()
  const go = (p: string) => nav(`/crm/${role}/${p}`)
  const toast = useToast()
  const hire = useStore(hireStore)
  const docs = useStore(personDocsStore)
  const kpi = useStoreList(kpiStore)
  const abs = useStore(absencesStore)
  const rh = useStore(repairHoursStore)
  const me = emp('e6')!

  const inProcess = hire.filter((h) => h.stage !== 'Допущен')
  const stageOf = (id: string, def: string) => hire.find((h) => h.empId === id)?.stage ?? def
  const noAccess = employees.filter((e) => stageOf(e.id, e.hireStage) !== 'Допущен' || e.status === 'Заблокирован')
  const expired = docs.filter((d) => d.expires < TODAY)
  const expiring = docs.filter((d) => d.expires >= TODAY && daysBetween(TODAY, d.expires) <= 30)
  const onCheck = docs.filter((d) => d.status === 'На проверке')
  const kpiPending = kpi.rows.filter((k) => k.status === 'На утверждении')
  const absentNow = abs.filter((a) => a.from <= TODAY && a.to >= TODAY && a.status !== 'Закрыт')
  const rhToConfirm = rh.filter((h) => h.status === 'Согласовано механиком')

  return (
    <>
      <PageHead title="Дашборд кадровика" sub={`${shortName(me.name)} · ${me.position} · вторник, 13 октября 2026`}
        actions={<><button className="btn btn-secondary" onClick={() => go('kpi')}><Gauge />KPI и отчёты</button><button className="btn btn-primary" onClick={() => go('hiring')}><UserPlus />Приём и увольнение</button></>} />

      <div className="cx-stats">
        <div className="cx-click" onClick={() => go('hiring')}><Stat icon={<UserPlus />} label="Кандидаты в процессе" value={inProcess.length} delta={`на проверке документов: ${onCheck.length}`} /></div>
        <div className="cx-click" onClick={() => go('hiring')}><Stat icon={<ShieldOff />} label="Сотрудники без допуска" value={noAccess.length} delta="нет смен, техники и доступа" trend="down" /></div>
        <div className="cx-click" onClick={() => go('hiring')}><Stat icon={<FileWarning />} label="Просроченные документы" value={expired.length} delta={`истекают за 30 дней: ${expiring.length}`} trend="down" /></div>
        <div className="cx-click" onClick={() => go('kpi')}><Stat icon={<Gauge />} label="KPI на утверждении" value={kpiPending.length} delta="период: сентябрь 2026" /></div>
      </div>

      <div className="grid g2">
        <Panel icon={<ClipboardCheck />} tone="info" title="Воронка приёма" count={inProcess.length} action={<MoreBtn onClick={() => go('hiring')}>Канбан</MoreBtn>}>
          <div className="cx-funnel" style={{ padding: '6px 0 4px' }}>
            {hireStages.map((s) => { const n = hire.filter((h) => h.stage === s).length; return (
              <div key={s} className="cx-funnel-row"><span>{s}</span><Progress value={(n / Math.max(1, hire.length)) * 100} tone={s === 'Допущен' ? 'ok' : undefined} /><b className="tnum" style={{ textAlign: 'right' }}>{n}</b></div>
            ) })}
          </div>
          {inProcess.slice(0, 4).map((h) => {
            const d = h.checklist.filter((c) => c.done).length
            return <LItem key={h.id} onClick={() => go('hiring')} icon={<Avatar name={h.name} size="sm" />} title={h.name} sub={<>{h.position} · чек-лист {d}/{h.checklist.length}</>} right={<XBadge s={h.stage} />} />
          })}
        </Panel>

        <Panel icon={<ShieldOff />} tone="bad" title="Сотрудники без допуска" count={noAccess.length} action={<MoreBtn onClick={() => go('employees')}>Сотрудники</MoreBtn>}>
          {noAccess.map((e) => (
            <LItem key={e.id} icon={<Avatar name={e.name} size="sm" />} title={e.name} sub={<>{e.position} · без «Допущен» смены и техника не назначаются</>} right={<XBadge s={e.status === 'Заблокирован' ? e.status : stageOf(e.id, e.hireStage)} />} />
          ))}
        </Panel>

        <Panel icon={<FileWarning />} tone="warn" title="Просроченные и истекающие документы" count={expired.length + expiring.length} action={<MoreBtn onClick={() => go('hiring')}>Проверка</MoreBtn>}>
          {[...expired, ...expiring].map((d) => {
            const left = daysBetween(TODAY, d.expires)
            return <LItem key={d.id} icon={<Ico tone={left < 0 ? 'bad' : 'warn'}><FileWarning /></Ico>} title={<>{d.type} · {empShort(d.empId)}</>} sub={<>{d.number} · действует до {date(d.expires)}</>}
              right={<><Badge tone={left < 0 ? 'bad' : 'warn'}>{left < 0 ? `просрочен ${-left} дн.` : `осталось ${left} дн.`}</Badge><button className="btn btn-ghost btn-sm" onClick={() => toast(`Запрос на обновление документа отправлен ${empShort(d.empId)} в Telegram (демо)`)}>Запросить</button></>} />
          })}
        </Panel>

        <Panel icon={<Gauge />} tone="accent" title="KPI на утверждении" count={kpiPending.length} action={<MoreBtn onClick={() => go('kpi')}>Расчёт</MoreBtn>}>
          {kpiPending.slice(0, 6).map((k) => {
            const v = calcKpi(k).kpi
            return <LItem key={k.id} icon={<Avatar name={emp(k.empId)?.name ?? ''} size="sm" />} title={empShort(k.empId)} sub={`${emp(k.empId)?.position} · явка ${k.attendance}% · нарушений ${k.violations}`}
              right={<><b className={`tnum ${v >= 85 ? 'cx-ok' : v >= 70 ? 'cx-warn' : 'cx-bad'}`}>{v}%</b><button className="btn btn-secondary btn-sm" onClick={() => { kpi.patch(k.id, { status: 'Утверждён' }); toast(`KPI ${empShort(k.empId)} утверждён`) }}><Check />Утвердить</button></>} />
          })}
        </Panel>

        <Panel icon={<CalendarOff />} tone="muted" title="Отсутствуют сегодня" count={absentNow.length} action={<MoreBtn onClick={() => go('hiring')}>Отпуска</MoreBtn>}>
          {absentNow.map((a) => <LItem key={a.id} icon={<Avatar name={emp(a.empId)?.name ?? ''} size="sm" />} title={empShort(a.empId)} sub={<>{date(a.from)} — {date(a.to)} · {a.note}</>} right={<XBadge s={a.kind === 'Больничный' ? 'На больничном' : a.kind} />} />)}
        </Panel>

        <Panel icon={<Timer />} tone="info" title="Ремонтные часы к подтверждению" count={rhToConfirm.length} action={<MoreBtn onClick={() => go('hiring')}>Подтвердить</MoreBtn>}>
          {rhToConfirm.length ? rhToConfirm.map((h) => <LItem key={h.id} icon={<Avatar name={emp(h.empId)?.name ?? ''} size="sm" />} title={<>{empShort(h.empId)} · {hrs(h.hours)}</>} sub={<>{date(h.date)} · {h.note}</>} right={<XBadge s={h.status} />} />)
            : <div className="cx-note" style={{ padding: '12px 0' }}>Нет часов, ожидающих подтверждения.</div>}
        </Panel>
      </div>
    </>
  )
}
