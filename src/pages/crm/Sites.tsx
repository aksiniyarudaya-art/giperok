import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function Sites({ role }: CrmPageProps) {
  return <PageHead title="Sites" sub={`Раздел в разработке · ${role}`} />
}
