import { createContext, useContext } from 'react'
import type { Order } from '../../data/types'
import type { SignDoc } from '../../data/cabinet'

export type BookPrefill = { siteId?: string; hours?: number; start?: string; comment?: string; fromOrder?: string }

export type ClientCtx = {
  hasContract: boolean
  setHasContract: (v: boolean) => void
  contractRequested: boolean
  requestContract: () => void
  fav: string[]
  toggleFav: (id: string) => void
  compare: string[]
  toggleCompare: (id: string) => void
  clearCompare: () => void
  orders: Order[]
  addOrder: (o: Order) => void
  updateOrder: (o: Order) => void
  book: (equipmentId: string, prefill?: BookPrefill) => void
  docs: SignDoc[]
  signDoc: (id: string) => void
  unread: number
}

export const Ctx = createContext<ClientCtx | null>(null)
export function useClient() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useClient вне ClientApp')
  return c
}
export const COMPARE_MAX = 4
