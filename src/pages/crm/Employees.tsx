import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function Employees({ role }: CrmPageProps) {
  return <PageHead title="Employees" sub={`Раздел в разработке · ${role}`} />
}
