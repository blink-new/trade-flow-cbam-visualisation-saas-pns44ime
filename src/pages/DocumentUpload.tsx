import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  X,
  Leaf
} from 'lucide-react'
import { blink } from '../blink/client'

interface UploadedFile {
  file: File
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  records?: number
  cbamaRecords?: number
  error?: string
}

interface TradeRecord {
  productCode: string
  productDescription: string
  originCountry: string
  quantity: number
  unit: string
  value: number
  currency: string
  isCbamRelevant: boolean
  cbamaCategory?: string
}

export function DocumentUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const detectCBAMRelevance = (productCode: string, description: string): { relevant: boolean; category?: string } => {
    const code = productCode.toLowerCase()
    const desc = description.toLowerCase()
    
    // CBAM categories based on EU regulation
    const cbamaCategories = {
      cement: ['2523', '2507', 'cement', 'concrete'],
      steel: ['72', '7301', '7302', '7303', '7304', '7305', '7306', 'steel', 'iron'],
      aluminum: ['76', '7601', '7602', '7603', '7604', '7605', 'aluminum', 'aluminium'],
      fertilizers: ['31', '3102', '3103', '3104', '3105', 'fertilizer', 'urea', 'ammonia'],
      electricity: ['2716', 'electricity', 'power', 'energy']
    }
    
    for (const [category, keywords] of Object.entries(cbamaCategories)) {
      for (const keyword of keywords) {
        if (code.includes(keyword) || desc.includes(keyword)) {
          return { relevant: true, category }
        }
      }
    }
    
    return { relevant: false }
  }

  const processExcelFile = async (file: File): Promise<TradeRecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          const records: TradeRecord[] = jsonData.map((row: any) => {
            // Map common column names (flexible mapping)
            const productCode = row['Product Code'] || row['HS Code'] || row['Code'] || row['Kod'] || ''
            const productDescription = row['Product Description'] || row['Description'] || row['Açıklama'] || row['Ürün'] || ''
            const originCountry = row['Origin Country'] || row['Country'] || row['Ülke'] || row['Menşe'] || ''
            const quantity = parseFloat(row['Quantity'] || row['Miktar'] || row['Amount'] || 0)
            const unit = row['Unit'] || row['Birim'] || 'KG'
            const value = parseFloat(row['Value'] || row['Değer'] || row['Amount'] || 0)
            const currency = row['Currency'] || row['Para Birimi'] || 'USD'
            
            const cbamaCheck = detectCBAMRelevance(productCode, productDescription)
            
            return {
              productCode,
              productDescription,
              originCountry,
              quantity,
              unit,
              value,
              currency,
              isCbamRelevant: cbamaCheck.relevant,
              cbamaCategory: cbamaCheck.category
            }
          })
          
          resolve(records)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  const processFile = async (fileData: UploadedFile) => {
    try {
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileData.id ? { ...f, status: 'processing', progress: 10 } : f)
      )
      
      // Process the Excel file
      const records = await processExcelFile(fileData.file)
      
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileData.id ? { ...f, progress: 50 } : f)
      )
      
      const user = await blink.auth.me()
      
      // Save document record
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await blink.db.tradeDocuments.create({
        id: documentId,
        userId: user.id,
        filename: fileData.file.name,
        status: 'processing',
        uploadedAt: new Date().toISOString(),
        totalRecords: records.length,
        cbamaRecords: records.filter(r => r.isCbamRelevant).length
      })
      
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileData.id ? { ...f, progress: 75 } : f)
      )
      
      // Save trade records
      for (const record of records) {
        await blink.db.tradeRecords.create({
          id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          documentId,
          userId: user.id,
          productCode: record.productCode,
          productDescription: record.productDescription,
          originCountry: record.originCountry,
          quantity: record.quantity,
          unit: record.unit,
          value: record.value,
          currency: record.currency,
          isCbamRelevant: record.isCbamRelevant ? "1" : "0",
          cbamaCategory: record.cbamaCategory || null,
          createdAt: new Date().toISOString()
        })
      }
      
      // Update document status
      await blink.db.tradeDocuments.update(documentId, { status: 'completed' })
      
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileData.id ? { 
          ...f, 
          status: 'completed', 
          progress: 100,
          records: records.length,
          cbamaRecords: records.filter(r => r.isCbamRelevant).length
        } : f)
      )
      
    } catch (error) {
      console.error('Error processing file:', error)
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileData.id ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Processing failed'
        } : f)
      )
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      progress: 0
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: true
  })

  const processAllFiles = async () => {
    setIsProcessing(true)
    const pendingFiles = uploadedFiles.filter(f => f.status === 'pending')
    
    for (const file of pendingFiles) {
      await processFile(file)
    }
    
    setIsProcessing(false)
  }

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Document Upload</h1>
        <p className="text-muted-foreground mt-2">
          Upload trade documents (Excel, CSV) for analysis and CBAM compliance checking
        </p>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Trade Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-accent bg-accent/5' 
                : 'border-gray-300 hover:border-accent hover:bg-accent/5'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium text-accent">Drop files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports Excel (.xlsx, .xls) and CSV files
                </p>
              </div>
            )}
          </div>
          
          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Uploaded Files</h3>
                {uploadedFiles.some(f => f.status === 'pending') && (
                  <Button 
                    onClick={processAllFiles}
                    disabled={isProcessing}
                    className="bg-accent hover:bg-accent/90"
                  >
                    {isProcessing ? 'Processing...' : 'Process All Files'}
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(file.status)}
                        <div>
                          <p className="font-medium">{file.file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(file.status)}>
                          {file.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          disabled={file.status === 'processing'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {file.status === 'processing' && (
                      <div className="space-y-2">
                        <Progress value={file.progress} className="w-full" />
                        <p className="text-xs text-muted-foreground">
                          Processing... {file.progress}%
                        </p>
                      </div>
                    )}
                    
                    {file.status === 'completed' && (
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{file.records} records processed</span>
                        <div className="flex items-center space-x-1">
                          <Leaf className="h-4 w-4 text-green-600" />
                          <span>{file.cbamaRecords} CBAM relevant</span>
                        </div>
                      </div>
                    )}
                    
                    {file.status === 'error' && (
                      <p className="text-sm text-red-600 mt-2">
                        Error: {file.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Info */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Supported File Formats</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Excel files (.xlsx, .xls)</li>
                <li>• CSV files (.csv)</li>
                <li>• Maximum file size: 50MB</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">CBAM Categories Detected</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Cement & Concrete</li>
                <li>• Steel & Iron</li>
                <li>• Aluminum</li>
                <li>• Fertilizers</li>
                <li>• Electricity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}