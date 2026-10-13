import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function Timesheet({ role }: CrmPageProps) {
  return <PageHead title="Timesheet" sub={`Раздел в разработке · ${role}`} />
}
