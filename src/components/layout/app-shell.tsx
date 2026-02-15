'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { useAppStore } from '@/stores/app-store'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { PanelLeft } from 'lucide-react'
import { useEffect } from 'react'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  // Quick capture shortcut (Cmd+N / Ctrl+N)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('create-new-note'))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar as sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[260px] p-0 lg:hidden">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center gap-2 border-b px-4 py-2 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(true)}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm">Forever Notes</span>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
