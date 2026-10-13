import type { CrmPageProps } from '../types'
import { PageHead } from '../../../ui'

export default function MechEquipment({ role }: CrmPageProps) {
  return <PageHead title="MechEquipment" sub={`Раздел в разработке · ${role}`} />
}
