import type { Equipment } from '../../data/types'

const h = (id: string) => [...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 1000

/** Загрузка машины за последние 30 дней, % (демо-расчёт по статусу и истории). */
export function loadOf(e: Equipment) {
  const r = h(e.id) / 1000
  switch (e.status) {
    case 'Арендована': return Math.round(78 + r * 18)
    case 'Забронирована': return Math.round(58 + r * 20)
    case 'Свободна': return Math.round(24 + r * 38)
    case 'В ремонте': return Math.round(10 + r * 15)
    default: return 0
  }
}
/** Выручка машины за 30 дней: часы в работе × ставка. */
export const revenueOf = (e: Equipment) => Math.round((e.pricePerHour * 8 * 26 * loadOf(e)) / 100)
/** Ряд выручки по неделям для спарклайна. */
export const trendOf = (e: Equipment) => Array.from({ length: 8 }, (_, i) => Math.round(revenueOf(e) / 4 * (0.7 + (((h(e.id) * (i + 3)) % 60) / 100))))

/** Статусы, участвующие в расчёте загрузки (техника в обороте). */
export const inService = (e: Equipment) => ['Свободна', 'Забронирована', 'Арендована', 'В ремонте'].includes(e.status)
