import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function CallCenter({ role }: CrmPageProps) {
  return <PageHead title="CallCenter" sub={`Раздел в разработке · ${role}`} />
}
