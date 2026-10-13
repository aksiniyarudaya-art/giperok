import { createContext, useContext } from 'react'
import type { Equipment } from '../../data/types'
import type { Deal, PartnerOrder, PartnerSite, Payout } from '../../data/cabinet'

export type PartnerCtx = {
  equipment: Equipment[]
  saveEquipment: (e: Equipment) => void
  orders: PartnerOrder[]
  updateOrder: (o: PartnerOrder) => void
  sites: PartnerSite[]
  saveSite: (s: PartnerSite) => void
  deals: Deal[]
  payouts: Payout[]
  addPayout: (p: Payout) => void
}
export const PCtx = createContext<PartnerCtx | null>(null)
export function usePartner() {
  const c = useContext(PCtx)
  if (!c) throw new Error('usePartner вне PartnerApp')
  return c
}

/** Остаток к выплате: оплачено клиентами − комиссия платформы − выплаты текущего периода (с 06.10; ранние выплаты закрывали прошлый период). */
export function payoutBalance(deals: Deal[], payouts: Payout[]) {
  const paidNet = deals.reduce((a, d) => a + d.paid - Math.round(d.fee * (d.paid / d.amount)), 0)
  const out = payouts.filter((p) => p.date >= '2026-10-06').reduce((a, p) => a + p.amount, 0)
  return Math.max(0, paidNet - out)
}
