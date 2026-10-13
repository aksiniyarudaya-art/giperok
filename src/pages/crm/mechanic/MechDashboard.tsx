import type { CrmPageProps } from '../types'
import { PageHead } from '../../../ui'

export default function MechDashboard({ role }: CrmPageProps) {
  return <PageHead title="MechDashboard" sub={`Раздел в разработке · ${role}`} />
}
