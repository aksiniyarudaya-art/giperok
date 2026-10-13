import type { CrmPageProps } from '../types'
import { PageHead } from '../../../ui'

export default function Hiring({ role }: CrmPageProps) {
  return <PageHead title="Hiring" sub={`Раздел в разработке · ${role}`} />
}
