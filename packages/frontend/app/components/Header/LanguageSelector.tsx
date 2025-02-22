"use client"

import { useRouter, usePathname } from "next/navigation"
import type { Locale } from "../../types"

interface LanguageSelectorProps {
  currentLang: Locale
}

export default function LanguageSelector({ currentLang }: LanguageSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLanguageChange = (newLang: string) => {
    const newPathname = pathname.replace(`/${currentLang}`, `/${newLang}`)
    router.push(newPathname)
  }

  return (
    <select
      value={currentLang}
      onChange={(e) => handleLanguageChange(e.target.value)}
      className="bg-blue-700 dark:bg-gray-700 text-white px-2 py-1 rounded hover:bg-blue-800 dark:hover:bg-gray-600 transition-colors"
    >
      <option value="en">En</option>
      <option value="ru">Ру</option>
    </select>
  )
}

