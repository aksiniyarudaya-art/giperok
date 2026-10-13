import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Landing from './pages/landing/Landing'
import { Login, Register } from './pages/auth/Auth'
import ClientApp from './pages/client/ClientApp'
import PartnerApp from './pages/partner/PartnerApp'
import CrmApp from './pages/crm/CrmApp'
import DriverApp from './pages/driver/DriverApp'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/client/*" element={<ClientApp />} />
        <Route path="/partner/*" element={<PartnerApp />} />
        <Route path="/crm/:role/*" element={<CrmApp />} />
        <Route path="/crm" element={<Navigate to="/crm/manager/dashboard" replace />} />
        <Route path="/driver/*" element={<DriverApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
