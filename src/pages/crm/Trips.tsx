import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function Trips({ role }: CrmPageProps) {
  return <PageHead title="Trips" sub={`Раздел в разработке · ${role}`} />
}
