import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function Landlords({ role }: CrmPageProps) {
  return <PageHead title="Landlords" sub={`Раздел в разработке · ${role}`} />
}
