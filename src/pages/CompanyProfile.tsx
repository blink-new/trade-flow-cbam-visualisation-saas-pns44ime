import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { 
  Building, 
  MapPin, 
  Mail, 
  Phone, 
  Globe,
  Edit,
  Save,
  X
} from 'lucide-react'
import { blink } from '../blink/client'

interface CompanyProfile {
  id: string
  name: string
  address: string
  country: string
  email: string
  phone: string
  website: string
  industry: string
  taxId: string
  description: string
}

export function CompanyProfile() {
  const [profile, setProfile] = useState<CompanyProfile>({
    id: '',
    name: '',
    address: '',
    country: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    taxId: '',
    description: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadCompanyProfile = async () => {
    try {
      const user = await blink.auth.me()
      
      // Try to load existing profile
      const profiles = await blink.db.companyProfiles.list({
        where: { userId: user.id },
        limit: 1
      })
      
      if (profiles.length > 0) {
        setProfile(profiles[0])
      } else {
        // Create default profile
        setProfile(prev => ({
          ...prev,
          id: `profile_${Date.now()}`,
          email: user.email || ''
        }))
        setIsEditing(true) // Start in edit mode if no profile exists
      }
    } catch (error) {
      console.error('Error loading company profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanyProfile()
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const user = await blink.auth.me()
      
      const profileData = {
        ...profile,
        userId: user.id,
        updatedAt: new Date().toISOString()
      }
      
      // Check if profile exists
      const existingProfiles = await blink.db.companyProfiles.list({
        where: { userId: user.id },
        limit: 1
      })
      
      if (existingProfiles.length > 0) {
        await blink.db.companyProfiles.update(existingProfiles[0].id, profileData)
      } else {
        await blink.db.companyProfiles.create({
          ...profileData,
          createdAt: new Date().toISOString()
        })
      }
      
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof CompanyProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Company Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your company information and trade compliance details
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={saveProfile}
                disabled={saving}
                className="bg-accent hover:bg-accent/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-accent hover:bg-accent/90"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Company Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter company name"
                />
              ) : (
                <p className="text-lg font-medium">{profile.name || 'Not specified'}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              {isEditing ? (
                <Input
                  id="industry"
                  value={profile.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  placeholder="e.g., Manufacturing, Trading, etc."
                />
              ) : (
                <p className="text-lg font-medium">{profile.industry || 'Not specified'}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            {isEditing ? (
              <textarea
                id="description"
                value={profile.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of your company and business activities"
                className="w-full p-3 border rounded-lg resize-none h-24"
              />
            ) : (
              <p className="text-muted-foreground">
                {profile.description || 'No description provided'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Contact Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="company@example.com"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p>{profile.email || 'Not specified'}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>{profile.phone || 'Not specified'}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            {isEditing ? (
              <Input
                id="website"
                value={profile.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.company.com"
              />
            ) : (
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                {profile.website ? (
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {profile.website}
                  </a>
                ) : (
                  <p>Not specified</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address & Legal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Address & Legal Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="address">Business Address</Label>
            {isEditing ? (
              <textarea
                id="address"
                value={profile.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Street address, city, state/province, postal code"
                className="w-full p-3 border rounded-lg resize-none h-20"
              />
            ) : (
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <p className="whitespace-pre-line">{profile.address || 'Not specified'}</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              {isEditing ? (
                <Input
                  id="country"
                  value={profile.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Country of operation"
                />
              ) : (
                <p className="font-medium">{profile.country || 'Not specified'}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID / Registration Number</Label>
              {isEditing ? (
                <Input
                  id="taxId"
                  value={profile.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  placeholder="Tax identification number"
                />
              ) : (
                <p className="font-medium">{profile.taxId || 'Not specified'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Status */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Profile Completion</p>
              <p className="text-sm text-muted-foreground">
                Complete your profile for better trade analysis
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {(() => {
                const fields = [
                  profile.name, profile.industry, profile.email, 
                  profile.address, profile.country, profile.taxId
                ]
                const completedFields = fields.filter(field => field && field.trim()).length
                const completionPercentage = Math.round((completedFields / fields.length) * 100)
                
                return (
                  <>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-accent">{completionPercentage}%</p>
                      <p className="text-xs text-muted-foreground">Complete</p>
                    </div>
                    <Badge 
                      className={
                        completionPercentage >= 80 
                          ? 'bg-green-100 text-green-800'
                          : completionPercentage >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {completionPercentage >= 80 ? 'Complete' : 
                       completionPercentage >= 50 ? 'Partial' : 'Incomplete'}
                    </Badge>
                  </>
                )
              })()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}