import type { CrmPageProps } from '../types'
import { PageHead } from '../../../ui'

export default function Repairs({ role }: CrmPageProps) {
  return <PageHead title="Repairs" sub={`Раздел в разработке · ${role}`} />
}
