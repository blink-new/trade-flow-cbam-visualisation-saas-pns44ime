import { 
  LayoutDashboard, 
  Upload, 
  Globe, 
  Leaf, 
  Building, 
  Settings 
} from 'lucide-react'

type Page = 'dashboard' | 'upload' | 'visualization' | 'cbam' | 'profile' | 'settings'

interface SidebarProps {
  currentPage: Page
  onPageChange: (page: Page) => void
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload' as Page, label: 'Upload Documents', icon: Upload },
    { id: 'visualization' as Page, label: 'Trade Flow', icon: Globe },
    { id: 'cbam' as Page, label: 'CBAM Analysis', icon: Leaf },
    { id: 'profile' as Page, label: 'Company Profile', icon: Building },
    { id: 'settings' as Page, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="w-64 bg-primary text-white h-screen flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold">TradeFlow Analytics</h1>
        <p className="text-sm text-white/70 mt-1">CBAM Compliance Platform</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-accent text-white' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}