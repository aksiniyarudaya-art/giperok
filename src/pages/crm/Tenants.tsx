import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function Tenants({ role }: CrmPageProps) {
  return <PageHead title="Tenants" sub={`Раздел в разработке · ${role}`} />
}
