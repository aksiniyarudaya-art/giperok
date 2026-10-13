/* Демо-данные для кабинетов клиента (1.2) и партнёра-арендодателя (1.3). */
import type { ChatThread } from '../ui/Chat'
import type { Equipment, EquipmentCategory, Order } from './types'
import { drivers, eq, equipment, sites, TODAY } from './mock'

export const CLIENT_ID = 'c1'
export const PARTNER_ID = 'l1'

export const extrasByCategory: Record<EquipmentCategory, string[]> = {
  excavator: ['Гидромолот', 'Ковш планировочный', 'Ковш траншейный 0,4 м', 'Быстросъём', 'Гидробур'],
  loader: ['Вилы паллетные', 'Отвал снегоуборочный', 'Щётка', 'Гидромолот', 'Ковш 4в1'],
  crane: ['Гусёк 9 м', 'Комплект строп', 'Траверса', 'Люлька монтажная'],
  dumptruck: ['Тент', 'Обогрев кузова', 'Задний борт «книжка»'],
  bulldozer: ['Рыхлитель', 'Отвал поворотный', 'Отвал полусферический'],
  manipulator: ['Люлька', 'Захват для труб', 'Буровая установка', 'Грейфер'],
  aerial: ['Люлька 2 чел.', 'Изолированная корзина', 'Поворотная корзина'],
}

/** Ключевые характеристики, применимые к категории. */
export const specFields: Record<EquipmentCategory, ('capacity' | 'boom' | 'bucket')[]> = {
  excavator: ['capacity', 'boom', 'bucket'],
  loader: ['capacity', 'bucket', 'boom'],
  crane: ['capacity', 'boom'],
  dumptruck: ['capacity'],
  bulldozer: ['capacity'],
  manipulator: ['capacity', 'boom'],
  aerial: ['boom', 'capacity'],
}
export const specLabel = { capacity: 'Грузоподъёмность', boom: 'Вылет стрелы', bucket: 'Объём ковша' } as const
export const specUnit = { capacity: 'т', boom: 'м', bucket: 'м³' } as const

/** Дата, с которой техника снова доступна (для каталога клиента). */
export function availableDate(e: Equipment): string | undefined {
  if (e.status === 'Свободна') return undefined
  if (e.availableFrom) return e.availableFrom
  if (e.status === 'В ремонте') return '2026-10-20'
  return '2026-10-18'
}

/* ---------------- Схема-карта (условные координаты 0..100, Беларусь) ---------------- */
export const mapCities: { name: string; x: number; y: number; big?: boolean }[] = [
  { name: 'Минск', x: 50, y: 46, big: true }, { name: 'Борисов', x: 62, y: 40 }, { name: 'Молодечно', x: 38, y: 38 },
  { name: 'Брест', x: 10, y: 80, big: true }, { name: 'Барановичи', x: 32, y: 62 }, { name: 'Гродно', x: 9, y: 34, big: true },
  { name: 'Лида', x: 22, y: 32 }, { name: 'Витебск', x: 76, y: 14, big: true }, { name: 'Орша', x: 84, y: 32 },
  { name: 'Могилёв', x: 82, y: 50, big: true }, { name: 'Бобруйск', x: 64, y: 64 }, { name: 'Гомель', x: 84, y: 82, big: true },
  { name: 'Мозырь', x: 60, y: 86 },
]
/** Адреса для поиска на карте: улицы привязаны к точкам схемы. */
export const mapAddresses: { label: string; x: number; y: number }[] = [
  { label: 'Минск, ул. Кальварийская, 25 (офис)', x: 49, y: 45 },
  { label: 'Минск, ул. Брилевская, 35 (ЖК «Сокол»)', x: 48, y: 47 },
  { label: 'Минск, пр. Независимости, 168', x: 53, y: 43 },
  { label: 'Минский р-н, аг. Колядичи', x: 49, y: 50 },
  { label: 'Минский р-н, Ждановичи', x: 46, y: 44 },
  ...mapCities.filter((c) => c.name !== 'Минск').map((c) => ({ label: `${c.name}, центр`, x: c.x, y: c.y })),
]
/** 1 единица схемы ≈ 6 км. */
export const mapKm = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) * 6

/* ---------------- Клиент: объекты и заказы ---------------- */
export type ClientSite = { id: string; name: string; address: string; typical?: boolean }
export const clientSites: ClientSite[] = [
  ...sites.filter((s) => s.clientId === CLIENT_ID).map((s) => ({ id: s.id, name: s.name, address: s.address, typical: s.status === 'Текущий' })),
  { id: 'cs7', name: 'Склад «Колядичи»', address: 'Минский р-н, аг. Колядичи, ул. Бабушкина, 39', typical: true },
  { id: 'cs8', name: 'КП «Лесные озёра»', address: 'Минский р-н, д. Боровляны, ул. Озёрная, 2', typical: true },
]
export const clientSite = (id?: string) => clientSites.find((s) => s.id === id)

type OSeed = [string, string, string, number, string, Order['status'], Order['pay'], string, number]
// eqId, date, start, hours, siteId, status, pay, driverFallback, deliveryKm
const oSeeds: OSeed[] = [
  ['eq1', '2026-10-13', '08:00', 8, 's1', 'В работе', 'Оплачено', 'd1', 18],
  ['eq9', '2026-10-13', '07:30', 10, 's1', 'В работе', 'Частично', 'd3', 18],
  ['eq12', '2026-10-14', '08:00', 8, 'cs7', 'Новая', 'Долг', 'd2', 12],
  ['eq5', '2026-10-16', '09:00', 6, 'cs8', 'На модерации', 'Долг', 'd4', 22],
  ['eq17', '2026-10-17', '08:00', 4, 's1', 'На модерации', 'Долг', 'd5', 18],
  ['eq8', '2026-10-10', '08:00', 8, 's1', 'Ожидает оплаты', 'Долг', 'd3', 18],
  ['eq13', '2026-10-11', '07:30', 10, 'cs7', 'Ожидает оплаты', 'Частично', 'd7', 12],
  ['eq1', '2026-10-06', '08:00', 8, 's1', 'Выполнена', 'Оплачено', 'd1', 18],
  ['eq11', '2026-10-03', '08:00', 8, 's1', 'Выполнена', 'Оплачено', 'd2', 18],
  ['eq19', '2026-09-28', '09:00', 6, 'cs8', 'Выполнена', 'Оплачено', 'd10', 22],
  ['eq2', '2026-09-22', '08:00', 10, 's6', 'Выполнена', 'Оплачено', 'd8', 9],
  ['eq16', '2026-09-15', '08:00', 8, 's6', 'Выполнена', 'Оплачено', 'd6', 9],
  ['eq7', '2026-09-09', '08:00', 6, 'cs7', 'Отменена', 'Оплачено', 'd4', 12],
]
export const clientOrders: Order[] = oSeeds.map(([eqId, d, start, hours, siteId, status, pay, drv, km], i) => {
  const e = eq(eqId)!
  const delivery = Math.round(e.deliveryPerKm * km * 2)
  const cost = e.pricePerHour * Math.max(hours, e.minHours) + delivery
  return {
    id: `co${i + 1}`, number: `К-${3120 + i}`, date: d, start, hours, equipmentId: eqId, clientId: CLIENT_ID, siteId,
    managerId: 'e2', driverId: e.driverId ?? drv, status, pay,
    cost, paid: pay === 'Оплачено' ? cost : pay === 'Частично' ? Math.round(cost * 0.5) : 0, delivery,
    docs: status === 'Выполнена' ? ['Договор', 'Счёт', 'Акт выполненных работ', 'Путевой лист'] : status === 'Ожидает оплаты' ? ['Договор', 'Счёт', 'Путевой лист'] : status === 'Отменена' ? ['Заявка'] : ['Договор', 'Заявка'],
    comment: i === 0 ? 'Работа рядом с газопроводом, нужен опытный машинист' : i === 3 ? 'Планировка площадки под бытовки' : '',
  }
})

export const clientPayments = [
  { label: 'Май', value: 8400, value2: 8400 },
  { label: 'Июн', value: 11200, value2: 11900 },
  { label: 'Июл', value: 14600, value2: 14600 },
  { label: 'Авг', value: 9800, value2: 10400 },
  { label: 'Сен', value: 16300, value2: 17100 },
  { label: 'Окт', value: 6900, value2: 12800 },
]

/* ---------------- Отзывы и рейтинги ---------------- */
export type Review = { id: string; author: string; company: string; date: string; stars: number; text: string; target: string }
const reviewTexts = [
  'Приехали вовремя, машинист аккуратный, работу выполнил быстрее плана.',
  'Техника в хорошем состоянии, документы по смене пришли в тот же день.',
  'Были вопросы по пропуску на объект — менеджер решил за 15 минут. Рекомендуем.',
  'Немного задержались с выездом из-за пробки на МКАД, предупредили заранее.',
  'Работаем постоянно, удобно повторять заказ на типовой объект в пару кликов.',
]
const reviewAuthors: [string, string][] = [['Лисовская И.', 'ООО «СтройМонолит»'], ['Гурин О.', 'ОАО «Белдорстрой-7»'], ['Мельник Д.', 'ЧУП «Гарант-Девелопмент»'], ['Адамович А.', 'ООО «ГродноИнвестСтрой»'], ['Жук П.', 'Частный заказчик']]
export function reviewsFor(eqId: string): Review[] {
  const n = Number(eqId.replace(/\D/g, '')) || 1
  return Array.from({ length: 3 + (n % 3) }, (_, i) => {
    const [author, company] = reviewAuthors[(n + i) % reviewAuthors.length]
    return { id: `${eqId}-r${i}`, author, company, date: `2026-${String(9 + ((i + n) % 2)).padStart(2, '0')}-${String(3 + ((n * 7 + i * 5) % 24)).padStart(2, '0')}`, stars: i === 3 ? 4 : 5 - ((n + i) % 4 === 0 ? 1 : 0), text: reviewTexts[(n + i) % reviewTexts.length], target: eqId }
  })
}

export type Executor = { id: string; kind: 'driver' | 'company'; name: string; sub: string; rating: number; votes: number; orders: number; onTime: number; city: string }
export const executors: Executor[] = [
  ...drivers.slice(0, 8).map((d, i) => ({ id: d.id, kind: 'driver' as const, name: d.name, sub: d.position, rating: +(4.5 + ((i * 7) % 5) / 10).toFixed(1), votes: 14 + i * 9, orders: 40 + i * 23, onTime: 92 + (i % 4) * 2, city: ['Минск', 'Минск', 'Борисов', 'Минск', 'Молодечно', 'Брест', 'Минск', 'Гродно'][i] })),
  { id: 'own', kind: 'company', name: 'СпецХаб (собственный парк)', sub: '64 ед. техники · проверенный парк', rating: 4.8, votes: 412, orders: 3810, onTime: 98, city: 'Минск' },
  { id: 'l1', kind: 'company', name: 'ООО «ТехноПарк Аренда»', sub: '12 ед. техники · партнёр с 2024 г.', rating: 4.9, votes: 186, orders: 920, onTime: 97, city: 'Минск' },
  { id: 'l2', kind: 'company', name: 'ЧТУП «КранСервис»', sub: '7 автокранов · партнёр с 2025 г.', rating: 4.7, votes: 94, orders: 410, onTime: 95, city: 'Брест' },
  { id: 'l3', kind: 'company', name: 'ИП Левчук Роман Игоревич', sub: '3 ед. техники · новый партнёр', rating: 4.5, votes: 21, orders: 58, onTime: 91, city: 'Гомель' },
]
export const executorReviews: Review[] = [
  { id: 'xr1', author: 'Лисовская И.', company: 'ООО «СтройМонолит»', date: '2026-10-09', stars: 5, text: 'Сергей Викторович отработал смену без замечаний, грамотно выкопал траншею рядом с коммуникациями.', target: 'd1' },
  { id: 'xr2', author: 'Гурин О.', company: 'ОАО «Белдорстрой-7»', date: '2026-10-07', stars: 5, text: 'ТехноПарк — всегда техника в срок и полный пакет документов.', target: 'l1' },
  { id: 'xr3', author: 'Мельник Д.', company: 'ЧУП «Гарант-Девелопмент»', date: '2026-10-04', stars: 4, text: 'Кран пришёл с опозданием на 30 минут, но работу закончили вовремя.', target: 'l2' },
  { id: 'xr4', author: 'Адамович А.', company: 'ООО «ГродноИнвестСтрой»', date: '2026-10-01', stars: 5, text: 'Дмитрий — опытный крановщик, монтаж ферм прошёл чётко.', target: 'd3' },
]

/* ---------------- Клиент: диалоги и документы ---------------- */
export const clientThreads: ChatThread[] = [
  { id: 't1', title: 'Поддержка СпецХаб', sub: 'Отвечаем 24/7 · среднее время ответа 3 мин', unread: 2, msgs: [
    { from: 'Поддержка', text: 'Добрый день, Ирина Олеговна! Заказ К-3123 передан на модерацию, менеджер подтвердит технику до 18:00.', at: '10:12' },
    { from: 'Вы', me: true, text: 'Спасибо. Можно ли перенести начало смены на 07:30?', at: '10:20' },
    { from: 'Поддержка', text: 'Да, согласовали с владельцем техники. Время в заказе обновлено.', at: '10:26' },
    { from: 'Поддержка', text: 'Счёт по заказу К-3125 сформирован и отправлен на подпись.', at: '11:02', file: 'Счёт №1452 от 13.10.2026.pdf' },
  ] },
  { id: 't2', title: 'Бондарь Максим · менеджер', sub: 'Персональный менеджер по аренде', unread: 1, msgs: [
    { from: 'Бондарь М.', text: 'Ирина, на ЖК «Сокол» завтра освобождается второй экскаватор — если нужен, забронирую за вами.', at: 'вчера' },
  ] },
  { id: 't3', title: 'Документы на подпись', sub: 'ЭДО · уведомления о документах', unread: 0, msgs: [
    { from: 'ЭДО', text: 'Акт выполненных работ по заказу К-3127 ожидает подписи.', at: '09:40', file: 'Акт №880 от 06.10.2026.pdf' },
  ] },
]
export type SignDoc = { id: string; title: string; kind: 'Договор' | 'Счёт' | 'Акт' | 'Доп. соглашение'; order?: string; date: string; amount?: number; status: 'На подписи у клиента' | 'Подписан' }
export const signDocs: SignDoc[] = [
  { id: 'sd1', title: 'Акт выполненных работ №880', kind: 'Акт', order: 'К-3127', date: '2026-10-06', amount: 860, status: 'На подписи у клиента' },
  { id: 'sd2', title: 'Счёт на оплату №1452', kind: 'Счёт', order: 'К-3125', date: '2026-10-13', amount: 1101, status: 'На подписи у клиента' },
  { id: 'sd3', title: 'Доп. соглашение №4 к договору аренды', kind: 'Доп. соглашение', date: '2026-10-12', status: 'На подписи у клиента' },
  { id: 'sd4', title: 'Договор аренды спецтехники №ДА-2026/118', kind: 'Договор', date: '2026-02-03', status: 'Подписан' },
  { id: 'sd5', title: 'Акт выполненных работ №861', kind: 'Акт', order: 'К-3128', date: '2026-10-03', amount: 1000, status: 'Подписан' },
]

/* ---------------- Партнёр: техника ---------------- */
const base = eq('eq3')!
const mkEq = (p: Partial<Equipment> & Pick<Equipment, 'id' | 'category' | 'brand' | 'model' | 'status' | 'pricePerHour'>): Equipment => ({
  ...base, title: `${p.brand} ${p.model}`, capacity: undefined, boom: undefined, bucket: undefined, extras: [], availableFrom: undefined, driverId: undefined,
  pricePerShift: p.pricePerHour * 8, overtimePerHour: Math.round(p.pricePerHour * 1.5), ownerId: PARTNER_ID, own: false, ...p,
})
export const partnerExtraEquipment: Equipment[] = [
  mkEq({ id: 'pe1', category: 'excavator', brand: 'Doosan', model: 'DX225LCA', status: 'Арендована', pricePerHour: 110, capacity: 22, boom: 9.9, bucket: 1.05, extras: ['Гидромолот', 'Быстросъём'], plate: '4471 ЕК-7', year: 2021, address: 'Минск, ул. Брилевская, 35', city: 'Минск', region: 'Минская обл.', availableFrom: '2026-10-21', driverId: 'pd2', map: { x: 48, y: 47 }, short: 'Гусеничный экскаватор для котлованов и траншей, кабина ROPS.' }),
  mkEq({ id: 'pe2', category: 'crane', brand: 'Ивановец', model: 'КС-45719-7А', status: 'Забронирована', pricePerHour: 125, capacity: 25, boom: 31, extras: ['Комплект строп', 'Траверса'], plate: '2208 АВ-7', year: 2020, address: 'Минск, ул. Тимирязева, 67 (база)', city: 'Минск', region: 'Минская обл.', availableFrom: '2026-10-15', driverId: 'pd3', short: 'Автокран 25 т на шасси МАЗ, стрела 31 м.' }),
  mkEq({ id: 'pe3', category: 'loader', brand: 'Амкодор', model: '332С4', status: 'На модерации', pricePerHour: 78, capacity: 3.4, bucket: 1.9, extras: ['Вилы паллетные'], plate: '7710 МН-7', year: 2023, address: 'Борисов, ул. Строителей, 14', city: 'Борисов', region: 'Минская обл.', short: 'Фронтальный погрузчик для сыпучих грузов и планировки.' }),
  mkEq({ id: 'pe4', category: 'dumptruck', brand: 'МАЗ', model: '6516V8', status: 'Арендована', pricePerHour: 70, capacity: 25, extras: ['Обогрев кузова'], plate: '6123 ОТ-7', year: 2022, address: 'Минский р-н, аг. Колядичи', city: 'Минск', region: 'Минская обл.', availableFrom: '2026-10-19', driverId: 'pd4', short: 'Самосвал 6х4, кузов 20 м³ для вывоза грунта.' }),
  mkEq({ id: 'pe5', category: 'aerial', brand: 'МАЗ', model: 'АГП-18', status: 'Скрытая', pricePerHour: 65, boom: 18, capacity: 0.25, extras: ['Люлька 2 чел.'], plate: '3390 ВС-7', year: 2016, address: 'Минск, ул. Тимирязева, 67 (база)', city: 'Минск', region: 'Минская обл.', short: 'Автовышка 18 м для фасадных и кровельных работ.' }),
  mkEq({ id: 'pe6', category: 'bulldozer', brand: 'ЧТЗ', model: 'Б10М', status: 'Архив', pricePerHour: 90, capacity: 15, extras: ['Рыхлитель'], plate: '1180 АВ-7', year: 2012, address: 'Молодечно, ул. Промышленная, 3', city: 'Молодечно', region: 'Минская обл.', short: 'Бульдозер для планировки и срезки грунта. Снят с эксплуатации.' }),
]
export const partnerEquipment: Equipment[] = [
  ...equipment.filter((e) => e.ownerId === PARTNER_ID).map((e) => ({ ...e, driverId: undefined })),
  ...partnerExtraEquipment,
]

export type PartnerDriver = { id: string; name: string; phone: string; license: string; equipmentId?: string; orders: number; rating: number; address: string; state: 'На смене' | 'Выходной' | 'Свободен' }
export const partnerDrivers: PartnerDriver[] = [
  { id: 'pd1', name: 'Савчук Андрей Леонидович', phone: '+375 29 455-12-30', license: 'тракторист D, E', equipmentId: 'eq3', orders: 84, rating: 4.9, address: 'Минск, ул. Брилевская, 35 — ЖК «Сокол»', state: 'На смене' },
  { id: 'pd2', name: 'Романенко Виталий Петрович', phone: '+375 33 612-77-04', license: 'тракторист D', equipmentId: 'pe1', orders: 61, rating: 4.8, address: 'Минск, ул. Брилевская, 35 — ЖК «Сокол»', state: 'На смене' },
  { id: 'pd3', name: 'Гайдук Олег Иванович', phone: '+375 44 780-41-19', license: 'B, C · крановщик', equipmentId: 'pe2', orders: 102, rating: 4.7, address: 'База, ул. Тимирязева, 67', state: 'Свободен' },
  { id: 'pd4', name: 'Кулик Денис Сергеевич', phone: '+375 29 233-90-58', license: 'B, C, CE', equipmentId: 'pe4', orders: 133, rating: 4.6, address: 'аг. Колядичи, склад «Колядичи»', state: 'На смене' },
  { id: 'pd5', name: 'Бура Павел Николаевич', phone: '+375 33 301-15-62', license: 'B, C', equipmentId: 'eq14', orders: 47, rating: 4.9, address: 'Лида, ул. Индустриальная, 4', state: 'На смене' },
  { id: 'pd6', name: 'Жданович Илья Олегович', phone: '+375 29 118-66-71', license: 'тракторист D', equipmentId: 'eq6', orders: 29, rating: 4.5, address: '—', state: 'Выходной' },
]
// водители партнёра закрепляются за его техникой
for (const d of partnerDrivers) { const e = partnerEquipment.find((x) => x.id === d.equipmentId); if (e) e.driverId = d.id }
export const partnerDriver = (id?: string) => partnerDrivers.find((d) => d.id === id)

/* ---------------- Партнёр: заказы ---------------- */
export type PartnerOrderStatus = 'Новая' | 'Ожидает оплаты' | 'Оплачено' | 'Выполнена' | 'Отклонена'
export type PartnerOrder = { id: string; number: string; equipmentId: string; client: string; contact: string; site: string; address: string; date: string; start: string; hours: number; amount: number; status: PartnerOrderStatus; comment: string; docs: string[]; reason?: string }
type PSeed = [string, string, string, string, string, string, number, PartnerOrderStatus, string]
const pSeeds: PSeed[] = [
  ['eq3', 'ООО «СтройМонолит»', 'ЖК «Сокол»', 'Минск, ул. Брилевская, 35', '2026-10-15', '08:00', 8, 'Новая', 'Нужен ковш 1,2 м³, работа в стеснённых условиях'],
  ['eq19', 'ЧУП «Гарант-Девелопмент»', 'ТЦ «Брест Плаза»', 'Брест, ул. Московская, 210', '2026-10-16', '09:00', 6, 'Новая', 'Монтаж вывески, высота 20 м'],
  ['eq22', 'Жук Павел Валерьевич', 'Частный дом', 'аг. Ждановичи, ул. Лесная, 8', '2026-10-18', '09:00', 4, 'Новая', ''],
  ['eq11', 'ОАО «Белдорстрой-7»', 'Развязка М1 / МКАД', 'Минский р-н, 12 км МКАД', '2026-10-14', '07:30', 10, 'Ожидает оплаты', 'Вывоз грунта, 6 рейсов'],
  ['pe2', 'ООО «СтройМонолит»', 'Склад «Колядичи»', 'аг. Колядичи, ул. Бабушкина, 39', '2026-10-15', '08:00', 8, 'Ожидает оплаты', ''],
  ['pe1', 'ООО «СтройМонолит»', 'ЖК «Сокол»', 'Минск, ул. Брилевская, 35', '2026-10-13', '08:00', 10, 'Оплачено', 'Вахта до 21.10'],
  ['eq14', 'ООО «ГродноИнвестСтрой»', 'ЛЦ «Лида-Запад»', 'Лида, ул. Индустриальная, 4', '2026-10-12', '07:00', 10, 'Оплачено', ''],
  ['pe4', 'ООО «СтройМонолит»', 'Склад «Колядичи»', 'аг. Колядичи, ул. Бабушкина, 39', '2026-10-13', '07:30', 10, 'Оплачено', ''],
  ['eq3', 'ООО «СтройМонолит»', 'ЖК «Сокол»', 'Минск, ул. Брилевская, 35', '2026-10-06', '08:00', 8, 'Выполнена', ''],
  ['eq6', 'ООО «ГродноИнвестСтрой»', 'ЛЦ «Лида-Запад»', 'Лида, ул. Индустриальная, 4', '2026-10-02', '07:00', 8, 'Выполнена', ''],
  ['eq19', 'ОАО «Белдорстрой-7»', 'Развязка М1 / МКАД', 'Минский р-н, 12 км МКАД', '2026-09-29', '09:00', 6, 'Выполнена', ''],
  ['eq11', 'ООО «СтройМонолит»', 'КП «Лесные озёра»', 'д. Боровляны, ул. Озёрная, 2', '2026-09-24', '08:00', 8, 'Выполнена', ''],
  ['pe2', 'ЧУП «Гарант-Девелопмент»', 'ТЦ «Брест Плаза»', 'Брест, ул. Московская, 210', '2026-09-18', '08:00', 8, 'Отклонена', ''],
]
export const partnerOrders: PartnerOrder[] = pSeeds.map(([eqId, client, site, address, d, start, hours, status, comment], i) => {
  const e = partnerEquipment.find((x) => x.id === eqId)!
  return {
    id: `po${i + 1}`, number: `А-${2700 + i}`, equipmentId: eqId, client, contact: ['Лисовская И. · +375 29 611-24-80', 'Мельник Д. · +375 33 355-90-12', 'Жук П. · +375 29 150-77-31', 'Гурин О. · +375 44 702-11-45'][i % 4],
    site, address, date: d, start, hours, amount: e.pricePerHour * hours + Math.round(e.deliveryPerKm * 30), status, comment,
    docs: status === 'Выполнена' ? ['Договор-заявка', 'Путевой лист', 'Акт', 'Счёт'] : status === 'Оплачено' ? ['Договор-заявка', 'Счёт', 'Платёжное поручение'] : status === 'Ожидает оплаты' ? ['Договор-заявка', 'Счёт'] : ['Заявка клиента'],
    reason: status === 'Отклонена' ? 'Техника на ТО в указанные даты' : undefined,
  }
})

/* ---------------- Партнёр: объекты ---------------- */
export type PartnerSite = { id: string; name: string; address: string; kind: 'Объект клиента' | 'База / стоянка'; client: string; contacts: string; schedule: string; equipmentIds: string[]; notes: string; status: 'Текущий' | 'Архив' }
export const partnerSites: PartnerSite[] = [
  { id: 'ps1', name: 'База «Тимирязева»', address: 'Минск, ул. Тимирязева, 67', kind: 'База / стоянка', client: '—', contacts: 'Охрана · +375 17 300-40-51', schedule: 'Круглосуточно', equipmentIds: ['pe2', 'pe5'], notes: 'Стоянка на 14 ед., мойка, топливный терминал', status: 'Текущий' },
  { id: 'ps2', name: 'ЖК «Сокол»', address: 'Минск, ул. Брилевская, 35', kind: 'Объект клиента', client: 'ООО «СтройМонолит»', contacts: 'Прораб Лисовский В. · +375 29 611-24-81', schedule: 'Пн–Сб 08:00–20:00', equipmentIds: ['eq3', 'pe1'], notes: 'Пропуск за сутки, высота ворот 4,2 м', status: 'Текущий' },
  { id: 'ps3', name: 'Склад «Колядичи»', address: 'аг. Колядичи, ул. Бабушкина, 39', kind: 'Объект клиента', client: 'ООО «СтройМонолит»', contacts: 'Кладовщик Ерёменко Н. · +375 29 611-24-85', schedule: 'Пн–Пт 07:30–19:00', equipmentIds: ['pe4'], notes: '', status: 'Текущий' },
  { id: 'ps4', name: 'ЛЦ «Лида-Запад»', address: 'Лида, ул. Индустриальная, 4', kind: 'Объект клиента', client: 'ООО «ГродноИнвестСтрой»', contacts: 'Адамович А. · +375 29 788-03-21', schedule: 'Пн–Сб 07:00–19:00', equipmentIds: ['eq14'], notes: 'Проживание водителя за счёт заказчика', status: 'Текущий' },
  { id: 'ps5', name: 'Школа №12, реконструкция', address: 'Минск, ул. Седых, 12', kind: 'Объект клиента', client: 'ООО «СтройМонолит»', contacts: '—', schedule: '—', equipmentIds: [], notes: 'Объект закрыт 30.08.2026', status: 'Архив' },
]

/* ---------------- Партнёр: оплата ---------------- */
export type Deal = { id: string; number: string; date: string; client: string; equipmentId: string; amount: number; fee: number; paid: number; status: 'Оплачено' | 'Частично' | 'Долг'; docs: string[] }
export const deals: Deal[] = partnerOrders.filter((o) => o.status !== 'Новая' && o.status !== 'Отклонена').map((o, i) => {
  const paid = o.status === 'Ожидает оплаты' ? (i % 2 ? Math.round(o.amount * 0.3) : 0) : i === 8 ? Math.round(o.amount * 0.5) : o.amount
  return { id: `dl${i + 1}`, number: o.number, date: o.date, client: o.client, equipmentId: o.equipmentId, amount: o.amount, fee: Math.round(o.amount * 0.1), paid, status: paid >= o.amount ? 'Оплачено' : paid > 0 ? 'Частично' : 'Долг', docs: o.docs }
})
export type Payout = { id: string; date: string; amount: number; account: string; status: 'Выплачено' | 'В обработке' }
export const payouts: Payout[] = [
  { id: 'pay1', date: '2026-10-05', amount: 6420, account: 'BY02 ALFA •••• 9988', status: 'Выплачено' },
  { id: 'pay2', date: '2026-09-25', amount: 8150, account: 'BY02 ALFA •••• 9988', status: 'Выплачено' },
  { id: 'pay3', date: '2026-09-15', amount: 5390, account: 'BY02 ALFA •••• 9988', status: 'Выплачено' },
]
export const partnerRevenue = [
  { label: 'Май', value: 18400 }, { label: 'Июн', value: 22100 }, { label: 'Июл', value: 26900 },
  { label: 'Авг', value: 24300 }, { label: 'Сен', value: 29800 }, { label: 'Окт', value: 14200 },
]

export const partnerThreads: ChatThread[] = [
  { id: 'pt1', title: 'Поддержка СпецХаб', sub: 'Для партнёров · 24/7', unread: 1, msgs: [
    { from: 'Поддержка', text: 'Игорь Михайлович, добрый день! Погрузчик Амкодор 332С4 на модерации — пришлите, пожалуйста, фото техпаспорта.', at: '09:15' },
    { from: 'Вы', me: true, text: 'Добрый день, загрузил в карточку техники.', at: '09:31', file: 'Техпаспорт_332С4.pdf' },
    { from: 'Поддержка', text: 'Спасибо! Проверим в течение 2 часов.', at: '09:33' },
  ] },
  { id: 'pt2', title: 'Бухгалтерия платформы', sub: 'Выплаты и закрывающие документы', unread: 0, msgs: [
    { from: 'Бухгалтерия', text: 'Выплата 6 420 BYN от 05.10 проведена. Акт сверки за сентябрь во вложении.', at: '05.10', file: 'Акт сверки 09.2026.pdf' },
  ] },
  { id: 'pt3', title: 'Кравченко Ольга · менеджер', sub: 'Курирующий менеджер СпецХаб', unread: 0, msgs: [
    { from: 'Кравченко О.', text: 'На следующей неделе будет большой заказ на самосвалы под М1 — держите 2 машины свободными, если получится.', at: 'вчера' },
  ] },
]

export type Lesson = { id: string; kind: 'video' | 'guide'; title: string; desc: string; minutes: number; shot: 'catalog' | 'form' | 'orders' | 'chat' | 'payout' | 'dashboard'; steps: string[] }
export const lessons: Lesson[] = [
  { id: 'ls1', kind: 'video', title: 'Знакомство с кабинетом партнёра', desc: 'Обзор разделов: техника, заказы, оплата, объекты.', minutes: 4, shot: 'dashboard', steps: ['Дашборд показывает загрузку парка и выручку', 'В меню слева — все разделы кабинета', 'Колокольчик сверху — уведомления о новых заказах'] },
  { id: 'ls2', kind: 'video', title: 'Как добавить технику и пройти модерацию', desc: 'Заполнение карточки, фото, документы и сроки проверки.', minutes: 6, shot: 'form', steps: ['Откройте «Моя техника» → «Добавить технику»', 'Укажите категорию, марку, модель, характеристики', 'Загрузите 4–8 фото и документы (техпаспорт, страховка)', 'Задайте цены: час, смена, доставка, переработка', 'Нажмите «Отправить на модерацию» — проверка до 2 часов'] },
  { id: 'ls3', kind: 'guide', title: 'Принимаем заказ за 1 минуту', desc: 'Что проверить перед подтверждением заявки клиента.', minutes: 2, shot: 'orders', steps: ['Откройте вкладку «Новые» в разделе «Заказы»', 'Проверьте дату, адрес объекта и требования клиента', 'Нажмите «Принять» — клиент получит счёт на оплату', 'Если техника занята — «Отклонить» с указанием причины'] },
  { id: 'ls4', kind: 'guide', title: 'Выплаты и закрывающие документы', desc: 'Когда приходят деньги и где взять акты.', minutes: 3, shot: 'payout', steps: ['Раздел «Оплата» → вкладка «Сделки»', 'Остаток к выплате = оплачено клиентами − комиссия − выплачено', 'Нажмите «Запросить выплату» и укажите сумму', 'Акты и счета прикреплены к каждой сделке'] },
  { id: 'ls5', kind: 'video', title: 'Гео-метка и фото в конце смены', desc: 'Как водитель обновляет позицию техники на карте клиентов.', minutes: 3, shot: 'catalog', steps: ['Водитель в приложении нажимает «Завершить смену»', 'Делает фото техники и путевого листа', 'Позиция машины на карте каталога обновляется автоматически'] },
  { id: 'ls6', kind: 'guide', title: 'Чат с поддержкой и спорные ситуации', desc: 'Как быстро решить вопрос по заказу.', minutes: 2, shot: 'chat', steps: ['Откройте «Чат с поддержкой»', 'Укажите номер заказа и приложите фото', 'Менеджер ответит в течение 5 минут'] },
]

export const isoPlus = (days: number, from = TODAY) => {
  const d = new Date(from); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10)
}
