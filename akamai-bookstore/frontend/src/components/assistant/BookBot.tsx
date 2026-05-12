import { useEffect, useRef, useState } from 'react'
import { ChatBubbleBottomCenterTextIcon, XMarkIcon, MinusIcon } from '@heroicons/react/24/outline'
import { useAssistantStore } from '../../store/assistant.store.ts'
import ChatMessageComponent from './ChatMessage.tsx'
import BookBotInput from './BookBotInput.tsx'
import keycloak from '../../keycloak.ts'

export default function BookBot() {
  const { messages, isOpen, toggleOpen, addUserMessage, startAssistantMessage, appendToken, finalizeMessage, setConnected } =
    useAssistantStore()
  const [isStreaming, setIsStreaming] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const currentMsgIdRef = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen && !wsRef.current) {
      connectWs()
    }
    return () => {
      if (!isOpen && wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [isOpen])

  function connectWs() {
    const token = keycloak.token ?? ''
    const wsUrl =
      (import.meta.env.VITE_WS_URL as string | undefined) ??
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    const ws = new WebSocket(`${wsUrl}/api/assistant?token=${token}`)

    ws.onopen = () => setConnected(true)
    ws.onclose = () => {
      setConnected(false)
      wsRef.current = null
    }

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data) as { type: string; content?: string }

      if (data.type === 'token' && currentMsgIdRef.current) {
        appendToken(currentMsgIdRef.current, data.content ?? '')
      }

      if (data.type === 'done' && currentMsgIdRef.current) {
        finalizeMessage(currentMsgIdRef.current)
        currentMsgIdRef.current = null
        setIsStreaming(false)
      }

      if (data.type === 'error') {
        if (currentMsgIdRef.current) {
          appendToken(currentMsgIdRef.current, 'Sorry, something went wrong. Please try again.')
          finalizeMessage(currentMsgIdRef.current)
          currentMsgIdRef.current = null
        }
        setIsStreaming(false)
      }
    }

    wsRef.current = ws
  }

  const handleSend = (message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWs()
      setTimeout(() => sendMessage(message), 500)
      return
    }
    sendMessage(message)
  }

  const sendMessage = (message: string) => {
    addUserMessage(message)
    const id = startAssistantMessage()
    currentMsgIdRef.current = id
    setIsStreaming(true)

    wsRef.current?.send(JSON.stringify({ message, sessionId: crypto.randomUUID() }))
  }

  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg hover:bg-brand-600 transition-colors flex items-center justify-center"
        aria-label="Open BookBot"
      >
        <ChatBubbleBottomCenterTextIcon className="w-7 h-7" />
      </button>
    )
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-200 ${
        isMinimized ? 'h-14' : 'h-[600px]'
      } max-w-[calc(100vw-3rem)]`}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-brand-500 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
          <span className="font-semibold text-sm">BookBot</span>
          <span className="text-xs opacity-75">AI Shopping Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized((v) => !v)}
            className="p-1 hover:bg-brand-400 rounded"
            aria-label="Minimize"
          >
            <MinusIcon className="w-4 h-4" />
          </button>
          <button onClick={toggleOpen} className="p-1 hover:bg-brand-400 rounded" aria-label="Close">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-12">
                <p className="text-3xl mb-3">📚</p>
                <p className="font-medium">Hi! I'm BookBot.</p>
                <p className="mt-1">Ask me to recommend books, compare titles, or help you find your next read.</p>
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessageComponent key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <BookBotInput onSend={handleSend} disabled={isStreaming} />
        </>
      )}
    </div>
  )
}
