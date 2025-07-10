"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  HardDrive, 
  Download, 
  X, 
  AlertCircle, 
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
  Check
} from "lucide-react"
import { runHealthCheck } from "@/lib/supabase-test"
import { useDataSourceStatus, useDataSync } from "@/hooks/use-supabase-data"
import { AutoSyncStatus } from "@/components/settings/auto-sync-status"
import { autoSyncManager } from "@/lib/auto-sync-manager"

export function DataMigration() {
  const [healthStatus, setHealthStatus] = useState<any>(null)
  
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
          
          <div>
            <div className="font-medium">Primary Data Source</div>
            <div className="text-sm text-muted-foreground">
              Currently using {sourceStatus.currentSource} with automatic synchronization
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automatic Sync Status Section */}
      {sourceStatus.supabaseAvailable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Automatic Synchronization
            </CardTitle>
            <CardDescription>
              Your data syncs automatically across all devices - no setup required
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AutoSyncStatus />
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Force Sync</div>
                <div className="text-sm text-muted-foreground">
                  Manually trigger immediate sync (optional)
                </div>
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await autoSyncManager.forceSync()
                    console.log('Force sync completed')
                  } catch (error) {
                    console.error('Force sync failed:', error)
                  }
                }}
                disabled={!sourceStatus.supabaseAvailable}
              >
                Sync Now
              </Button>
            </div>

            <Alert>
              <Wifi className="h-4 w-4" />
              <AlertTitle>Always On</AlertTitle>
              <AlertDescription>
                Automatic sync runs in the background. Your changes are saved locally instantly 
                and uploaded to the cloud when you're online.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting Section */}
      {healthStatus && !healthStatus.overall && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Connection Troubleshooting
            </CardTitle>
            <CardDescription>
              Resolve Supabase configuration issues
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export your data and manage sync operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Backup
            </Button>
            <Button
              variant="outline"
              onClick={syncAll}
              disabled={syncLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
              Force Sync
            </Button>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Automatic Sync Active</AlertTitle>
            <AlertDescription>
              Your data syncs automatically in the background. Export creates a local backup file, 
              and Force Sync manually triggers immediate synchronization.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}