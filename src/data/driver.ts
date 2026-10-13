/* Демо-данные мобильного приложения водителя (часть 3 ТЗ). Пользователь — водитель d1. */
import type { ChatThread } from '../ui/Chat'
import { emp, equipment, site, TODAY } from './mock'
import type { Employee, Equipment } from './types'

export const DRIVER_ID = 'd1'
export const me: Employee = emp(DRIVER_ID)!
export const myEq: Equipment = equipment.find((e) => e.driverId === DRIVER_ID && e.category === 'excavator') ?? equipment[0]
export const myManager = emp('e1')!
export const myMechanic = emp('e5')!
export const chiefMechanic = emp('e4')!
export const myHr = emp('e6')!
export { TODAY }

/* ---------------- Смены / рейсы / вахты ---------------- */
export type ShiftKind = 'смена' | 'рейс' | 'вахта'
export type DayStatus = 'Выполнена' | 'Текущая' | 'Запланирована' | 'Выходной' | 'Не вышел' | 'Больничный'
export type PlanDay = { date: string; kind?: ShiftKind; siteId?: string; start?: string; end?: string; status: DayStatus; orderNo?: string; note?: string }

export const week: PlanDay[] = [
  { date: '2026-10-12', kind: 'смена', siteId: 's1', start: '08:00', end: '20:00', status: 'Выполнена', orderNo: 'А-2610' },
  { date: '2026-10-13', kind: 'смена', siteId: 's1', start: '08:00', end: '20:00', status: 'Текущая', orderNo: 'А-2610' },
  { date: '2026-10-14', kind: 'смена', siteId: 's1', start: '08:00', end: '20:00', status: 'Запланирована', orderNo: 'А-2610' },
  { date: '2026-10-15', kind: 'смена', siteId: 's4', start: '09:00', end: '17:00', status: 'Запланирована', orderNo: 'А-2633', note: 'Время изменено менеджером: было 08:00' },
  { date: '2026-10-16', kind: 'смена', siteId: 's1', start: '08:00', end: '14:00', status: 'Запланирована', orderNo: 'А-2610', note: 'После 14:00 — плановое ТО-250 на базе' },
  { date: '2026-10-17', status: 'Выходной' },
  { date: '2026-10-18', status: 'Выходной' },
]

export const todayShift = {
  orderNo: 'А-2610',
  kind: 'смена' as ShiftKind,
  site: site('s1')!,
  client: 'ООО «СтройМонолит»',
  start: '08:00',
  end: '20:00',
  task: 'Разработка котлована под секцию 3, погрузка грунта в самосвалы. Работа рядом с газопроводом — по разметке.',
  contact: 'Прораб Лисовский В. · +375 29 611-24-81',
  /** координаты объекта (для гео-сверки) */
  geo: { lat: 53.8848, lng: 27.6021 },
}

export type ShiftRecord = {
  id: string; date: string; kind: ShiftKind; siteId: string; orderNo: string; status: 'Выполнена' | 'Не вышел' | 'Больничный'
  worked: number; pause: number; repair: number; motoStart: number; motoEnd: number; waybill: string
}
const m0 = myEq.motoHours
export const shiftHistory: ShiftRecord[] = [
  { id: 'sh1', date: '2026-10-12', kind: 'смена', siteId: 's1', orderNo: 'А-2610', status: 'Выполнена', worked: 11, pause: 1, repair: 0, motoStart: m0 - 10.5, motoEnd: m0, waybill: 'ПЛ-004812' },
  { id: 'sh2', date: '2026-10-10', kind: 'смена', siteId: 's1', orderNo: 'А-2610', status: 'Выполнена', worked: 10, pause: 1, repair: 1.5, motoStart: m0 - 20, motoEnd: m0 - 10.5, waybill: 'ПЛ-004790' },
  { id: 'sh3', date: '2026-10-09', kind: 'смена', siteId: 's5', orderNo: 'А-2604', status: 'Выполнена', worked: 9, pause: 1, repair: 0, motoStart: m0 - 29, motoEnd: m0 - 20, waybill: 'ПЛ-004771' },
  { id: 'sh4', date: '2026-10-08', kind: 'смена', siteId: 's5', orderNo: 'А-2604', status: 'Выполнена', worked: 10, pause: 1, repair: 0, motoStart: m0 - 38.5, motoEnd: m0 - 29, waybill: 'ПЛ-004755' },
  { id: 'sh5', date: '2026-10-07', kind: 'смена', siteId: 's5', orderNo: 'А-2604', status: 'Выполнена', worked: 8, pause: 1, repair: 2, motoStart: m0 - 46, motoEnd: m0 - 38.5, waybill: 'ПЛ-004738' },
  { id: 'sh6', date: '2026-10-06', kind: 'смена', siteId: 's2', orderNo: 'А-2598', status: 'Больничный', worked: 0, pause: 0, repair: 0, motoStart: m0 - 46, motoEnd: m0 - 46, waybill: '—' },
  { id: 'sh7', date: '2026-10-03', kind: 'вахта', siteId: 's2', orderNo: 'А-2591', status: 'Выполнена', worked: 12, pause: 1, repair: 0, motoStart: m0 - 57.5, motoEnd: m0 - 46, waybill: 'ПЛ-004702' },
  { id: 'sh8', date: '2026-10-02', kind: 'вахта', siteId: 's2', orderNo: 'А-2591', status: 'Выполнена', worked: 12, pause: 1, repair: 0, motoStart: m0 - 69, motoEnd: m0 - 57.5, waybill: 'ПЛ-004688' },
]

export type Waybill = { id: string; number: string; date: string; status: 'Активный' | 'Закрыт' | 'На модерации'; motoStart: number; motoEnd?: number; km: number; fuel: number; siteId: string }
export const waybills: Waybill[] = [
  { id: 'w0', number: 'ПЛ-004830', date: TODAY, status: 'Активный', motoStart: m0, km: 0, fuel: 0, siteId: 's1' },
  ...shiftHistory.filter((s) => s.waybill !== '—').map((s, i): Waybill => ({
    id: `w${i + 1}`, number: s.waybill, date: s.date, status: i === 0 ? 'На модерации' : 'Закрыт',
    motoStart: s.motoStart, motoEnd: s.motoEnd, km: s.siteId === 's1' ? 0 : [14, 22, 9][i % 3], fuel: Math.round((s.motoEnd - s.motoStart) * 14), siteId: s.siteId,
  })),
]

/* ---------------- Техника ---------------- */
export const eqAdmission = { status: 'Допущена', until: '2026-10-16', nextService: 'ТО-250', nextServiceIn: 48, lastEto: '2026-10-12 19:40', by: myMechanic.name }
export const restrictions = [
  { id: 'r1', text: 'Гидромолот не использовать до замены уплотнения гидроцилиндра', until: '2026-10-20', by: myMechanic.name },
  { id: 'r2', text: 'Работа на уклоне не более 10°, выносные опоры — обязательно', until: 'постоянно', by: chiefMechanic.name },
  { id: 'r3', text: 'Контроль уровня масла гидросистемы каждые 4 моточаса', until: '2026-10-20', by: myMechanic.name },
]
export const remarks = [
  { id: 'm1', date: '2026-10-12', text: 'Подтекание масла в районе поворотной платформы — наблюдать, при росте сообщить', by: myMechanic.name, level: 'warn' as const },
  { id: 'm2', date: '2026-10-05', text: 'Износ зубьев ковша ~30%, замена запланирована на ТО-250', by: myMechanic.name, level: 'info' as const },
  { id: 'm3', date: '2026-09-28', text: 'Заменён фильтр топливный тонкой очистки', by: chiefMechanic.name, level: 'ok' as const },
]
export const assignments = [
  { id: 'a1', eqId: myEq.id, from: '2026-03-02', to: undefined as string | undefined, accepted: 'Акт приёма № 0312 · 02.03.2026', returned: '' },
  { id: 'a2', eqId: equipment.find((e) => e.title === 'Volvo EW160E')?.id ?? 'eq21', from: '2025-11-10', to: '2026-03-01', accepted: 'Акт приёма № 0198', returned: 'Акт сдачи № 0309 · без замечаний' },
  { id: 'a3', eqId: equipment.find((e) => e.title === 'Komatsu PC78US')?.id ?? 'eq4', from: '2025-06-02', to: '2025-11-08', accepted: 'Акт приёма № 0091', returned: 'Акт сдачи № 0195 · скол стекла кабины' },
]
export const tmcList = [
  { id: 't1', group: 'Инструменты', name: 'Набор ключей 8–32 мм, монтировка' },
  { id: 't2', group: 'Инструменты', name: 'Шприц для смазки, огнетушитель ОП-5' },
  { id: 't3', group: 'Рации', name: 'Рация Motorola DP1400 + зарядка' },
  { id: 't4', group: 'ГСМ', name: 'Масло гидравлическое — 5 л (канистра)' },
  { id: 't5', group: 'ГСМ', name: 'Уровень топлива — не ниже 1/2 бака' },
  { id: 't6', group: 'Запчасти', name: 'Зубья ковша — 2 шт., пальцы — 2 шт.' },
  { id: 't7', group: 'Запчасти', name: 'Предохранители, лампы фар' },
]
export const photoSlots = [
  { id: 'front', label: 'Перед' }, { id: 'back', label: 'Зад' }, { id: 'left', label: 'Левая сторона' },
  { id: 'right', label: 'Правая сторона' }, { id: 'cab', label: 'Кабина' }, { id: 'moto', label: 'Счётчик моточасов' },
]

/* ---------------- Уведомления ---------------- */
export type Notice = { id: string; kind: 'to' | 'brief' | 'doc' | 'shift' | 'request'; title: string; text: string; at: string; read?: boolean; to?: string }
export const notices: Notice[] = [
  { id: 'n1', kind: 'to', title: 'ТО-250 через 48 моточасов', text: `${myEq.title} · плановое ТО 16.10 после 14:00 на базе`, at: '2026-10-13T07:10:00', to: '/driver/equipment' },
  { id: 'n2', kind: 'brief', title: 'Назначен инструктаж', text: '«Механик–водитель (регламент ЕТО)» — пройти до 15.10', at: '2026-10-12T18:20:00', to: '/driver/briefing/b2' },
  { id: 'n3', kind: 'doc', title: 'Медсправка истекает 02.11', text: 'Загрузите новую справку, иначе допуск будет приостановлен', at: '2026-10-12T09:00:00', to: '/driver/profile' },
  { id: 'n4', kind: 'shift', title: 'Изменено время смены 15.10', text: 'Ждановичи, ул. Лесная, 8 — начало в 09:00', at: '2026-10-11T16:45:00', read: true, to: '/driver/shifts' },
  { id: 'n5', kind: 'request', title: 'Заявка З-118: решение', text: 'Отпуск 02.11–15.11 согласован менеджером', at: '2026-10-10T12:05:00', read: true, to: '/driver/requests' },
]

/* ---------------- Заявки водителя ---------------- */
export type ReqType = 'ТО' | 'Ремонт' | 'Заправка' | 'Факт заправки' | 'Больничный' | 'Отпуск' | 'Выходной'
export type ReqStatus = 'Отправлена' | 'Принята' | 'В работе' | 'Решение' | 'Ожидание запчастей' | 'Ремонт силами водителя' | 'Выезд сервиса' | 'Выполнена' | 'Отменена' | 'Отклонена'
export type DriverRequest = {
  id: string; num: string; type: ReqType; createdAt: string; status: ReqStatus
  eqId?: string; description?: string; dateFrom?: string; dateTo?: string; comment?: string
  media: string[]; audioSec?: number; volume?: number; decision?: string; repairHours?: number; archived?: boolean
  history: { status: string; at: string; by?: string }[]
}
export const reqTypes: { id: ReqType; title: string; sub: string }[] = [
  { id: 'ТО', title: 'Заявка на ТО', sub: 'Техника, описание проблемы, фото/видео' },
  { id: 'Ремонт', title: 'Заявка на ремонт', sub: 'Фото/видео поломки + аудиокомментарий' },
  { id: 'Заправка', title: 'Заправка', sub: '«Нужна заправка» или факт заправки' },
  { id: 'Больничный', title: 'Больничный', sub: 'Даты и комментарий' },
  { id: 'Отпуск', title: 'Отпуск', sub: 'Даты и комментарий' },
  { id: 'Выходной', title: 'Выходной', sub: 'Дата и причина' },
]
export const requestsSeed: DriverRequest[] = [
  {
    id: 'q1', num: 'З-124', type: 'ТО', createdAt: '2026-10-12T19:45:00', status: 'Принята', eqId: myEq.id,
    description: 'Подтекание масла под поворотной платформой, на стоянке пятно ~10 см', media: ['IMG_2041.jpg', 'VID_2042.mp4'],
    history: [{ status: 'Отправлена', at: '2026-10-12T19:45:00' }, { status: 'Принята', at: '2026-10-12T20:10:00', by: myMechanic.name }],
  },
  {
    id: 'q2', num: 'З-121', type: 'Ремонт', createdAt: '2026-10-10T14:20:00', status: 'Ожидание запчастей', eqId: myEq.id,
    description: 'Не работает правая фара рабочего освещения', media: ['IMG_1988.jpg'], audioSec: 18, repairHours: 1.5,
    history: [{ status: 'Отправлена', at: '2026-10-10T14:20:00' }, { status: 'Принята', at: '2026-10-10T14:31:00', by: myMechanic.name }, { status: 'В работе', at: '2026-10-10T15:00:00', by: myMechanic.name }, { status: 'Ожидание запчастей', at: '2026-10-10T16:30:00', by: myMechanic.name }],
  },
  {
    id: 'q3', num: 'З-123', type: 'Выходной', createdAt: '2026-10-11T10:00:00', status: 'Отправлена', dateFrom: '2026-10-24', dateTo: '2026-10-24', comment: 'Семейные обстоятельства', media: [],
    history: [{ status: 'Отправлена', at: '2026-10-11T10:00:00' }],
  },
  {
    id: 'q4', num: 'З-118', type: 'Отпуск', createdAt: '2026-10-01T09:12:00', status: 'Решение', dateFrom: '2026-11-02', dateTo: '2026-11-15', comment: 'Ежегодный отпуск по графику', media: [],
    decision: 'Согласовано. На время отпуска экскаватор закрепляется за Пашкевичем Е. М.',
    history: [{ status: 'Отправлена', at: '2026-10-01T09:12:00' }, { status: 'Принята', at: '2026-10-01T11:00:00', by: myManager.name }, { status: 'Решение', at: '2026-10-10T12:05:00', by: myManager.name }],
  },
  {
    id: 'q5', num: 'З-116', type: 'Факт заправки', createdAt: '2026-10-09T12:40:00', status: 'Выполнена', eqId: myEq.id, volume: 180, media: ['Чек_АЗС_0910.jpg', 'Счётчик_ТЗ.jpg', 'Моточасы.jpg'],
    decision: 'Сверено с топливной картой, расхождений нет',
    history: [{ status: 'Отправлена', at: '2026-10-09T12:40:00' }, { status: 'Выполнена', at: '2026-10-09T15:00:00', by: myManager.name }],
  },
  {
    id: 'q6', num: 'З-115', type: 'Ремонт', createdAt: '2026-10-07T10:05:00', status: 'Выполнена', eqId: myEq.id, description: 'Порван шланг гидравлики рукояти', media: ['IMG_1902.jpg', 'VID_1903.mp4'], audioSec: 32, repairHours: 2,
    decision: 'Шланг заменён выездной бригадой, простой 2 ч отмечен в табеле как «Ремонтные»',
    history: [{ status: 'Отправлена', at: '2026-10-07T10:05:00' }, { status: 'Выезд сервиса', at: '2026-10-07T10:20:00', by: myMechanic.name }, { status: 'Выполнена', at: '2026-10-07T12:10:00', by: myMechanic.name }],
  },
  {
    id: 'q7', num: 'З-112', type: 'Заправка', createdAt: '2026-10-05T08:15:00', status: 'Отменена', eqId: myEq.id, comment: 'Заправился на объекте от топливозаправщика клиента', media: [],
    history: [{ status: 'Отправлена', at: '2026-10-05T08:15:00' }, { status: 'Отменена', at: '2026-10-05T08:40:00', by: 'Вы' }],
  },
  {
    id: 'q8', num: 'З-097', type: 'Больничный', createdAt: '2026-10-06T07:00:00', status: 'Решение', dateFrom: '2026-10-06', dateTo: '2026-10-06', comment: 'ОРВИ, справка из поликлиники', media: ['Справка_06-10.jpg'], archived: true,
    decision: 'Больничный учтён в табеле',
    history: [{ status: 'Отправлена', at: '2026-10-06T07:00:00' }, { status: 'Решение', at: '2026-10-06T09:00:00', by: myHr.name }],
  },
  {
    id: 'q9', num: 'З-088', type: 'ТО', createdAt: '2026-09-21T18:00:00', status: 'Решение', eqId: myEq.id, description: 'Скрип в пальцах стрелы', media: ['IMG_1650.jpg'], archived: true,
    decision: 'Выполнена смазка узлов, допуск без ограничений',
    history: [{ status: 'Отправлена', at: '2026-09-21T18:00:00' }, { status: 'Принята', at: '2026-09-21T18:30:00', by: myMechanic.name }, { status: 'В работе', at: '2026-09-22T08:00:00', by: myMechanic.name }, { status: 'Решение', at: '2026-09-22T09:10:00', by: myMechanic.name }],
  },
]

/* ---------------- Чаты ---------------- */
export const chatThreads: ChatThread[] = [
  { id: 'c-mgr', title: myManager.name, sub: 'Менеджер · ваш куратор', unread: 2, msgs: [
    { from: myManager.name, text: 'Сергей, доброе утро. Сегодня ЖК «Сокол», котлован секции 3. Самосвалы будут к 08:30.', at: '07:05' },
    { from: 'Вы', me: true, text: 'Принял. Буду на объекте в 07:50.', at: '07:08' },
    { from: myManager.name, text: 'Пропуск заказан. Прораб — Лисовский, он покажет разметку газопровода.', at: '07:12' },
    { from: myManager.name, text: 'Не забудь отправить фото путевого листа до начала работы.', at: '07:13' },
  ] },
  { id: 'c-mech', title: myMechanic.name, sub: 'Механик', unread: 1, msgs: [
    { from: 'Вы', me: true, text: 'Василий Петрович, под платформой снова масло. Отправил заявку на ТО.', at: '19:46' },
    { from: myMechanic.name, text: 'Видел, заявку принял. Завтра утром подъеду на объект к 12:00, посмотрю. Гидромолот не ставь.', at: '20:12' },
  ] },
  { id: 'c-site', title: 'ЖК «Сокол» — смена 13.10', sub: 'Группа · 5 участников', group: true, msgs: [
    { from: 'Лисовский В. (прораб)', text: 'Коллеги, въезд только с Брилевской, у ворот 2 ведутся работы.', at: '07:30' },
    { from: 'Петрович А. И.', text: 'Первый самосвал на подходе, буду через 10 минут.', at: '08:21' },
    { from: 'Вы', me: true, text: 'Стою у секции 3, готов к погрузке.', at: '08:24' },
  ] },
  { id: 'c-ex', title: 'Машинисты экскаваторов', sub: 'Группа · 7 участников', group: true, msgs: [
    { from: chiefMechanic.name, text: 'Напоминаю: ЕТО фотографируем в приложении до начала смены. Без фото допуск не открывается.', at: 'вчера' },
    { from: 'Пашкевич Е. М.', text: 'Принято.', at: 'вчера' },
  ] },
  { id: 'c-hr', title: myHr.name, sub: 'Отдел кадров', msgs: [
    { from: myHr.name, text: 'Сергей Викторович, у вас медсправка до 02.11. Загрузите новую в профиль, пожалуйста.', at: '12.10' },
  ] },
]
export const chatContacts = [myManager, myMechanic, chiefMechanic, myHr, emp('d2')!, emp('d3')!, emp('d8')!]

/* ---------------- Профиль: документы ---------------- */
export type DocStatus = 'Проверен' | 'На проверке' | 'Истекает' | 'Просрочен'
export type DriverDoc = { id: string; title: string; number: string; issued: string; until: string; status: DocStatus; checkedBy?: string; extra?: string }
export const docsSeed: DriverDoc[] = [
  { id: 'doc1', title: 'Паспорт', number: 'MP 3418827', issued: '2019-04-11', until: '2029-04-11', status: 'Проверен', checkedBy: myHr.name },
  { id: 'doc2', title: 'Водительское удостоверение', number: '5 АВ 271044', issued: '2020-06-18', until: '2030-06-18', status: 'Проверен', checkedBy: myHr.name, extra: 'Категории: B, C, CE' },
  { id: 'doc3', title: 'Удостоверение тракториста-машиниста', number: 'ТМ 094551', issued: '2021-02-01', until: '2031-02-01', status: 'Проверен', checkedBy: myHr.name, extra: 'Категории: D, E' },
  { id: 'doc4', title: 'Медицинская справка', number: '№ 1207 / 2025', issued: '2025-11-02', until: '2026-11-02', status: 'Истекает', checkedBy: myHr.name, extra: 'Годен к управлению кат. B, C, CE, D, E' },
  { id: 'doc5', title: 'Допуск к работе в охранной зоне газопровода', number: 'Д-0581', issued: '2026-03-10', until: '2027-03-10', status: 'Проверен', checkedBy: myHr.name },
  { id: 'doc6', title: 'Удостоверение стропальщика', number: 'СТ-1149', issued: '2026-09-29', until: '2027-09-29', status: 'На проверке' },
]

/* ---------------- Профиль: инструктажи ---------------- */
export type Quiz = { q: string; options: string[]; correct: number }
export type Briefing = {
  id: string; title: string; kind: 'Обязательный' | 'Внеплановый'; by: string; assignedAt: string; due: string
  status: 'Пройден' | 'Назначен' | 'Просрочен'; passedAt?: string; score?: string; text: string[]; quiz: Quiz[]
}
export const briefingsSeed: Briefing[] = [
  {
    id: 'b1', title: 'Менеджер–водитель (регламент связи)', kind: 'Обязательный', by: myManager.name, assignedAt: '2026-03-02', due: '2026-03-05', status: 'Пройден', passedAt: '2026-03-03', score: '3/3',
    text: [
      'Менеджер — основной контакт водителя по сменам, объектам и клиентам. Все изменения графика приходят в приложение и дублируются в Telegram-бот.',
      'Водитель подтверждает получение задания на смену не позднее 20:00 накануне. Об опоздании или невыходе — сообщает менеджеру сразу, звонком, затем пишет в чат.',
      'Рабочие вопросы — только в чатах приложения: так переписка прикрепляется к заявке и объекту. Личные мессенджеры для рабочих договорённостей не используются.',
    ],
    quiz: [
      { q: 'До какого времени нужно подтвердить задание на завтрашнюю смену?', options: ['До 08:00 в день смены', 'До 20:00 накануне', 'Подтверждать не нужно'], correct: 1 },
      { q: 'Как сообщить об опоздании?', options: ['Написать в общий чат водителей', 'Позвонить менеджеру, затем написать в чат', 'Сообщить клиенту на объекте'], correct: 1 },
      { q: 'Где вести рабочую переписку?', options: ['В чатах приложения', 'В личных мессенджерах', 'По СМС'], correct: 0 },
    ],
  },
  {
    id: 'b2', title: 'Механик–водитель (регламент ЕТО)', kind: 'Обязательный', by: myMechanic.name, assignedAt: '2026-10-12', due: '2026-10-15', status: 'Назначен',
    text: [
      'Ежесменное техническое обслуживание (ЕТО) выполняется водителем до начала каждой смены и фиксируется в приложении фотографиями 360°: перед, зад, обе стороны, кабина, счётчик моточасов.',
      'Проверяются: уровни масла двигателя и гидросистемы, охлаждающей жидкости, топлива; отсутствие подтеканий; состояние рукавов, пальцев и зубьев ковша; работа освещения и сигнала.',
      'При обнаружении неисправности, влияющей на безопасность, работа не начинается — создаётся заявка на ТО или ремонт, механик принимает решение о допуске.',
    ],
    quiz: [
      { q: 'Когда выполняется ЕТО?', options: ['Раз в неделю', 'До начала каждой смены', 'Только после ремонта'], correct: 1 },
      { q: 'Сколько фото нужно для фиксации 360°?', options: ['2 — перед и зад', '4 стороны + кабина + счётчик моточасов', 'Достаточно одного общего'], correct: 1 },
      { q: 'Обнаружено подтекание гидравлики. Что делать?', options: ['Работать и сообщить вечером', 'Не начинать работу, создать заявку на ТО', 'Долить масло и продолжить'], correct: 1 },
    ],
  },
  {
    id: 'b3', title: 'Клиент–водитель (правила поведения на объекте)', kind: 'Обязательный', by: myManager.name, assignedAt: '2026-03-02', due: '2026-03-05', status: 'Пройден', passedAt: '2026-03-04', score: '2/2',
    text: [
      'На объекте водитель подчиняется требованиям прораба по безопасности, но объём работ и время согласует только с менеджером.',
      'Запрещено обсуждать с клиентом стоимость, оплату и договорные условия. Любые претензии клиента — фиксируются и передаются менеджеру.',
      'Внешний вид: спецодежда, каска, сигнальный жилет. Курение — только в отведённых местах.',
    ],
    quiz: [
      { q: 'Клиент просит поработать ещё 2 часа сверх заявки. Ваши действия?', options: ['Согласиться и договориться об оплате наличными', 'Согласовать с менеджером', 'Отказать без объяснений'], correct: 1 },
      { q: 'Можно ли обсуждать стоимость аренды с клиентом?', options: ['Да', 'Нет, это вопрос менеджера'], correct: 1 },
    ],
  },
  {
    id: 'b4', title: 'Оформление путевого листа', kind: 'Обязательный', by: myManager.name, assignedAt: '2026-09-20', due: '2026-10-01', status: 'Просрочен',
    text: [
      'Путевой лист оформляется на каждую смену/рейс. До начала работы водитель фотографирует лицевую и оборотную сторону — дата, номер, начальные моточасы должны читаться.',
      'Если фото размыто, система не примет путевой лист: переснимите при хорошем освещении, без бликов.',
      'Показания вводятся вручную для сверки. Расхождение с распознанными данными уходит на модерацию менеджеру.',
    ],
    quiz: [
      { q: 'Какие стороны ПЛ нужно сфотографировать?', options: ['Только лицевую', 'Лицевую и оборотную', 'Любую одну'], correct: 1 },
      { q: 'Фото получилось размытым. Что произойдёт?', options: ['Лист примут автоматически', 'Принять лист будет нельзя, нужно переснять', 'Менеджер исправит сам'], correct: 1 },
    ],
  },
  {
    id: 'b5', title: 'Работа на объекте', kind: 'Обязательный', by: chiefMechanic.name, assignedAt: '2026-03-02', due: '2026-03-06', status: 'Пройден', passedAt: '2026-03-05', score: '3/3',
    text: [
      'Перед началом работ уточните у прораба расположение подземных коммуникаций и границы опасной зоны.',
      'Не допускайте нахождения людей в радиусе действия стрелы. Работа под ЛЭП — только по наряду-допуску.',
      'По завершении смены приведите рабочее место в порядок и сделайте фотоотчёт в приложении.',
    ],
    quiz: [
      { q: 'Что уточнить у прораба до начала работ?', options: ['Расположение коммуникаций и опасной зоны', 'Стоимость смены', 'Время обеда'], correct: 0 },
      { q: 'Работа под ЛЭП допускается…', options: ['Всегда', 'Только по наряду-допуску', 'Только ночью'], correct: 1 },
      { q: 'Что сделать по завершении смены?', options: ['Сразу уехать', 'Убрать рабочее место и сделать фотоотчёт', 'Оставить технику у ворот'], correct: 1 },
    ],
  },
  {
    id: 'b6', title: 'Работа вблизи газопровода', kind: 'Внеплановый', by: chiefMechanic.name, assignedAt: '2026-10-12', due: '2026-10-14', status: 'Назначен',
    text: [
      'На ЖК «Сокол» котлован секции 3 проходит в 4 м от действующего газопровода среднего давления. Граница охранной зоны отмечена красными вешками.',
      'Ковш не заходит за разметку ближе 2 м. При обнаружении трубы, ленты-сигнализатора или запаха газа — немедленно остановить работу, отвести технику и позвонить по 104 и менеджеру.',
    ],
    quiz: [
      { q: 'Минимальное расстояние ковша до разметки газопровода?', options: ['0,5 м', '2 м', 'Ограничений нет'], correct: 1 },
      { q: 'Почувствовали запах газа. Первое действие?', options: ['Продолжить работу', 'Остановить работу, отвести технику, звонить 104', 'Написать в общий чат'], correct: 1 },
    ],
  },
  {
    id: 'b7', title: 'Работа в осенне-зимний период', kind: 'Внеплановый', by: myMechanic.name, assignedAt: '2026-10-01', due: '2026-10-08', status: 'Пройден', passedAt: '2026-10-02', score: '2/2',
    text: ['Прогрев двигателя и гидросистемы не менее 10 минут при температуре ниже +5 °C. Переход на зимнее дизтопливо — с 15.10.'],
    quiz: [
      { q: 'Минимальное время прогрева при температуре ниже +5 °C?', options: ['2 минуты', '10 минут', 'Не нужно'], correct: 1 },
      { q: 'С какой даты переход на зимнее топливо?', options: ['С 15.10', 'С 01.12', 'С 01.01'], correct: 0 },
    ],
  },
]

/* ---------------- Нарушения, KPI, выплаты ---------------- */
export const violations = [
  { id: 'v1', date: '2026-09-18', text: 'Работа гидромолотом при перегреве масла гидросистемы', by: chiefMechanic.name, fine: 50, status: 'Удержано' },
  { id: 'v2', date: '2026-08-04', text: 'ЕТО не зафиксировано фото до начала смены', by: myMechanic.name, fine: 20, status: 'Удержано' },
  { id: 'v3', date: '2026-10-09', text: 'Опоздание на объект на 25 мин без предупреждения', by: myManager.name, fine: 0, status: 'Предупреждение' },
]
export const bonuses = [
  { id: 'bn1', date: '2026-09-30', text: 'Без простоев по вине водителя за сентябрь', amount: 150 },
  { id: 'bn2', date: '2026-09-30', text: 'Оценка клиента 5,0 — ООО «ГродноИнвестСтрой»', amount: 60 },
  { id: 'bn3', date: '2026-08-31', text: 'Сверхурочная вахта на М1/МКАД', amount: 220 },
]
export const kpis = [
  { id: 'k1', label: 'Выход на смены', value: 98, target: 95, unit: '%' },
  { id: 'k2', label: 'ЕТО вовремя', value: 92, target: 95, unit: '%' },
  { id: 'k3', label: 'Путевые листы без исправлений', value: 87, target: 90, unit: '%' },
  { id: 'k4', label: 'Оценка клиентов', value: 4.8, target: 4.5, unit: '' },
]
export const payouts = [
  { id: 'p0', date: '2026-10-25', kind: 'Аванс', period: 'Октябрь 2026', amount: 1100, status: 'Запланирована' },
  { id: 'p1', date: '2026-10-10', kind: 'Зарплата', period: 'Сентябрь 2026', amount: 1845, status: 'Выплачено' },
  { id: 'p2', date: '2026-09-25', kind: 'Аванс', period: 'Сентябрь 2026', amount: 1100, status: 'Выплачено' },
  { id: 'p3', date: '2026-09-10', kind: 'Зарплата', period: 'Август 2026', amount: 2010, status: 'Выплачено' },
  { id: 'p4', date: '2026-08-25', kind: 'Аванс', period: 'Август 2026', amount: 1100, status: 'Выплачено' },
]
export const monthSummary = { hours: 118, repairHours: 5.5, shifts: 11, accrued: 2412, advance: 1100 }
