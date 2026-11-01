// Messages: concept preview only. Direct messages and group chat are out of scope
// for the MVP. This page shows where they would go; nothing is sent or saved.
import { Send, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { ConceptBadge } from '../../components/Concept'
import { chatThreads } from '../../mock/data'

export function MessagesPage() {
  const [selectedId, setSelectedId] = useState(chatThreads[0].id)
  const selected = chatThreads.find((chat) => chat.id === selectedId) ?? chatThreads[0]

  return (
    <div>
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Messages</h1>
        <ConceptBadge />
      </div>
      <p className="mb-4 text-sm text-gray-600">
        Group chats for club teams and direct messages. Shown as a concept; not part of the MVP.
      </p>

      <div className="grid grid-cols-1 overflow-hidden rounded-lg border-2 border-dashed border-brand-soft bg-white shadow-sm md:grid-cols-3">
        <ul className="divide-y divide-gray-100 border-b border-gray-100 md:border-r md:border-b-0">
          {chatThreads.map((chat) => (
            <li key={chat.id}>
              <button
                type="button"
                onClick={() => setSelectedId(chat.id)}
                className={`flex w-full items-start gap-3 p-3 text-left ${chat.id === selected.id ? 'bg-brand/10' : 'hover:bg-page'}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-squid text-sm font-bold text-brand">
                  {chat.kind === 'group' ? <Users size={16} aria-hidden="true" /> : chat.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{chat.name}</span>
                    <span className="shrink-0 text-xs text-gray-500">{chat.lastAt}</span>
                  </span>
                  <span className="block truncate text-sm text-gray-600">{chat.lastMessage}</span>
                </span>
                {chat.unread > 0 && (
                  <span className="rounded-full bg-brand px-1.5 text-xs font-bold text-gray-900">{chat.unread}</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex min-h-80 flex-col md:col-span-2">
          <div className="border-b border-gray-100 p-3 font-semibold">{selected.name}</div>
          <div className="flex-1 space-y-2 p-3">
            {selected.messages.map((message, i) => (
              <div key={i} className={`flex ${message.mine ? 'justify-end' : ''}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${message.mine ? 'bg-squid text-white' : 'bg-page'}`}
                >
                  {!message.mine && <p className="text-xs font-semibold text-amber-700">{message.from}</p>}
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-gray-100 p-3">
            <input
              disabled
              placeholder="Messaging isn't part of the MVP"
              className="h-10 flex-1 rounded-md border border-gray-300 bg-page px-3 text-sm"
            />
            <Button disabled aria-label="Send">
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
