import type { CrmPageProps } from '../types'
import { PageHead } from '../../../ui'

export default function MechDocs({ role }: CrmPageProps) {
  return <PageHead title="MechDocs" sub={`Раздел в разработке · ${role}`} />
}
