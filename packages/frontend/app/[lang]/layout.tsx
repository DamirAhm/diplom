import Footer from "../components/Footer/Footer"
import Header from "../components/Header/Header"
import type { Locale } from "../types"
import { ThemeProvider } from "../components/ThemeProvider"
import { cookies } from "next/headers"

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "ru" }]
}

interface LangLayoutProps {
  children: React.ReactNode
  params: {
    lang: Locale
  }
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = params
  const cookieStore = await cookies()
  const theme = cookieStore.get("theme")

  return (
    <ThemeProvider storedTheme={theme?.value === 'dark' ? 'dark' : 'light'}>
      <div className="flex min-h-screen flex-col">
        <Header lang={lang} />
        <main className="flex-1">
          {children}
        </main>
        <Footer lang={lang} />
      </div>
    </ThemeProvider>
  )
}

