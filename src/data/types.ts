export type EquipmentCategory = 'excavator' | 'crane' | 'loader' | 'dumptruck' | 'bulldozer' | 'manipulator' | 'aerial'

export const categoryLabels: Record<EquipmentCategory, string> = {
  excavator: 'Экскаваторы',
  crane: 'Автокраны',
  loader: 'Погрузчики',
  dumptruck: 'Самосвалы',
  bulldozer: 'Бульдозеры',
  manipulator: 'Манипуляторы',
  aerial: 'Автовышки',
}
export const categoryOne: Record<EquipmentCategory, string> = {
  excavator: 'Экскаватор', crane: 'Автокран', loader: 'Погрузчик', dumptruck: 'Самосвал',
  bulldozer: 'Бульдозер', manipulator: 'Манипулятор', aerial: 'Автовышка',
}
/** Как считается работа по типу техники (часть 2, раздел 9): смены, рейсы, вахты. */
export const workMode: Record<EquipmentCategory, 'смена' | 'рейс' | 'вахта'> = {
  excavator: 'смена', crane: 'смена', loader: 'смена', dumptruck: 'рейс',
  bulldozer: 'вахта', manipulator: 'рейс', aerial: 'смена',
}

/** Статусы в каталоге/кабинете партнёра. */
export type EquipmentStatus = 'Свободна' | 'На модерации' | 'Забронирована' | 'Арендована' | 'Скрытая' | 'Архив' | 'В ремонте'

export type Equipment = {
  id: string
  category: EquipmentCategory
  brand: string
  model: string
  title: string
  short: string
  plate: string
  year: number
  /** грузоподъёмность, т */
  capacity?: number
  /** вылет стрелы, м */
  boom?: number
  /** объём ковша, м³ */
  bucket?: number
  extras: string[]
  pricePerHour: number
  pricePerShift: number
  minHours: number
  deliveryPerKm: number
  overtimePerHour: number
  region: string
  city: string
  address: string
  /** координаты на схеме карты, 0..100 */
  map: { x: number; y: number }
  rating: number
  reviews: number
  status: EquipmentStatus
  availableFrom?: string
  ownerId: string
  /** своя техника компании или привлечённая у партнёра */
  own: boolean
  driverId?: string
  managerId?: string
  motoHours: number
  mileage: number
  rentCostForUs?: number
  lastGeoAt: string
}

export type CompanyKind = 'tenant' | 'landlord'
export type Company = {
  id: string
  kind: CompanyKind
  type: 'Компания' | 'Физлицо'
  name: string
  unp: string
  legalAddress: string
  director: string
  representative: string
  phone: string
  email: string
  site?: string
  socials?: string
  bank: string
  hasContract: boolean
  debt: number
  critical?: boolean
  rating: number
  activeNote?: string
}

export type Role = 'manager' | 'driver' | 'mechanic' | 'hr' | 'admin'
export const roleLabels: Record<Role, string> = { manager: 'Менеджер', driver: 'Водитель', mechanic: 'Механик', hr: 'Кадровик', admin: 'Администратор' }

export type EmployeeStatus = 'Активный' | 'На больничном' | 'Отпуск' | 'Заблокирован' | 'Уволен'
export type HireStage = 'Кандидат' | 'Проверка' | 'Оформление' | 'Инструктаж' | 'Допущен'

export type Employee = {
  id: string
  name: string
  role: Role
  position: string
  department: string
  supervisorId?: string
  phone: string
  email: string
  status: EmployeeStatus
  hireStage: HireStage
  hiredAt: string
  contract: string
  rating: number
  kpi: number
  salary: number
  /** для водителей */
  license?: string
  shiftState?: 'На смене' | 'Не вышел' | 'Замена' | 'Выходной'
}

export type Site = {
  id: string
  name: string
  address: string
  clientId: string
  general: string
  contractors: string[]
  contacts: string
  schedule: string
  limits: string
  incidents: string[]
  notes: string
  status: 'Текущий' | 'Архив'
  map: { x: number; y: number }
}

export type OrderStatus = 'Новая' | 'На модерации' | 'Ожидает оплаты' | 'В работе' | 'Выполнена' | 'Отменена'
export type PayStatus = 'Оплачено' | 'Частично' | 'Долг'

export type Order = {
  id: string
  number: string
  date: string
  start: string
  hours: number
  equipmentId: string
  clientId: string
  siteId: string
  managerId: string
  driverId: string
  status: OrderStatus
  pay: PayStatus
  cost: number
  paid: number
  delivery: number
  docs: string[]
  comment: string
}
