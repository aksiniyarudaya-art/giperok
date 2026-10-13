import type { CrmPageProps } from '../types'
import { PageHead } from '../../../ui'

export default function HrKpi({ role }: CrmPageProps) {
  return <PageHead title="HrKpi" sub={`Раздел в разработке · ${role}`} />
}
