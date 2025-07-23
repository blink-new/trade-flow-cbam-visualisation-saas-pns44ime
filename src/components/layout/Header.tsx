import { LogOut, User } from 'lucide-react'
import { blink } from '../../blink/client'

interface HeaderProps {
  user: any
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Welcome back</h2>
          <p className="text-sm text-muted-foreground">
            Manage your trade flows and CBAM compliance
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <User size={16} />
            <span>{user?.email}</span>
          </div>
          
          <button
            onClick={() => blink.auth.logout()}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  )
}