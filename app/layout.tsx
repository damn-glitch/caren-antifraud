import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CAREN - AI-Powered Anti-Fraud System",
  description: "Credit Analysis & Risk Evaluation Network - The world's most advanced AI-powered anti-fraud system for banking. Created by Alisher Beisembekov.",
  keywords: ["fraud detection", "AI", "machine learning", "banking", "security", "credit card fraud"],
  authors: [{ name: "Alisher Beisembekov" }],
  openGraph: {
    title: "CAREN - AI-Powered Anti-Fraud System",
    description: "The world's most advanced AI-powered anti-fraud system for banking",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
