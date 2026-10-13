import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function Motivation({ role }: CrmPageProps) {
  return <PageHead title="Motivation" sub={`Раздел в разработке · ${role}`} />
}
