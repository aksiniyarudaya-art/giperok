import type { CrmPageProps } from './types'
import { PageHead } from '../../ui'

export default function Chats({ role }: CrmPageProps) {
  return <PageHead title="Chats" sub={`Раздел в разработке · ${role}`} />
}
