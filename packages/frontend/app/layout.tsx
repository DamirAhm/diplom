import "./globals.css"
import { Inter } from "next/font/google"
import { cookies } from "next/headers"
import type React from "react" // Import React

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const theme = cookieStore.get("theme")

  return (
    <html lang="en" className={theme?.value === "dark" ? "dark" : ""}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}

