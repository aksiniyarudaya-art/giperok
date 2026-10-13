import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, FileSignature, FileText, ShieldCheck } from 'lucide-react'
import { ChatPanel } from '../../ui/Chat'
import { Field, Modal, PageHead, StatusBadge, Tabs, date, money, useToast } from '../../ui'
import { clientThreads, type SignDoc } from '../../data/cabinet'
import { useClient } from './ctx'

type T = 'chats' | 'docs'

export default function Dialogs() {
  const c = useClient()
  const toast = useToast()
  const [sp, setSp] = useSearchParams()
  const tab = (sp.get('tab') as T) || 'chats'
  const [signing, setSigning] = useState<SignDoc | null>(null)
  const [view, setView] = useState<SignDoc | null>(null)
  const pending = c.docs.filter((d) => d.status !== 'Подписан')

  return (
    <>
      <PageHead title="Диалоги" sub="Чат с поддержкой и менеджером, документы на подпись через ЭДО" />
      <div className="stack">
        <Tabs<T> value={tab} onChange={(t) => setSp({ tab: t }, { replace: true })} items={[
          { id: 'chats', label: 'Чаты', count: c.unread },
          { id: 'docs', label: 'Документы на подпись', count: pending.length },
        ]} />
        {tab === 'chats' && <ChatPanel threads={clientThreads} />}
        {tab === 'docs' && (
          <div className="stack">
            {pending.length > 0 && <div className="alert alert-warn"><FileSignature /><div>На подписи <b>{pending.length}</b> документа. Подписание ЭЦП занимает несколько секунд — документ сразу уходит владельцу техники через ЭДО.</div></div>}
            <div className="cl-docs">
              {c.docs.map((d) => (
                <div key={d.id} className="card cl-sign">
                  <div className="cl-sign-ico"><FileText /></div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{d.title}</div>
                    <div className="muted" style={{ fontSize: 13 }}>{d.kind}{d.order ? ` · заказ ${d.order}` : ''} · {date(d.date)}{d.amount ? ` · ${money(d.amount)}` : ''}</div>
                  </div>
                  <StatusBadge status={d.status} />
                  <div className="row" style={{ gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setView(d)}>Открыть</button>
                    {d.status === 'Подписан'
                      ? <button className="btn btn-ghost btn-icon btn-sm" aria-label="Скачать" onClick={() => toast(`Скачивание: ${d.title}.pdf`)}><Download /></button>
                      : <button className="btn btn-primary btn-sm" onClick={() => setSigning(d)}><FileSignature />Подписать</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {view && (
        <Modal title={view.title} onClose={() => setView(null)} footer={<>
          <button className="btn btn-ghost" onClick={() => toast(`Скачивание: ${view.title}.pdf`)}><Download />Скачать PDF</button>
          {view.status !== 'Подписан' && <button className="btn btn-primary" onClick={() => { setSigning(view); setView(null) }}><FileSignature />Подписать</button>}
        </>}>
          <div className="cl-paper">
            <div className="row-between"><b>{view.kind.toUpperCase()}</b><span className="mono">{date(view.date)}</span></div>
            <p>Исполнитель: ООО «СпецХаб Платформа», УНП 193000001.<br />Заказчик: ООО «СтройМонолит», УНП 191234567.</p>
            {view.order && <p>Основание: заказ {view.order} на аренду спецтехники с экипажем.</p>}
            {view.amount ? <p>Сумма: <b>{money(view.amount)}</b>, в т. ч. НДС 20% — {money(Math.round(view.amount / 6))}.</p> : <p>Предмет: изменение порядка расчётов — оплата по факту выполненных смен в течение 5 банковских дней.</p>}
            <div className="cl-paper-lines"><span /><span /><span style={{ width: '60%' }} /></div>
            <div className="row-between" style={{ marginTop: 16 }}><span>Исполнитель ______</span><span>Заказчик {view.status === 'Подписан' ? <b style={{ color: 'var(--ok)' }}>ЭЦП ✓</b> : '______'}</span></div>
          </div>
        </Modal>
      )}

      {signing && (
        <Modal title="Подписание ЭЦП" onClose={() => setSigning(null)} footer={<>
          <button className="btn btn-ghost" onClick={() => setSigning(null)}>Отмена</button>
          <button className="btn btn-primary" onClick={() => { c.signDoc(signing.id); setSigning(null) }}><ShieldCheck />Подписать</button>
        </>}>
          <div style={{ fontWeight: 600 }}>{signing.title}</div>
          <Field label="Сертификат ключа">
            <select className="select"><option>Ковалёв А. П., директор · ГосСУОК · до 14.12.2027</option><option>Лисовская И. О., по доверенности №12 · до 01.03.2027</option></select>
          </Field>
          <div className="alert alert-info"><ShieldCheck /><div>После подписи документ получит статус «Подписан» и автоматически уйдёт контрагенту через ЭДО (демо).</div></div>
        </Modal>
      )}
    </>
  )
}
