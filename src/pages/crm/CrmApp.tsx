import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import {
  BookOpen, Briefcase, Building2, Calculator, CalendarClock, ClipboardCheck, Clock, FileText, Fuel, Gauge, HardHat,
  LayoutDashboard, MapPinned, MessagesSquare, PhoneCall, Route as RouteIcon, ShieldCheck, Trophy, Truck, UserCircle, Users, Wrench,
} from 'lucide-react'
import { Shell, type NavGroup } from '../../layouts/Shell'
import { emp } from '../../data/mock'
import { roleLabels, type Role } from '../../data/types'
import Profile from './Profile'
import Dashboard from './Dashboard'
import Employees from './Employees'
import Tenants from './Tenants'
import Landlords from './Landlords'
import CallCenter from './CallCenter'
import EquipmentPage from './Equipment'
import FuelPage from './Fuel'
import Trips from './Trips'
import Sites from './Sites'
import Accounting from './Accounting'
import Timesheet from './Timesheet'
import Docs from './Docs'
import Motivation from './Motivation'
import Instructions from './Instructions'
import Chats from './Chats'
import MechDashboard from './mechanic/MechDashboard'
import MechDrivers from './mechanic/MechDrivers'
import MechEquipment from './mechanic/MechEquipment'
import Repairs from './mechanic/Repairs'
import MechDocs from './mechanic/MechDocs'
import Briefings from './mechanic/Briefings'
import HrDashboard from './hr/HrDashboard'
import Hiring from './hr/Hiring'
import HrKpi from './hr/HrKpi'

type CrmRole = Exclude<Role, 'driver'>
const userByRole: Record<CrmRole, string> = { manager: 'e1', mechanic: 'e4', hr: 'e6', admin: 'e7' }

const i = (p: string) => p
function navFor(role: CrmRole): NavGroup[] {
  const b = `/crm/${role}`
  const s = 18
  if (role === 'mechanic') return [
    { items: [
      { to: `${b}/dashboard`, label: 'Дашборд', icon: <LayoutDashboard size={s} /> },
      { to: `${b}/profile`, label: 'Профиль', icon: <UserCircle size={s} /> },
    ] },
    { title: 'Работа', items: [
      { to: `${b}/repairs`, label: 'ТО и ремонты', icon: <Wrench size={s} />, badge: 4 },
      { to: `${b}/equipment`, label: 'Техника', icon: <Truck size={s} /> },
      { to: `${b}/drivers`, label: 'Водители', icon: <HardHat size={s} /> },
      { to: `${b}/briefings`, label: 'Инструктажи', icon: <ShieldCheck size={s} /> },
      { to: `${b}/docs`, label: 'Документооборот', icon: <FileText size={s} /> },
    ] },
    { title: 'Команда', items: [
      { to: `${b}/employees`, label: 'Сотрудники', icon: <Users size={s} /> },
      { to: `${b}/motivation`, label: 'Мотивация', icon: <Trophy size={s} /> },
      { to: `${b}/chats`, label: 'Чаты', icon: <MessagesSquare size={s} />, badge: 2 },
    ] },
  ]
  if (role === 'hr') return [
    { items: [
      { to: `${b}/dashboard`, label: 'Дашборд', icon: <LayoutDashboard size={s} /> },
      { to: `${b}/profile`, label: 'Профиль', icon: <UserCircle size={s} /> },
    ] },
    { title: 'Кадры', items: [
      { to: `${b}/employees`, label: 'Сотрудники', icon: <Users size={s} /> },
      { to: `${b}/hiring`, label: 'Приём и увольнение', icon: <ClipboardCheck size={s} />, badge: 3 },
      { to: `${b}/kpi`, label: 'KPI и отчёты', icon: <Gauge size={s} /> },
      { to: `${b}/timesheet`, label: 'Учёт времени', icon: <Clock size={s} /> },
      { to: `${b}/chats`, label: 'Чаты', icon: <MessagesSquare size={s} /> },
    ] },
  ]
  return [
    { items: [
      { to: `${b}/dashboard`, label: 'Дашборд', icon: <LayoutDashboard size={s} /> },
      { to: `${b}/profile`, label: 'Профиль', icon: <UserCircle size={s} /> },
    ] },
    { title: 'Продажи', items: [
      { to: `${b}/callcenter`, label: 'Колл-центр', icon: <PhoneCall size={s} />, badge: 5 },
      { to: `${b}/tenants`, label: 'Арендаторы', icon: <Briefcase size={s} /> },
      { to: `${b}/landlords`, label: 'Арендодатели', icon: <Building2 size={s} /> },
      { to: `${b}/sites`, label: 'Объекты', icon: <MapPinned size={s} /> },
    ] },
    { title: 'Парк', items: [
      { to: `${b}/equipment`, label: 'Техника и ТО', icon: <Truck size={s} /> },
      { to: `${b}/trips`, label: 'Рейсы и смены', icon: <RouteIcon size={s} /> },
      { to: `${b}/fuel`, label: 'Заправка', icon: <Fuel size={s} />, badge: 1 },
    ] },
    { title: 'Финансы и документы', items: [
      { to: `${b}/accounting`, label: 'Бухгалтерия', icon: <Calculator size={s} /> },
      { to: `${b}/docs`, label: 'Документооборот', icon: <FileText size={s} /> },
    ] },
    { title: 'Команда', items: [
      { to: `${b}/employees`, label: 'Сотрудники', icon: <Users size={s} /> },
      { to: `${b}/timesheet`, label: 'Учёт времени', icon: <CalendarClock size={s} /> },
      { to: `${b}/motivation`, label: 'Мотивация', icon: <Trophy size={s} /> },
      { to: `${b}/instructions`, label: 'Инструкции', icon: <BookOpen size={s} /> },
      { to: `${b}/chats`, label: 'Чаты', icon: <MessagesSquare size={s} />, badge: 3 },
    ] },
  ]
}

function RoleSwitch({ role }: { role: CrmRole }) {
  const nav = useNavigate()
  return (
    <select className="select" style={{ height: 32, width: 'auto', fontSize: 13 }} value={role} aria-label="Роль (демо)"
      onChange={(e) => nav(`/crm/${e.target.value}/dashboard`)}>
      {(['manager', 'mechanic', 'hr', 'admin'] as CrmRole[]).map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
    </select>
  )
}

export default function CrmApp() {
  const { role: raw } = useParams()
  const role = (['manager', 'mechanic', 'hr', 'admin'].includes(raw ?? '') ? raw : 'manager') as CrmRole
  const me = emp(userByRole[role])!
  const p = { role }
  const isMech = role === 'mechanic', isHr = role === 'hr'
  return (
    <Routes>
      <Route element={<Shell groups={navFor(role)} area={`CRM · ${roleLabels[role]}`} user={me.name} userRole={me.position} top={<RoleSwitch role={role} />} />}>
        <Route path="dashboard" element={isMech ? <MechDashboard {...p} /> : isHr ? <HrDashboard {...p} /> : <Dashboard {...p} />} />
        <Route path="profile" element={<Profile {...p} />} />
        <Route path="employees" element={<Employees {...p} />} />
        <Route path="tenants" element={<Tenants {...p} />} />
        <Route path="landlords" element={<Landlords {...p} />} />
        <Route path="callcenter" element={<CallCenter {...p} />} />
        <Route path="equipment" element={isMech ? <MechEquipment {...p} /> : <EquipmentPage {...p} />} />
        <Route path="fuel" element={<FuelPage {...p} />} />
        <Route path="trips" element={<Trips {...p} />} />
        <Route path="sites" element={<Sites {...p} />} />
        <Route path="accounting" element={<Accounting {...p} />} />
        <Route path="timesheet" element={<Timesheet {...p} />} />
        <Route path="docs" element={isMech ? <MechDocs {...p} /> : <Docs {...p} />} />
        <Route path="motivation" element={<Motivation {...p} />} />
        <Route path="instructions" element={<Instructions {...p} />} />
        <Route path="chats" element={<Chats {...p} />} />
        <Route path="drivers" element={<MechDrivers {...p} />} />
        <Route path="repairs" element={<Repairs {...p} />} />
        <Route path="briefings" element={<Briefings {...p} />} />
        <Route path="hiring" element={<Hiring {...p} />} />
        <Route path="kpi" element={<HrKpi {...p} />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  )
}
void i
