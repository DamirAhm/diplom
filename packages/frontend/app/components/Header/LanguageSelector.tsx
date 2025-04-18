"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Globe } from "lucide-react"
import type { Locale } from "../../types"

interface LanguageSelectorProps {
  currentLang: Locale
}

export default function LanguageSelector({ currentLang }: LanguageSelectorProps) {
  const pathname = usePathname()
  const otherLang = currentLang === "en" ? "ru" : "en"
  const newPathname = pathname.replace(`/${currentLang}`, `/${otherLang}`)

  return (
    <Link
      href={newPathname}
      className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-background px-2 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted transition-colors"
      title={otherLang === "en" ? "Switch to English" : "Переключиться на русский"}
    >
      <Globe size={16} className="text-primary dark:text-indigo-400" />
      <span>{otherLang.toUpperCase()}</span>
    </Link>
  )
}

