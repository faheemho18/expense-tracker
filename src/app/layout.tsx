import type { Metadata } from "next"

import { SettingsProvider } from "@/contexts/settings-context"
import { Toaster } from "@/components/ui/toaster"
import { ClientLayout } from "./client-layout"

import "./globals.css"


export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your expenses and create insightful dashboards.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" 
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ClientLayout>
          <SettingsProvider>
            {children}
            <Toaster />
          </SettingsProvider>
        </ClientLayout>
      </body>
    </html>
  )
}
