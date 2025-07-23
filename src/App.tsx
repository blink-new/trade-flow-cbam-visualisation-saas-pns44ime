import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { Dashboard } from './pages/Dashboard'
import { DocumentUpload } from './pages/DocumentUpload'
import { TradeFlowVisualization } from './pages/TradeFlowVisualization'
import { CBAMAnalysis } from './pages/CBAMAnalysis'
import { CompanyProfile } from './pages/CompanyProfile'
import { Settings } from './pages/Settings'

type Page = 'dashboard' | 'upload' | 'visualization' | 'cbam' | 'profile' | 'settings'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading TradeFlow Analytics...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-3xl font-bold text-primary mb-4">TradeFlow Analytics</h1>
          <p className="text-muted-foreground mb-6">
            Analyze trade flows and CBAM compliance with advanced document processing
          </p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'upload':
        return <DocumentUpload />
      case 'visualization':
        return <TradeFlowVisualization />
      case 'cbam':
        return <CBAMAnalysis />
      case 'profile':
        return <CompanyProfile />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="flex-1 flex flex-col">
          <Header user={user} />
          <main className="flex-1 p-6">
            {renderPage()}
          </main>
        </div>
      </div>
    </div>
  )
}

export default App