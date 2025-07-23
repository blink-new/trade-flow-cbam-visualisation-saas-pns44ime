import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { 
  Leaf, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Factory,
  Zap
} from 'lucide-react'
import { blink } from '../blink/client'

interface CBAMRecord {
  id: string
  productCode: string
  productDescription: string
  originCountry: string
  quantity: number
  value: number
  cbamaCategory: string
  riskLevel: 'low' | 'medium' | 'high'
  complianceScore: number
}

interface CBAMStats {
  totalRecords: number
  highRiskRecords: number
  averageComplianceScore: number
  categoriesBreakdown: { [key: string]: number }
  countryRisks: { [key: string]: number }
}

export function CBAMAnalysis() {
  const [cbamaRecords, setCbamaRecords] = useState<CBAMRecord[]>([])
  const [stats, setStats] = useState<CBAMStats>({
    totalRecords: 0,
    highRiskRecords: 0,
    averageComplianceScore: 0,
    categoriesBreakdown: {},
    countryRisks: {}
  })
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const calculateRiskLevel = useCallback((country: string, category: string): 'low' | 'medium' | 'high' => {
    // High-risk countries for CBAM (simplified logic)
    const highRiskCountries = ['China', 'India', 'Russia', 'Turkey', 'Ukraine']
    const mediumRiskCountries = ['Brazil', 'South Africa', 'Indonesia', 'Thailand']
    
    // High-risk categories
    const highRiskCategories = ['steel', 'cement', 'aluminum']
    
    if (highRiskCountries.includes(country) && highRiskCategories.includes(category)) {
      return 'high'
    } else if (highRiskCountries.includes(country) || highRiskCategories.includes(category)) {
      return 'medium'
    } else if (mediumRiskCountries.includes(country)) {
      return 'medium'
    }
    
    return 'low'
  }, [])

  const calculateComplianceScore = useCallback((riskLevel: string, value: number): number => {
    const baseScore = riskLevel === 'high' ? 40 : riskLevel === 'medium' ? 70 : 85
    const valueAdjustment = Math.min(value / 100000, 15) // Adjust based on trade value
    return Math.max(0, Math.min(100, baseScore - valueAdjustment))
  }, [])

  const loadCBAMData = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      
      // Load CBAM-relevant records
      const records = await blink.db.tradeRecords.list({
        where: { 
          userId: user.id,
          isCbamRelevant: "1"
        }
      })
      
      // Process records with risk analysis
      const processedRecords: CBAMRecord[] = records.map(record => {
        const category = record.cbamaCategory || 'unknown'
        const riskLevel = calculateRiskLevel(record.originCountry, category)
        const complianceScore = calculateComplianceScore(riskLevel, record.value)
        
        return {
          id: record.id,
          productCode: record.productCode,
          productDescription: record.productDescription,
          originCountry: record.originCountry,
          quantity: record.quantity,
          value: record.value,
          cbamaCategory: category,
          riskLevel,
          complianceScore
        }
      })
      
      // Calculate statistics
      const totalRecords = processedRecords.length
      const highRiskRecords = processedRecords.filter(r => r.riskLevel === 'high').length
      const averageComplianceScore = totalRecords > 0 
        ? processedRecords.reduce((sum, r) => sum + r.complianceScore, 0) / totalRecords 
        : 0
      
      // Categories breakdown
      const categoriesBreakdown: { [key: string]: number } = {}
      processedRecords.forEach(record => {
        categoriesBreakdown[record.cbamaCategory] = (categoriesBreakdown[record.cbamaCategory] || 0) + 1
      })
      
      // Country risks
      const countryRisks: { [key: string]: number } = {}
      processedRecords.forEach(record => {
        const riskScore = record.riskLevel === 'high' ? 3 : record.riskLevel === 'medium' ? 2 : 1
        countryRisks[record.originCountry] = (countryRisks[record.originCountry] || 0) + riskScore
      })
      
      setCbamaRecords(processedRecords)
      setStats({
        totalRecords,
        highRiskRecords,
        averageComplianceScore,
        categoriesBreakdown,
        countryRisks
      })
      
    } catch (error) {
      console.error('Error loading CBAM data:', error)
    } finally {
      setLoading(false)
    }
  }, [calculateRiskLevel, calculateComplianceScore])

  useEffect(() => {
    loadCBAMData()
  }, [loadCBAMData])

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />
      case 'low':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'steel':
      case 'aluminum':
        return <Factory className="h-5 w-5" />
      case 'electricity':
        return <Zap className="h-5 w-5" />
      default:
        return <Leaf className="h-5 w-5" />
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
        <h1 className="text-3xl font-bold text-primary">CBAM Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Carbon Border Adjustment Mechanism compliance analysis and risk assessment
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CBAM Records</p>
                <p className="text-2xl font-bold">{stats.totalRecords}</p>
              </div>
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-red-600">{stats.highRiskRecords}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalRecords > 0 ? Math.round((stats.highRiskRecords / stats.totalRecords) * 100) : 0}% of total
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold">{Math.round(stats.averageComplianceScore)}</p>
                <p className="text-xs text-muted-foreground">Average score</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{Object.keys(stats.categoriesBreakdown).length}</p>
              </div>
              <Factory className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Overall Compliance Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Compliance Score</span>
              <span className="text-sm font-bold">{Math.round(stats.averageComplianceScore)}/100</span>
            </div>
            <Progress value={stats.averageComplianceScore} className="w-full h-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">
                  {cbamaRecords.filter(r => r.riskLevel === 'low').length}
                </p>
                <p className="text-xs text-green-600">Low Risk</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-lg font-bold text-yellow-600">
                  {cbamaRecords.filter(r => r.riskLevel === 'medium').length}
                </p>
                <p className="text-xs text-yellow-600">Medium Risk</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-lg font-bold text-red-600">
                  {cbamaRecords.filter(r => r.riskLevel === 'high').length}
                </p>
                <p className="text-xs text-red-600">High Risk</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories and Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CBAM Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Factory className="h-5 w-5" />
              <span>CBAM Categories</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.categoriesBreakdown).map(([category, count]) => (
                <div 
                  key={category}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedCategory === category 
                      ? 'border-accent bg-accent/5' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category ? null : category
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getCategoryIcon(category)}
                      <div>
                        <p className="font-medium capitalize">{category}</p>
                        <p className="text-sm text-muted-foreground">
                          {count} records
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{count}</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalRecords > 0 ? Math.round((count / stats.totalRecords) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* High Risk Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>High Risk Records</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {cbamaRecords
                .filter(record => record.riskLevel === 'high')
                .slice(0, 10)
                .map((record) => (
                <div key={record.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{record.productDescription}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.productCode} • {record.originCountry}
                      </p>
                    </div>
                    <Badge className={getRiskColor(record.riskLevel)}>
                      {getRiskIcon(record.riskLevel)}
                      <span className="ml-1">{record.riskLevel}</span>
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatCurrency(record.value)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">Score:</span>
                      <span className="font-medium">{Math.round(record.complianceScore)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {cbamaRecords.filter(r => r.riskLevel === 'high').length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">No high-risk records found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your trade portfolio shows good CBAM compliance
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Records Table */}
      {stats.totalRecords > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>CBAM Records Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Product</th>
                    <th className="text-left p-2">Country</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Value</th>
                    <th className="text-left p-2">Risk</th>
                    <th className="text-left p-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {cbamaRecords.slice(0, 20).map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{record.productCode}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {record.productDescription}
                          </p>
                        </div>
                      </td>
                      <td className="p-2">{record.originCountry}</td>
                      <td className="p-2">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {record.cbamaCategory}
                        </Badge>
                      </td>
                      <td className="p-2">{formatCurrency(record.value)}</td>
                      <td className="p-2">
                        <Badge className={getRiskColor(record.riskLevel)}>
                          {record.riskLevel}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{Math.round(record.complianceScore)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}