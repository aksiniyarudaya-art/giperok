import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function Profile({ role }: CrmPageProps) {
  return <PageHead title="Profile" sub={`Раздел в разработке · ${role}`} />
}
