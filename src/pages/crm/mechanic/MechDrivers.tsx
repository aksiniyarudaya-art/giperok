import type { CrmPageProps } from '../types'
import { PageHead } from '../../../ui'

export default function MechDrivers({ role }: CrmPageProps) {
  return <PageHead title="MechDrivers" sub={`Раздел в разработке · ${role}`} />
}
