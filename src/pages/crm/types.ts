import type { Role } from '../../data/types'
export type CrmRole = Exclude<Role, 'driver'>
export type CrmPageProps = { role: CrmRole }
/** Администратор может всё: отменять, редактировать, архивировать, блокировать. */
export const isAdmin = (r: CrmRole) => r === 'admin'
