import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function Dashboard({ role }: CrmPageProps) {
  return <PageHead title="Dashboard" sub={`Раздел в разработке · ${role}`} />
}
