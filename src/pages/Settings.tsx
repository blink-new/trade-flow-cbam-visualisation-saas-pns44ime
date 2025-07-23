import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Settings as SettingsIcon, User, Database, Download, Trash2 } from 'lucide-react'
import { blink } from '../blink/client'

export function Settings() {
  const handleExportData = async () => {
    try {
      const user = await blink.auth.me()
      
      // Get all user data
      const [companies, documents, tradeRecords] = await Promise.all([
        blink.db.companies.list({ where: { userId: user.id } }),
        blink.db.tradeDocuments.list({ where: { userId: user.id } }),
        blink.db.tradeRecords.list({ where: { userId: user.id } })
      ])

      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          exportDate: new Date().toISOString()
        },
        companies,
        documents,
        tradeRecords
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tradeflow-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const handleDeleteAllData = async () => {
    if (!confirm('Are you sure you want to delete all your trade data? This action cannot be undone.')) {
      return
    }

    try {
      const user = await blink.auth.me()
      
      // Delete all user data
      const [companies, documents, tradeRecords] = await Promise.all([
        blink.db.companies.list({ where: { userId: user.id } }),
        blink.db.tradeDocuments.list({ where: { userId: user.id } }),
        blink.db.tradeRecords.list({ where: { userId: user.id } })
      ])

      // Delete in reverse order to maintain referential integrity
      for (const record of tradeRecords) {
        await blink.db.tradeRecords.delete(record.id)
      }
      
      for (const document of documents) {
        await blink.db.tradeDocuments.delete(document.id)
      }
      
      for (const company of companies) {
        await blink.db.companies.delete(company.id)
      }

      alert('All trade data has been deleted successfully.')
    } catch (error) {
      console.error('Error deleting data:', error)
      alert('Error deleting data. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and data
        </p>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-accent" />
            <span>Account Settings</span>
          </CardTitle>
          <CardDescription>
            Manage your account information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Profile Information</h4>
              <p className="text-sm text-muted-foreground">
                Your account is managed through Blink's authentication system. 
                Profile updates are handled automatically.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground mb-2">Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Email notifications for document processing and CBAM compliance alerts 
                are enabled by default.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-accent" />
            <span>Data Management</span>
          </CardTitle>
          <CardDescription>
            Export or delete your trade data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <h4 className="font-medium text-foreground">Export Data</h4>
                <p className="text-sm text-muted-foreground">
                  Download all your trade data in JSON format
                </p>
              </div>
              <Button onClick={handleExportData} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
              <div>
                <h4 className="font-medium text-red-800">Delete All Data</h4>
                <p className="text-sm text-red-600">
                  Permanently delete all companies, documents, and trade records
                </p>
              </div>
              <Button 
                onClick={handleDeleteAllData} 
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-accent" />
            <span>Application Settings</span>
          </CardTitle>
          <CardDescription>
            Configure application behavior and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">CBAM Detection</h4>
              <p className="text-sm text-muted-foreground">
                Automatic detection of CBAM-relevant products is enabled based on 
                product codes and descriptions.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground mb-2">Data Processing</h4>
              <p className="text-sm text-muted-foreground">
                Documents are processed automatically upon upload with intelligent 
                column mapping and data validation.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground mb-2">Carbon Intensity</h4>
              <p className="text-sm text-muted-foreground">
                Default carbon intensity values are applied based on product categories. 
                You can override these values by providing specific data in your uploads.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About TradeFlow Analytics</CardTitle>
          <CardDescription>
            Version information and support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Built with:</strong> React, TypeScript, Blink SDK</p>
            <p><strong>CBAM Categories:</strong> Cement, Steel, Aluminum, Fertilizers, Electricity</p>
            <p><strong>Supported Formats:</strong> Excel (.xlsx, .xls), CSV</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}