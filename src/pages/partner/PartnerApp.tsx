import { useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Building2, ClipboardList, GraduationCap, LayoutDashboard, LifeBuoy, Truck, UserCircle, Wallet } from 'lucide-react'
import { Shell, type NavGroup } from '../../layouts/Shell'
import { deals as deals0, partnerEquipment, partnerOrders, partnerSites, partnerThreads, payouts as payouts0, type Deal, type PartnerOrder, type PartnerSite, type Payout } from '../../data/cabinet'
import type { Equipment } from '../../data/types'
import { PCtx, type PartnerCtx } from './ctx'
import Dashboard from './Dashboard'
import MyEquipment from './MyEquipment'
import Orders from './Orders'
import Sites from './Sites'
import Payments from './Payments'
import Support from './Support'
import Learning from './Learning'
import Profile from './Profile'
import './partner.css'

const upsert = <T extends { id: string }>(list: T[], x: T) => (list.some((i) => i.id === x.id) ? list.map((i) => (i.id === x.id ? x : i)) : [x, ...list])

export default function PartnerApp() {
  const [equipment, setEquipment] = useState<Equipment[]>(partnerEquipment)
  const [orders, setOrders] = useState<PartnerOrder[]>(partnerOrders)
  const [sites, setSites] = useState<PartnerSite[]>(partnerSites)
  const [deals] = useState<Deal[]>(deals0)
  const [payouts, setPayouts] = useState<Payout[]>(payouts0)

  const value: PartnerCtx = useMemo(() => ({
    equipment, saveEquipment: (e) => setEquipment((s) => upsert(s, e)),
    orders, updateOrder: (o) => setOrders((s) => upsert(s, o)),
    sites, saveSite: (x) => setSites((s) => upsert(s, x)),
    deals, payouts, addPayout: (p) => setPayouts((s) => [p, ...s]),
  }), [equipment, orders, sites, deals, payouts])

  const s = 18
  const newOrders = orders.filter((o) => o.status === 'Новая').length
  const moder = equipment.filter((e) => e.status === 'На модерации').length
  const groups: NavGroup[] = [
    { items: [
      { to: '/partner/dashboard', label: 'Дашборд', icon: <LayoutDashboard size={s} /> },
    ] },
    { title: 'Работа', items: [
      { to: '/partner/equipment', label: 'Моя техника', icon: <Truck size={s} />, badge: moder || undefined },
      { to: '/partner/orders', label: 'Заказы', icon: <ClipboardList size={s} />, badge: newOrders || undefined },
      { to: '/partner/sites', label: 'Мои объекты', icon: <Building2 size={s} /> },
      { to: '/partner/payments', label: 'Оплата', icon: <Wallet size={s} /> },
    ] },
    { title: 'Помощь', items: [
      { to: '/partner/support', label: 'Чат с поддержкой', icon: <LifeBuoy size={s} />, badge: partnerThreads.reduce((a, t) => a + (t.unread ?? 0), 0) || undefined },
      { to: '/partner/learning', label: 'Обучение', icon: <GraduationCap size={s} /> },
      { to: '/partner/profile', label: 'Профиль', icon: <UserCircle size={s} /> },
    ] },
  ]

  return (
    <PCtx.Provider value={value}>
      <Routes>
        <Route element={<Shell groups={groups} area="Кабинет партнёра" user="Шевчук Игорь" userRole="ООО «ТехноПарк Аренда»" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="equipment" element={<MyEquipment />} />
          <Route path="orders" element={<Orders />} />
          <Route path="sites" element={<Sites />} />
          <Route path="payments" element={<Payments />} />
          <Route path="support" element={<Support />} />
          <Route path="learning" element={<Learning />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/partner/dashboard" replace />} />
        </Route>
      </Routes>
    </PCtx.Provider>
  )
}
