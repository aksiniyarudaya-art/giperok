import { useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import {
  Calculator, ClipboardList, FileCheck2, FileX2, Heart, LayoutDashboard, LayoutGrid, Map as MapIcon, MessagesSquare, Scale, Star, UserCircle,
} from 'lucide-react'
import { Shell, type NavGroup } from '../../layouts/Shell'
import { useToast } from '../../ui'
import { clientOrders, clientThreads, signDocs, type SignDoc } from '../../data/cabinet'
import type { Order } from '../../data/types'
import { COMPARE_MAX, Ctx, type BookPrefill, type ClientCtx } from './ctx'
import BookingModal from './BookingModal'
import Dashboard from './Dashboard'
import Catalog from './Catalog'
import EquipmentDetail from './EquipmentDetail'
import MapPage from './MapPage'
import CalculatorPage from './CalculatorPage'
import Orders from './Orders'
import Compare from './Compare'
import Favorites from './Favorites'
import Dialogs from './Dialogs'
import Ratings from './Ratings'
import Profile from './Profile'
import './client.css'

export default function ClientApp() {
  const toast = useToast()
  const [hasContract, setHasContract] = useState(true)
  const [contractRequested, setContractRequested] = useState(false)
  const [fav, setFav] = useState<string[]>(['eq9', 'eq13', 'eq2'])
  const [compare, setCompare] = useState<string[]>(['eq1', 'eq2', 'eq3'])
  const [orders, setOrders] = useState<Order[]>(clientOrders)
  const [docs, setDocs] = useState<SignDoc[]>(signDocs)
  const [booking, setBooking] = useState<{ id: string; prefill?: BookPrefill } | null>(null)

  const value: ClientCtx = useMemo(() => ({
    hasContract,
    setHasContract,
    contractRequested,
    requestContract: () => { setContractRequested(true); toast('Заявка на договор отправлена — менеджер свяжется в течение часа') },
    fav,
    toggleFav: (id) => {
      const on = fav.includes(id)
      setFav(on ? fav.filter((x) => x !== id) : [...fav, id])
      toast(on ? 'Удалено из избранного' : 'Добавлено в избранное')
    },
    compare,
    toggleCompare: (id) => {
      if (compare.includes(id)) { setCompare(compare.filter((x) => x !== id)); toast('Убрано из сравнения'); return }
      if (compare.length >= COMPARE_MAX) { toast(`В сравнении максимум ${COMPARE_MAX} машины — уберите одну`); return }
      setCompare([...compare, id]); toast('Добавлено в сравнение')
    },
    clearCompare: () => setCompare([]),
    orders,
    addOrder: (o) => setOrders((s) => [o, ...s]),
    updateOrder: (o) => setOrders((s) => s.map((x) => (x.id === o.id ? o : x))),
    book: (id, prefill) => setBooking({ id, prefill }),
    docs,
    signDoc: (id) => { setDocs((s) => s.map((d) => (d.id === id ? { ...d, status: 'Подписан' } : d))); toast('Документ подписан ЭЦП и отправлен через ЭДО') },
    unread: clientThreads.reduce((a, t) => a + (t.unread ?? 0), 0),
  }), [hasContract, contractRequested, fav, compare, orders, docs, toast])

  const s = 18
  const toSign = docs.filter((d) => d.status !== 'Подписан').length
  const active = orders.filter((o) => o.status !== 'Выполнена' && o.status !== 'Отменена').length
  const groups: NavGroup[] = [
    { items: [
      { to: '/client/dashboard', label: 'Дашборд', icon: <LayoutDashboard size={s} /> },
    ] },
    { title: 'Аренда', items: [
      { to: '/client/catalog', label: 'Каталог техники', icon: <LayoutGrid size={s} /> },
      { to: '/client/map', label: 'Карта свободных машин', icon: <MapIcon size={s} /> },
      { to: '/client/calculator', label: 'Калькулятор', icon: <Calculator size={s} /> },
      { to: '/client/compare', label: 'Сравнение', icon: <Scale size={s} />, badge: compare.length || undefined },
      { to: '/client/favorites', label: 'Избранное', icon: <Heart size={s} />, badge: fav.length || undefined },
    ] },
    { title: 'Кабинет', items: [
      { to: '/client/orders', label: 'Мои заказы', icon: <ClipboardList size={s} />, badge: active || undefined },
      { to: '/client/dialogs', label: 'Диалоги', icon: <MessagesSquare size={s} />, badge: value.unread + toSign || undefined },
      { to: '/client/ratings', label: 'Рейтинги исполнителей', icon: <Star size={s} /> },
      { to: '/client/profile', label: 'Профиль', icon: <UserCircle size={s} /> },
    ] },
  ]

  const top = (
    <button
      className={`btn btn-sm cl-contract-toggle ${hasContract ? 'btn-ok' : 'btn-danger'}`}
      title="Демо: переключить наличие договора"
      onClick={() => { setHasContract(!hasContract); toast(hasContract ? 'Демо: договор отсутствует' : 'Демо: договор действует') }}
    >
      {hasContract ? <FileCheck2 /> : <FileX2 />}
      <span className="hide-mobile">{hasContract ? 'Договор есть' : 'Договора нет'}</span>
      <span className="cl-demo-tag hide-mobile">демо</span>
    </button>
  )

  return (
    <Ctx.Provider value={value}>
      <Routes>
        <Route element={<Shell groups={groups} area="Кабинет клиента" user="Лисовская Ирина" userRole="ООО «СтройМонолит»" top={top} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="catalog/:id" element={<EquipmentDetail />} />
          <Route path="map" element={<MapPage />} />
          <Route path="calculator" element={<CalculatorPage />} />
          <Route path="orders" element={<Orders />} />
          <Route path="compare" element={<Compare />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="dialogs" element={<Dialogs />} />
          <Route path="ratings" element={<Ratings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
        </Route>
      </Routes>
      {booking && <BookingModal equipmentId={booking.id} prefill={booking.prefill} onClose={() => setBooking(null)} />}
    </Ctx.Provider>
  )
}
