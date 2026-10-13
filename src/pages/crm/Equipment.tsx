import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function Equipment({ role }: CrmPageProps) {
  return <PageHead title="Equipment" sub={`Раздел в разработке · ${role}`} />
}
