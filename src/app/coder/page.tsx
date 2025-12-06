"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CoderPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [conversations, setConversations] = useState([{ id: 1, title: "New Conversation" }])
  const [currentConversationId, setCurrentConversationId] = useState(1)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const editInputRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations))
  }, [conversations])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const createNewConversation = () => {
    const validIds = conversations.map(c => c.id).filter(id => typeof id === 'number' && !isNaN(id))
    const newId = validIds.length > 0 ? Math.max(...validIds) + 1 : 1
    setConversations([...conversations, { id: newId, title: "New Conversation" }])
    setCurrentConversationId(newId)
  }

  const switchConversation = (id: number) => {
    setCurrentConversationId(id)
  }

  const deleteConversation = (id: number) => {
    setConversations(conversations.filter(c => c.id !== id))
    if (currentConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id)
      if (remaining.length > 0) {
        setCurrentConversationId(remaining[0].id)
      }
    }
  }

  const startEditing = (id: number, title: string) => {
    setEditingId(id)
    setEditTitle(title)
    setMenuOpen(null)
  }

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const saveEdit = () => {
    if (editingId) {
      setConversations(conversations.map(c =>
        c.id === editingId ? { ...c, title: editTitle } : c
      ))
      setEditingId(null)
      setEditTitle("")
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle("")
  }

  return (
    <div className="flex min-h-screen bg-[rgb(24,24,37)] font-sans dark">
      <aside className={`fixed left-0 top-0 h-full ${isMobile ? 'w-full' : 'w-64'} bg-gray-800 transform transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} z-30`}>
        <div className="p-4">
          <button onClick={() => setIsSidebarOpen(false)} className="text-white hover:text-gray-300 mb-4">
            <img src="/favicon.ico" alt="Close" className="w-12 h-12" />
          </button>
          <div className="space-y-2">
            {conversations.map((convo) => (
              <div key={convo.id} className="group relative">
                {editingId === convo.id ? (
                  <div className="p-3 bg-gray-700 rounded flex items-center justify-between">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit()
                      }}
                      onBlur={saveEdit}
                      className="flex-1 bg-transparent text-white outline-none border-none p-0"
                      placeholder="Conversation title"
                    />
                    <button
                      onClick={saveEdit}
                      className="-ml-1 p-1 text-green-400 hover:text-green-300"
                      title="Save"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <div
                    className={`p-3 rounded text-white cursor-pointer hover:bg-gray-600 flex items-center justify-between group ${
                      convo.id === currentConversationId ? 'bg-gray-600' : 'bg-gray-700'
                    }`}
                    onClick={() => switchConversation(convo.id)}
                  >
                    <span className="flex-1 truncate">{convo.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(menuOpen === convo.id ? null : convo.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-600 rounded"
                    >
                      ⋮
                    </button>
                  </div>
                )}
                {menuOpen === convo.id && (
                  <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-10 w-32">
                    <button
                      onClick={() => {
                        startEditing(convo.id, convo.title)
                        setMenuOpen(null)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 first:rounded-t last:rounded-b"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        deleteConversation(convo.id)
                        setMenuOpen(null)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 first:rounded-t last:rounded-b"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>
      <button onClick={() => setIsSidebarOpen(true)} className={`fixed top-4 left-4 z-10 p-2 bg-gray-700 text-white rounded hover:bg-gray-600 ${isSidebarOpen ? 'hidden' : ''}`}>
        <img src="/favicon.ico" alt="Menu" className="w-12 h-12" />
      </button>
      <button onClick={createNewConversation} className={`fixed top-4 z-10 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 hover:scale-110 ${isSidebarOpen ? 'right-4' : 'right-4'}`}>
        +
      </button>
      <main className={`flex-1 min-h-screen flex flex-col bg-[rgb(24,24,37)] relative ${!isMobile && isSidebarOpen ? 'ml-64' : ''}`}>
        <div className="flex-1">
        </div>
      </main>
    </div>
  )
}
