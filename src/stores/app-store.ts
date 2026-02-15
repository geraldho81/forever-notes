import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  selectedNoteId: string | null
  selectedNotebookId: string | null
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSelectedNoteId: (id: string | null) => void
  setSelectedNotebookId: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  selectedNoteId: null,
  selectedNotebookId: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  setSelectedNotebookId: (id) => set({ selectedNotebookId: id }),
}))
