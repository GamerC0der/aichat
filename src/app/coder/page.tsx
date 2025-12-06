"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function CoderPage() {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [conversations, setConversations] = useState([{ id: 1, title: "New Conversation" }])
  const [currentConversationId, setCurrentConversationId] = useState(1)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const editInputRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedModel, setSelectedModel] = useState<"Gemini" | "GPT 5" | "Grok" | "Gemini 3" | "Kimi">("Gemini")
  const [message, setMessage] = useState("")
  const messageInputRef = useRef<HTMLInputElement>(null)
  const [generatedHtml, setGeneratedHtml] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState("")

  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations))
  }, [conversations])

  useEffect(() => {
    localStorage.setItem("selectedModel", selectedModel)
  }, [selectedModel])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const savedConversations = localStorage.getItem("conversations")
    const savedSelectedModel = localStorage.getItem("selectedModel")
    if (savedSelectedModel && ["Gemini", "GPT 5", "Grok", "Gemini 3", "Kimi"].includes(savedSelectedModel)) {
      setSelectedModel(savedSelectedModel as "Gemini" | "GPT 5" | "Grok" | "Gemini 3" | "Kimi")
    }
    const savedApiKey = localStorage.getItem("apiKey")
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
    if (savedConversations) {
      const parsedConversations = JSON.parse(savedConversations)
      const validConversations = parsedConversations.filter((convo: { id: number; title: string }) =>
        typeof convo.id === 'number' && !isNaN(convo.id) && convo.title
      )
      setConversations(validConversations.length > 0 ? validConversations : [{ id: 1, title: "New Conversation" }])
      if (validConversations.length > 0) {
        setCurrentConversationId(validConversations[0].id)
      }
    }
  }, [])

  const getModelId = (model: string) => {
    const modelMap: Record<string, string> = {
      "Gemini": "google/gemini-2.5-flash",
      "GPT 5": "openai/gpt-5-mini",
      "Grok": "x-ai/grok-4.1-fast",
      "Gemini 3": "google/gemini-3-pro-preview",
      "Kimi": "moonshotai/kimi-k2-0905"
    }
    return modelMap[model] || modelMap["Gemini"]
  }

  const generateHtml = async () => {
    if (!message.trim() || isLoading || !apiKey) return

    setIsLoading(true)
    setGeneratedHtml("")
    const currentMessage = message
    setMessage("")

    try {
      const modelId = getModelId(selectedModel)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: "system",
              content: "You are a web developer. Generate a complete, valid HTML page based on the user's description. Include modern CSS styling and make it responsive. Use background color rgb(31, 41, 55) (equivalent to gray-800) for the main background to match the application theme. Return ONLY the HTML code, no explanations or markdown formatting."
            },
            {
              role: "user",
              content: currentMessage
            }
          ],
          stream: true
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let buffer = ""
        let accumulatedHtml = ""
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6))
                const content = data.choices?.[0]?.delta?.content
                if (content) {
                  accumulatedHtml += content
                  setGeneratedHtml(accumulatedHtml)
                }
              } catch (e) {
                console.error("Error parsing stream:", e)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating HTML:", error)
      setGeneratedHtml(`<html><body><h1>Error</h1><p>Failed to generate HTML. Please check your API key and try again.</p></body></html>`)
    } finally {
      setIsLoading(false)
    }
  }

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
      <div className={`fixed top-4 z-10 flex items-center gap-2 ${!isMobile && isSidebarOpen ? 'left-68' : 'left-4'}`}>
        <button
          onClick={() => router.back()}
          className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center justify-center transition-colors"
          title="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <Select value={selectedModel} onValueChange={(value) => {
          const model = value as "Gemini" | "GPT 5" | "Grok" | "Gemini 3" | "Kimi"
          setSelectedModel(model)
        }}>
          <SelectTrigger className={`${isMobile ? 'w-[160px]' : 'w-[220px]'}`}>
            <span className="truncate flex-1 text-left">
              {selectedModel}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Gemini">Gemini</SelectItem>
            <SelectItem value="GPT 5">GPT 5</SelectItem>
            <SelectItem value="Grok">Grok</SelectItem>
            <SelectItem value="Gemini 3">Gemini 3</SelectItem>
            <SelectItem value="Kimi">Kimi</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <button onClick={createNewConversation} className={`fixed top-4 z-10 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 hover:scale-110 ${isSidebarOpen ? 'right-4' : 'right-4'}`}>
        +
      </button>
      <main className={`flex-1 min-h-screen flex flex-col bg-[rgb(24,24,37)] relative ${!isMobile && isSidebarOpen ? 'ml-64' : ''}`}>
        {generatedHtml || isLoading ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-white text-lg font-semibold">Preview</h2>
                  {isLoading && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setGeneratedHtml("")
                    setMessage("")
                  }}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                >
                  New Project
                </button>
              </div>
            </div>
            <div className="flex-1">
              <iframe
                srcDoc={generatedHtml || '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;"><h2 style="color:#666;">Generating your website...</h2></body></html>'}
                className="w-full h-full border-0"
                title="HTML Preview"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className={`${isMobile ? 'w-full' : 'w-[50%]'} ${isMobile ? 'px-2' : 'px-4'}`}>
              <div className="text-center text-white text-6xl mb-4">
                Code with {selectedModel}
              </div>
              <div className="relative">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      generateHtml()
                    }
                  }}
                  placeholder="Describe what you want to build..."
                  className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={generateHtml}
                  disabled={!message.trim() || isLoading || !apiKey}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "..." : "↑"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
