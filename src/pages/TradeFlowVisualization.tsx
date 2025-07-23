import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { 
  Globe, 
  TrendingUp, 
  Package, 
  DollarSign,
  MapPin,
  BarChart3
} from 'lucide-react'
import { blink } from '../blink/client'

interface CountryData {
  country: string
  totalRecords: number
  totalValue: number
  cbamaRecords: number
  topProducts: string[]
}

interface TradeFlowData {
  totalCountries: number
  totalValue: number
  topCountries: CountryData[]
  tradeRoutes: Array<{
    from: string
    to: string
    value: number
    volume: number
  }>
}

export function TradeFlowVisualization() {
  const [tradeData, setTradeData] = useState<TradeFlowData>({
    totalCountries: 0,
    totalValue: 0,
    topCountries: [],
    tradeRoutes: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)

  const loadTradeFlowData = async () => {
    try {
      const user = await blink.auth.me()
      
      // Load all trade records
      const records = await blink.db.tradeRecords.list({
        where: { userId: user.id }
      })
      
      // Process data by country
      const countryMap = new Map<string, CountryData>()
      let totalValue = 0
      
      records.forEach(record => {
        const country = record.originCountry || 'Unknown'
        const value = record.value || 0
        const isCbam = Number(record.isCbamRelevant) > 0
        
        totalValue += value
        
        if (!countryMap.has(country)) {
          countryMap.set(country, {
            country,
            totalRecords: 0,
            totalValue: 0,
            cbamaRecords: 0,
            topProducts: []
          })
        }
        
        const countryData = countryMap.get(country)!
        countryData.totalRecords++
        countryData.totalValue += value
        if (isCbam) countryData.cbamaRecords++
        
        // Track top products
        if (record.productDescription && !countryData.topProducts.includes(record.productDescription)) {
          countryData.topProducts.push(record.productDescription)
        }
      })
      
      // Sort countries by value
      const topCountries = Array.from(countryMap.values())
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10)
      
      // Create mock trade routes (in real app, this would be more sophisticated)
      const tradeRoutes = topCountries.slice(0, 5).map(country => ({
        from: country.country,
        to: 'Your Company',
        value: country.totalValue,
        volume: country.totalRecords
      }))
      
      setTradeData({
        totalCountries: countryMap.size,
        totalValue,
        topCountries,
        tradeRoutes
      })
      
    } catch (error) {
      console.error('Error loading trade flow data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTradeFlowData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getCountryFlag = (country: string) => {
    // Simple flag mapping - in real app, use proper flag API
    const flags: { [key: string]: string } = {
      'China': '🇨🇳',
      'Germany': '🇩🇪',
      'USA': '🇺🇸',
      'Japan': '🇯🇵',
      'South Korea': '🇰🇷',
      'Italy': '🇮🇹',
      'France': '🇫🇷',
      'Turkey': '🇹🇷',
      'India': '🇮🇳',
      'Brazil': '🇧🇷'
    }
    return flags[country] || '🌍'
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
        <h1 className="text-3xl font-bold text-primary">Trade Flow Visualization</h1>
        <p className="text-muted-foreground mt-2">
          Interactive analysis of your trade routes and partner countries
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Countries</p>
                <p className="text-2xl font-bold">{tradeData.totalCountries}</p>
              </div>
              <Globe className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Trade Value</p>
                <p className="text-2xl font-bold">{formatCurrency(tradeData.totalValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Routes</p>
                <p className="text-2xl font-bold">{tradeData.tradeRoutes.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trade Flow Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Trade Flow Map</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <Globe className="h-16 w-16 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Interactive World Map</h3>
              <p className="text-muted-foreground max-w-md">
                Visual representation of your trade flows with animated routes, 
                country statistics, and CBAM compliance indicators
              </p>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {tradeData.topCountries.slice(0, 4).map((country, index) => (
                  <div key={country.country} className="text-center">
                    <div className="text-2xl mb-1">{getCountryFlag(country.country)}</div>
                    <div className="text-sm font-medium">{country.country}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(country.totalValue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Trading Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Top Trading Partners</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tradeData.topCountries.slice(0, 8).map((country, index) => (
                <div 
                  key={country.country}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedCountry === country.country 
                      ? 'border-accent bg-accent/5' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCountry(
                    selectedCountry === country.country ? null : country.country
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getCountryFlag(country.country)}</span>
                      <div>
                        <p className="font-medium">{country.country}</p>
                        <p className="text-sm text-muted-foreground">
                          {country.totalRecords} transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(country.totalValue)}</p>
                      <Badge variant="secondary" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Trade Volume</span>
                      <span>{Math.round((country.totalValue / tradeData.totalValue) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(country.totalValue / tradeData.totalValue) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  {country.cbamaRecords > 0 && (
                    <div className="mt-2 flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {country.cbamaRecords} CBAM records
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Country Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Country Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCountry ? (
              <div className="space-y-4">
                {(() => {
                  const country = tradeData.topCountries.find(c => c.country === selectedCountry)
                  if (!country) return <p>Country not found</p>
                  
                  return (
                    <>
                      <div className="flex items-center space-x-3 pb-4 border-b">
                        <span className="text-2xl">{getCountryFlag(country.country)}</span>
                        <div>
                          <h3 className="text-xl font-semibold">{country.country}</h3>
                          <p className="text-muted-foreground">Trading Partner Details</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-accent">{country.totalRecords}</p>
                          <p className="text-sm text-muted-foreground">Total Records</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{country.cbamaRecords}</p>
                          <p className="text-sm text-muted-foreground">CBAM Records</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Trade Value</h4>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(country.totalValue)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round((country.totalValue / tradeData.totalValue) * 100)}% of total trade
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Top Products</h4>
                        <div className="space-y-1">
                          {country.topProducts.slice(0, 5).map((product, index) => (
                            <p key={index} className="text-sm text-muted-foreground">
                              • {product}
                            </p>
                          ))}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select a country from the list to view detailed information
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}