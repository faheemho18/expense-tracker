
"use client"

import { AppLayout } from "@/components/app-layout"
import { ManageAccountTypes } from "@/components/settings/manage-account-types"
import { ManageCategories } from "@/components/settings/manage-categories"
import {
  Card,
  CardContent,
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
            <TabsTrigger value="account-types">Account Types</TabsTrigger>
          </TabsList>
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Manage Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ManageCategories />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="account-types">
            <Card>
              <CardHeader>
                <CardTitle>Manage Account Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ManageAccountTypes />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
