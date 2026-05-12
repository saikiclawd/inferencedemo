import { create } from 'zustand'

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  isStreaming?: boolean
}

interface AssistantState {
  messages: ChatMessage[]
  isOpen: boolean
  isConnected: boolean
  addUserMessage: (content: string) => void
  startAssistantMessage: () => string
  appendToken: (id: string, token: string) => void
  finalizeMessage: (id: string) => void
  toggleOpen: () => void
  setConnected: (connected: boolean) => void
  clearMessages: () => void
}

export const useAssistantStore = create<AssistantState>((set) => ({
  messages: [],
  isOpen: false,
  isConnected: false,

  addUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: crypto.randomUUID(), role: 'user', content },
      ],
    })),

  startAssistantMessage: () => {
    const id = crypto.randomUUID()
    set((state) => ({
      messages: [
        ...state.messages,
        { id, role: 'assistant', content: '', isStreaming: true },
      ],
    }))
    return id
  },

  appendToken: (id, token) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + token } : m,
      ),
    })),

  finalizeMessage: (id) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isStreaming: false } : m,
      ),
    })),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setConnected: (connected) => set({ isConnected: connected }),
  clearMessages: () => set({ messages: [] }),
}))
