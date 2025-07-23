import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Globe, MapPin, TrendingUp } from 'lucide-react'
import { blink } from '../blink/client'

export function TradeFlowVisualization() {
  const [tradeData, setTradeData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadTradeData = async () => {
    try {
      const user = await blink.auth.me()
      const records = await blink.db.tradeRecords.list({
        where: { userId: user.id },
        limit: 50
      })
      setTradeData(records)
    } catch (error) {
      console.error('Error loading trade data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTradeData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  const countryPairs = tradeData.reduce((acc, record) => {
    const key = `${record.countryOrigin}-${record.countryDestination}`
    if (!acc[key]) {
      acc[key] = {
        origin: record.countryOrigin,
        destination: record.countryDestination,
        count: 0,
        totalValue: 0,
        cbamRelevant: 0
      }
    }
    acc[key].count++
    acc[key].totalValue += record.valueUsd || 0
    if (Number(record.isCbamRelevant) > 0) {
      acc[key].cbamRelevant++
    }
    return acc
  }, {} as Record<string, any>)

  const topRoutes = Object.values(countryPairs)
    .sort((a: any, b: any) => b.totalValue - a.totalValue)
    .slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Trade Flow Visualization</h1>
        <p className="text-muted-foreground">
          Interactive visualization of your global trade routes and patterns
        </p>
      </div>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-accent" />
            <span>Global Trade Flow Map</span>
          </CardTitle>
          <CardDescription>
            Interactive world map showing trade routes and volumes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
            <div className="text-center">
              <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Interactive Map Coming Soon</h3>
              <p className="text-muted-foreground">
                3D globe visualization with animated trade flows will be displayed here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Trade Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <span>Top Trade Routes</span>
          </CardTitle>
          <CardDescription>
            Your most valuable trade corridors by volume and value
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topRoutes.length > 0 ? (
            <div className="space-y-4">
              {topRoutes.map((route: any, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{route.origin}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{route.destination}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium">
                        ${route.totalValue.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {route.count} shipments
                      </p>
                    </div>
                    {route.cbamRelevant > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {route.cbamRelevant} CBAM
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No trade data available. Upload documents to see trade flow visualization.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {Object.keys(countryPairs).length}
              </p>
              <p className="text-sm text-muted-foreground">Trade Routes</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {new Set(tradeData.map(r => r.countryOrigin)).size}
              </p>
              <p className="text-sm text-muted-foreground">Origin Countries</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {new Set(tradeData.map(r => r.countryDestination)).size}
              </p>
              <p className="text-sm text-muted-foreground">Destination Countries</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}