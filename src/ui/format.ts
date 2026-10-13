export const money = (v: number, cur = 'BYN') =>
  `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(v)} ${cur}`

export const num = (v: number, digits = 0) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(v)

export const date = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const dateShort = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

export const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

export const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

export const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
  return many
}

export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
