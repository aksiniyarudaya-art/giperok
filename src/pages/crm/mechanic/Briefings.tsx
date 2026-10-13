import type { CrmPageProps } from '../types'
import { PageHead } from '../../../ui'

export default function Briefings({ role }: CrmPageProps) {
  return <PageHead title="Briefings" sub={`Раздел в разработке · ${role}`} />
}
