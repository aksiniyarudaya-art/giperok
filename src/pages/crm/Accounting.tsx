import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function Accounting({ role }: CrmPageProps) {
  return <PageHead title="Accounting" sub={`Раздел в разработке · ${role}`} />
}
