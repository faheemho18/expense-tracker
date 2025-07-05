"use client"

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, RotateCcw, Key, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAPIKeyMonitor } from '@/hooks/use-api-key-monitor';
import { useToast } from '@/hooks/use-toast';

export function APIKeyMonitor() {
  const { data, isLoading, error, refresh, resetKeys } = useAPIKeyMonitor();
  const { toast } = useToast();

  const handleRefresh = () => {
    refresh();
    toast({
      title: "Status Refreshed",
      description: "API key status has been updated.",
    });
  };

  const handleReset = () => {
    resetKeys();
    toast({
      title: "Keys Reset",
      description: "All API keys have been reset to active status.",
    });
  };

  const formatLastError = (errorTime?: number) => {
    if (!errorTime) return 'Never';
    const date = new Date(errorTime);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Manager
          </CardTitle>
          <CardDescription>
            Loading API key status...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Manager
          </CardTitle>
          <CardDescription>
            Monitor and manage Google AI API key rotation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load API key status: {error}
            </AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Manager
          </CardTitle>
          <CardDescription>
            No API key data available
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Key Manager
          <Badge variant={data.manager === 'active' ? 'default' : 'secondary'}>
            {data.manager}
          </Badge>
        </CardTitle>
        <CardDescription>
          Monitor and manage Google AI API key rotation for cost optimization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{data.activeKeys}</div>
            <div className="text-sm text-muted-foreground">Active Keys</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.keys}</div>
            <div className="text-sm text-muted-foreground">Total Keys</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.totalRequests || 0}</div>
            <div className="text-sm text-muted-foreground">Total Requests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.currentKeyIndex + 1}</div>
            <div className="text-sm text-muted-foreground">Current Key</div>
          </div>
        </div>

        {/* Status Alert */}
        {!data.hasAvailableKeys && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No API keys are currently available! All keys may have exceeded their quota.
              Try resetting the keys or add more API keys to your environment variables.
            </AlertDescription>
          </Alert>
        )}

        {/* Key Details */}
        {data.keyDetails && data.keyDetails.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Key Details</h4>
            <div className="space-y-3">
              {data.keyDetails.map((key, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {key.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <div className="font-mono text-sm">{key.key}</div>
                      {key.lastError && (
                        <div className="text-xs text-muted-foreground">
                          Last error: {key.lastError}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={key.isActive ? 'default' : 'destructive'}>
                      {key.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {key.requestCount} requests | {key.failureCount} failures
                    </div>
                    {key.lastErrorTime && (
                      <div className="text-xs text-muted-foreground">
                        Failed: {formatLastError(key.lastErrorTime)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All Keys
          </Button>
        </div>

        {/* Environment Variables Guide */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Environment Variables</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Add these to your .env.local file:</div>
            <div className="font-mono bg-muted p-2 rounded">
              GOOGLE_AI_API_KEY_1=your_first_api_key<br />
              GOOGLE_AI_API_KEY_2=your_second_api_key<br />
              GOOGLE_AI_API_KEY_3=your_third_api_key
            </div>
            <div className="mt-2">
              The system will automatically rotate between available keys when one runs out of quota.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}