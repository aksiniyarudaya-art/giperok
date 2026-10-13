/* Демо-данные для CRM (часть 2, разделы 1–8): профиль, дашборд, сотрудники, арендаторы,
   арендодатели, колл-центр, техника и ТО, заправка. Опирается на общие сущности из mock.ts. */
import type { Equipment, EquipmentCategory, Order } from './types'
import { companies, drivers, employees, equipment, orders, sites } from './mock'

export type CrmUserRole = 'manager' | 'mechanic' | 'hr' | 'admin'
export const userByRole: Record<CrmUserRole, string> = { manager: 'e1', mechanic: 'e4', hr: 'e6', admin: 'e7' }

/* ---------- Статус техники в CRM (раздел 7): в рейсе / свободна / ТО ---------- */
export type CrmEqStatus = 'В рейсе' | 'Свободна' | 'ТО'
export const crmEqStatus = (e: Equipment): CrmEqStatus =>
  e.status === 'В ремонте' ? 'ТО' : e.status === 'Арендована' || e.status === 'Забронирована' ? 'В рейсе' : 'Свободна'

/** Финансовая эффективность единицы техники за октябрь (по заявкам). */
export function eqFinance(e: Equipment, list: Order[] = orders) {
  const mine = list.filter((o) => o.equipmentId === e.id && o.status !== 'Отменена')
  const revenue = mine.reduce((a, o) => a + o.cost, 0)
  const hours = mine.reduce((a, o) => a + o.hours, 0)
  const cost = e.own
    ? Math.round(revenue * 0.38) + 420 // топливо, ЗП машиниста, амортизация
    : hours * (e.rentCostForUs ?? 0) + Math.round(revenue * 0.06)
  const profit = revenue - cost
  const util = Math.min(100, Math.round((hours / 176) * 100 * 3.2))
  return { revenue, cost, profit, margin: revenue ? Math.round((profit / revenue) * 100) : 0, hours, util, deals: mine.length }
}

/* ---------- История ремонтов ---------- */
export type RepairRec = { id: string; eqId: string; date: string; kind: 'Плановое ТО' | 'Внеплановый ремонт'; works: string; cost: number; downtime: number; mechanic: string }
const repairWorks = ['ТО-250: замена масла и фильтров', 'Замена РВД стрелы', 'Ремонт гидрораспределителя', 'ТО-500: фильтры, ремни, диагностика', 'Замена зубьев ковша', 'Ремонт стартера', 'Замена тормозных колодок', 'Регулировка клапанов']
export const repairs: RepairRec[] = equipment.flatMap((e, i) =>
  Array.from({ length: 1 + (i % 3) }, (_, k) => ({
    id: `rp${i}-${k}`, eqId: e.id,
    date: `2026-0${9 - k * 2 > 0 ? 9 - k * 2 : 1}-${String(5 + ((i * 7 + k * 3) % 20)).padStart(2, '0')}`,
    kind: (k + i) % 2 === 0 ? 'Плановое ТО' as const : 'Внеплановый ремонт' as const,
    works: repairWorks[(i + k * 3) % repairWorks.length],
    cost: 180 + ((i * 131 + k * 77) % 1400),
    downtime: 4 + ((i + k) % 5) * 6,
    mechanic: k % 2 ? 'Гриб В. П.' : 'Сидоренко П. Н.',
  })),
)

export const eqNotes: Record<string, string> = {
  eq1: 'Требует замены резины до зимы. Клиенты отмечают аккуратного машиниста.',
  eq2: 'Сезонная загрузка высокая — держать в резерве на ноябрь.',
  eq8: 'Аттестация ГПМ до 03.2027.',
  eq10: 'Работает только с допуском крановщика 6 разряда.',
}

/* ---------- ТО (только своя техника) ---------- */
export type ToStage = 'Заявка' | 'В процессе' | 'Закрыта'
export type ToDecision = '' | 'Ремонт' | 'Замена' | 'Субаренда'
export type ToRequest = {
  id: string; eqId: string; driverId: string; created: string; problem: string; urgency: 'Плановое' | 'Срочно' | 'Аварийно'
  stage: ToStage; status: string; mechanicId: string; diagnosis: string; works: string[]; decision: ToDecision
  outOfTrip: boolean; downtime: number; cost: number; closed?: string; replaceEqId?: string
}
export const toRequests: ToRequest[] = [
  { id: 'to1', eqId: 'eq4', driverId: 'd4', created: '2026-10-13T07:42:00', problem: 'Течь масла из-под гидроцилиндра рукояти, падает давление', urgency: 'Срочно', stage: 'Заявка', status: 'Новая', mechanicId: 'e4', diagnosis: '', works: [], decision: '', outOfTrip: false, downtime: 0, cost: 0 },
  { id: 'to2', eqId: 'eq20', driverId: 'd2', created: '2026-10-12T18:15:00', problem: 'Плановое ТО-500 по моточасам', urgency: 'Плановое', stage: 'Заявка', status: 'Новая', mechanicId: 'e5', diagnosis: '', works: [], decision: '', outOfTrip: false, downtime: 0, cost: 0 },
  { id: 'to3', eqId: 'eq7', driverId: 'd7', created: '2026-10-13T09:05:00', problem: 'Стук в ходовой, вибрация на холостых', urgency: 'Аварийно', stage: 'Заявка', status: 'Новая', mechanicId: 'e4', diagnosis: '', works: [], decision: '', outOfTrip: false, downtime: 0, cost: 0 },
  { id: 'to4', eqId: 'eq10', driverId: 'd3', created: '2026-10-10T11:00:00', problem: 'Ошибка ограничителя грузоподъёмности ОНК-160', urgency: 'Срочно', stage: 'В процессе', status: 'Ожидание запчастей', mechanicId: 'e4', diagnosis: 'Неисправен датчик длины стрелы, заказан новый (3–4 дня)', works: ['Диагностика ОНК', 'Демонтаж датчика'], decision: 'Ремонт', outOfTrip: true, downtime: 26, cost: 640 },
  { id: 'to5', eqId: 'eq1', driverId: 'd1', created: '2026-10-11T08:30:00', problem: 'Плановое ТО-250', urgency: 'Плановое', stage: 'В процессе', status: 'В работе', mechanicId: 'e5', diagnosis: 'Без замечаний, плановые работы', works: ['Замена масла ДВС', 'Фильтры топливные'], decision: 'Ремонт', outOfTrip: true, downtime: 6, cost: 310 },
  { id: 'to6', eqId: 'eq2', driverId: 'd2', created: '2026-09-28T10:00:00', problem: 'Перегрев гидравлики', urgency: 'Срочно', stage: 'Закрыта', status: 'Закрыта', mechanicId: 'e4', diagnosis: 'Забит радиатор масла', works: ['Промывка радиатора', 'Замена масла ГС'], decision: 'Ремонт', outOfTrip: true, downtime: 14, cost: 520, closed: '2026-09-29' },
  { id: 'to7', eqId: 'eq12', driverId: 'd7', created: '2026-09-15T13:20:00', problem: 'Трещина рамы кузова', urgency: 'Аварийно', stage: 'Закрыта', status: 'Закрыта', mechanicId: 'e5', diagnosis: 'Сварка невозможна на месте, техника заменена', works: ['Осмотр', 'Эвакуация'], decision: 'Замена', outOfTrip: true, downtime: 72, cost: 1450, closed: '2026-09-19', replaceEqId: 'eq23' },
  { id: 'to8', eqId: 'eq17', driverId: 'd5', created: '2026-09-02T09:00:00', problem: 'Плановое ТО крано-манипуляторной установки', urgency: 'Плановое', stage: 'Закрыта', status: 'Закрыта', mechanicId: 'e4', diagnosis: 'Плановые работы', works: ['Смазка узлов КМУ', 'Проверка тросов'], decision: 'Субаренда', outOfTrip: true, downtime: 8, cost: 260, closed: '2026-09-03' },
]

/* ---------- Заправка (раздел 8) ---------- */
export type FuelStage = 'Новые' | 'В работе' | 'Архивные'
export type FuelStatus = 'Новая' | 'Утверждена' | 'Заправлена' | 'На сверке' | 'Подтверждена' | 'Отклонена' | 'Расследование' | 'Заблокирована'
export type FuelReq = {
  id: string; date: string; eqId: string; driverId: string; siteId: string; liters: number; price: number
  status: FuelStatus; receipt: boolean; motoBefore: number; motoAfter: number; hoursWorked: number
  cardLiters?: number; station: string; comment: string; investigation?: string
}
/** Нормы расхода, л/моточас, по категории техники и виду работ. */
export const fuelNorm: Record<EquipmentCategory, number> = { excavator: 14, loader: 11, crane: 9, dumptruck: 12, bulldozer: 19, manipulator: 8, aerial: 6 }
export const FUEL_PRICE = 2.48
export const fuelReqs: FuelReq[] = [
  { id: 'f1', date: '2026-10-13T07:10:00', eqId: 'eq1', driverId: 'd1', siteId: 's1', liters: 120, price: FUEL_PRICE, status: 'Новая', receipt: false, motoBefore: 0, motoAfter: 0, hoursWorked: 0, station: 'Белоруснефть АЗС №41', comment: 'Нужна заправка — остаток 15%' },
  { id: 'f2', date: '2026-10-13T08:25:00', eqId: 'eq23', driverId: 'd5', siteId: 's2', liters: 200, price: FUEL_PRICE, status: 'Новая', receipt: false, motoBefore: 0, motoAfter: 0, hoursWorked: 0, station: 'Топливозаправщик на объекте', comment: '' },
  { id: 'f3', date: '2026-10-12T16:40:00', eqId: 'eq18', driverId: 'd5', siteId: 's4', liters: 90, price: FUEL_PRICE, status: 'Утверждена', receipt: false, motoBefore: 0, motoAfter: 0, hoursWorked: 0, station: 'Газпромнефть АЗС №7', comment: 'Вахта, ночная смена' },
  { id: 'f4', date: '2026-10-12T19:05:00', eqId: 'eq12', driverId: 'd2', siteId: 's5', liters: 180, price: FUEL_PRICE, status: 'На сверке', receipt: true, motoBefore: 4930, motoAfter: 4942, hoursWorked: 12, cardLiters: 180, station: 'Белоруснефть АЗС №12', comment: '' },
  { id: 'f5', date: '2026-10-12T18:20:00', eqId: 'eq7', driverId: 'd7', siteId: 's1', liters: 118, price: FUEL_PRICE, status: 'На сверке', receipt: true, motoBefore: 3110, motoAfter: 3120, hoursWorked: 10, cardLiters: 118, station: 'Белоруснефть АЗС №41', comment: 'Работа на погрузке' },
  { id: 'f6', date: '2026-10-11T17:45:00', eqId: 'eq4', driverId: 'd4', siteId: 's4', liters: 96, price: FUEL_PRICE, status: 'Заправлена', receipt: true, motoBefore: 2050, motoAfter: 2058, hoursWorked: 8, cardLiters: 96, station: 'А-100 АЗС №3', comment: '' },
  { id: 'f7', date: '2026-10-10T18:00:00', eqId: 'eq2', driverId: 'd2', siteId: 's1', liters: 150, price: FUEL_PRICE, status: 'Подтверждена', receipt: true, motoBefore: 6400, motoAfter: 6411, hoursWorked: 11, cardLiters: 150, station: 'Белоруснефть АЗС №41', comment: '' },
  { id: 'f8', date: '2026-10-09T17:30:00', eqId: 'eq15', driverId: 'd6', siteId: 's2', liters: 230, price: FUEL_PRICE, status: 'Расследование', receipt: true, motoBefore: 1510, motoAfter: 1520, hoursWorked: 10, cardLiters: 190, station: 'Газпромнефть АЗС №7', comment: '', investigation: 'Расхождение чека и топливной карты 40 л. Запрошены записи видеонаблюдения АЗС.' },
  { id: 'f9', date: '2026-10-08T18:10:00', eqId: 'eq1', driverId: 'd1', siteId: 's1', liters: 128, price: FUEL_PRICE, status: 'Подтверждена', receipt: true, motoBefore: 8090, motoAfter: 8099, hoursWorked: 9, cardLiters: 128, station: 'Белоруснефть АЗС №41', comment: '' },
  { id: 'f10', date: '2026-10-06T19:00:00', eqId: 'eq23', driverId: 'd7', siteId: 's5', liters: 90, price: FUEL_PRICE, status: 'Отклонена', receipt: false, motoBefore: 0, motoAfter: 0, hoursWorked: 0, station: '—', comment: 'Дубль заявки' },
]
export const fuelStage = (s: FuelStatus): FuelStage =>
  s === 'Новая' ? 'Новые' : s === 'Подтверждена' || s === 'Отклонена' || s === 'Заблокирована' ? 'Архивные' : 'В работе'

/* ---------- Колл-центр (раздел 6) ---------- */
export type CallDir = 'in' | 'out' // in — у нас арендуют, out — мы арендуем
export type CallStatus = 'Новая' | 'В работе' | 'Принята' | 'Отклонена' | 'Сделка запущена'
export type CallReq = {
  id: string; dir: CallDir; source: 'own' | 'attracted'; created: string; companyId?: string; companyName: string; contact: string; phone: string
  category: EquipmentCategory; eqId?: string; siteId?: string; address: string; dateFrom: string; hours: number; price: number
  status: CallStatus; reason?: string; managerId: string; comment: string; record?: { duration: number; at: string }
}
export const callReqs: CallReq[] = [
  { id: 'cr1', dir: 'in', source: 'own', created: '2026-10-13T09:12:00', companyId: 'c1', companyName: 'ООО «СтройМонолит»', contact: 'Лисовская Ирина Олеговна', phone: '+375 29 611-24-80', category: 'excavator', eqId: 'eq1', siteId: 's1', address: 'г. Минск, ул. Брилевская, 35', dateFrom: '2026-10-15', hours: 16, price: 1520, status: 'Новая', managerId: 'e3', comment: 'Вторая захватка котлована', record: { duration: 184, at: '2026-10-13T09:10:00' } },
  { id: 'cr2', dir: 'in', source: 'attracted', created: '2026-10-13T08:40:00', companyId: 'c5', companyName: 'ООО «ГродноИнвестСтрой»', contact: 'Адамович Анна Викторовна', phone: '+375 29 788-03-21', category: 'dumptruck', eqId: 'eq11', siteId: 's5', address: 'г. Лида, ул. Индустриальная, 4', dateFrom: '2026-10-14', hours: 24, price: 1560, status: 'В работе', managerId: 'e2', comment: '3 самосвала на вывоз грунта', record: { duration: 312, at: '2026-10-13T08:36:00' } },
  { id: 'cr3', dir: 'in', source: 'own', created: '2026-10-12T15:05:00', companyId: 'c3', companyName: 'ЧУП «Гарант-Девелопмент»', contact: 'Мельник Денис Андреевич', phone: '+375 33 355-90-12', category: 'crane', eqId: 'eq9', siteId: 's3', address: 'г. Брест, ул. Московская, 210', dateFrom: '2026-10-16', hours: 8, price: 1000, status: 'Принята', managerId: 'e1', comment: 'Монтаж витражей, нужен гусёк', record: { duration: 141, at: '2026-10-12T15:01:00' } },
  { id: 'cr4', dir: 'in', source: 'own', created: '2026-10-12T11:30:00', companyId: 'c2', companyName: 'ОАО «Белдорстрой-7»', contact: 'Гурин Олег Сергеевич', phone: '+375 44 702-11-45', category: 'bulldozer', eqId: 'eq15', siteId: 's2', address: 'Минский р-н, 12 км МКАД', dateFrom: '2026-10-14', hours: 60, price: 6600, status: 'Отклонена', reason: 'Критический долг клиента — до погашения', managerId: 'e2', comment: '', record: { duration: 95, at: '2026-10-12T11:28:00' } },
  { id: 'cr5', dir: 'in', source: 'own', created: '2026-10-11T10:00:00', companyId: 'c4', companyName: 'Жук Павел Валерьевич', contact: 'Жук Павел Валерьевич', phone: '+375 29 150-77-31', category: 'manipulator', eqId: 'eq18', siteId: 's4', address: 'аг. Ждановичи, ул. Лесная, 8', dateFrom: '2026-10-18', hours: 4, price: 290, status: 'Сделка запущена', managerId: 'e3', comment: 'Доставка бытовки', record: { duration: 76, at: '2026-10-11T09:58:00' } },
  { id: 'cr6', dir: 'in', source: 'attracted', created: '2026-10-13T10:02:00', companyName: 'ООО «ЛесТрансГрупп»', contact: 'Кулик Андрей', phone: '+375 25 904-33-17', category: 'loader', address: 'г. Борисов, ул. Заводская, 3', dateFrom: '2026-10-20', hours: 40, price: 2800, status: 'Новая', managerId: 'e3', comment: 'Новый клиент, пришёл с сайта' },
  { id: 'cr7', dir: 'out', source: 'attracted', created: '2026-10-13T08:10:00', companyId: 'l1', companyName: 'ООО «ТехноПарк Аренда»', contact: 'Котова Марина Юрьевна', phone: '+375 29 300-40-50', category: 'excavator', eqId: 'eq3', address: 'г. Минск, ул. Тимирязева, 67', dateFrom: '2026-10-15', hours: 16, price: 3250, status: 'В работе', managerId: 'e1', comment: 'Подмена своего экскаватора на время ТО', record: { duration: 228, at: '2026-10-13T08:05:00' } },
  { id: 'cr8', dir: 'out', source: 'attracted', created: '2026-10-12T14:20:00', companyId: 'l2', companyName: 'ЧТУП «КранСервис»', contact: 'Новик Алексей Владимирович', phone: '+375 33 640-22-10', category: 'loader', eqId: 'eq5', address: 'г. Брест, ул. Катин Бор, 102', dateFrom: '2026-10-16', hours: 8, price: 780, status: 'Принята', managerId: 'e1', comment: 'Под заявку Гарант-Девелопмент', record: { duration: 119, at: '2026-10-12T14:18:00' } },
  { id: 'cr9', dir: 'out', source: 'attracted', created: '2026-10-11T12:00:00', companyId: 'l3', companyName: 'ИП Левчук Роман Игоревич', contact: 'Левчук Роман Игоревич', phone: '+375 44 512-66-09', category: 'crane', eqId: 'eq8', address: 'г. Гомель, ул. Барыкина, 140', dateFrom: '2026-10-14', hours: 10, price: 700, status: 'Отклонена', reason: 'Нет договора, техника далеко от объекта', managerId: 'e2', comment: '' },
  { id: 'cr10', dir: 'out', source: 'own', created: '2026-10-13T07:55:00', companyId: 'l1', companyName: 'ООО «ТехноПарк Аренда»', contact: 'Котова Марина Юрьевна', phone: '+375 29 300-40-50', category: 'dumptruck', address: 'г. Минск, ул. Тимирязева, 67', dateFrom: '2026-10-17', hours: 24, price: 1300, status: 'Новая', managerId: 'e2', comment: 'Догрузить свой парк на МКАД — 2 самосвала', record: { duration: 64, at: '2026-10-13T07:52:00' } },
]

/* ---------- Сотрудники: заявки кадровику, допуски, увольнения (раздел 3) ---------- */
export type HrReqStage = 'Найти' | 'Проверка' | 'Оформлен' | 'В работе'
export type HrReq = { id: string; kind: 'Подбор' | 'Замена'; position: string; reason: string; replaceId?: string; created: string; deadline: string; stage: HrReqStage; candidate?: string; authorId: string }
export const hrReqs: HrReq[] = [
  { id: 'hq1', kind: 'Подбор', position: 'Машинист автокрана 25 т', reason: 'Рост заявок на краны, Брест', created: '2026-10-02', deadline: '2026-10-20', stage: 'Проверка', candidate: 'Ярошевич Антон Павлович', authorId: 'e1' },
  { id: 'hq2', kind: 'Замена', position: 'Машинист погрузчика', reason: 'Систематические невыходы', replaceId: 'd4', created: '2026-10-11', deadline: '2026-10-18', stage: 'Найти', authorId: 'e1' },
  { id: 'hq3', kind: 'Подбор', position: 'Водитель самосвала', reason: 'Вахта на МКАД', created: '2026-09-25', deadline: '2026-10-10', stage: 'Оформлен', candidate: 'Волков Кирилл Денисович', authorId: 'e2' },
  { id: 'hq4', kind: 'Подбор', position: 'Механик (выездной)', reason: 'Второй выездной экипаж', created: '2026-09-01', deadline: '2026-09-30', stage: 'В работе', candidate: 'Гриб Василий Петрович', authorId: 'e1' },
]
export const hrStages: HrReqStage[] = ['Найти', 'Проверка', 'Оформлен', 'В работе']

export type Admission = { id: string; empId: string; siteId: string; requested: string; note: string; status: 'Ожидает' | 'Согласован' | 'Отказано' }
export const admissions: Admission[] = [
  { id: 'ad1', empId: 'd9', siteId: 's2', requested: '2026-10-12', note: 'Инструктаж по объекту пройден, ждёт допуска', status: 'Ожидает' },
  { id: 'ad2', empId: 'd3', siteId: 's3', requested: '2026-10-13', note: 'Нужен допуск крановщика к ТЦ, пропуск', status: 'Ожидает' },
  { id: 'ad3', empId: 'e5', siteId: 's5', requested: '2026-10-09', note: 'Выездной ремонт на объекте', status: 'Согласован' },
]
export type Dismissal = { id: string; empId: string; kind: 'Увольнение' | 'Блокировка доступа'; reason: string; initiator: string; date: string; status: 'Ожидает подтверждения' | 'Подтверждено' | 'Отклонено' }
export const dismissals: Dismissal[] = [
  { id: 'ds1', empId: 'd11', kind: 'Блокировка доступа', reason: 'Не прошёл проверку документов (ВУ просрочено)', initiator: 'Мороз Т. А.', date: '2026-10-12', status: 'Ожидает подтверждения' },
  { id: 'ds2', empId: 'd4', kind: 'Увольнение', reason: '3 невыхода на смену за месяц, по соглашению сторон', initiator: 'Мороз Т. А.', date: '2026-10-13', status: 'Ожидает подтверждения' },
]

/* ---------- Арендаторы: менеджеры юрлиц (раздел 4) ---------- */
export type ClientManager = {
  id: string; companyId: string; name: string; position: string; phone1: string; requisites: string; charter: string; poa: string
  phone2?: string; email?: string; profCalendar?: string; birthday?: string; socials?: string; drivers?: string
}
export const clientManagers: ClientManager[] = [
  { id: 'cm1', companyId: 'c1', name: 'Лисовская Ирина Олеговна', position: 'Начальник отдела снабжения', phone1: '+375 29 611-24-80', requisites: 'УНП 191234567 · BY20 ALFA 3012…1234', charter: 'Устав_СтройМонолит_2024.pdf', poa: 'Доверенность №14 от 02.01.2026', phone2: '+375 33 611-24-80 (Viber)', email: 'lisovskaya@stroymonolit.by', profCalendar: 'День строителя — 9 августа', birthday: '1986-03-14', socials: 'linkedin.com/in/lisovskaya' },
  { id: 'cm2', companyId: 'c1', name: 'Лисовский Вадим Петрович', position: 'Прораб ЖК «Сокол»', phone1: '+375 29 611-24-81', requisites: 'УНП 191234567', charter: 'Устав_СтройМонолит_2024.pdf', poa: 'Доверенность №22 от 15.03.2026', email: 'prorab@stroymonolit.by', profCalendar: 'День строителя — 9 августа', drivers: 'Принимает смены водителей' },
  { id: 'cm3', companyId: 'c2', name: 'Гурин Олег Сергеевич', position: 'Начальник участка', phone1: '+375 44 702-11-45', requisites: 'УНП 100456789 · BY54 BPSB…7788', charter: 'Устав_БДС7.pdf', poa: 'Доверенность №3 от 10.01.2026', phone2: '+375 29 702-11-45 (Telegram)', email: 'gurin@bds7.by', profCalendar: 'День работников дорожного хозяйства — 3-е воскресенье октября', birthday: '1979-10-19' },
  { id: 'cm4', companyId: 'c3', name: 'Мельник Денис Андреевич', position: 'Директор по строительству', phone1: '+375 33 355-90-12', requisites: 'УНП 691112233', charter: 'Устав_Гарант.pdf', poa: '—', email: 'melnik@garant-dev.by', profCalendar: 'День строителя — 9 августа', socials: 'instagram.com/garant.dev' },
  { id: 'cm5', companyId: 'c5', name: 'Адамович Анна Викторовна', position: 'Инженер ПТО', phone1: '+375 29 788-03-21', requisites: 'УНП 590887766 · BY77 PJCB…3311', charter: 'Устав_ГИС.pdf', poa: 'Доверенность №8 от 05.02.2026', phone2: '+375 29 788-03-22', profCalendar: 'День строителя — 9 августа', birthday: '1991-11-02' },
  { id: 'cm6', companyId: 'c4', name: 'Жук Павел Валерьевич', position: 'Частный заказчик', phone1: '+375 29 150-77-31', requisites: 'Паспорт MP1234567', charter: '— (физлицо)', poa: '—', email: 'p.zhuk@mail.by' },
]

/* ---------- Арендодатели: менеджеры, объекты (площадки) (раздел 5) ---------- */
export type LandlordEqStatus = 'Свободная' | 'На модерации' | 'В работе' | 'Отклонённая' | 'Архив'
export const landlordEqStatus = (e: Equipment): LandlordEqStatus =>
  e.status === 'На модерации' ? 'На модерации' : e.status === 'Архив' || e.status === 'Скрытая' ? 'Архив' : e.status === 'Арендована' || e.status === 'Забронирована' ? 'В работе' : 'Свободная'

export type PartnerManager = { id: string; companyId: string; name: string; position: string; phone: string; email: string; note: string }
export const partnerManagers: PartnerManager[] = [
  { id: 'pm1', companyId: 'l1', name: 'Котова Марина Юрьевна', position: 'Менеджер по аренде', phone: '+375 29 300-40-50', email: 'kotova@technopark.by', note: 'Отвечает за краны и экскаваторы' },
  { id: 'pm2', companyId: 'l1', name: 'Шевчук Игорь Михайлович', position: 'Директор', phone: '+375 29 300-40-51', email: 'director@technopark.by', note: 'Согласует скидки > 10%' },
  { id: 'pm3', companyId: 'l2', name: 'Новик Алексей Владимирович', position: 'Директор', phone: '+375 33 640-22-10', email: 'kran@kranservice.by', note: '' },
  { id: 'pm4', companyId: 'l3', name: 'Левчук Роман Игоревич', position: 'ИП', phone: '+375 44 512-66-09', email: 'levchuk.r@gmail.com', note: 'Работает без НДС' },
]
export type PartnerSite = { id: string; companyId: string; name: string; address: string; kind: 'Стоянка' | 'Ремонтная база' | 'Объект клиента'; units: number; contact: string }
export const partnerSites: PartnerSite[] = [
  { id: 'ps1', companyId: 'l1', name: 'Стоянка Тимирязева', address: 'г. Минск, ул. Тимирязева, 67', kind: 'Стоянка', units: 4, contact: 'Сторож · +375 29 300-40-59' },
  { id: 'ps2', companyId: 'l1', name: 'База в Колодищах', address: 'аг. Колодищи, ул. Минская, 5', kind: 'Ремонтная база', units: 2, contact: 'Мастер · +375 29 300-40-58' },
  { id: 'ps3', companyId: 'l2', name: 'Площадка Катин Бор', address: 'г. Брест, ул. Катин Бор, 102', kind: 'Стоянка', units: 3, contact: 'Новик А. В.' },
  { id: 'ps4', companyId: 'l3', name: 'Гараж Барыкина', address: 'г. Гомель, ул. Барыкина, 140', kind: 'Стоянка', units: 1, contact: 'Левчук Р. И.' },
]
export type PartnerPay = 'Оплачено' | 'Не оплачено' | 'Долг'

/* ---------- Профиль: ответственность, KPI, ЗП ---------- */
export function responsibility(empId: string) {
  const mgrOrders = orders.filter((o) => o.managerId === empId)
  const siteIds = [...new Set(mgrOrders.map((o) => o.siteId))]
  const eqs = equipment.filter((e) => e.managerId === empId)
  const clientIds = [...new Set(mgrOrders.map((o) => o.clientId))]
  const staff = empId === 'e7' ? employees.filter((e) => e.id !== 'e7') : employees.filter((e) => e.supervisorId === 'e1' && (empId === 'e1' || drivers.indexOf(e) % 3 === 1))
  return {
    sites: (empId === 'e7' ? sites.filter((s) => s.status === 'Текущий') : sites.filter((s) => siteIds.includes(s.id))),
    staff, eqs: empId === 'e7' ? equipment : eqs,
    clients: empId === 'e7' ? companies.filter((c) => c.kind === 'tenant') : companies.filter((c) => clientIds.includes(c.id)),
  }
}
export type KpiItem = { name: string; plan: string; fact: string; pct: number; weight: number }
export const kpiByRole: Record<CrmUserRole, KpiItem[]> = {
  manager: [
    { name: 'Выручка по сделкам', plan: '120 000 BYN', fact: '104 300 BYN', pct: 87, weight: 40 },
    { name: 'Загрузка закреплённой техники', plan: '75%', fact: '81%', pct: 108, weight: 25 },
    { name: 'Дебиторка > 30 дней', plan: '≤ 10 000 BYN', fact: '12 400 BYN', pct: 76, weight: 20 },
    { name: 'Скорость обработки заявки', plan: '≤ 15 мин', fact: '11 мин', pct: 120, weight: 15 },
  ],
  mechanic: [
    { name: 'ТО в срок', plan: '100%', fact: '94%', pct: 94, weight: 40 },
    { name: 'Среднее время простоя', plan: '≤ 24 ч', fact: '19 ч', pct: 115, weight: 30 },
    { name: 'Повторные поломки', plan: '≤ 2', fact: '1', pct: 110, weight: 20 },
    { name: 'Инструктажи проведены', plan: '12', fact: '11', pct: 92, weight: 10 },
  ],
  hr: [
    { name: 'Закрытые вакансии', plan: '6', fact: '5', pct: 83, weight: 40 },
    { name: 'Срок подбора', plan: '≤ 14 дн', fact: '12 дн', pct: 110, weight: 30 },
    { name: 'Документы без просрочек', plan: '100%', fact: '97%', pct: 97, weight: 30 },
  ],
  admin: [
    { name: 'Маржинальность компании', plan: '28%', fact: '31%', pct: 110, weight: 50 },
    { name: 'Утверждённые KPI в срок', plan: '100%', fact: '100%', pct: 100, weight: 25 },
    { name: 'Инциденты без решения', plan: '0', fact: '1', pct: 80, weight: 25 },
  ],
}
export const salaryParts = (base: number, kpi: number) => {
  const bonus = Math.round(base * 0.35 * (kpi / 100))
  return [
    { name: 'Оклад', v: base },
    { name: `Премия по KPI (${kpi}%)`, v: bonus },
    { name: 'Надбавка за ответственность', v: Math.round(base * 0.08) },
    { name: 'Удержания (подоходный 13%)', v: -Math.round((base + bonus + base * 0.08) * 0.13) },
  ]
}
export const salaryHistory = [
  { label: 'Май', value: 3740 }, { label: 'Июн', value: 3920 }, { label: 'Июл', value: 4110 },
  { label: 'Авг', value: 3880 }, { label: 'Сен', value: 4260 }, { label: 'Окт', value: 4020 },
]

/* ---------- Дашборд: календарь, уведомления, финансы ---------- */
export type CalEvent = { day: number; kind: 'Аренда' | 'ТО' | 'Оплата' | 'Документы' | 'Встреча' | 'Праздник'; text: string }
export const calendar: CalEvent[] = [
  { day: 1, kind: 'Оплата', text: 'Платёж ТехноПарк Аренда — 8 400 BYN' },
  { day: 3, kind: 'ТО', text: 'Плановое ТО-500 Hyundai R210W' },
  { day: 6, kind: 'Аренда', text: 'Старт: ЖК «Сокол», 2 экскаватора' },
  { day: 9, kind: 'Документы', text: 'Сдать акты за сентябрь' },
  { day: 12, kind: 'Встреча', text: 'Визит на МКАД с Гуриным О. С.' },
  { day: 13, kind: 'ТО', text: 'Заявки на ТО: Komatsu PC78US, Bobcat S650' },
  { day: 13, kind: 'Оплата', text: 'Просрочка Белдорстрой-7: 50 000 BYN' },
  { day: 14, kind: 'Аренда', text: 'Самосвалы на Лиду (3 ед.)' },
  { day: 15, kind: 'Аренда', text: 'Подменный кран ТехноПарк' },
  { day: 16, kind: 'Аренда', text: 'Кран на ТЦ «Брест Плаза»' },
  { day: 18, kind: 'Праздник', text: 'День работников дорожного хозяйства — поздравить Белдорстрой-7' },
  { day: 19, kind: 'Встреча', text: 'ДР Гурина О. С. — подарок' },
  { day: 20, kind: 'Оплата', text: 'Выплата аванса водителям' },
  { day: 22, kind: 'ТО', text: 'Аттестация ГПМ Ивановец' },
  { day: 25, kind: 'Документы', text: 'Сверка с топливными картами' },
  { day: 28, kind: 'Аренда', text: 'Завершение вахты бульдозеров' },
  { day: 30, kind: 'Оплата', text: 'Закрытие месяца, счета клиентам' },
]
export type Notice = { id: string; level: 'bad' | 'warn' | 'info'; title: string; text: string; at: string; to: string }
export const notices: Notice[] = [
  { id: 'n1', level: 'bad', title: 'Критический долг', text: 'ОАО «Белдорстрой-7» — 50 000 BYN, назначение техники заблокировано до решения фин. директора', at: '2026-10-13T08:00:00', to: 'tenants' },
  { id: 'n2', level: 'bad', title: 'Перерасход топлива +21%', text: 'Shantui SD16 · Ткачук И. В. — требуется расследование', at: '2026-10-13T07:30:00', to: 'fuel' },
  { id: 'n3', level: 'bad', title: 'Водитель не вышел на смену', text: 'Михалевич А. Ю. · Амкодор 342В · ЖК «Сокол» — нужна замена', at: '2026-10-13T08:15:00', to: 'employees' },
  { id: 'n4', level: 'warn', title: 'Аварийная заявка на ТО', text: 'Bobcat S650 — стук в ходовой, требуется вывод из рейса', at: '2026-10-13T09:05:00', to: 'equipment' },
  { id: 'n5', level: 'warn', title: 'Техника на модерации', text: '2 единицы от арендодателей ждут проверки', at: '2026-10-12T16:00:00', to: 'landlords' },
  { id: 'n6', level: 'info', title: 'Новый входящий лид', text: 'ООО «ЛесТрансГрупп» — погрузчик на 40 ч', at: '2026-10-13T10:02:00', to: 'callcenter' },
]
export const finMonths = [
  { label: 'Май', value: 182000, value2: 131000 }, { label: 'Июн', value: 214000, value2: 149000 },
  { label: 'Июл', value: 236000, value2: 162000 }, { label: 'Авг', value: 228000, value2: 158000 },
  { label: 'Сен', value: 251000, value2: 171000 }, { label: 'Окт', value: 118000, value2: 79000 },
]
export const expenseItems = [
  { name: 'Субаренда техники', sum: 38400, paid: 30100, status: 'Частично' as const },
  { name: 'Топливо', sum: 16900, paid: 16900, status: 'Оплачено' as const },
  { name: 'Ремонт и запчасти', sum: 7300, paid: 4100, status: 'Частично' as const },
  { name: 'Зарплата (аванс)', sum: 14200, paid: 14200, status: 'Оплачено' as const },
  { name: 'Лизинг Liebherr LTM', sum: 2200, paid: 0, status: 'Долг' as const },
]
