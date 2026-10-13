import { useState } from 'react'
import { ChevronDown, Clock, Mail, Phone, Send } from 'lucide-react'
import { ChatPanel } from '../../ui/Chat'
import { PageHead, useToast } from '../../ui'
import { partnerThreads } from '../../data/cabinet'

const faq: [string, string][] = [
  ['Сколько длится модерация техники?', 'До 2 часов в рабочее время (Пн–Пт 08:00–20:00). Ускорить можно, загрузив сразу техпаспорт, страховку и 4+ фото.'],
  ['Когда приходят выплаты?', '5, 15 и 25 числа на расчётный счёт из профиля. Комиссия 10% удерживается автоматически.'],
  ['Клиент не оплатил заказ — что делать?', 'Ничего: взысканием занимается платформа. Сделка помечается «Долг», выплата придёт после оплаты.'],
  ['Как обновляется позиция техники на карте?', 'Водитель в приложении завершает смену и делает фото — гео-метка обновляется автоматически.'],
]

export default function Support() {
  const toast = useToast()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <>
      <PageHead title="Чат с поддержкой" sub="Поддержка партнёров, бухгалтерия и курирующий менеджер · ответ в среднем за 4 минуты" />
      <div className="pt-support">
        <ChatPanel threads={partnerThreads} />
        <aside className="stack">
          <div className="card stack-sm">
            <div className="card-head" style={{ marginBottom: 4 }}><h3>Связаться</h3><span className="badge badge-ok">онлайн</span></div>
            <button className="pt-contact" onClick={() => toast('Звонок на линию партнёров: +375 17 388-00-10 (демо)')}><Phone size={16} /><span className="grow">+375 17 388-00-10</span><span className="muted">позвонить</span></button>
            <button className="pt-contact" onClick={() => toast('Открыт Telegram-бот @giperok_partner (демо)')}><Send size={16} /><span className="grow">@giperok_partner</span><span className="muted">Telegram</span></button>
            <button className="pt-contact" onClick={() => toast('Письмо: partners@giperok.by')}><Mail size={16} /><span className="grow">partners@giperok.by</span><span className="muted">почта</span></button>
            <div className="muted row" style={{ gap: 6, fontSize: 12 }}><Clock size={14} />Чат и телефон — круглосуточно</div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Частые вопросы</h3></div>
            <div className="pt-faq">
              {faq.map(([q, a], i) => (
                <div key={q} className={`pt-faq-i ${open === i ? 'on' : ''}`}>
                  <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}><span className="grow">{q}</span><ChevronDown size={16} /></button>
                  {open === i && <p>{a}</p>}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
