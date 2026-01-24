import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard - CAREN Anti-Fraud System",
  description: "AI-powered fraud detection dashboard by Alisher Beisembekov",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
