import type { Company, Employee, Equipment, EquipmentCategory, Order, Site } from './types'

/** «Сегодня» для демо-данных. */
export const TODAY = '2026-10-13'

const rnd = (() => { let s = 42; return () => (s = (s * 16807) % 2147483647) / 2147483647 })()
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]

export const regions: Record<string, string[]> = {
  'Минская обл.': ['Минск', 'Борисов', 'Молодечно'],
  'Брестская обл.': ['Брест', 'Барановичи'],
  'Гомельская обл.': ['Гомель', 'Мозырь'],
  'Гродненская обл.': ['Гродно', 'Лида'],
  'Витебская обл.': ['Витебск', 'Орша'],
  'Могилёвская обл.': ['Могилёв', 'Бобруйск'],
}

/* ---------------- Компании ---------------- */
export const companies: Company[] = [
  { id: 'c1', kind: 'tenant', type: 'Компания', name: 'ООО «СтройМонолит»', unp: '191234567', legalAddress: 'г. Минск, ул. Кальварийская, 25', director: 'Ковалёв Андрей Петрович', representative: 'Лисовская Ирина Олеговна', phone: '+375 29 611-24-80', email: 'zakaz@stroymonolit.by', site: 'stroymonolit.by', socials: 'instagram.com/stroymonolit', bank: 'BY20 ALFA 3012 0000 0000 1234 · Альфа-Банк', hasContract: true, debt: 0, rating: 4.8, activeNote: 'Активная аренда на ЖК «Сокол»' },
  { id: 'c2', kind: 'tenant', type: 'Компания', name: 'ОАО «Белдорстрой-7»', unp: '100456789', legalAddress: 'г. Минск, пр. Победителей, 104', director: 'Тарасевич Виктор Иванович', representative: 'Гурин Олег Сергеевич', phone: '+375 44 702-11-45', email: 'snab@bds7.by', bank: 'BY54 BPSB 3012 0000 0000 7788 · Сбер Банк', hasContract: true, debt: 50000, critical: true, rating: 4.1, activeNote: 'Долг 50 000 BYN' },
  { id: 'c3', kind: 'tenant', type: 'Компания', name: 'ЧУП «Гарант-Девелопмент»', unp: '691112233', legalAddress: 'г. Брест, ул. Московская, 210', director: 'Савицкая Елена Николаевна', representative: 'Мельник Денис Андреевич', phone: '+375 33 355-90-12', email: 'office@garant-dev.by', bank: 'BY11 BLBB 3012 0000 0000 4455 · Белинвестбанк', hasContract: false, debt: 0, rating: 4.6 },
  { id: 'c4', kind: 'tenant', type: 'Физлицо', name: 'Жук Павел Валерьевич', unp: '—', legalAddress: 'Минский р-н, аг. Ждановичи, ул. Лесная, 8', director: 'Жук Павел Валерьевич', representative: 'Жук Павел Валерьевич', phone: '+375 29 150-77-31', email: 'p.zhuk@mail.by', bank: '—', hasContract: false, debt: 0, rating: 5 },
  { id: 'c5', kind: 'tenant', type: 'Компания', name: 'ООО «ГродноИнвестСтрой»', unp: '590887766', legalAddress: 'г. Гродно, ул. Горького, 91', director: 'Рыбак Сергей Леонидович', representative: 'Адамович Анна Викторовна', phone: '+375 29 788-03-21', email: 'gis@gis.by', bank: 'BY77 PJCB 3012 0000 0000 3311 · Приорбанк', hasContract: true, debt: 12400, rating: 4.4 },
  { id: 'l1', kind: 'landlord', type: 'Компания', name: 'ООО «ТехноПарк Аренда»', unp: '192333444', legalAddress: 'г. Минск, ул. Тимирязева, 67', director: 'Шевчук Игорь Михайлович', representative: 'Котова Марина Юрьевна', phone: '+375 29 300-40-50', email: 'rent@technopark.by', site: 'technopark.by', bank: 'BY02 ALFA 3012 0000 0000 9988 · Альфа-Банк', hasContract: true, debt: 0, rating: 4.9 },
  { id: 'l2', kind: 'landlord', type: 'Компания', name: 'ЧТУП «КранСервис»', unp: '291555666', legalAddress: 'г. Брест, ул. Катин Бор, 102', director: 'Новик Алексей Владимирович', representative: 'Новик Алексей Владимирович', phone: '+375 33 640-22-10', email: 'kran@kranservice.by', bank: 'BY45 BAPB 3012 0000 0000 2201 · Белагропромбанк', hasContract: true, debt: 0, rating: 4.7 },
  { id: 'l3', kind: 'landlord', type: 'Физлицо', name: 'ИП Левчук Роман Игоревич', unp: '791000222', legalAddress: 'г. Гомель, ул. Барыкина, 140', director: 'Левчук Роман Игоревич', representative: 'Левчук Роман Игоревич', phone: '+375 44 512-66-09', email: 'levchuk.r@gmail.com', bank: 'BY63 BPSB 3012 0000 0000 6402 · Сбер Банк', hasContract: false, debt: 0, rating: 4.5 },
  { id: 'own', kind: 'landlord', type: 'Компания', name: 'Гиперок (собственный парк)', unp: '193000001', legalAddress: 'г. Минск, ул. Ваупшасова, 10', director: 'Администрация', representative: 'Диспетчерская', phone: '+375 44 582-11-11', email: 'park@giperok.by', bank: '—', hasContract: true, debt: 0, rating: 4.8 },
]

/* ---------------- Сотрудники ---------------- */
const mk = (id: string, name: string, role: Employee['role'], position: string, extra: Partial<Employee> = {}): Employee => ({
  id, name, role, position,
  department: role === 'driver' ? 'Транспортный участок' : role === 'mechanic' ? 'Ремонтная служба' : role === 'hr' ? 'Отдел кадров' : 'Коммерческий отдел',
  supervisorId: role === 'driver' || role === 'mechanic' ? 'e1' : undefined,
  phone: `+375 29 ${Math.floor(100 + rnd() * 899)}-${Math.floor(10 + rnd() * 89)}-${Math.floor(10 + rnd() * 89)}`,
  email: `${id}@giperok.by`, status: 'Активный', hireStage: 'Допущен',
  hiredAt: `20${pick(['21', '22', '23', '24', '25'])}-0${1 + Math.floor(rnd() * 9)}-1${Math.floor(rnd() * 9)}`,
  contract: `ТД-${100 + Number(id.replace(/\D/g, ''))}`, rating: +(4 + rnd()).toFixed(1), kpi: Math.round(70 + rnd() * 30),
  salary: role === 'driver' ? 2600 : role === 'mechanic' ? 2400 : role === 'hr' ? 2100 : 3200,
  ...extra,
})

export const employees: Employee[] = [
  mk('e1', 'Кравченко Ольга Сергеевна', 'manager', 'Старший менеджер'),
  mk('e2', 'Бондарь Максим Олегович', 'manager', 'Менеджер по аренде'),
  mk('e3', 'Дубовик Анастасия Игоревна', 'manager', 'Менеджер колл-центра'),
  mk('e4', 'Сидоренко Павел Николаевич', 'mechanic', 'Главный механик'),
  mk('e5', 'Гриб Василий Петрович', 'mechanic', 'Механик'),
  mk('e6', 'Мороз Татьяна Александровна', 'hr', 'Специалист по кадрам'),
  mk('e7', 'Захарова Наталья Викторовна', 'admin', 'Администратор платформы'),
  mk('d1', 'Иванов Сергей Викторович', 'driver', 'Машинист экскаватора', { license: 'B, C, CE · тракторист D, E', shiftState: 'На смене' }),
  mk('d2', 'Петрович Алексей Иванович', 'driver', 'Водитель самосвала', { license: 'B, C, CE', shiftState: 'На смене' }),
  mk('d3', 'Козлов Дмитрий Андреевич', 'driver', 'Машинист автокрана', { license: 'B, C · крановщик', shiftState: 'На смене' }),
  mk('d4', 'Михалевич Артём Юрьевич', 'driver', 'Машинист погрузчика', { license: 'B · тракторист D', shiftState: 'Не вышел' }),
  mk('d5', 'Шуляк Николай Степанович', 'driver', 'Водитель манипулятора', { license: 'B, C, CE', shiftState: 'Замена' }),
  mk('d6', 'Ткачук Игорь Валентинович', 'driver', 'Машинист бульдозера', { license: 'тракторист D, E', shiftState: 'Выходной', status: 'Отпуск' }),
  mk('d7', 'Лукашевич Роман Олегович', 'driver', 'Водитель самосвала', { license: 'B, C', shiftState: 'На смене' }),
  mk('d8', 'Пашкевич Евгений Михайлович', 'driver', 'Машинист экскаватора', { license: 'тракторист D', shiftState: 'Выходной', status: 'На больничном' }),
  mk('d9', 'Волков Кирилл Денисович', 'driver', 'Водитель самосвала', { license: 'B, C', hireStage: 'Инструктаж', shiftState: 'Выходной' }),
  mk('d10', 'Ярошевич Антон Павлович', 'driver', 'Машинист автовышки', { license: 'B, C', hireStage: 'Проверка', shiftState: 'Выходной' }),
  mk('d11', 'Белый Вадим Сергеевич', 'driver', 'Водитель самосвала', { license: 'B, C', hireStage: 'Кандидат', shiftState: 'Выходной' }),
]
export const drivers = employees.filter((e) => e.role === 'driver')
export const managers = employees.filter((e) => e.role === 'manager')
export const emp = (id?: string) => employees.find((e) => e.id === id)

/* ---------------- Объекты ---------------- */
export const sites: Site[] = [
  { id: 's1', name: 'ЖК «Сокол»', address: 'г. Минск, ул. Брилевская, 35', clientId: 'c1', general: 'ООО «СтройМонолит»', contractors: ['ЧУП «ФасадПро»', 'ООО «ЭлектроМонтаж-М»'], contacts: 'Прораб Лисовский В. · +375 29 611-24-81', schedule: 'Пн–Сб 08:00–20:00', limits: 'Въезд с ул. Брилевской, высота ворот 4,2 м', incidents: ['12.10 — задержка выезда на 40 мин'], notes: 'Пропуск заказывать за сутки', status: 'Текущий', map: { x: 48, y: 46 } },
  { id: 's2', name: 'Развязка М1 / МКАД', address: 'Минский р-н, 12 км МКАД', clientId: 'c2', general: 'ОАО «Белдорстрой-7»', contractors: ['ООО «ДорМост»'], contacts: 'Нач. участка Гурин О. · +375 44 702-11-45', schedule: 'Круглосуточно, вахта 15/15', limits: 'Перекрытие полосы согласовано до 30.11', incidents: [], notes: '', status: 'Текущий', map: { x: 30, y: 62 } },
  { id: 's3', name: 'ТЦ «Брест Плаза»', address: 'г. Брест, ул. Московская, 210', clientId: 'c3', general: 'ЧУП «Гарант-Девелопмент»', contractors: [], contacts: 'Мельник Д. · +375 33 355-90-12', schedule: 'Пн–Пт 08:00–18:00', limits: 'Работы с шумом до 19:00', incidents: [], notes: '', status: 'Текущий', map: { x: 12, y: 74 } },
  { id: 's4', name: 'Частный дом, Ждановичи', address: 'аг. Ждановичи, ул. Лесная, 8', clientId: 'c4', general: '—', contractors: [], contacts: 'Жук П. · +375 29 150-77-31', schedule: 'Сб–Вс 09:00–17:00', limits: 'Узкий проезд, до 3,5 м', incidents: [], notes: 'Котлован под фундамент', status: 'Текущий', map: { x: 40, y: 34 } },
  { id: 's5', name: 'Логистический центр «Лида-Запад»', address: 'г. Лида, ул. Индустриальная, 4', clientId: 'c5', general: 'ООО «ГродноИнвестСтрой»', contractors: ['ООО «МеталлКаркас»'], contacts: 'Адамович А. · +375 29 788-03-21', schedule: 'Пн–Сб 07:00–19:00', limits: '', incidents: ['02.10 — повреждение ограждения'], notes: '', status: 'Текущий', map: { x: 22, y: 30 } },
  { id: 's6', name: 'Школа №12, реконструкция', address: 'г. Минск, ул. Седых, 12', clientId: 'c1', general: 'ООО «СтройМонолит»', contractors: [], contacts: '—', schedule: '—', limits: '', incidents: [], notes: 'Закрыт 30.08.2026', status: 'Архив', map: { x: 56, y: 40 } },
]

/* ---------------- Техника ---------------- */
type Spec = [EquipmentCategory, string, string, Partial<Equipment>]
const specs: Spec[] = [
  ['excavator', 'Hyundai', 'R210W-9S', { bucket: 1.0, boom: 9.6, capacity: 21, pricePerHour: 95 }],
  ['excavator', 'JCB', 'JS220LC', { bucket: 1.2, boom: 9.9, capacity: 22, pricePerHour: 105 }],
  ['excavator', 'Caterpillar', '320 GC', { bucket: 1.19, boom: 9.9, capacity: 22, pricePerHour: 115 }],
  ['excavator', 'Komatsu', 'PC78US', { bucket: 0.32, boom: 7.2, capacity: 8, pricePerHour: 75 }],
  ['loader', 'JCB', '3CX Super', { bucket: 1.1, capacity: 3.3, boom: 5.9, pricePerHour: 70 }],
  ['loader', 'Амкодор', '342В', { bucket: 3.4, capacity: 6, pricePerHour: 85 }],
  ['loader', 'Bobcat', 'S650', { bucket: 0.5, capacity: 1.2, pricePerHour: 60 }],
  ['crane', 'Ивановец', 'КС-45717-1', { capacity: 25, boom: 28, pricePerHour: 120 }],
  ['crane', 'Галичанин', 'КС-55713-5В', { capacity: 25, boom: 31, pricePerHour: 125 }],
  ['crane', 'Liebherr', 'LTM 1050-3.1', { capacity: 50, boom: 48, pricePerHour: 260 }],
  ['dumptruck', 'МАЗ', '6501C9', { capacity: 20, pricePerHour: 65 }],
  ['dumptruck', 'МАЗ', '5516X5', { capacity: 20, pricePerHour: 62 }],
  ['dumptruck', 'Volvo', 'FMX 460', { capacity: 25, pricePerHour: 80 }],
  ['dumptruck', 'Scania', 'P440 8x4', { capacity: 32, pricePerHour: 90 }],
  ['bulldozer', 'Shantui', 'SD16', { capacity: 17, pricePerHour: 110 }],
  ['bulldozer', 'Komatsu', 'D65EX', { capacity: 21, pricePerHour: 140 }],
  ['manipulator', 'МАЗ', '6312 + Palfinger PK 23500', { capacity: 10, boom: 15, pricePerHour: 90 }],
  ['manipulator', 'Hyundai', 'HD120 + Kanglim', { capacity: 5, boom: 12, pricePerHour: 72 }],
  ['aerial', 'МАЗ', 'АГП-28', { boom: 28, capacity: 0.3, pricePerHour: 85 }],
  ['aerial', 'Isuzu', 'АГП-22 Horyong', { boom: 22, capacity: 0.25, pricePerHour: 70 }],
  ['excavator', 'Volvo', 'EW160E', { bucket: 0.7, boom: 8.8, capacity: 16, pricePerHour: 95 }],
  ['loader', 'Liugong', '835H', { bucket: 1.8, capacity: 3.5, pricePerHour: 72 }],
  ['dumptruck', 'Howo', 'ZZ3327', { capacity: 25, pricePerHour: 68 }],
  ['crane', 'Клинцы', 'КС-55713-1К', { capacity: 25, boom: 28, pricePerHour: 118 }],
]
const extrasBy: Record<EquipmentCategory, string[]> = {
  excavator: ['Гидромолот', 'Ковш планировочный', 'Ковш траншейный 0,4 м', 'Быстросъём'],
  loader: ['Вилы паллетные', 'Отвал снегоуборочный', 'Щётка', 'Гидромолот'],
  crane: ['Гусёк 9 м', 'Комплект строп', 'Траверса'],
  dumptruck: ['Тент', 'Обогрев кузова'],
  bulldozer: ['Рыхлитель', 'Отвал поворотный'],
  manipulator: ['Люлька', 'Захват для труб', 'Буровая установка'],
  aerial: ['Люлька 2 чел.', 'Изолированная корзина'],
}
const statusPool: Equipment['status'][] = ['Свободна', 'Свободна', 'Свободна', 'Арендована', 'Забронирована', 'Свободна', 'Арендована', 'На модерации', 'Свободна', 'В ремонте']
const owners = ['own', 'own', 'l1', 'own', 'l2', 'l1', 'own', 'l3']
const regionKeys = Object.keys(regions)

export const equipment: Equipment[] = specs.map(([category, brand, model, p], i) => {
  const region = i % 3 === 0 ? 'Минская обл.' : pick(regionKeys)
  const city = region === 'Минская обл.' && i % 2 === 0 ? 'Минск' : pick(regions[region])
  const status = statusPool[i % statusPool.length]
  const ownerId = owners[i % owners.length]
  const pph = p.pricePerHour ?? 80
  const drv = drivers[i % 8]
  return {
    id: `eq${i + 1}`,
    category, brand, model,
    title: `${brand} ${model}`,
    short: {
      excavator: 'Колёсный/гусеничный экскаватор для земляных работ, котлованов и траншей.',
      loader: 'Погрузка сыпучих грузов, планировка, уборка территории.',
      crane: 'Монтаж конструкций, подъём и перемещение грузов на объекте.',
      dumptruck: 'Вывоз грунта и доставка сыпучих материалов.',
      bulldozer: 'Планировка участков, срезка грунта, отсыпка.',
      manipulator: 'Перевозка с самопогрузкой: плиты, блоки, трубы, вагончики.',
      aerial: 'Высотные работы: фасады, кровля, освещение, вывески.',
    }[category],
    plate: `${1000 + Math.floor(rnd() * 8999)} ${pick(['АВ', 'ЕК', 'МН', 'ОТ', 'ВС'])}-${1 + (i % 7)}`,
    year: 2014 + (i % 11),
    capacity: p.capacity, boom: p.boom, bucket: p.bucket,
    extras: extrasBy[category].slice(0, 1 + (i % extrasBy[category].length)),
    pricePerHour: pph,
    pricePerShift: pph * 8,
    minHours: category === 'dumptruck' || category === 'manipulator' ? 2 : 4,
    deliveryPerKm: category === 'crane' || category === 'bulldozer' ? 4.5 : 2.8,
    overtimePerHour: Math.round(pph * 1.5),
    region, city,
    address: `${city}, ${pick(['ул. Промышленная', 'ул. Складская', 'ул. Ленина', 'пр. Независимости', 'ул. Строителей'])}, ${1 + Math.floor(rnd() * 120)}`,
    map: { x: 8 + rnd() * 84, y: 10 + rnd() * 78 },
    rating: +(4.2 + rnd() * 0.8).toFixed(1),
    reviews: 3 + Math.floor(rnd() * 60),
    status,
    availableFrom: status === 'Арендована' || status === 'Забронирована' ? `2026-10-${15 + (i % 12)}` : undefined,
    ownerId,
    own: ownerId === 'own',
    driverId: drv.id,
    managerId: managers[i % managers.length].id,
    motoHours: 1200 + Math.floor(rnd() * 9000),
    mileage: category === 'dumptruck' || category === 'manipulator' || category === 'crane' || category === 'aerial' ? 40000 + Math.floor(rnd() * 260000) : 0,
    rentCostForUs: ownerId === 'own' ? undefined : Math.round(pph * 0.78),
    lastGeoAt: `2026-10-12T${17 + (i % 4)}:${10 + (i % 49)}:00`,
  }
})
export const eq = (id?: string) => equipment.find((e) => e.id === id)
export const company = (id?: string) => companies.find((c) => c.id === id)
export const site = (id?: string) => sites.find((s) => s.id === id)

/* ---------------- Заявки / заказы ---------------- */
const orderStatuses: Order['status'][] = ['В работе', 'В работе', 'Выполнена', 'Ожидает оплаты', 'На модерации', 'Новая', 'Выполнена', 'Отменена']
export const orders: Order[] = Array.from({ length: 28 }, (_, i) => {
  const e = equipment[(i * 5) % equipment.length]
  const s = sites[i % 5]
  const status = orderStatuses[i % orderStatuses.length]
  const hours = [8, 8, 10, 6, 12, 4, 8][i % 7]
  const cost = e.pricePerHour * hours + Math.round(e.deliveryPerKm * 25)
  const pay: Order['pay'] = status === 'Выполнена' ? (i % 3 === 0 ? 'Долг' : i % 3 === 1 ? 'Частично' : 'Оплачено') : status === 'Ожидает оплаты' ? 'Долг' : 'Оплачено'
  const day = Math.max(1, 13 - (i % 14) + (status === 'Новая' || status === 'На модерации' ? 4 : 0))
  return {
    id: `o${i + 1}`,
    number: `А-${2610 + i}`,
    date: `2026-10-${String(Math.min(day, 28)).padStart(2, '0')}`,
    start: ['08:00', '07:30', '09:00', '08:00', '20:00'][i % 5],
    hours,
    equipmentId: e.id,
    clientId: s.clientId,
    siteId: s.id,
    managerId: managers[i % managers.length].id,
    driverId: e.driverId!,
    status,
    pay: status === 'Отменена' ? 'Оплачено' : pay,
    cost,
    paid: pay === 'Оплачено' ? cost : pay === 'Частично' ? Math.round(cost / 2) : 0,
    delivery: Math.round(e.deliveryPerKm * 25),
    docs: status === 'Выполнена' ? ['Договор', 'Счёт', 'Акт', 'Путевой лист'] : ['Договор'],
    comment: i % 4 === 0 ? 'Нужен опытный машинист, работа рядом с газопроводом' : '',
  }
})
export const order = (id?: string) => orders.find((o) => o.id === id)
