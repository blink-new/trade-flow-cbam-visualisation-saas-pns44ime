import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Building, Edit, Save, X } from 'lucide-react'
import { blink } from '../blink/client'

export function CompanyProfile() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const loadCompanies = async () => {
    try {
      const user = await blink.auth.me()
      const companiesList = await blink.db.companies.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setCompanies(companiesList)
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  const handleEdit = (company: any) => {
    setEditingId(company.id)
    setEditName(company.name)
  }

  const handleSave = async (companyId: string) => {
    try {
      await blink.db.companies.update(companyId, {
        name: editName.trim()
      })
      setEditingId(null)
      setEditName('')
      loadCompanies()
    } catch (error) {
      console.error('Error updating company:', error)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditName('')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Company Profile</h1>
        <p className="text-muted-foreground">
          Manage your company information and trade data organization
        </p>
      </div>

      {companies.length > 0 ? (
        <div className="space-y-4">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building className="w-8 h-8 text-accent" />
                    <div>
                      {editingId === company.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-64"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSave(company.id)}
                            disabled={!editName.trim()}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold text-foreground">
                            {company.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(company.createdAt).toLocaleDateString()}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  {editingId !== company.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(company)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Companies Found</h3>
            <p className="text-muted-foreground mb-4">
              Upload trade documents to automatically create company profiles
            </p>
          </CardContent>
        </Card>
      )}

      {/* Company Statistics */}
      {companies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Company Overview</CardTitle>
            <CardDescription>
              Summary of your registered companies and their trade activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{companies.length}</p>
                <p className="text-sm text-muted-foreground">Total Companies</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {companies.filter(c => c.name !== 'Default Company').length}
                </p>
                <p className="text-sm text-muted-foreground">Named Companies</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {companies.filter(c => c.name === 'Default Company').length}
                </p>
                <p className="text-sm text-muted-foreground">Default Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}