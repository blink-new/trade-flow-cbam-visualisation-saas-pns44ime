import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { 
  FileText, 
  TrendingUp, 
  Globe, 
  Leaf, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react'
import { blink } from '../blink/client'

interface TradeDocument {
  id: string
  filename: string
  status: 'processing' | 'completed' | 'error'
  uploaded_at: string
  total_records: number
  cbam_records: number
}

interface DashboardStats {
  totalDocuments: number
  totalRecords: number
  cbamaRecords: number
  uniqueCountries: number
  processingDocuments: number
}

export function Dashboard() {
  const [documents, setDocuments] = useState<TradeDocument[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    totalRecords: 0,
    cbamaRecords: 0,
    uniqueCountries: 0,
    processingDocuments: 0
  })
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      const user = await blink.auth.me()
      
      // Load recent documents
      const docsResult = await blink.db.tradeDocuments.list({
        where: { userId: user.id },
        orderBy: { uploadedAt: 'desc' },
        limit: 5
      })
      
      // Load trade records for stats
      const recordsResult = await blink.db.tradeRecords.list({
        where: { userId: user.id }
      })
      
      setDocuments(docsResult)
      
      // Calculate stats
      const totalRecords = recordsResult.length
      const cbamaRecords = recordsResult.filter(record => 
        Number(record.isCbamRelevant) > 0
      ).length
      const uniqueCountries = new Set(recordsResult.map(r => r.originCountry)).size
      const processingDocs = docsResult.filter(doc => doc.status === 'processing').length
      
      setStats({
        totalDocuments: docsResult.length,
        totalRecords,
        cbamaRecords,
        uniqueCountries,
        processingDocuments: processingDocs
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} />
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
      case 'error':
        return <AlertTriangle size={16} />
      default:
        return <FileText size={16} />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your trade flow analysis and CBAM compliance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{stats.totalDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trade Records</p>
                <p className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CBAM Records</p>
                <p className="text-2xl font-bold">{stats.cbamaRecords.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalRecords > 0 ? Math.round((stats.cbamaRecords / stats.totalRecords) * 100) : 0}% of total
                </p>
              </div>
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Countries</p>
                <p className="text-2xl font-bold">{stats.uniqueCountries}</p>
              </div>
              <Globe className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your first trade document to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(doc.status)}
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.totalRecords} records • {doc.cbamaRecords} CBAM relevant
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Status */}
      {stats.processingDocuments > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
              <span>Processing Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {stats.processingDocuments} document(s) being processed
                </span>
                <span className="text-sm text-muted-foreground">In progress...</span>
              </div>
              <Progress value={65} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Processing includes data extraction, CBAM classification, and trade flow analysis
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}