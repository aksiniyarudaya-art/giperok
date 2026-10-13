import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function Instructions({ role }: CrmPageProps) {
  return <PageHead title="Instructions" sub={`Раздел в разработке · ${role}`} />
}
