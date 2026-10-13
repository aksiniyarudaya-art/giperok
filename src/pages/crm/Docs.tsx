import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function Docs({ role }: CrmPageProps) {
  return <PageHead title="Docs" sub={`Раздел в разработке · ${role}`} />
}
