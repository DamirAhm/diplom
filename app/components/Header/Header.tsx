"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import type { Locale } from "../../types"
import LanguageSelector from "./LanguageSelector"
import { getDictionary } from "@/app/dictionaries"
import { ThemeToggle } from "../ThemeToggle"
import { Menu, X } from "lucide-react"

interface HeaderProps {
  lang: Locale
}

export default function Header({ lang }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const dictionary = getDictionary(lang)
  const pathname = usePathname()

  const menuItems = [
    { key: "projects", label: dictionary.navigation.projects },
    { key: "publications", label: dictionary.navigation.publications },
    { key: "researchers", label: dictionary.navigation.researchers },
    { key: "sandbox", label: dictionary.navigation.sandbox },
    { key: "partners", label: dictionary.navigation.partners },
    { key: "training", label: dictionary.navigation.training },
  ]

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <header className="bg-blue-600 dark:bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href={`/${lang}`} className="text-2xl font-bold">
            ETU CAD Laboratory
          </Link>
          <div className="flex items-center space-x-4 md:hidden">
            <ThemeToggle />
            <LanguageSelector currentLang={lang} />
            <button onClick={toggleMenu} className="text-white focus:outline-none">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          <nav className="hidden md:block">
            <ul className="flex space-x-4">
              {menuItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={`/${lang}/${item.key}`}
                    className={`hover:text-blue-200 dark:hover:text-blue-400 transition-colors ${
                      pathname === `/${lang}/${item.key}` || pathname.startsWith(`/${lang}/${item.key}/`)
                        ? "text-blue-200 dark:text-blue-400 font-semibold"
                        : "text-white dark:text-gray-300"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <LanguageSelector currentLang={lang} />
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <nav className="px-4 pt-2 pb-4 bg-blue-500 dark:bg-gray-700">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={`/${lang}/${item.key}`}
                    className={`block py-2 hover:text-blue-200 dark:hover:text-blue-400 transition-colors ${
                      pathname === `/${lang}/${item.key}` || pathname.startsWith(`/${lang}/${item.key}/`)
                        ? "text-blue-200 dark:text-blue-400 font-semibold"
                        : "text-white dark:text-gray-300"
                    }`}
                    onClick={toggleMenu}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  )
}

