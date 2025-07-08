"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Cloud, 
  HardDrive, 
  Download, 
  Upload, 
  Check, 
  X, 
  AlertCircle, 
  RefreshCw,
  Database,
  Wifi,
  WifiOff
} from "lucide-react"
import { migrateData } from "@/lib/data-migration"
import { runHealthCheck } from "@/lib/supabase-test"
import { dataService } from "@/lib/supabase-data-service"
import { useDataSourceStatus, useDataSync } from "@/hooks/use-supabase-data"
import { SyncControls } from "@/components/sync/sync-status-indicator"
import { useSettings } from "@/contexts/settings-context"

interface MigrationStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'error'
  error?: string
}

export function DataMigration() {
  const { 
    isRealtimeSyncEnabled, 
    isRealtimeSyncActive, 
    enableRealtimeSync, 
    disableRealtimeSync 
  } = useSettings()
  
  const [migrationSteps, setMigrationSteps] = useState<MigrationStep[]>([
    {
      id: 'health-check',
      title: 'Supabase Health Check',
      description: 'Verify database connection and schema',
      status: 'pending'
    },
    {
      id: 'accounts',
      title: 'Migrate Accounts',
      description: 'Transfer account data to Supabase',
      status: 'pending'
    },
    {
      id: 'categories',
      title: 'Migrate Categories',
      description: 'Transfer category data to Supabase',
      status: 'pending'
    },
    {
      id: 'themes',
      title: 'Migrate Theme',
      description: 'Transfer theme settings to Supabase',
      status: 'pending'
    },
    {
      id: 'expenses',
      title: 'Migrate Expenses',
      description: 'Transfer all expense records to Supabase',
      status: 'pending'
    }
  ])

  const [isRunning, setIsRunning] = useState(false)
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [dataSource, setDataSource] = useState<'localStorage' | 'supabase'>('localStorage')
  
  const sourceStatus = useDataSourceStatus()
  const { loading: syncLoading, error: syncError, syncAll } = useDataSync()

  // Check health status on component mount
  useEffect(() => {
    checkHealth()
  }, [])

  const checkHealth = async () => {
    try {
      const result = await runHealthCheck()
      setHealthStatus(result)
    } catch (error) {
      console.error('Health check failed:', error)
    }
  }

  const updateStep = (id: string, updates: Partial<MigrationStep>) => {
    setMigrationSteps(prev => prev.map(step => 
      step.id === id ? { ...step, ...updates } : step
    ))
  }

  const runMigration = async () => {
    setIsRunning(true)
    
    try {
      // Step 1: Health Check
      updateStep('health-check', { status: 'running' })
      await checkHealth()
      
      if (!healthStatus?.overall) {
        updateStep('health-check', { 
          status: 'error', 
          error: 'Supabase health check failed. Please check your configuration.' 
        })
        return
      }
      
      updateStep('health-check', { status: 'completed' })
      
      // Step 2-5: Run the actual migration
      updateStep('accounts', { status: 'running' })
      updateStep('categories', { status: 'running' })
      updateStep('themes', { status: 'running' })
      updateStep('expenses', { status: 'running' })
      
      await migrateData()
      
      // Mark all as completed (in real scenario, we'd track each step individually)
      updateStep('accounts', { status: 'completed' })
      updateStep('categories', { status: 'completed' })
      updateStep('themes', { status: 'completed' })
      updateStep('expenses', { status: 'completed' })
      
    } catch (error) {
      console.error('Migration failed:', error)
      const currentRunning = migrationSteps.find(s => s.status === 'running')
      if (currentRunning) {
        updateStep(currentRunning.id, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    } finally {
      setIsRunning(false)
    }
  }

  const toggleDataSource = () => {
    const newSource = dataSource === 'localStorage' ? 'supabase' : 'localStorage'
    setDataSource(newSource)
    dataService.updateConfig({ primarySource: newSource })
  }

  const exportData = () => {
    // Get all localStorage data
    const data = {
      expenses: JSON.parse(localStorage.getItem('expenses') || '[]'),
      categories: JSON.parse(localStorage.getItem('categories') || '[]'),
      accounts: JSON.parse(localStorage.getItem('accounts') || '[]'),
      theme: JSON.parse(localStorage.getItem('app-theme') || 'null'),
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const completedSteps = migrationSteps.filter(s => s.status === 'completed').length
  const progress = (completedSteps / migrationSteps.length) * 100

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Source Status
              </CardTitle>
              <CardDescription>
                Current data storage and synchronization status
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={isRunning}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5" />
              <div>
                <div className="font-medium">Local Storage</div>
                <div className="text-sm text-muted-foreground">
                  {sourceStatus.localStorageAvailable ? 'Available' : 'Not Available'}
                </div>
              </div>
              <Badge variant={sourceStatus.localStorageAvailable ? 'default' : 'destructive'}>
                {sourceStatus.localStorageAvailable ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              {sourceStatus.supabaseAvailable ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
              <div>
                <div className="font-medium">Supabase</div>
                <div className="text-sm text-muted-foreground">
                  {sourceStatus.supabaseAvailable ? 'Connected' : 'Not Connected'}
                </div>
              </div>
              <Badge variant={sourceStatus.supabaseAvailable ? 'default' : 'destructive'}>
                {sourceStatus.supabaseAvailable ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </Badge>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Primary Data Source</div>
              <div className="text-sm text-muted-foreground">
                Currently using {sourceStatus.currentSource}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={toggleDataSource}
              disabled={!sourceStatus.supabaseAvailable}
            >
              Switch to {dataSource === 'localStorage' ? 'Supabase' : 'Local Storage'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Sync Section */}
      {sourceStatus.supabaseAvailable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Real-time Synchronization
            </CardTitle>
            <CardDescription>
              Enable real-time data sync across all your devices for instant updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">Sync Status</div>
                <div className="text-sm text-muted-foreground">
                  Real-time sync is {isRealtimeSyncEnabled ? 'enabled' : 'disabled'}
                  {isRealtimeSyncActive && ' and active'}
                </div>
              </div>
              <SyncControls />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Enable Real-time Sync</div>
                <div className="text-sm text-muted-foreground">
                  Automatically sync changes across all your devices
                </div>
              </div>
              <Button
                variant={isRealtimeSyncEnabled ? "destructive" : "default"}
                onClick={isRealtimeSyncEnabled ? disableRealtimeSync : enableRealtimeSync}
                disabled={!sourceStatus.supabaseAvailable}
              >
                {isRealtimeSyncEnabled ? 'Disable' : 'Enable'} Sync
              </Button>
            </div>

            {isRealtimeSyncEnabled && (
              <Alert>
                <Wifi className="h-4 w-4" />
                <AlertTitle>Real-time Sync Active</AlertTitle>
                <AlertDescription>
                  Your data will automatically sync across all devices when changes are made.
                  You can see the sync status in the header bar.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Migration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Migrate to Supabase
          </CardTitle>
          <CardDescription>
            Transfer your local data to Supabase for cloud storage and multi-device access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sourceStatus.supabaseAvailable && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Supabase Not Available</AlertTitle>
              <AlertDescription>
                Please configure your Supabase environment variables before migrating.
                Check your .env.local file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
              </AlertDescription>
            </Alert>
          )}

          {healthStatus && !healthStatus.overall && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertTitle>Configuration Issues</AlertTitle>
              <AlertDescription className="space-y-2">
                {!healthStatus.environment.success && !healthStatus.client.success && (
                  <div className="space-y-1">
                    <div>• {healthStatus.environment.message}</div>
                    {healthStatus.environment.details?.instructions && (
                      <div className="text-xs bg-destructive/10 p-2 rounded border">
                        <strong>Solution:</strong> {healthStatus.environment.details.instructions}
                      </div>
                    )}
                    {healthStatus.environment.details?.environment === 'vercel' && (
                      <div className="text-xs text-muted-foreground">
                        <strong>Steps for Vercel:</strong>
                        <ol className="list-decimal list-inside mt-1 space-y-0.5">
                          <li>Go to Vercel Dashboard → Your Project → Settings</li>
                          <li>Click "Environment Variables"</li>
                          <li>Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                          <li>Set scope to Production, Preview, and Development</li>
                          <li>Redeploy this branch</li>
                        </ol>
                      </div>
                    )}
                    {healthStatus.environment.details?.deploymentGuide && (
                      <div className="text-xs">
                        <a 
                          href={healthStatus.environment.details.deploymentGuide} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          📖 Deployment Guide →
                        </a>
                      </div>
                    )}
                  </div>
                )}
                {!healthStatus.environment.success && healthStatus.client.success && (
                  <div>• Environment validation failed, but client is working (this is normal in browser context)</div>
                )}
                {!healthStatus.connection.success && (healthStatus.environment.success || healthStatus.client.success) && (
                  <div>• {healthStatus.connection.message}</div>
                )}
                {!healthStatus.schema.success && healthStatus.connection.success && (
                  <div>• {healthStatus.schema.message}</div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Migration Progress</span>
                <span className="text-sm text-muted-foreground">{completedSteps}/{migrationSteps.length}</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="space-y-3">
            {migrationSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex-shrink-0">
                  {step.status === 'completed' && <Check className="h-5 w-5 text-green-500" />}
                  {step.status === 'error' && <X className="h-5 w-5 text-red-500" />}
                  {step.status === 'running' && <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />}
                  {step.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-muted" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{step.title}</div>
                  <div className="text-sm text-muted-foreground">{step.description}</div>
                  {step.error && (
                    <div className="text-sm text-red-500 mt-1">{step.error}</div>
                  )}
                </div>
                <Badge variant={
                  step.status === 'completed' ? 'default' :
                  step.status === 'error' ? 'destructive' :
                  step.status === 'running' ? 'secondary' : 'outline'
                }>
                  {step.status}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={runMigration}
              disabled={!sourceStatus.supabaseAvailable || isRunning}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isRunning ? 'Migrating...' : 'Start Migration'}
            </Button>
            <Button
              variant="outline"
              onClick={syncAll}
              disabled={syncLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
              Sync All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export, import, and manage your expense data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" disabled>
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Data Safety</AlertTitle>
            <AlertDescription>
              Your local data will be preserved during migration. We recommend exporting a backup before proceeding.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}