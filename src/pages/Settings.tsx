import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  Download, 
  Trash2, 
  Database, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Settings as SettingsIcon
} from 'lucide-react'
import { blink } from '../blink/client'

export function Settings() {
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const exportData = async () => {
    setIsExporting(true)
    try {
      const user = await blink.auth.me()
      
      // Get all user data
      const [documents, records, profiles] = await Promise.all([
        blink.db.tradeDocuments.list({ where: { userId: user.id } }),
        blink.db.tradeRecords.list({ where: { userId: user.id } }),
        blink.db.companyProfiles.list({ where: { userId: user.id } })
      ])
      
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email
        },
        documents,
        records,
        profiles,
        summary: {
          totalDocuments: documents.length,
          totalRecords: records.length,
          cbamaRecords: records.filter(r => Number(r.isCbamRelevant) > 0).length
        }
      }
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tradeflow-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const deleteAllData = async () => {
    setIsDeleting(true)
    try {
      const user = await blink.auth.me()
      
      // Delete all user data
      const [documents, records, profiles] = await Promise.all([
        blink.db.tradeDocuments.list({ where: { userId: user.id } }),
        blink.db.tradeRecords.list({ where: { userId: user.id } }),
        blink.db.companyProfiles.list({ where: { userId: user.id } })
      ])
      
      // Delete records
      for (const record of records) {
        await blink.db.tradeRecords.delete(record.id)
      }
      
      // Delete documents
      for (const doc of documents) {
        await blink.db.tradeDocuments.delete(doc.id)
      }
      
      // Delete profiles
      for (const profile of profiles) {
        await blink.db.companyProfiles.delete(profile.id)
      }
      
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Error deleting data:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your data, exports, and application preferences
        </p>
      </div>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Data Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Export Data</h3>
                <p className="text-sm text-muted-foreground">
                  Download all your trade data, documents, and analysis results
                </p>
              </div>
            </div>
            <Button
              onClick={exportData}
              disabled={isExporting}
              className="bg-accent hover:bg-accent/90"
            >
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>

          {/* Delete All Data */}
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-red-900">Delete All Data</h3>
                <p className="text-sm text-red-700">
                  Permanently remove all your trade data and analysis results
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              Delete All
            </Button>
          </div>

          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-semibold">Confirm Data Deletion</h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  This action cannot be undone. All your trade documents, records, 
                  analysis results, and company profiles will be permanently deleted.
                </p>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={deleteAllData}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete All Data'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="h-5 w-5" />
            <span>Application Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Version</h4>
                <Badge variant="secondary">v1.0.0</Badge>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Last Updated</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Status</h4>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">All systems operational</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Support</h4>
                <p className="text-sm text-muted-foreground">
                  For technical support, contact our team
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features & Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Features & Capabilities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Document Processing</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Excel (.xlsx, .xls) file support</li>
                <li>• CSV file processing</li>
                <li>• Automatic data extraction</li>
                <li>• Real-time processing status</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">CBAM Analysis</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic CBAM category detection</li>
                <li>• Risk level assessment</li>
                <li>• Compliance scoring</li>
                <li>• Country-based risk analysis</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Trade Flow Visualization</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Interactive country analysis</li>
                <li>• Trade route mapping</li>
                <li>• Value and volume tracking</li>
                <li>• Partner country insights</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Data Management</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Secure data storage</li>
                <li>• Data export capabilities</li>
                <li>• Company profile management</li>
                <li>• Historical data tracking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CBAM Categories Reference */}
      <Card>
        <CardHeader>
          <CardTitle>CBAM Categories Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-green-600 mb-2">Cement</h4>
              <p className="text-sm text-muted-foreground">
                HS codes: 2523, 2507 and related cement products
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-blue-600 mb-2">Steel & Iron</h4>
              <p className="text-sm text-muted-foreground">
                HS codes: 72xx series, steel and iron products
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-purple-600 mb-2">Aluminum</h4>
              <p className="text-sm text-muted-foreground">
                HS codes: 76xx series, aluminum and aluminum products
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-orange-600 mb-2">Fertilizers</h4>
              <p className="text-sm text-muted-foreground">
                HS codes: 31xx series, fertilizers and related products
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-yellow-600 mb-2">Electricity</h4>
              <p className="text-sm text-muted-foreground">
                HS code: 2716, electrical energy and power
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-gray-600 mb-2">Other</h4>
              <p className="text-sm text-muted-foreground">
                Additional carbon-intensive products under review
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}