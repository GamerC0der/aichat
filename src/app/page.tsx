"use client"

import { useState, useRef, useEffect } from "react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Settings, Volume2, Loader2, RefreshCw } from "lucide-react"

const parseMarkdown = (text: string): string => {
  if (!text || text === "Thinking...") return text

  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<pre><code>${escaped}</code></pre>`
  })

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

  const lines = html.split('\n')
  let result = ''
  let inList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (/^### /.test(line)) {
      if (inList) { result += '</ul>'; inList = false }
      result += line.replace(/^### (.*)$/, '<h3>$1</h3>')
    } else if (/^## /.test(line)) {
      if (inList) { result += '</ul>'; inList = false }
      result += line.replace(/^## (.*)$/, '<h2>$1</h2>')
    } else if (/^# /.test(line)) {
      if (inList) { result += '</ul>'; inList = false }
      result += line.replace(/^# (.*)$/, '<h1>$1</h1>')
    } else if (/^\d+\. /.test(line)) {
      if (!inList) { result += '<ol>'; inList = true }
      result += line.replace(/^\d+\. (.*)$/, '<li>$1</li>')
    } else if (/^[-*] /.test(line)) {
      if (!inList) { result += '<ul>'; inList = true }
      result += line.replace(/^[-*] (.*)$/, '<li>$1</li>')
    } else {
      if (inList) { result += '</ul>'; inList = false }
      if (line.trim() === '') {
        result += '</p><p>'
      } else {
        result += line + ' '
      }
    }
  }

  if (inList) result += '</ul>'

  result = '<p>' + result.trim() + '</p>'
  result = result.replace(/<p><\/p>/g, '')
  result = result.replace(/<p>(<h[1-3]>.*<\/h[1-3]>)<\/p>/g, '$1')
  result = result.replace(/<p>(<[uo]l>.*<\/[uo]l>)<\/p>/g, '$1')

  return result
}

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInitialSetup, setIsInitialSetup] = useState(false)
  const [apiKey, setApiKey] = useState("sk-hc-v1-")
  const [systemPrompt, setSystemPrompt] = useState("")

  useEffect(() => {
    const savedKey = localStorage.getItem("apiKey")
    const savedPrompt = localStorage.getItem("systemPrompt")
    const savedConversations = localStorage.getItem("conversations")
    const savedMessages = localStorage.getItem("conversationMessages")

    if (savedKey) {
      setApiKey(savedKey)
    } else {
      setIsModalOpen(true)
      setIsInitialSetup(true)
    }
    if (savedPrompt) {
      setSystemPrompt(savedPrompt)
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
    if (savedMessages) {
      setConversationMessages(JSON.parse(savedMessages))
    }
    setMenuOpen(null)
  }, [])
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [conversations, setConversations] = useState([{ id: 1, title: "New Conversation" }])
  const [currentConversationId, setCurrentConversationId] = useState(1)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const editInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState("")
  const messageInputRef = useRef<HTMLInputElement>(null)
  const [conversationMessages, setConversationMessages] = useState<Record<number, Array<{id: number, text: string, isUser: boolean}>>>({1: []})
  const [selectedModel, setSelectedModel] = useState<"Gemini" | "GPT 5" | "Grok" | "Gemini 3" | "Kimi">("Gemini")
  const [isLoading, setIsLoading] = useState(false)
  const [showAllModels, setShowAllModels] = useState(false)
  const [isTtsLoading, setIsTtsLoading] = useState(false)

  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations))
  }, [conversations])

  useEffect(() => {
    localStorage.setItem("conversationMessages", JSON.stringify(conversationMessages))
  }, [conversationMessages])

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

  const createNewConversation = () => {
    const currentMessages = conversationMessages[currentConversationId] || []
    if (currentMessages.length === 0) {
      return
    }
    const validIds = conversations.map(c => c.id).filter(id => typeof id === 'number' && !isNaN(id))
    const newId = validIds.length > 0 ? Math.max(...validIds) + 1 : 1
    setConversations([...conversations, { id: newId, title: "New Conversation" }])
    setCurrentConversationId(newId)
    setConversationMessages(prev => ({ ...prev, [newId]: [] }))
    setMessage("")
  }

  const switchConversation = (id: number) => {
    setCurrentConversationId(id)
    setMessage("")
  }

  const deleteConversation = (id: number) => {
    setConversations(conversations.filter(c => c.id !== id))
    setConversationMessages(prev => {
      const newMessages = { ...prev }
      delete newMessages[id]
      return newMessages
    })
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

  const generateTitleFromFirstMessage = async (firstMessage: string) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "z-ai/glm-4.6",
          messages: [
            {
              role: "system",
              content: "Generate a concise, descriptive title (max 2 words) for this conversation based on the user's first message. Return only the title, nothing else."
            },
            {
              role: "user",
              content: firstMessage
            }
          ],
          stream: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        const title = data.choices?.[0]?.message?.content?.trim()
        if (title && title.length > 0 && title.length <= 50) {
          setConversations(prev => prev.map(c =>
            c.id === currentConversationId ? { ...c, title } : c
          ))
        }
      }
    } catch (error) {
      console.error("Error generating title:", error)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const speakMessage = async (text: string) => {
    if (text && text !== "Thinking...") {
      setIsTtsLoading(true)
      try {
        const params = new URLSearchParams({
          input: text,
          model: "tts-1",
          voice: "alloy",
          response_format: "mp3",
          prompt: "Speak in a natural, conversational tone."
        })

        const response = await fetch(`/api/tts?${params}`, {
          method: "GET"
        })

        if (response.ok) {
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          audio.onplay = () => setIsTtsLoading(false)
          audio.onerror = () => setIsTtsLoading(false)
          audio.play()
        } else {
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.onstart = () => setIsTtsLoading(false)
            utterance.onerror = () => setIsTtsLoading(false)
            speechSynthesis.speak(utterance)
          } else {
            setIsTtsLoading(false)
          }
        }
      } catch (error) {
        console.error("TTS error:", error)
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.onstart = () => setIsTtsLoading(false)
          utterance.onerror = () => setIsTtsLoading(false)
          speechSynthesis.speak(utterance)
        } else {
          setIsTtsLoading(false)
        }
      }
    }
  }

  const sendMessage = async () => {
    if (message.trim() && !isLoading) {
      const isFirstMessage = (conversationMessages[currentConversationId] || []).length === 0
      const userMessage = {
        id: Date.now(),
        text: message,
        isUser: true
      }
      setConversationMessages(prev => ({
        ...prev,
        [currentConversationId]: [...(prev[currentConversationId] || []), userMessage]
      }))
      const currentMessage = message
      setMessage("")
      setIsLoading(true)

      if (isFirstMessage) {
        generateTitleFromFirstMessage(currentMessage)
      }

      const assistantMessageId = Date.now() + 1
      const assistantMessage = {
        id: assistantMessageId,
        text: "",
        isUser: false
      }
      setConversationMessages(prev => ({
        ...prev,
        [currentConversationId]: [...(prev[currentConversationId] || []), assistantMessage]
      }))

      try {
        const modelId = getModelId(selectedModel)
        const currentMessages = conversationMessages[currentConversationId] || []
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
              ...currentMessages.map(m => ({
                role: m.isUser ? "user" : "assistant",
                content: m.text
              })),
              { role: "user", content: currentMessage }
            ],
            stream: true
          })
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (reader) {
          let buffer = ""
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
                    setConversationMessages(prev => ({
                      ...prev,
                      [currentConversationId]: prev[currentConversationId].map(m =>
                        m.id === assistantMessageId
                          ? { ...m, text: m.text + content }
                          : m
                      )
                    }))
                  }
                } catch (e) {
                  console.error("Error parsing stream:", e)
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error sending message:", error)
        setConversationMessages(prev => ({
          ...prev,
          [currentConversationId]: prev[currentConversationId].map(m =>
            m.id === assistantMessageId
              ? { ...m, text: "Error: Failed to get response. Please check your API key." }
              : m
          )
        }))
      } finally {
        setIsLoading(false)
      }
    }
  }

  const retryMessage = async (messageId: number) => {
    const messages = conversationMessages[currentConversationId] || []
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1 || !messages[messageIndex].isUser) return

    const userMessageText = messages[messageIndex].text

    const messagesAfter = messages.slice(messageIndex + 1)
    setConversationMessages(prev => ({
      ...prev,
      [currentConversationId]: messages.slice(0, messageIndex + 1)
    }))

    setIsLoading(true)

    const assistantMessageId = Date.now() + 1
    const assistantMessage = {
      id: assistantMessageId,
      text: "",
      isUser: false
    }
    setConversationMessages(prev => ({
      ...prev,
      [currentConversationId]: [...prev[currentConversationId], assistantMessage]
    }))

    try {
      const modelId = getModelId(selectedModel)
      const currentMessages = conversationMessages[currentConversationId] || []
      const contextMessages = currentMessages.slice(0, messageIndex + 1).map(m => ({
        role: m.isUser ? "user" : "assistant",
        content: m.text
      }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            ...contextMessages,
            { role: "user", content: userMessageText }
          ],
          stream: true
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let buffer = ""
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
                  setConversationMessages(prev => ({
                    ...prev,
                    [currentConversationId]: prev[currentConversationId].map(m =>
                      m.id === assistantMessageId
                        ? { ...m, text: m.text + content }
                        : m
                    )
                  }))
                }
              } catch (e) {
                console.error("Error parsing stream:", e)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error retrying message:", error)
      setConversationMessages(prev => ({
        ...prev,
        [currentConversationId]: prev[currentConversationId].map(m =>
          m.id === assistantMessageId
            ? { ...m, text: "Error: Failed to get response. Please check your API key." }
            : m
        )
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const regenerateResponse = async (messageId: number) => {
    const messages = conversationMessages[currentConversationId] || []
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1 || messages[messageIndex].isUser) return

    const previousUserMessageIndex = messageIndex - 1
    if (previousUserMessageIndex < 0 || !messages[previousUserMessageIndex].isUser) return

    const userMessageText = messages[previousUserMessageIndex].text

    setConversationMessages(prev => ({
      ...prev,
      [currentConversationId]: messages.slice(0, messageIndex)
    }))

    setIsLoading(true)

    const newAssistantMessageId = Date.now() + 1
    const assistantMessage = {
      id: newAssistantMessageId,
      text: "",
      isUser: false
    }
    setConversationMessages(prev => ({
      ...prev,
      [currentConversationId]: [...prev[currentConversationId], assistantMessage]
    }))

    try {
      const modelId = getModelId(selectedModel)
      const currentMessages = conversationMessages[currentConversationId] || []
      const contextMessages = currentMessages.slice(0, messageIndex).map(m => ({
        role: m.isUser ? "user" : "assistant",
        content: m.text
      }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            ...contextMessages,
            { role: "user", content: userMessageText }
          ],
          stream: true
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let buffer = ""
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
                  setConversationMessages(prev => ({
                    ...prev,
                    [currentConversationId]: prev[currentConversationId].map(m =>
                      m.id === newAssistantMessageId
                        ? { ...m, text: m.text + content }
                        : m
                    )
                  }))
                }
              } catch (e) {
                console.error("Error parsing stream:", e)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error regenerating response:", error)
      setConversationMessages(prev => ({
        ...prev,
        [currentConversationId]: prev[currentConversationId].map(m =>
          m.id === newAssistantMessageId
            ? { ...m, text: "Error: Failed to get response. Please check your API key." }
            : m
        )
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex min-h-screen bg-[rgb(24,24,37)] font-sans dark:bg-black">
      <aside className={`fixed left-0 top-0 h-full w-64 bg-gray-800 transform transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
      <div className={`fixed top-4 z-10 ${isSidebarOpen ? 'left-68' : 'left-4'}`}>
        <Select value={selectedModel} onValueChange={(value) => {
          if (value === "view-more") {
            setShowAllModels(!showAllModels)
            return
          }
          const model = value as "Gemini" | "GPT 5" | "Grok" | "Gemini 3" | "Kimi"
          setSelectedModel(model)
          console.log("Model changed to:", model)
        }}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
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
      <main className={`flex-1 min-h-screen flex flex-col bg-[rgb(24,24,37)] relative ${isSidebarOpen ? 'ml-64' : ''}`}>
        <div className="flex-1 overflow-y-auto pb-32">
          <div className="w-full flex justify-center">
            <div className="w-[50%] py-8 px-4 space-y-6">
              {(conversationMessages[currentConversationId] || []).map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-lg text-white border ${
                    msg.isUser
                      ? 'rounded-bl-none border-blue-500 bg-gray-800'
                      : 'rounded-br-none border-gray-600 bg-gray-700'
                  }`}>
                    {msg.isUser ? (
                      msg.text
                    ) : (
                      <div className="markdown-content" dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text || "Thinking...") }} />
                    )}
                  </div>
                  <div className="flex items-center text-xs text-gray-400 mt-1 px-2">
                    <span>{formatTime(msg.id)}</span>
                    {msg.isUser && (
                      <button
                        onClick={() => retryMessage(msg.id)}
                        disabled={isLoading}
                        className="ml-2 p-1 hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Retry message"
                      >
                        <RefreshCw size={14} />
                      </button>
                    )}
                    {!msg.isUser && msg.text && msg.text !== "Thinking..." && (
                      <>
                        <button
                          onClick={() => regenerateResponse(msg.id)}
                          disabled={isLoading}
                          className="ml-2 p-1 hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Regenerate response"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          onClick={() => speakMessage(msg.text)}
                          disabled={isTtsLoading}
                          className="ml-2 p-1 hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={isTtsLoading ? "Generating speech..." : "Speak message"}
                        >
                          {isTtsLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Volume2 size={14} />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={`fixed left-0 right-0 flex justify-center ${ (conversationMessages[currentConversationId] || []).length === 0 ? 'top-1/2 -translate-y-1/2' : 'bottom-0 pb-8' }`} style={{ paddingLeft: isSidebarOpen ? '16rem' : '0' }}>
          <div className="w-[50%] px-4">
            {(conversationMessages[currentConversationId] || []).length === 0 && (
              <div className="text-center text-white text-6xl mb-4">
                Hi, I'm {selectedModel}!
              </div>
            )}
            <div className="relative">
              <input
                ref={messageInputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send message"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </main>

      <button
        onClick={() => {
          setIsModalOpen(true)
          setIsInitialSetup(false)
        }}
        className="fixed bottom-4 right-4 w-12 h-12 bg-gray-700 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors z-20"
        title="Settings"
      >
        <Settings size={20} />
      </button>

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false)
        setIsInitialSetup(false)
      }}>
        <ModalHeader>
          <h2 className="text-lg font-semibold">{isInitialSetup ? "Set API Key" : "Settings"}</h2>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <input
                id="apiKey"
                type="text"
                value={apiKey}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.startsWith("sk-hc-v1-")) {
                    setApiKey(value);
                  } else {
                    setApiKey("sk-hc-v1-" + value.replace(/^sk-hc-v1-/, ""));
                  }
                }}
                placeholder="Enter the rest of your API key"
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-2">
                P.S: You can obtain the key at ai.hackclub.com
              </p>
            </div>
            {!isInitialSetup && (
              <>
                <div>
                  <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                    System Prompt (Optional)
                  </label>
                  <textarea
                    id="systemPrompt"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Enter a custom system prompt..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  />
                </div>
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          {!isInitialSetup && (
            <button
              onClick={() => {
                setConversations([{ id: 1, title: "New Conversation" }])
                setConversationMessages({1: []})
                setCurrentConversationId(1)
                setMessage("")
                setIsModalOpen(false)
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mr-2"
            >
              Clear Chats
            </button>
          )}
          {apiKey.length > 8 && (
            <button
              onClick={() => {
                localStorage.setItem("apiKey", apiKey)
                localStorage.setItem("systemPrompt", systemPrompt)
                setIsModalOpen(false)
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          )}
        </ModalFooter>
      </Modal>

    </div>
  );
}
