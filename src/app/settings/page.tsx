
"use client"

import { AppLayout } from "@/components/app-layout"
import { ManageAccounts } from "@/components/settings/manage-accounts"
import { ManageCategories } from "@/components/settings/manage-categories"
import { DataMigration } from "@/components/settings/data-migration"
import { APIKeyMonitor } from "@/components/settings/api-key-monitor"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <Tabs defaultValue="categories" className="space-y-4">
          <TabsList>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="migration">Data Migration</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Manage Categories</CardTitle>
                <CardDescription>
                  Define your expense categories, set icons and colors, and
                  assign monthly thresholds.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ManageCategories />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <CardTitle>Manage Accounts</CardTitle>
                <CardDescription>
                  Define your payment accounts and their owners.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ManageAccounts />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="migration">
            <DataMigration />
          </TabsContent>
          <TabsContent value="api-keys">
            <APIKeyMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
