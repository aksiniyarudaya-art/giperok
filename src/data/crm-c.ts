/* Демо-данные CRM механика и кадровика (часть 2, разделы 1.2 и 1.3).
   Состояние хранится в маленьких модульных сторах — изменения видны на всех
   страницах механика/кадровика, пока открыт прототип. */
import { useSyncExternalStore } from 'react'
import type { Employee, HireStage } from './types'
import { employees, equipment } from './mock'

/** «Сейчас» для демо: утро 13.10.2026. */
export const NOW = '2026-10-13T11:30:00'

/* ---------------- Мини-стор ---------------- */
export type Store<T> = { get: () => T; set: (v: T | ((p: T) => T)) => void; sub: (l: () => void) => () => void }
export function createStore<T>(initial: T): Store<T> {
  let v = initial
  const ls = new Set<() => void>()
  return {
    get: () => v,
    set: (n) => { v = typeof n === 'function' ? (n as (p: T) => T)(v) : n; ls.forEach((l) => l()) },
    sub: (l) => { ls.add(l); return () => { ls.delete(l) } },
  }
}
export function useStore<T>(s: Store<T>) { return useSyncExternalStore(s.sub, s.get, s.get) }
/** CRUD над стором-списком. */
export function useStoreList<T extends { id: string }>(s: Store<T[]>) {
  const rows = useStore(s)
  return {
    rows,
    set: s.set,
    add: (r: T) => s.set((p) => [r, ...p]),
    update: (r: T) => s.set((p) => p.map((x) => (x.id === r.id ? r : x))),
    patch: (id: string, part: Partial<T>) => s.set((p) => p.map((x) => (x.id === id ? { ...x, ...part } : x))),
    remove: (id: string) => s.set((p) => p.filter((x) => x.id !== id)),
  }
}

export const hoursBetween = (a: string, b: string) => Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 3600000)
export const nowIso = () => NOW

/* ======================================================================
   МЕХАНИК
   ====================================================================== */
export type MechState = 'На смене' | 'На объекте' | 'В ремонте' | 'Свободна'
export type FleetUnit = {
  id: string // = equipment.id
  state: MechState
  siteName?: string
  driverId?: string
  lastTo: string
  nextTo: string
  toKind: string
  faults: string[]
  repairStartedAt?: string
  repairId?: string
}
const unit = (id: string, state: MechState, driverId: string | undefined, lastTo: string, nextTo: string, toKind: string, faults: string[] = [], extra: Partial<FleetUnit> = {}): FleetUnit =>
  ({ id, state, driverId, lastTo, nextTo, toKind, faults, ...extra })

export const fleetStore = createStore<FleetUnit[]>([
  unit('eq1', 'На объекте', 'd1', '2026-08-20', '2026-10-13', 'ТО-500', [], { siteName: 'ЖК «Сокол»' }),
  unit('eq2', 'Свободна', 'd8', '2026-07-02', '2026-10-05', 'ТО-1000', ['Течь гидравлики в районе поворотной платформы']),
  unit('eq4', 'В ремонте', 'd4', '2026-08-11', '2026-11-11', 'ТО-250', ['Не запускается двигатель — неисправен стартер'], { repairStartedAt: '2026-10-12T08:30:00', repairId: 'r2' }),
  unit('eq7', 'На объекте', 'd4', '2026-09-15', '2026-11-15', 'ТО-250', [], { siteName: 'Частный дом, Ждановичи' }),
  unit('eq9', 'На объекте', 'd3', '2026-09-01', '2026-10-13', 'ТО-1000', ['Износ грузового каната (в пределах нормы)'], { siteName: 'ЖК «Сокол»' }),
  unit('eq10', 'В ремонте', undefined, '2026-06-18', '2026-12-18', 'ТО-500', ['Отказ гидронасоса привода стрелы'], { repairStartedAt: '2026-10-09T10:00:00', repairId: 'r1' }),
  unit('eq12', 'На смене', 'd2', '2026-07-10', '2026-10-10', 'ТО-250', ['Горит лампа давления масла'], { siteName: 'Развязка М1 / МКАД' }),
  unit('eq15', 'Свободна', 'd6', '2026-07-20', '2026-10-20', 'ТО-500'),
  unit('eq17', 'На смене', 'd5', '2026-08-28', '2026-10-28', 'ТО-250', ['Люфт рукояти манипулятора'], { siteName: 'Логистический центр «Лида-Запад»' }),
  unit('eq18', 'Свободна', undefined, '2026-07-11', '2026-10-11', 'ТО-250'),
  unit('eq20', 'В ремонте', undefined, '2026-08-02', '2026-11-02', 'ТО-250', ['Ошибка датчика выравнивания люльки'], { repairStartedAt: '2026-10-11T14:00:00', repairId: 'r3' }),
  unit('eq23', 'На смене', 'd7', '2026-09-24', '2026-10-24', 'ТО-250', ['Скрип тормозных колодок передней оси'], { siteName: 'Развязка М1 / МКАД' }),
])
export const ownFleetIds = equipment.filter((e) => e.own).map((e) => e.id)

/* ---------- ТО и ремонты ---------- */
export type RepairStatus = 'Новая' | 'В работе' | 'Решение' | 'Закрыта'
export const repairStatuses: RepairStatus[] = ['Новая', 'В работе', 'Решение', 'Закрыта']
export type RepairSub = 'Ожидание запчастей' | 'Ремонт силами водителя' | 'Выезд сервиса'
export const repairSubs: RepairSub[] = ['Ожидание запчастей', 'Ремонт силами водителя', 'Выезд сервиса']
export type CheckItem = { id: string; text: string; done: boolean }
export type Part = { id: string; name: string; qty: number; price: number }
export type Repair = {
  id: string
  number: string
  kind: 'Плановое ТО' | 'Внеплановый ремонт'
  equipmentId: string
  driverId?: string
  title: string
  diagnosis: string
  source: 'График ТО' | 'Заявка водителя' | 'Осмотр механика' | 'Решение менеджера'
  status: RepairStatus
  sub?: RepairSub
  planned: string
  checklist: CheckItem[]
  parts: Part[]
  downtimeStart?: string
  downtimeEnd?: string
  conclusion: string
}
const ck = (texts: string[], done = 0): CheckItem[] => texts.map((t, i) => ({ id: `c${i}`, text: t, done: i < done }))
const toList = ['Замена моторного масла и масляного фильтра', 'Замена топливного фильтра', 'Проверка и замена воздушного фильтра', 'Проверка уровня и состояния гидравлической жидкости', 'Смазка шарнирных соединений', 'Проверка тормозной системы', 'Диагностика электрооборудования']
export const toTemplate = toList

export const repairsStore = createStore<Repair[]>([
  { id: 'r1', number: 'Р-2041', kind: 'Внеплановый ремонт', equipmentId: 'eq10', title: 'Отказ гидронасоса привода стрелы', diagnosis: 'Падение давления в контуре стрелы до 140 бар при норме 280. Стружка в фильтре возвратной линии — износ качающего узла насоса.', source: 'Осмотр механика', status: 'В работе', sub: 'Ожидание запчастей', planned: '2026-10-09', checklist: ck(['Слив и анализ гидравлической жидкости', 'Демонтаж гидронасоса', 'Промывка гидросистемы', 'Установка нового насоса', 'Замена фильтров возвратной линии', 'Испытание под нагрузкой'], 3), parts: [{ id: 'p1', name: 'Гидронасос Rexroth A10VO 71', qty: 1, price: 6850 }, { id: 'p2', name: 'Комплект уплотнений', qty: 1, price: 180 }, { id: 'p3', name: 'Масло гидравлическое HVLP 46, л', qty: 120, price: 7.4 }], downtimeStart: '2026-10-09T10:00:00', conclusion: '' },
  { id: 'r2', number: 'Р-2044', kind: 'Внеплановый ремонт', equipmentId: 'eq4', driverId: 'd4', title: 'Замена стартера', diagnosis: 'Стартер не проворачивает двигатель, на клеммах 24,6 В — неисправно втягивающее реле.', source: 'Заявка водителя', status: 'В работе', sub: 'Ремонт силами водителя', planned: '2026-10-12', checklist: ck(['Снятие стартера', 'Установка нового стартера', 'Проверка запуска', 'Проверка зарядки АКБ'], 1), parts: [{ id: 'p1', name: 'Стартер Komatsu 600-863-3110', qty: 1, price: 1240 }], downtimeStart: '2026-10-12T08:30:00', conclusion: '' },
  { id: 'r3', number: 'Р-2045', kind: 'Внеплановый ремонт', equipmentId: 'eq20', title: 'Ошибка датчика выравнивания люльки', diagnosis: 'Код E-14 на пульте. Требуется калибровка у официального сервиса Horyong.', source: 'Осмотр механика', status: 'В работе', sub: 'Выезд сервиса', planned: '2026-10-11', checklist: ck(['Считывание кодов ошибок', 'Проверка проводки датчика', 'Калибровка сервисом', 'Испытание люльки с грузом'], 2), parts: [], downtimeStart: '2026-10-11T14:00:00', conclusion: '' },
  { id: 'r4', number: 'ТО-1187', kind: 'Плановое ТО', equipmentId: 'eq1', driverId: 'd1', title: 'ТО-500 по моточасам', diagnosis: 'Плановое обслуживание по графику, наработка 500 м/ч с прошлого ТО.', source: 'График ТО', status: 'Новая', planned: '2026-10-13', checklist: ck(toList), parts: [{ id: 'p1', name: 'Фильтр масляный', qty: 1, price: 46 }, { id: 'p2', name: 'Масло моторное 10W-40, л', qty: 24, price: 14.5 }], conclusion: '' },
  { id: 'r5', number: 'ТО-1188', kind: 'Плановое ТО', equipmentId: 'eq9', driverId: 'd3', title: 'ТО-1000, проверка канатов', diagnosis: 'Плановое ТО крана + освидетельствование грузового каната.', source: 'График ТО', status: 'Новая', planned: '2026-10-13', checklist: ck([...toList.slice(0, 4), 'Дефектовка грузового каната', 'Проверка ограничителя грузоподъёмности']), parts: [], conclusion: '' },
  { id: 'r6', number: 'Р-2047', kind: 'Внеплановый ремонт', equipmentId: 'eq2', title: 'Течь гидравлики у поворотной платформы', diagnosis: 'Со слов водителя: масляные пятна под платформой после смены.', source: 'Заявка водителя', status: 'Новая', planned: '2026-10-14', checklist: ck(['Осмотр и локализация течи', 'Замена РВД / уплотнений', 'Долив жидкости', 'Проверка под давлением']), parts: [], conclusion: '' },
  { id: 'r7', number: 'ТО-1183', kind: 'Плановое ТО', equipmentId: 'eq12', driverId: 'd2', title: 'ТО-250 (просрочено)', diagnosis: 'Плановое ТО, перенесено из-за загрузки на объекте.', source: 'График ТО', status: 'Новая', planned: '2026-10-10', checklist: ck(toList.slice(0, 6)), parts: [], conclusion: '' },
  { id: 'r8', number: 'ТО-1185', kind: 'Плановое ТО', equipmentId: 'eq18', title: 'ТО-250', diagnosis: 'Плановое ТО. Выявлен износ тормозных колодок задней оси (остаток 30%).', source: 'График ТО', status: 'Решение', planned: '2026-10-11', checklist: ck(toList.slice(0, 6), 6), parts: [{ id: 'p1', name: 'Комплект фильтров', qty: 1, price: 210 }], downtimeStart: '2026-10-11T09:00:00', downtimeEnd: '2026-10-11T16:30:00', conclusion: 'ТО выполнено. Колодки — замена при следующем ТО. Ожидает решения менеджера о выпуске в рейс.' },
  { id: 'r9', number: 'ТО-1179', kind: 'Плановое ТО', equipmentId: 'eq7', driverId: 'd4', title: 'ТО-250', diagnosis: 'Плановое обслуживание.', source: 'График ТО', status: 'Закрыта', planned: '2026-09-15', checklist: ck(toList.slice(0, 5), 5), parts: [{ id: 'p1', name: 'Комплект фильтров Bobcat', qty: 1, price: 165 }], downtimeStart: '2026-09-15T08:00:00', downtimeEnd: '2026-09-15T13:00:00', conclusion: 'Замечаний нет, техника допущена к работе.' },
  { id: 'r10', number: 'Р-2031', kind: 'Внеплановый ремонт', equipmentId: 'eq23', driverId: 'd7', title: 'Замена тормозных колодок передней оси', diagnosis: 'Износ колодок до металла, задиры на барабане.', source: 'Заявка водителя', status: 'Закрыта', planned: '2026-09-28', checklist: ck(['Снятие колёс', 'Замена колодок', 'Проточка барабанов', 'Регулировка'], 4), parts: [{ id: 'p1', name: 'Колодки тормозные, комплект', qty: 1, price: 420 }, { id: 'p2', name: 'Проточка барабана', qty: 2, price: 60 }], downtimeStart: '2026-09-28T08:00:00', downtimeEnd: '2026-09-29T12:00:00', conclusion: 'Причина — нарушение эксплуатации (движение под уклон на тормозах). Проведён внеплановый инструктаж.' },
  { id: 'r11', number: 'ТО-1190', kind: 'Плановое ТО', equipmentId: 'eq15', driverId: 'd6', title: 'ТО-500', diagnosis: 'Плановое обслуживание по графику.', source: 'График ТО', status: 'Новая', planned: '2026-10-20', checklist: ck(toList), parts: [], conclusion: '' },
])
export const repairDowntime = (r: Repair) => (r.downtimeStart ? hoursBetween(r.downtimeStart, r.downtimeEnd ?? NOW) : 0)
export const partsTotal = (r: Repair) => r.parts.reduce((a, p) => a + p.qty * p.price, 0)

/* ---------- Заявки от водителей ---------- */
export type ReqStatus = 'Отправлена' | 'Принята' | 'В работе' | 'Решение' | 'Отклонена'
export type DriverRequest = { id: string; driverId: string; equipmentId: string; type: 'ТО' | 'Ремонт'; text: string; media: string[]; status: ReqStatus; createdAt: string; answer?: string; repairId?: string }
export const requestsStore = createStore<DriverRequest[]>([
  { id: 'q1', driverId: 'd7', equipmentId: 'eq23', type: 'Ремонт', text: 'Снова скрип тормозов на спуске, педаль стала мягче.', media: ['Фото ×2', 'Аудио 0:34'], status: 'Отправлена', createdAt: '2026-10-13T07:40:00' },
  { id: 'q2', driverId: 'd5', equipmentId: 'eq17', type: 'ТО', text: 'Люфт рукояти, стук при повороте колонны.', media: ['Видео 0:21'], status: 'Отправлена', createdAt: '2026-10-13T06:55:00' },
  { id: 'q3', driverId: 'd2', equipmentId: 'eq12', type: 'Ремонт', text: 'Загорелась лампа давления масла на холостых, на ходу гаснет.', media: ['Фото ×1', 'Аудио 0:18'], status: 'Отправлена', createdAt: '2026-10-13T09:05:00' },
  { id: 'q4', driverId: 'd1', equipmentId: 'eq1', type: 'ТО', text: 'Подошёл срок ТО-500 по моточасам (8 512 м/ч).', media: ['Фото счётчика'], status: 'Принята', createdAt: '2026-10-12T18:10:00', repairId: 'r4' },
  { id: 'q5', driverId: 'd4', equipmentId: 'eq4', type: 'Ремонт', text: 'Не запускается двигатель, стартер щёлкает.', media: ['Видео 0:12'], status: 'В работе', createdAt: '2026-10-12T07:20:00', repairId: 'r2' },
  { id: 'q6', driverId: 'd3', equipmentId: 'eq9', type: 'ТО', text: 'Прошу проверить канат перед монтажом плит.', media: [], status: 'Решение', createdAt: '2026-10-10T08:00:00', answer: 'Канат в норме, износ 8%. Допуск к работе подтверждён.' },
])

/* ---------- Водители глазами механика ---------- */
export type Appeal = { date: string; text: string; result: string }
export const driverMeta: Record<string, { restrictions: string[]; appeals: Appeal[] }> = {
  d1: { restrictions: [], appeals: [{ date: '2026-10-12', text: 'ТО-500 по моточасам', result: 'Принята, ТО-1187' }, { date: '2026-08-19', text: 'Замена ковшовых зубьев', result: 'Выполнено' }] },
  d2: { restrictions: ['Допуск только к самосвалам до 20 т'], appeals: [{ date: '2026-10-13', text: 'Лампа давления масла', result: 'Ожидает' }, { date: '2026-09-02', text: 'Не работает тахограф', result: 'Выполнено' }] },
  d3: { restrictions: [], appeals: [{ date: '2026-10-10', text: 'Проверка каната', result: 'Решение: в норме' }] },
  d4: { restrictions: ['Медсправка просрочена — допуск до 20.10 по решению менеджера'], appeals: [{ date: '2026-10-12', text: 'Не запускается двигатель', result: 'Ремонт Р-2044' }] },
  d5: { restrictions: ['Запрет работы с люлькой до повторного инструктажа'], appeals: [{ date: '2026-10-13', text: 'Люфт рукояти манипулятора', result: 'Ожидает' }] },
  d6: { restrictions: [], appeals: [{ date: '2026-07-19', text: 'ТО-500 бульдозера', result: 'Выполнено' }] },
  d7: { restrictions: ['Только равнинные маршруты до внепланового инструктажа'], appeals: [{ date: '2026-10-13', text: 'Скрип тормозов', result: 'Ожидает' }, { date: '2026-09-27', text: 'Износ колодок', result: 'Ремонт Р-2031' }] },
  d8: { restrictions: ['На больничном — смены не назначаются'], appeals: [{ date: '2026-10-08', text: 'Подтёки под платформой', result: 'Передано в Р-2047' }] },
  d9: { restrictions: ['Нет допуска: не пройден первичный инструктаж'], appeals: [] },
  d10: { restrictions: ['Нет допуска: документы на проверке у кадровика'], appeals: [] },
  d11: { restrictions: ['Кандидат — доступ к технике закрыт'], appeals: [] },
}
export type Violation = { id: string; driverId: string; equipmentId?: string; date: string; text: string; severity: 'Низкая' | 'Средняя' | 'Высокая'; fine: number }
export const violationsStore = createStore<Violation[]>([
  { id: 'v1', driverId: 'd7', equipmentId: 'eq23', date: '2026-09-27', text: 'Движение под уклон на рабочих тормозах, перегрев колодок', severity: 'Высокая', fine: 150 },
  { id: 'v2', driverId: 'd5', equipmentId: 'eq17', date: '2026-10-02', text: 'Подъём груза с превышением вылета', severity: 'Средняя', fine: 80 },
  { id: 'v3', driverId: 'd2', equipmentId: 'eq12', date: '2026-09-18', text: 'Не проведено ЕТО перед выездом', severity: 'Низкая', fine: 30 },
])
export type Feedback = { id: string; driverId: string; date: string; text: string }
export const feedbackStore = createStore<Feedback[]>([
  { id: 'f1', driverId: 'd1', date: '2026-10-05', text: 'Отличное ЕТО, техника в чистоте. Так держать.' },
  { id: 'f2', driverId: 'd7', date: '2026-09-29', text: 'Разобрали причины износа колодок — торможение двигателем на спусках.' },
])
export type Motivation = { id: string; empId: string; kind: 'Бонус' | 'Штраф'; amount: number; reason: string; date: string; by: string; status: 'На утверждении' | 'Утверждено' | 'Отклонено' }
export const motivationStore = createStore<Motivation[]>([
  { id: 'm1', empId: 'd1', kind: 'Бонус', amount: 120, reason: 'Образцовое ЕТО за сентябрь', date: '2026-10-01', by: 'e4', status: 'Утверждено' },
  { id: 'm2', empId: 'd7', kind: 'Штраф', amount: 150, reason: 'Нарушение эксплуатации: перегрев тормозов', date: '2026-09-29', by: 'e4', status: 'Утверждено' },
  { id: 'm3', empId: 'd5', kind: 'Штраф', amount: 80, reason: 'Превышение вылета манипулятора', date: '2026-10-02', by: 'e4', status: 'На утверждении' },
  { id: 'm4', empId: 'd3', kind: 'Бонус', amount: 200, reason: 'Монтаж без замечаний на ЖК «Сокол»', date: '2026-10-08', by: 'e1', status: 'На утверждении' },
  { id: 'm5', empId: 'e5', kind: 'Бонус', amount: 150, reason: 'Ремонт гидронасоса в срок', date: '2026-10-03', by: 'e4', status: 'На утверждении' },
])
export type RhStatus = 'На согласовании' | 'Согласовано механиком' | 'Подтверждено кадровиком' | 'Передано в бухгалтерию' | 'Отклонено'
export type RepairHours = { id: string; empId: string; equipmentId: string; repairId?: string; date: string; hours: number; note: string; status: RhStatus }
export const repairHoursStore = createStore<RepairHours[]>([
  { id: 'h1', empId: 'd4', equipmentId: 'eq4', repairId: 'r2', date: '2026-10-12', hours: 6.5, note: 'Замена стартера силами водителя', status: 'На согласовании' },
  { id: 'h2', empId: 'd7', equipmentId: 'eq23', repairId: 'r10', date: '2026-09-28', hours: 4, note: 'Помощь в замене колодок', status: 'Согласовано механиком' },
  { id: 'h3', empId: 'e5', equipmentId: 'eq10', repairId: 'r1', date: '2026-10-10', hours: 9, note: 'Демонтаж гидронасоса', status: 'Согласовано механиком' },
  { id: 'h4', empId: 'd1', equipmentId: 'eq1', date: '2026-09-05', hours: 3, note: 'Замена зубьев ковша', status: 'Передано в бухгалтерию' },
])

/* ---------- Документооборот механика ---------- */
export type Attachment = { id: string; name: string; kind: 'photo' | 'video' | 'file'; url?: string; size?: number }
export type MechDocType = 'Заказ запчастей' | 'Акт дефектации' | 'Акт выполненных работ' | 'Счёт на оплату' | 'Фотофиксация' | 'Видеофиксация'
export const mechDocTypes: MechDocType[] = ['Заказ запчастей', 'Акт дефектации', 'Акт выполненных работ', 'Счёт на оплату', 'Фотофиксация', 'Видеофиксация']
export type MechDoc = {
  id: string; number: string; type: MechDocType; date: string; equipmentId?: string; repairId?: string; supplier?: string
  items: Part[]; note: string; status: 'Черновик' | 'На подписи' | 'Подписан'; pay: 'Ожидает оплаты' | 'Оплачено' | 'Не требуется'
  attachments: Attachment[]; signedBy?: string
}
const att = (name: string, kind: Attachment['kind']): Attachment => ({ id: name, name, kind })
export const docsStore = createStore<MechDoc[]>([
  { id: 'md1', number: 'ЗЗ-318', type: 'Заказ запчастей', date: '2026-10-10', equipmentId: 'eq10', repairId: 'r1', supplier: 'ООО «ГидроТехСервис»', items: [{ id: 'p1', name: 'Гидронасос Rexroth A10VO 71', qty: 1, price: 6850 }, { id: 'p2', name: 'Комплект уплотнений', qty: 1, price: 180 }], note: 'Срочно, техника простаивает', status: 'Подписан', pay: 'Ожидает оплаты', attachments: [att('КП_ГидроТехСервис.pdf', 'file')], signedBy: 'e4' },
  { id: 'md2', number: 'АД-112', type: 'Акт дефектации', date: '2026-10-09', equipmentId: 'eq10', repairId: 'r1', items: [], note: 'Износ качающего узла, стружка в фильтре', status: 'Подписан', pay: 'Не требуется', attachments: [att('фильтр_стружка.jpg', 'photo'), att('насос_разбор.jpg', 'photo')], signedBy: 'e4' },
  { id: 'md3', number: 'ЗЗ-319', type: 'Заказ запчастей', date: '2026-10-12', equipmentId: 'eq4', repairId: 'r2', supplier: 'ЧУП «КомацуЗапчасть»', items: [{ id: 'p1', name: 'Стартер Komatsu 600-863-3110', qty: 1, price: 1240 }], note: '', status: 'На подписи', pay: 'Ожидает оплаты', attachments: [] },
  { id: 'md4', number: 'СЧ-5521', type: 'Счёт на оплату', date: '2026-10-11', equipmentId: 'eq20', repairId: 'r3', supplier: 'Сервисный центр Horyong-BY', items: [{ id: 'p1', name: 'Выезд и калибровка датчиков', qty: 1, price: 640 }], note: 'Выезд сервиса 14.10', status: 'Подписан', pay: 'Ожидает оплаты', attachments: [att('счёт_5521.pdf', 'file')], signedBy: 'e4' },
  { id: 'md5', number: 'ФФ-207', type: 'Фотофиксация', date: '2026-10-13', equipmentId: 'eq23', items: [], note: 'Тормозной механизм передней оси', status: 'Черновик', pay: 'Не требуется', attachments: [att('колодки_лев.jpg', 'photo'), att('колодки_прав.jpg', 'photo'), att('барабан.jpg', 'photo')] },
  { id: 'md6', number: 'АВР-088', type: 'Акт выполненных работ', date: '2026-09-29', equipmentId: 'eq23', repairId: 'r10', supplier: 'Ремонтная служба СпецХаб', items: [{ id: 'p1', name: 'Колодки тормозные, комплект', qty: 1, price: 420 }, { id: 'p2', name: 'Проточка барабана', qty: 2, price: 60 }], note: '', status: 'Подписан', pay: 'Оплачено', attachments: [att('АВР_088_скан.pdf', 'file')], signedBy: 'e4' },
  { id: 'md7', number: 'ВФ-031', type: 'Видеофиксация', date: '2026-10-13', equipmentId: 'eq17', items: [], note: 'Люфт рукояти при повороте', status: 'Черновик', pay: 'Не требуется', attachments: [att('люфт_рукояти.mp4', 'video')] },
])
export const docTotal = (d: MechDoc) => d.items.reduce((a, p) => a + p.qty * p.price, 0)

/* ---------- Инструктажи ---------- */
export const mandatoryTopics = [
  'Менеджер–водитель (регламент связи)',
  'Механик–водитель (регламент ЕТО)',
  'Клиент–водитель (правила поведения на объекте)',
  'Оформление путевого листа',
  'Работа на объекте',
  'Короткая проверка знаний',
]
export type BriefKind = 'Первичный' | 'Повторный' | 'Внеплановый'
export type PartState = 'Ожидает' | 'Пройден' | 'Не пройден' | 'Отказ'
export type Participant = { empId: string; state: PartState; signedAt?: string; note?: string }
export type Briefing = { id: string; kind: BriefKind; topic: string; reason: string; date: string; status: 'Запланирован' | 'Проведён' | 'Отменён'; conductedBy: string; conductorSigned: boolean; participants: Participant[] }
const pp = (ids: string[], state: PartState = 'Ожидает', at?: string): Participant[] => ids.map((empId) => ({ empId, state, signedAt: state === 'Пройден' ? at : undefined }))
export const briefingsStore = createStore<Briefing[]>([
  { id: 'b1', kind: 'Повторный', topic: 'Механик–водитель (регламент ЕТО)', reason: 'Плановый повторный инструктаж (раз в квартал)', date: '2026-10-13T10:00:00', status: 'Запланирован', conductedBy: 'e4', conductorSigned: false, participants: pp(['d1', 'd2', 'd3', 'd7']) },
  { id: 'b2', kind: 'Внеплановый', topic: 'Работа на объекте', reason: 'Инцидент 12.10 на ЖК «Сокол»: задержка выезда и касание стрелой ограждения', date: '2026-10-13T14:00:00', status: 'Запланирован', conductedBy: 'e4', conductorSigned: false, participants: pp(['d1', 'd3']) },
  { id: 'b3', kind: 'Первичный', topic: 'Оформление путевого листа', reason: 'Приём на работу — цепочка допуска', date: '2026-10-13T16:00:00', status: 'Запланирован', conductedBy: 'e4', conductorSigned: false, participants: pp(['d9']) },
  { id: 'b4', kind: 'Повторный', topic: 'Клиент–водитель (правила поведения на объекте)', reason: 'Плановый повторный инструктаж', date: '2026-10-06T09:00:00', status: 'Проведён', conductedBy: 'e4', conductorSigned: true, participants: [{ empId: 'd2', state: 'Пройден', signedAt: '2026-10-06T09:40:00' }, { empId: 'd4', state: 'Пройден', signedAt: '2026-10-06T09:41:00' }, { empId: 'd5', state: 'Не пройден', note: 'Не сдал проверку знаний — 3 ошибки из 10' }, { empId: 'd7', state: 'Пройден', signedAt: '2026-10-06T09:43:00' }] },
  { id: 'b5', kind: 'Внеплановый', topic: 'Механик–водитель (регламент ЕТО)', reason: 'После инцидента: износ тормозов из-за нарушения эксплуатации (Р-2031)', date: '2026-09-29T15:00:00', status: 'Проведён', conductedBy: 'e4', conductorSigned: true, participants: [{ empId: 'd7', state: 'Пройден', signedAt: '2026-09-29T15:30:00' }] },
  { id: 'b6', kind: 'Первичный', topic: 'Короткая проверка знаний', reason: 'Приём на работу — цепочка допуска', date: '2026-10-15T10:00:00', status: 'Запланирован', conductedBy: 'e4', conductorSigned: false, participants: pp(['d10']) },
  { id: 'b7', kind: 'Внеплановый', topic: 'Работа на объекте', reason: 'Отказ от прохождения после нарушения 02.10', date: '2026-10-03T11:00:00', status: 'Проведён', conductedBy: 'e5', conductorSigned: true, participants: [{ empId: 'd5', state: 'Отказ', note: 'Отказался подписывать лист ознакомления' }] },
])
/** Матрица обязательных инструктажей: дата прохождения либо null (не пройден). */
export const mandatoryMatrix: Record<string, (string | null)[]> = {
  d1: ['2026-08-02', '2026-07-10', '2026-08-02', '2026-03-12', '2026-08-02', '2026-09-01'],
  d2: ['2026-08-02', '2026-04-04', '2026-10-06', '2026-03-12', '2026-08-02', '2026-09-01'],
  d3: ['2026-08-02', '2026-07-10', '2026-08-02', '2026-03-12', '2026-08-02', '2026-09-01'],
  d4: ['2026-05-14', '2026-07-10', '2026-10-06', '2026-03-12', '2026-05-14', null],
  d5: ['2026-08-02', '2026-07-10', null, '2026-03-12', '2026-04-20', '2026-09-01'],
  d6: ['2026-06-11', '2026-06-11', '2026-06-11', '2026-03-12', '2026-06-11', '2026-06-11'],
  d7: ['2026-08-02', '2026-09-29', '2026-10-06', '2026-03-12', '2026-08-02', '2026-09-01'],
  d8: ['2026-08-02', '2026-07-10', '2026-08-02', '2026-03-12', '2026-08-02', '2026-09-01'],
  d9: ['2026-10-08', '2026-10-09', null, null, null, null],
  d10: [null, null, null, null, null, null],
  d11: [null, null, null, null, null, null],
}
/** Срок действия обязательного инструктажа — 90 дней. */
export const BRIEF_VALID_DAYS = 90

/* ======================================================================
   КАДРОВИК
   ====================================================================== */
export type HireGroup = 'Загрузка документов' | 'Проверка документов' | 'Инструктажи' | 'Допуски'
export const hireGroups: HireGroup[] = ['Загрузка документов', 'Проверка документов', 'Инструктажи', 'Допуски']
export type HireItem = { id: string; group: HireGroup; text: string; done: boolean }
const hireTpl: [HireGroup, string][] = [
  ['Загрузка документов', 'Паспорт (скан разворота и прописки)'],
  ['Загрузка документов', 'Водительское удостоверение / удостоверение тракториста'],
  ['Загрузка документов', 'Медицинская справка'],
  ['Загрузка документов', 'Трудовая книжка, диплом / свидетельство'],
  ['Проверка документов', 'Сверка паспортных данных'],
  ['Проверка документов', 'Проверка категорий и срока действия ВУ'],
  ['Проверка документов', 'Проверка срока медсправки'],
  ['Проверка документов', 'Трудовой договор подписан'],
  ['Инструктажи', 'Вводный инструктаж по охране труда'],
  ['Инструктажи', 'Первичный инструктаж механика (регламент ЕТО)'],
  ['Инструктажи', 'Оформление путевого листа'],
  ['Допуски', 'Стажировка на технике (2 смены)'],
  ['Допуски', 'Приказ о допуске к самостоятельной работе'],
  ['Допуски', 'Выдача доступа в приложение водителя'],
]
export const makeHireChecklist = (done: number): HireItem[] => hireTpl.map(([group, text], i) => ({ id: `h${i}`, group, text, done: i < done }))
export const hireStages: HireStage[] = ['Кандидат', 'Проверка', 'Оформление', 'Инструктаж', 'Допущен']
export type HireCard = { id: string; empId?: string; name: string; position: string; phone: string; source: string; stage: HireStage; createdAt: string; checklist: HireItem[]; note: string }
const fromEmp = (e: Employee, done: number, source: string, createdAt: string, note = ''): HireCard =>
  ({ id: `hc-${e.id}`, empId: e.id, name: e.name, position: e.position, phone: e.phone, source, stage: e.hireStage, createdAt, checklist: makeHireChecklist(done), note })
const ee = (id: string) => employees.find((e) => e.id === id)!
export const hireStore = createStore<HireCard[]>([
  fromEmp(ee('d11'), 0, 'Заявка менеджера Кравченко О.', '2026-10-11', 'Замена Михалевича на период ремонта'),
  { id: 'hc-n1', name: 'Кучинский Олег Андреевич', position: 'Механик', phone: '+375 33 214-55-09', source: 'rabota.by', stage: 'Кандидат', createdAt: '2026-10-12', checklist: makeHireChecklist(1), note: 'Опыт с гидравликой Rexroth' },
  fromEmp(ee('d10'), 4, 'Рекомендация Козлова Д.', '2026-10-06', 'Ожидаем медсправку'),
  { id: 'hc-n2', name: 'Гордеев Илья Сергеевич', position: 'Водитель манипулятора', phone: '+375 29 610-33-71', source: 'Заявка менеджера Бондаря М.', stage: 'Проверка', createdAt: '2026-10-07', checklist: makeHireChecklist(5), note: '' },
  { id: 'hc-n3', name: 'Сенкевич Павел Петрович', position: 'Машинист автокрана', phone: '+375 44 733-18-20', source: 'Повторный приём', stage: 'Оформление', createdAt: '2026-10-02', checklist: makeHireChecklist(7), note: 'Договор на подписи' },
  fromEmp(ee('d9'), 10, 'rabota.by', '2026-09-28', 'Первичный инструктаж 13.10 в 16:00'),
  { id: 'hc-n4', name: 'Рябцев Денис Игоревич', position: 'Водитель самосвала', phone: '+375 29 555-41-02', source: 'Заявка менеджера Кравченко О.', stage: 'Допущен', createdAt: '2026-09-15', checklist: makeHireChecklist(14), note: 'Допущен 10.10' },
])

export type PersonDoc = { id: string; empId: string; type: 'Паспорт' | 'ВУ' | 'Медсправка'; number: string; detail: string; issued: string; expires: string; status: 'На проверке' | 'Проверен' | 'Отклонён'; uploadedAt: string; comment?: string }
let dn = 0
const pd = (empId: string, type: PersonDoc['type'], number: string, detail: string, issued: string, expires: string, status: PersonDoc['status'] = 'Проверен', uploadedAt = '2026-09-01'): PersonDoc =>
  ({ id: `pd${++dn}`, empId, type, number, detail, issued, expires, status, uploadedAt })
export const personDocsStore = createStore<PersonDoc[]>([
  pd('d1', 'Паспорт', 'MP 2345671', 'Фрунзенский РУВД г. Минска', '2019-04-11', '2029-04-11'),
  pd('d1', 'ВУ', '5АВ 118902', 'B, C, CE · тракторист D, E', '2018-06-02', '2028-06-02'),
  pd('d1', 'Медсправка', '№ 4471', 'Годен к управлению кат. B, C, CE', '2026-02-10', '2027-02-10'),
  pd('d2', 'ВУ', '5АВ 220114', 'B, C, CE', '2017-03-15', '2027-03-15'),
  pd('d2', 'Медсправка', '№ 3902', 'Годен', '2025-11-20', '2026-11-20'),
  pd('d3', 'ВУ', '5ВК 001842', 'B, C · крановщик', '2020-09-09', '2030-09-09'),
  pd('d3', 'Медсправка', '№ 5120', 'Годен', '2026-03-01', '2027-03-01'),
  pd('d4', 'ВУ', '5АВ 771203', 'B · тракторист D', '2016-10-30', '2026-10-30'),
  pd('d4', 'Медсправка', '№ 2207', 'Годен', '2025-09-30', '2026-09-30'),
  pd('d5', 'Медсправка', '№ 2981', 'Годен', '2025-10-01', '2026-10-01'),
  pd('d5', 'ВУ', '5МН 330987', 'B, C, CE', '2019-12-12', '2029-12-12'),
  pd('d7', 'ВУ', '5ЕК 450091', 'B, C', '2016-10-25', '2026-10-25'),
  pd('d7', 'Медсправка', '№ 4120', 'Годен', '2026-01-15', '2027-01-15'),
  pd('d8', 'Медсправка', '№ 3017', 'Годен', '2026-04-04', '2027-04-04'),
  pd('d9', 'Паспорт', 'MC 4410933', 'Партизанский РУВД г. Минска', '2021-07-01', '2031-07-01', 'Проверен', '2026-09-28'),
  pd('d9', 'ВУ', '5АВ 902211', 'B, C', '2022-05-17', '2032-05-17', 'Проверен', '2026-09-28'),
  pd('d9', 'Медсправка', '№ 6011', 'Годен', '2026-09-25', '2027-09-25', 'Проверен', '2026-09-28'),
  pd('d10', 'Паспорт', 'MP 5520187', 'Октябрьский РУВД г. Витебска', '2020-02-19', '2030-02-19', 'На проверке', '2026-10-12'),
  pd('d10', 'ВУ', '2ВС 114092', 'B, C', '2015-08-08', '2025-08-08', 'На проверке', '2026-10-12'),
  pd('d10', 'Медсправка', '№ 7002', 'Годен', '2026-10-01', '2027-10-01', 'На проверке', '2026-10-12'),
  pd('d11', 'Паспорт', 'HB 2290811', 'Гомельский РОВД', '2018-03-03', '2028-03-03', 'На проверке', '2026-10-12'),
])

export type Absence = { id: string; empId: string; kind: 'Отпуск' | 'Больничный' | 'Выходной' | 'Отгул'; from: string; to: string; status: 'На согласовании' | 'Согласовано' | 'Открыт' | 'Закрыт'; note: string }
export const absencesStore = createStore<Absence[]>([
  { id: 'a1', empId: 'd6', kind: 'Отпуск', from: '2026-10-05', to: '2026-10-25', status: 'Согласовано', note: 'Ежегодный трудовой' },
  { id: 'a2', empId: 'd8', kind: 'Больничный', from: '2026-10-10', to: '2026-10-17', status: 'Открыт', note: 'Листок нетрудоспособности № 118/26' },
  { id: 'a3', empId: 'e5', kind: 'Отпуск', from: '2026-11-02', to: '2026-11-15', status: 'На согласовании', note: 'Заявка из приложения' },
  { id: 'a4', empId: 'd2', kind: 'Выходной', from: '2026-10-16', to: '2026-10-16', status: 'На согласовании', note: 'Семейные обстоятельства' },
  { id: 'a5', empId: 'd3', kind: 'Больничный', from: '2026-09-02', to: '2026-09-08', status: 'Закрыт', note: '' },
])

export type Dismissal = { id: string; empId?: string; name: string; position: string; date: string; reason: string; status: 'В процессе' | 'Завершено'; checklist: { id: string; group: 'Материальная ответственность' | 'Документы' | 'Доступы'; text: string; done: boolean }[] }
export const dismissChecklist = (done = 0): Dismissal['checklist'] => ([
  ['Материальная ответственность', 'Сдача закреплённой техники (акт приёма-передачи)'],
  ['Материальная ответственность', 'Сдача инструмента, рации, спецодежды'],
  ['Материальная ответственность', 'Сдача топливной карты, сверка ГСМ'],
  ['Документы', 'Заявление / соглашение сторон подписано'],
  ['Документы', 'Приказ об увольнении подписан'],
  ['Документы', 'Обходной лист закрыт'],
  ['Документы', 'Окончательный расчёт передан в бухгалтерию'],
  ['Доступы', 'Блокировка доступа в приложение и CRM'],
] as const).map(([group, text], i) => ({ id: `x${i}`, group, text, done: i < done }))
export const dismissalsStore = createStore<Dismissal[]>([
  { id: 'x1', name: 'Лапицкий Георгий Иванович', position: 'Водитель самосвала', date: '2026-10-20', reason: 'По соглашению сторон', status: 'В процессе', checklist: dismissChecklist(4) },
  { id: 'x2', name: 'Стельмах Ирина Олеговна', position: 'Менеджер по аренде', date: '2026-09-30', reason: 'По собственному желанию', status: 'Завершено', checklist: dismissChecklist(8) },
])

/* ---------- KPI ---------- */
export type KpiRow = { id: string; empId: string; attendance: number; violations: number; shiftsDone: number; shiftsPlan: number; rating: number; status: 'Черновик' | 'На утверждении' | 'Утверждён' }
export type KpiWeights = { attendance: number; violations: number; shifts: number; rating: number }
export const defaultWeights: KpiWeights = { attendance: 30, violations: 20, shifts: 30, rating: 20 }
export const kpiStore = createStore<KpiRow[]>([
  { id: 'k-d1', empId: 'd1', attendance: 100, violations: 0, shiftsDone: 22, shiftsPlan: 22, rating: 4.9, status: 'На утверждении' },
  { id: 'k-d2', empId: 'd2', attendance: 95, violations: 1, shiftsDone: 20, shiftsPlan: 21, rating: 4.5, status: 'На утверждении' },
  { id: 'k-d3', empId: 'd3', attendance: 100, violations: 0, shiftsDone: 21, shiftsPlan: 21, rating: 4.8, status: 'На утверждении' },
  { id: 'k-d4', empId: 'd4', attendance: 82, violations: 0, shiftsDone: 16, shiftsPlan: 20, rating: 4.2, status: 'Черновик' },
  { id: 'k-d5', empId: 'd5', attendance: 91, violations: 2, shiftsDone: 18, shiftsPlan: 20, rating: 4.0, status: 'На утверждении' },
  { id: 'k-d6', empId: 'd6', attendance: 100, violations: 0, shiftsDone: 8, shiftsPlan: 8, rating: 4.6, status: 'Утверждён' },
  { id: 'k-d7', empId: 'd7', attendance: 96, violations: 1, shiftsDone: 21, shiftsPlan: 22, rating: 4.3, status: 'На утверждении' },
  { id: 'k-d8', empId: 'd8', attendance: 70, violations: 0, shiftsDone: 12, shiftsPlan: 17, rating: 4.4, status: 'Черновик' },
  { id: 'k-e4', empId: 'e4', attendance: 100, violations: 0, shiftsDone: 22, shiftsPlan: 22, rating: 4.8, status: 'На утверждении' },
  { id: 'k-e5', empId: 'e5', attendance: 98, violations: 0, shiftsDone: 21, shiftsPlan: 22, rating: 4.6, status: 'На утверждении' },
  { id: 'k-e1', empId: 'e1', attendance: 100, violations: 0, shiftsDone: 22, shiftsPlan: 22, rating: 4.9, status: 'Утверждён' },
  { id: 'k-e2', empId: 'e2', attendance: 95, violations: 0, shiftsDone: 21, shiftsPlan: 22, rating: 4.5, status: 'На утверждении' },
  { id: 'k-e3', empId: 'e3', attendance: 100, violations: 0, shiftsDone: 22, shiftsPlan: 22, rating: 4.7, status: 'Утверждён' },
])
export function calcKpi(r: KpiRow, w: KpiWeights = defaultWeights) {
  const parts = {
    attendance: r.attendance,
    violations: Math.max(0, 100 - r.violations * 25),
    shifts: r.shiftsPlan ? Math.min(100, (r.shiftsDone / r.shiftsPlan) * 100) : 0,
    rating: (r.rating / 5) * 100,
  }
  const total = w.attendance + w.violations + w.shifts + w.rating || 1
  const kpi = (parts.attendance * w.attendance + parts.violations * w.violations + parts.shifts * w.shifts + parts.rating * w.rating) / total
  return { parts, kpi: Math.round(kpi) }
}
/** Коэффициент к премиальной части: KPI ≥ 95 → 1.2, ≥ 85 → 1.0, ≥ 70 → 0.8, ниже → 0.5. */
export const kpiCoef = (k: number) => (k >= 95 ? 1.2 : k >= 85 ? 1 : k >= 70 ? 0.8 : 0.5)
export const kpiPeriodStore = createStore<{ period: string; sentAt?: string }>({ period: 'Сентябрь 2026' })
