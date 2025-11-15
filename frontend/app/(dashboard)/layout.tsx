import type React from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        <DashboardHeader />

        <main className="flex-1 bg-white dark:bg-gray-900">{children}</main>
      </div>
    </div>
  )
}
