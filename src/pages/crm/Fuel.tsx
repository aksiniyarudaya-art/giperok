import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function Fuel({ role }: CrmPageProps) {
  return <PageHead title="Fuel" sub={`Раздел в разработке · ${role}`} />
}
