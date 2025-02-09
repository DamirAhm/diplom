import Header from "../components/Header/Header"
import Footer from "../components/Footer/Footer"
import type { Locale } from "../types"
import { ThemeProvider } from "../components/ThemeProvider"
import { cookies } from "next/headers"

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "ru" }]
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: Locale }
}) {
  const { lang } = await params || {}
  const cookieStore = await cookies()
  const theme = cookieStore.get("theme")

  return (
    <ThemeProvider storedTheme={theme?.value === 'dark' ? 'dark' : 'light'}>
      <div className="min-h-screen flex flex-col">
        <Header lang={lang} />
        <main className="flex-grow">{children}</main>
        <Footer lang={lang} />
      </div>
    </ThemeProvider>
  )
}

