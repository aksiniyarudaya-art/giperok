import type { EquipmentCategory } from '../data/types'

/* Фото техники в фирменной обработке: синий тон, жёлтая и оранжевая техника остаётся в цвете (как в презентации). */
const files = import.meta.glob('../assets/eq/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const byCategory: Partial<Record<EquipmentCategory, string[]>> = {}
for (const [path, url] of Object.entries(files)) {
  const m = path.match(/\/(\w+)-\d+\.jpg$/)
  if (!m) continue
  const k = m[1] as EquipmentCategory
  ;(byCategory[k] ??= []).push(url)
}
export const brandPhoto = (name: string) => files[`../assets/eq/${name}.jpg`]

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function equipmentPhoto(category: EquipmentCategory, seed = '') {
  const list = byCategory[category] ?? byCategory.excavator ?? []
  return list[hash(seed) % list.length]
}

export function EquipmentArt({ category, label, seed }: { category: EquipmentCategory; label?: string; seed?: string }) {
  const src = equipmentPhoto(category, seed ?? label ?? '')
  return (
    <div className="eq-img" role="img" aria-label={label ?? 'Фото техники'}>
      <img src={src} alt="" decoding="async" />
    </div>
  )
}
