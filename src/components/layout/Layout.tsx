import type { ReactNode } from 'react'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: ReactNode
  showSidebar?: boolean
  activeScene?: string
  onSceneChange?: (sceneId: string) => void
}

export function Layout({
  children,
  showSidebar = true,
  activeScene,
  onSceneChange,
}: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#020617' }}>
      <Navbar />

      <div className="flex flex-1 pt-14">
        {showSidebar && (
          <Sidebar activeScene={activeScene} onSceneChange={onSceneChange} />
        )}

        <main className="flex-1 min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
