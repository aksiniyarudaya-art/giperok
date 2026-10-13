/* Демо-данные для разделов CRM 9–16: рейсы и смены, бухгалтерия, учёт времени,
   документооборот, мотивация, инструкции, чаты. Строятся на общих mock-данных. */
import { companies, drivers, emp, employees, eq, equipment, orders, sites, TODAY } from './mock'
import { workMode, type Role } from './types'
import type { ChatThread } from '../ui/Chat'

/* ---------------- Рейсы, смены, вахты ---------------- */
export type TripMode = 'смена' | 'рейс' | 'вахта'
export type TripStatus = 'Новая' | 'Начатая' | 'Завершённая' | 'Отклонённая'
export type Attendance = 'Ожидается' | 'Вышел' | 'Опоздал' | 'Не вышел' | 'Замена'
export type Trip = {
  id: string
  number: string
  mode: TripMode
  date: string
  start: string
  end: string
  /** вахта: количество дней */
  days?: number
  hours: number
  weekend: boolean
  equipmentId: string
  driverId: string
  siteId: string
  cost: number
  to: boolean
  docs: string[]
  note: string
  status: TripStatus
  attendance: Attendance
  violations: string[]
  /** баллы мотивации, начисленные/снятые по смене */
  motivation: number
  /** для рейсов: количество ходок */
  runs?: number
  archived?: boolean
  blocked?: boolean
}

const addHours = (start: string, h: number) => {
  const [hh, mm] = start.split(':').map(Number)
  const t = (hh * 60 + mm + h * 60) % (24 * 60)
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}
export const isWeekend = (iso: string) => [0, 6].includes(new Date(iso).getDay())
export const tripEnd = addHours

const statusMap: Record<string, TripStatus> = {
  'Новая': 'Новая', 'На модерации': 'Новая', 'В работе': 'Начатая', 'Выполнена': 'Завершённая', 'Ожидает оплаты': 'Завершённая', 'Отменена': 'Отклонённая',
}
const violationsPool = [['Опоздание на объект 35 мин'], [], [], ['Превышение скорости (трекер)'], [], ['Нет фото путевого листа'], [], []]

const fromOrders: Trip[] = orders.map((o, i) => {
  const e = eq(o.equipmentId)!
  const mode = workMode[e.category]
  const status = statusMap[o.status]
  const days = mode === 'вахта' ? [15, 10, 7][i % 3] : undefined
  const hours = mode === 'вахта' ? (days ?? 7) * 10 : o.hours
  const viol = status === 'Новая' ? [] : violationsPool[i % violationsPool.length]
  const attendance: Attendance = status === 'Новая' ? 'Ожидается' : status === 'Отклонённая' ? 'Не вышел' : viol[0]?.startsWith('Опоздание') ? 'Опоздал' : i % 9 === 4 ? 'Замена' : 'Вышел'
  return {
    id: `t${i + 1}`,
    number: `${mode === 'смена' ? 'СМ' : mode === 'рейс' ? 'РС' : 'ВХ'}-${1040 + i}`,
    mode, date: o.date, start: o.start, end: mode === 'вахта' ? o.start : addHours(o.start, o.hours), days, hours,
    weekend: isWeekend(o.date),
    equipmentId: e.id, driverId: o.driverId, siteId: o.siteId,
    cost: mode === 'вахта' ? e.pricePerHour * hours : o.cost,
    to: i % 6 === 2,
    docs: status === 'Завершённая' ? ['Путевой лист', 'Табель', 'Акт'] : status === 'Начатая' ? ['Путевой лист'] : [],
    note: o.comment,
    status,
    attendance,
    violations: viol,
    motivation: viol.length ? -5 : status === 'Завершённая' ? 3 : 0,
    runs: mode === 'рейс' ? 3 + (i % 5) : undefined,
  }
})

const extra: Trip[] = [
  { id: 't-x1', number: 'ВХ-1101', mode: 'вахта', date: '2026-10-01', start: '07:00', end: '07:00', days: 15, hours: 150, weekend: false, equipmentId: 'eq15', driverId: 'd6', siteId: 's2', cost: 16500, to: true, docs: ['Путевой лист', 'Табель вахты'], note: 'Вахта 15/15, проживание в бытовке подрядчика', status: 'Начатая', attendance: 'Замена', violations: [], motivation: 0 },
  { id: 't-x2', number: 'ВХ-1102', mode: 'вахта', date: '2026-10-16', start: '07:00', end: '07:00', days: 15, hours: 150, weekend: false, equipmentId: 'eq16', driverId: 'd8', siteId: 's5', cost: 21000, to: false, docs: [], note: 'Смена вахты, передача техники на объекте', status: 'Новая', attendance: 'Ожидается', violations: [], motivation: 0 },
  { id: 't-x3', number: 'РС-1103', mode: 'рейс', date: '2026-10-13', start: '06:30', end: '14:30', hours: 8, weekend: false, equipmentId: 'eq13', driverId: 'd7', siteId: 's1', cost: 720, to: false, docs: ['Путевой лист'], note: 'Вывоз грунта на полигон «Северный», 4 ходки', status: 'Начатая', attendance: 'Вышел', violations: [], motivation: 0, runs: 4 },
  { id: 't-x4', number: 'СМ-1104', mode: 'смена', date: '2026-10-17', start: '09:00', end: '17:00', hours: 8, weekend: true, equipmentId: 'eq19', driverId: 'd10', siteId: 's3', cost: 1020, to: false, docs: [], note: 'Работа в выходной: монтаж вывески, коэффициент 1,5', status: 'Новая', attendance: 'Ожидается', violations: [], motivation: 0 },
]
export const trips: Trip[] = [...extra, ...fromOrders]

export const modeMeta: Record<TripMode, { title: string; plural: string; cats: string }> = {
  'смена': { title: 'Смены', plural: 'смен', cats: 'Экскаваторы, погрузчики, автокраны, автовышки' },
  'рейс': { title: 'Рейсы', plural: 'рейсов', cats: 'Самосвалы, манипуляторы' },
  'вахта': { title: 'Вахты', plural: 'вахт', cats: 'Бульдозеры и гусеничная техника' },
}

/* ---------------- Бухгалтерия ---------------- */
export type TimesheetStatus = 'Черновик' | 'На проверке' | 'Подтверждено'
export type DocFlow = 'Не сформированы' | 'Сформированы' | 'Подписаны ЭЦП' | 'Отправлены' | 'Доставлен' | 'Доставлен и прочитан'
export const docFlow: DocFlow[] = ['Не сформированы', 'Сформированы', 'Подписаны ЭЦП', 'Отправлены', 'Доставлен', 'Доставлен и прочитан']
export type Deal = {
  id: string
  orderId: string
  number: string
  date: string
  clientId: string
  siteId: string
  equipmentId: string
  own: boolean
  planHours: number
  factHours: number
  factSource: 'ПЛ водителя (фото)' | 'Ручной ввод менеджера'
  rate: number
  delivery: number
  contractorRate: number
  contractorDelivery: number
  fuel: number
  fuelOurs: boolean
  salary: number
  pay: 'Оплачено' | 'Частично' | 'Долг'
  paid: number
  timesheet: TimesheetStatus
  docs: DocFlow
  channel?: string
  notices: string[]
}

export const deals: Deal[] = orders
  .filter((o) => ['Выполнена', 'Ожидает оплаты', 'В работе'].includes(o.status))
  .map((o, i) => {
    const e = eq(o.equipmentId)!
    const own = e.own
    const factHours = o.status === 'В работе' ? Math.max(0, o.hours - 2) : o.hours + ([0, 1, 2, 0, -1][i % 5])
    const income = factHours * e.pricePerHour + o.delivery
    const pay = o.pay
    const ts: TimesheetStatus = o.status === 'В работе' ? 'Черновик' : i % 4 === 1 ? 'На проверке' : 'Подтверждено'
    const docs: DocFlow = ts !== 'Подтверждено' ? 'Не сформированы' : (['Доставлен и прочитан', 'Не сформированы', 'Отправлены', 'Доставлен и прочитан', 'Подписаны ЭЦП'] as DocFlow[])[i % 5]
    return {
      id: `dl${i + 1}`, orderId: o.id, number: o.number, date: o.date, clientId: o.clientId, siteId: o.siteId, equipmentId: e.id, own,
      planHours: o.hours, factHours,
      factSource: own ? 'ПЛ водителя (фото)' : 'Ручной ввод менеджера',
      rate: e.pricePerHour, delivery: o.delivery,
      contractorRate: own ? 0 : e.rentCostForUs ?? Math.round(e.pricePerHour * 0.78),
      contractorDelivery: own ? 0 : Math.round(o.delivery * 0.8),
      fuel: own ? Math.round(factHours * 11 * 2.45) : i % 3 === 0 ? Math.round(factHours * 10 * 2.45) : 0,
      fuelOurs: own || i % 3 === 0,
      salary: own ? factHours * 14 : 0,
      pay, paid: pay === 'Оплачено' ? income : pay === 'Частично' ? Math.round(income / 2) : 0,
      timesheet: ts, docs,
      channel: docs === 'Не сформированы' ? undefined : 'ЭДО',
      notices: pay === 'Долг' ? [`${o.date.slice(8)}.10 — счёт выставлен, оплата не поступила`] : [],
    }
  })

export const dealIncome = (d: Deal) => d.factHours * d.rate + d.delivery
export const dealPlanIncome = (d: Deal) => d.planHours * d.rate + d.delivery
export const dealSubrent = (d: Deal) => (d.own ? 0 : d.factHours * d.contractorRate + d.contractorDelivery)
export const dealCosts = (d: Deal) => dealSubrent(d) + d.salary + (d.fuelOurs ? d.fuel : 0)
export const dealGross = (d: Deal) => dealIncome(d) - dealCosts(d)
export const dealRoi = (d: Deal) => { const c = dealCosts(d); return c ? Math.round((dealGross(d) / c) * 100) : 100 }

export type Expense = { id: string; date: string; kind: 'Субаренда' | 'Топливо' | 'Ремонт'; title: string; counterparty: string; amount: number; status: 'Оплачено' | 'Ожидает оплаты' | 'Частично'; equipmentId?: string }
export const expenses: Expense[] = [
  ...deals.filter((d) => !d.own).map((d, i): Expense => ({
    id: `ex-s${i}`, date: d.date, kind: 'Субаренда', title: `Субаренда ${eq(d.equipmentId)!.title} по ${d.number}`,
    counterparty: companies.find((c) => c.id === eq(d.equipmentId)!.ownerId)?.name ?? '—', amount: dealSubrent(d), status: i % 3 === 0 ? 'Ожидает оплаты' : 'Оплачено', equipmentId: d.equipmentId,
  })),
  { id: 'ex-f1', date: '2026-10-12', kind: 'Топливо', title: 'ДТ по топливным картам, неделя 41', counterparty: 'РУП «Белоруснефть»', amount: 6840, status: 'Оплачено' },
  { id: 'ex-f2', date: '2026-10-05', kind: 'Топливо', title: 'ДТ по топливным картам, неделя 40', counterparty: 'РУП «Белоруснефть»', amount: 7215, status: 'Оплачено' },
  { id: 'ex-f3', date: '2026-10-13', kind: 'Топливо', title: 'Топливозаправщик на объект «Развязка М1»', counterparty: 'ООО «ТопливоСервис»', amount: 1960, status: 'Ожидает оплаты' },
  { id: 'ex-r1', date: '2026-10-09', kind: 'Ремонт', title: 'Замена гидроцилиндра стрелы', counterparty: 'ООО «ГидроМастер»', amount: 3420, status: 'Оплачено', equipmentId: 'eq10' },
  { id: 'ex-r2', date: '2026-10-11', kind: 'Ремонт', title: 'ТО-2, фильтры и масла', counterparty: 'Собственный сервис', amount: 860, status: 'Оплачено', equipmentId: 'eq1' },
  { id: 'ex-r3', date: '2026-10-13', kind: 'Ремонт', title: 'Шины 315/80 R22.5, 4 шт.', counterparty: 'ЧТУП «ШинТорг»', amount: 4180, status: 'Частично', equipmentId: 'eq11' },
]

export type Salary = { id: string; employeeId: string; base: number; hours: number; overtime: number; bonus: number; fines: number; status: 'Начислено' | 'Выплачено' | 'На утверждении' }
export const salaries: Salary[] = employees.filter((e) => e.hireStage === 'Допущен').map((e, i) => ({
  id: `sal-${e.id}`, employeeId: e.id, base: e.salary,
  hours: e.role === 'driver' ? 168 + (i % 4) * 6 : 168,
  overtime: e.role === 'driver' ? (i % 4) * 6 : e.role === 'mechanic' ? 8 : 0,
  bonus: Math.round(e.kpi * (e.role === 'manager' ? 9 : 5)),
  fines: i % 5 === 3 ? 120 : i % 7 === 2 ? 60 : 0,
  status: i % 3 === 0 ? 'На утверждении' : 'Начислено',
}))
export const salaryTotal = (s: Salary) => {
  const rate = s.base / 168
  return Math.round(s.base + s.overtime * rate * 1.5 + s.bonus - s.fines)
}

export type PlanPayment = { id: string; date: string; dir: 'Поступление' | 'Платёж'; counterparty: string; purpose: string; amount: number; status: 'Запланирован' | 'Утверждён' | 'Исполнен' | 'Просрочен' }
export const paymentPlan: PlanPayment[] = [
  { id: 'pp1', date: '2026-10-08', dir: 'Поступление', counterparty: 'ОАО «Белдорстрой-7»', purpose: 'Оплата по актам сентября', amount: 18500, status: 'Просрочен' },
  { id: 'pp2', date: '2026-10-14', dir: 'Платёж', counterparty: 'ООО «ТехноПарк Аренда»', purpose: 'Субаренда, 1-я половина октября', amount: 9420, status: 'Утверждён' },
  { id: 'pp3', date: '2026-10-15', dir: 'Поступление', counterparty: 'ООО «СтройМонолит»', purpose: 'Аванс 50% по договору А-2610', amount: 6200, status: 'Запланирован' },
  { id: 'pp4', date: '2026-10-15', dir: 'Платёж', counterparty: 'Сотрудники', purpose: 'Аванс по заработной плате', amount: 21400, status: 'Утверждён' },
  { id: 'pp5', date: '2026-10-17', dir: 'Поступление', counterparty: 'ООО «ГродноИнвестСтрой»', purpose: 'Погашение задолженности', amount: 12400, status: 'Запланирован' },
  { id: 'pp6', date: '2026-10-20', dir: 'Платёж', counterparty: 'ЧТУП «КранСервис»', purpose: 'Субаренда автокрана Liebherr', amount: 7800, status: 'Запланирован' },
  { id: 'pp7', date: '2026-10-05', dir: 'Платёж', counterparty: 'РУП «Белоруснефть»', purpose: 'Топливные карты', amount: 7215, status: 'Исполнен' },
  { id: 'pp8', date: '2026-10-22', dir: 'Поступление', counterparty: 'ЧУП «Гарант-Девелопмент»', purpose: 'Оплата после подписания договора', amount: 4300, status: 'Запланирован' },
]

export const monthly = [
  { label: 'Май', value: 148000, value2: 96000 },
  { label: 'Июн', value: 172000, value2: 108000 },
  { label: 'Июл', value: 195000, value2: 121000 },
  { label: 'Авг', value: 188000, value2: 117000 },
  { label: 'Сен', value: 204000, value2: 126000 },
  { label: 'Окт', value: 96000, value2: 61000 },
]

/* ---------------- Учёт времени ---------------- */
export const weekDays = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18']
export type TimeRow = { id: string; employeeId: string; work: number[]; repair: number[]; absence: (string | null)[] }
export const timesheet: TimeRow[] = employees.filter((e) => e.hireStage === 'Допущен').map((e, i) => {
  const isDrv = e.role === 'driver', isMech = e.role === 'mechanic'
  const absent = e.status === 'Отпуск' ? 'О' : e.status === 'На больничном' ? 'Б' : null
  const work = weekDays.map((d, k) => {
    if (absent) return 0
    if (k > 1) return 0 // будущие дни — плановый ноль, заполняется по факту
    if (isWeekend(d)) return 0
    if (e.shiftState === 'Не вышел' && k === 1) return 0
    return isDrv ? [8, 10, 12, 9, 11][(i + k) % 5] : isMech ? [6, 7][k % 2] : [8, 9, 8][(i + k) % 3]
  })
  const plan = weekDays.map((d, k) => (absent || isWeekend(d) ? 0 : k > 1 ? (isDrv ? 10 : 8) : 0))
  const repair = weekDays.map((_, k) => (absent || k > 1 ? 0 : isMech ? [3, 2][k % 2] : isDrv && (i + k) % 4 === 0 ? 2 : 0))
  return {
    id: `ts-${e.id}`, employeeId: e.id,
    work: work.map((w, k) => w || plan[k]),
    repair,
    absence: weekDays.map((d, k) => (absent ? absent : e.shiftState === 'Не вышел' && k === 1 ? 'НВ' : isWeekend(d) ? 'В' : null)),
  }
})
export const NORM_DAY = 8

/* ---------------- Документооборот ---------------- */
export type DocType = 'Договор с арендатором' | 'Договор с арендодателем' | 'Трудовой договор' | 'Счёт' | 'Акт' | 'Протокол разногласий'
export type DocReturn = 'На подписи у клиента' | 'В офисе' | 'Оригинал получен'
export type DocRow = {
  id: string; number: string; type: DocType; counterparty: string; orderNumber?: string; amount?: number
  issued: string; due: string; returned?: string; status: DocReturn; responsibleId: string; approved: boolean; archived?: boolean
}
const docSeeds: [DocType, string, number | undefined, string, string, string | undefined, DocReturn][] = [
  ['Договор с арендатором', 'ООО «СтройМонолит»', undefined, '2026-09-01', '2026-09-08', '2026-09-06', 'Оригинал получен'],
  ['Договор с арендатором', 'ЧУП «Гарант-Девелопмент»', undefined, '2026-10-02', '2026-10-09', undefined, 'На подписи у клиента'],
  ['Договор с арендатором', 'ООО «ГродноИнвестСтрой»', undefined, '2026-08-15', '2026-08-22', '2026-08-28', 'Оригинал получен'],
  ['Договор с арендодателем', 'ООО «ТехноПарк Аренда»', undefined, '2026-07-10', '2026-07-17', '2026-07-15', 'Оригинал получен'],
  ['Договор с арендодателем', 'ИП Левчук Роман Игоревич', undefined, '2026-10-06', '2026-10-13', undefined, 'В офисе'],
  ['Трудовой договор', 'Волков Кирилл Денисович', undefined, '2026-10-09', '2026-10-12', undefined, 'В офисе'],
  ['Трудовой договор', 'Ярошевич Антон Павлович', undefined, '2026-10-10', '2026-10-14', undefined, 'На подписи у клиента'],
  ['Счёт', 'ОАО «Белдорстрой-7»', 18500, '2026-09-25', '2026-10-02', undefined, 'На подписи у клиента'],
  ['Счёт', 'ООО «СтройМонолит»', 6200, '2026-10-10', '2026-10-15', undefined, 'На подписи у клиента'],
  ['Счёт', 'ООО «ГродноИнвестСтрой»', 12400, '2026-09-20', '2026-09-27', '2026-10-01', 'Оригинал получен'],
  ['Акт', 'ОАО «Белдорстрой-7»', 18500, '2026-09-30', '2026-10-05', undefined, 'На подписи у клиента'],
  ['Акт', 'ООО «СтройМонолит»', 4820, '2026-10-07', '2026-10-12', '2026-10-12', 'Оригинал получен'],
  ['Акт', 'Жук Павел Валерьевич', 980, '2026-10-11', '2026-10-16', undefined, 'В офисе'],
  ['Протокол разногласий', 'ОАО «Белдорстрой-7»', undefined, '2026-10-03', '2026-10-08', undefined, 'На подписи у клиента'],
  ['Протокол разногласий', 'ЧТУП «КранСервис»', undefined, '2026-09-12', '2026-09-19', '2026-09-24', 'Оригинал получен'],
]
export const documents: DocRow[] = docSeeds.map(([type, cp, amount, issued, due, returned, status], i) => ({
  id: `doc${i + 1}`,
  number: `${type.startsWith('Договор') || type === 'Трудовой договор' ? 'Д' : type === 'Счёт' ? 'СЧ' : type === 'Акт' ? 'АКТ' : 'ПР'}-${String(2026)}/${120 + i}`,
  type, counterparty: cp, amount, issued, due, returned, status,
  orderNumber: type === 'Счёт' || type === 'Акт' ? orders[i % orders.length].number : undefined,
  responsibleId: ['e1', 'e2', 'e3', 'e6'][type === 'Трудовой договор' ? 3 : i % 3],
  approved: status === 'Оригинал получен' || i % 4 === 0,
}))
/** Дни задержки возврата оригинала относительно срока (или TODAY, если ещё не вернули). */
export const delayDays = (d: DocRow) => {
  const end = d.returned ?? TODAY
  const diff = Math.round((new Date(end).getTime() - new Date(d.due).getTime()) / 86400000)
  return Math.max(0, diff)
}

/* ---------------- Мотивация ---------------- */
export type MotivationEvent = { id: string; employeeId: string; date: string; kind: 'Бонус' | 'Штраф'; amount: number; points: number; reason: string }
export type MotivationRow = { id: string; employeeId: string; kpi: number; rating: number; plan: number; fact: number; bonus: number; fines: number; approved: boolean }
export const motivation: MotivationRow[] = employees.filter((e) => ['manager', 'driver', 'mechanic'].includes(e.role) && e.hireStage === 'Допущен').map((e, i) => ({
  id: `mv-${e.id}`, employeeId: e.id, kpi: e.kpi, rating: e.rating,
  plan: e.role === 'manager' ? 60000 : e.role === 'driver' ? 176 : 24,
  fact: e.role === 'manager' ? Math.round(60000 * e.kpi / 100) : e.role === 'driver' ? Math.round(176 * e.kpi / 100) : Math.round(24 * e.kpi / 100),
  bonus: Math.round(e.kpi * (e.role === 'manager' ? 9 : 5)),
  fines: i % 5 === 3 ? 120 : i % 7 === 2 ? 60 : 0,
  approved: i % 3 !== 0,
}))
export const motivationUnits: Record<string, string> = { manager: 'BYN выручки', driver: 'отраб. часов', mechanic: 'закрытых ТО/ремонтов' }
export const motivationEvents: MotivationEvent[] = [
  { id: 'me1', employeeId: 'd4', date: '2026-10-13', kind: 'Штраф', amount: 60, points: -10, reason: 'Невыход на смену СМ-1043 без предупреждения' },
  { id: 'me2', employeeId: 'd1', date: '2026-10-12', kind: 'Бонус', amount: 80, points: 5, reason: 'Смена без замечаний, ПЛ загружен вовремя' },
  { id: 'me3', employeeId: 'd2', date: '2026-10-11', kind: 'Штраф', amount: 40, points: -5, reason: 'Опоздание на объект 35 мин' },
  { id: 'me4', employeeId: 'e2', date: '2026-10-10', kind: 'Бонус', amount: 150, points: 8, reason: 'Привлечён новый клиент ООО «ГродноИнвестСтрой»' },
  { id: 'me5', employeeId: 'e5', date: '2026-10-09', kind: 'Бонус', amount: 70, points: 4, reason: 'Ремонт экскаватора закрыт на сутки раньше срока' },
  { id: 'me6', employeeId: 'd7', date: '2026-10-08', kind: 'Штраф', amount: 50, points: -5, reason: 'Нет фото путевого листа' },
]

/* ---------------- Инструкции ---------------- */
export type Instruction = { id: string; title: string; category: string; roles: Role[]; required: boolean; version: string; updated: string; authorId: string; read: number; total: number; body: string; archived?: boolean }
export const instructions: Instruction[] = [
  { id: 'in1', title: 'Приём техники перед сменой: чек-лист ТМЦ', category: 'Смены', roles: ['driver', 'mechanic'], required: true, version: '2.1', updated: '2026-10-01', authorId: 'e4', read: 8, total: 10, body: 'Перед началом смены водитель проверяет комплектность: инструменты, рация, GPS-трекер, огнетушитель, аптечка, знак аварийной остановки. Фото приборной панели и моточасов загружаются в приложение. При расхождениях — заявка механику до выезда.' },
  { id: 'in2', title: 'Оформление путевого листа и фото в конце дня', category: 'Документы', roles: ['driver', 'manager'], required: true, version: '1.4', updated: '2026-09-18', authorId: 'e1', read: 9, total: 13, body: 'Путевой лист заполняется на каждую смену/рейс. В конце дня водитель фотографирует ПЛ с отметкой прораба и загружает в приложение — фото становится основанием для табеля и счёта клиенту.' },
  { id: 'in3', title: 'Работа вблизи ЛЭП и газопроводов', category: 'Охрана труда', roles: ['driver', 'mechanic', 'manager'], required: true, version: '3.0', updated: '2026-08-30', authorId: 'e4', read: 11, total: 15, body: 'Работа в охранной зоне допускается только по наряду-допуску. Минимальное расстояние до проводов ЛЭП 10 кВ — 2 м. Перед началом работ — инструктаж на объекте и подпись в журнале.' },
  { id: 'in4', title: 'Регламент работы с заявками колл-центра', category: 'Продажи', roles: ['manager'], required: false, version: '1.2', updated: '2026-10-05', authorId: 'e1', read: 3, total: 3, body: 'Входящая заявка обрабатывается в течение 15 минут. Проверить наличие договора, свободную технику и водителя, согласовать доставку. После подтверждения — карточка заказа и уведомление водителю.' },
  { id: 'in5', title: 'Порядок списания запчастей и фотофиксации', category: 'Ремонт', roles: ['mechanic'], required: false, version: '1.0', updated: '2026-07-22', authorId: 'e4', read: 2, total: 2, body: 'Каждая запчасть списывается на конкретную единицу техники с фото до и после замены. Акт списания подписывает главный механик.' },
  { id: 'in6', title: 'Оформление отпусков и больничных', category: 'Кадры', roles: ['driver', 'mechanic', 'manager', 'hr'], required: false, version: '1.1', updated: '2026-06-14', authorId: 'e6', read: 12, total: 16, body: 'Заявка на отпуск подаётся через приложение не позднее чем за 14 дней. Больничный — уведомление в день открытия и фото листка нетрудоспособности.' },
  { id: 'in7', title: 'Критический долг клиента: порядок блокировки', category: 'Финансы', roles: ['manager', 'admin'], required: true, version: '1.0', updated: '2026-10-10', authorId: 'e7', read: 2, total: 4, body: 'При статусе «Критический долг» назначение техники на объекты клиента блокируется. Разблокировка — только с подтверждением финансового директора с указанием причины.' },
]

/* ---------------- Чаты ---------------- */
export const chatSeed: ChatThread[] = [
  { id: 'ch1', title: 'Диспетчерская · смены', sub: '12 участников', group: true, unread: 3, msgs: [
    { from: 'Иванов С.', text: 'На «Соколе» начал, техника принята, фото ПЛ загрузил.', at: '07:52' },
    { from: 'Петрович А.', text: 'Стою на въезде в Брилевскую, пропуск не готов.', at: '08:05' },
    { from: 'Вы', me: true, text: 'Алексей, сейчас позвоню прорабу, 10 минут.', at: '08:07' },
    { from: 'Михалевич А.', text: 'Сегодня не выйду, температура. Заявку на больничный отправил.', at: '08:20' },
  ] },
  { id: 'ch2', title: 'Сидоренко Павел Николаевич', sub: 'Главный механик', unread: 1, msgs: [
    { from: 'Сидоренко П.', text: 'Liebherr после замены гидроцилиндра готов, можно ставить на заказы с четверга.', at: 'вчера' },
    { from: 'Вы', me: true, text: 'Принято, ставлю на «Брест Плаза».', at: 'вчера' },
    { from: 'Сидоренко П.', text: 'МАЗ 6501 — шины меняем завтра, до обеда не планируйте.', at: '09:14', file: 'Акт_дефектовки_МАЗ.pdf' },
  ] },
  { id: 'ch3', title: 'Менеджеры · коммерческий отдел', sub: '4 участника', group: true, msgs: [
    { from: 'Бондарь М.', text: 'Белдорстрой снова просит кран, но у них критический долг.', at: '10:02' },
    { from: 'Захарова Н.', text: 'Без подтверждения финдиректора не назначаем. Отправьте напоминание.', at: '10:05' },
  ] },
  { id: 'ch4', title: 'Мороз Татьяна Александровна', sub: 'Специалист по кадрам', msgs: [
    { from: 'Мороз Т.', text: 'Волков прошёл проверку документов, остался инструктаж.', at: '11:30' },
  ] },
  { id: 'ch5', title: 'Иванов Сергей Викторович', sub: 'Машинист экскаватора', msgs: [
    { from: 'Иванов С.', text: 'Ковш траншейный забрать со склада?', at: '07:10' },
    { from: 'Вы', me: true, text: 'Да, он закреплён за вашей машиной на неделю.', at: '07:12' },
  ] },
]

export const activeDrivers = drivers.filter((d) => d.hireStage === 'Допущен' && d.status === 'Активный')
export { emp, eq, equipment, sites, TODAY }
