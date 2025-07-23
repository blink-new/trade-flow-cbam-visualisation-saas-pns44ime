import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Leaf, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'
import { blink } from '../blink/client'

export function CBAMAnalysis() {
  const [cbamData, setCbamData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRecords: 0,
    cbamRelevant: 0,
    totalCarbonIntensity: 0,
    categories: {} as Record<string, number>
  })

  const loadCBAMData = async () => {
    try {
      const user = await blink.auth.me()
      const records = await blink.db.tradeRecords.list({
        where: { userId: user.id }
      })
      
      const cbamRecords = records.filter(record => Number(record.isCbamRelevant) > 0)
      
      const categories = cbamRecords.reduce((acc, record) => {
        const category = record.cbamCategory || 'Unknown'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const totalCarbonIntensity = cbamRecords.reduce((sum, record) => 
        sum + (record.carbonIntensity || 0), 0
      )

      setStats({
        totalRecords: records.length,
        cbamRelevant: cbamRecords.length,
        totalCarbonIntensity,
        categories
      })
      
      setCbamData(cbamRecords)
    } catch (error) {
      console.error('Error loading CBAM data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCBAMData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const complianceScore = stats.totalRecords > 0 
    ? Math.round(((stats.totalRecords - stats.cbamRelevant) / stats.totalRecords) * 100)
    : 100

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">CBAM Analysis</h1>
        <p className="text-muted-foreground">
          Carbon Border Adjustment Mechanism compliance analysis and carbon intensity tracking
        </p>
      </div>

      {/* CBAM Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CBAM Relevant</p>
                <p className="text-2xl font-bold text-foreground">{stats.cbamRelevant}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalRecords > 0 
                    ? `${Math.round((stats.cbamRelevant / stats.totalRecords) * 100)}% of total`
                    : '0% of total'
                  }
                </p>
              </div>
              <Leaf className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Carbon Intensity</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalCarbonIntensity.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">tCO2e/tonne</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold text-foreground">{complianceScore}%</p>
                <Progress value={complianceScore} className="mt-2" />
              </div>
              {complianceScore >= 80 ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CBAM Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Leaf className="w-5 h-5 text-green-500" />
            <span>CBAM Categories</span>
          </CardTitle>
          <CardDescription>
            Breakdown of your trade by CBAM-regulated categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.categories).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.categories).map(([category, count]) => (
                <div key={category} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{category}</h4>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(count / stats.cbamRelevant) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((count / stats.cbamRelevant) * 100)}% of CBAM records
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Leaf className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No CBAM-relevant trade records found. Upload documents to see analysis.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CBAM Records Table */}
      {cbamData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>CBAM-Relevant Trade Records</CardTitle>
            <CardDescription>
              Detailed view of products subject to Carbon Border Adjustment Mechanism
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 font-medium">Product</th>
                    <th className="text-left p-2 font-medium">Category</th>
                    <th className="text-left p-2 font-medium">Origin</th>
                    <th className="text-left p-2 font-medium">Carbon Intensity</th>
                    <th className="text-left p-2 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {cbamData.slice(0, 10).map((record, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{record.productDescription || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{record.productCode}</p>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {record.cbamCategory}
                        </Badge>
                      </td>
                      <td className="p-2">{record.countryOrigin}</td>
                      <td className="p-2">
                        <span className="font-medium">
                          {record.carbonIntensity?.toFixed(2) || '0.00'}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">tCO2e/t</span>
                      </td>
                      <td className="p-2">
                        ${(record.valueUsd || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cbamData.length > 10 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Showing 10 of {cbamData.length} CBAM-relevant records
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span>Compliance Recommendations</span>
          </CardTitle>
          <CardDescription>
            Actions to improve your CBAM compliance posture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-foreground">Monitor Carbon Intensity</h4>
                <p className="text-sm text-muted-foreground">
                  Track carbon intensity values for all CBAM-relevant imports to ensure accurate reporting.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-foreground">Verify Origin Documentation</h4>
                <p className="text-sm text-muted-foreground">
                  Ensure all country of origin information is accurate and properly documented.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-foreground">Prepare for CBAM Certificates</h4>
                <p className="text-sm text-muted-foreground">
                  Start collecting necessary documentation for CBAM certificate purchases when the system becomes mandatory.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}