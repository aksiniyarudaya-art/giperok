import { Link } from 'react-router-dom'
import { Bell, Heart } from 'lucide-react'
import { Empty, PageHead, plural } from '../../ui'
import { availableDate } from '../../data/cabinet'
import { useClient } from './ctx'
import { EqCard, findEq } from './parts'

export default function Favorites() {
  const c = useClient()
  const list = c.fav.map((id) => findEq(id)!).filter(Boolean)
  const busy = list.filter((e) => availableDate(e)).length
  return (
    <>
      <PageHead title="Избранное" sub={`${list.length} ${plural(list.length, 'машина', 'машины', 'машин')}${busy ? ` · ${busy} сейчас заняты — сообщим, когда освободятся` : ''}`}
        actions={<Link to="/client/catalog" className="btn btn-secondary">В каталог</Link>} />
      {busy > 0 && <div className="alert alert-info" style={{ marginBottom: 16 }}><Bell /><div>Для занятой техники из избранного включено уведомление: придёт сообщение в «Диалоги» в день, когда машина освободится.</div></div>}
      {list.length
        ? <div className="cl-grid">{list.map((e) => <EqCard key={e.id} e={e} />)}</div>
        : <div className="card"><Empty icon={<Heart />} text="Нажмите сердечко на карточке техники, чтобы сохранить её здесь." /></div>}
    </>
  )
}
