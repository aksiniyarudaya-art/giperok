import type { CrmPageProps } from '../types'
import { PageHead } from '../../../ui'

export default function HrDashboard({ role }: CrmPageProps) {
  return <PageHead title="HrDashboard" sub={`Раздел в разработке · ${role}`} />
}
