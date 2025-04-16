"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import type { Locale } from "../../types"
import LanguageSelector from "./LanguageSelector"
import { getDictionary } from "@/app/dictionaries"
import { ThemeToggle } from "../ThemeToggle"
import { Menu, X, ChevronDown } from "lucide-react"

interface HeaderProps {
  lang: Locale
}

export default function Header({ lang }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
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

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [scrolled])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-200 ${scrolled
      ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm"
      : "bg-transparent"
      }`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href={`/${lang}`} className="font-heading text-2xl font-bold text-primary dark:text-secondary transition-colors hover:text-primary/80 dark:hover:text-secondary/80">
            {dictionary.common.laboratoryName}
          </Link>

          <div className="flex items-center gap-4 md:hidden">
            <ThemeToggle />
            <LanguageSelector currentLang={lang} />
            <button
              onClick={toggleMenu}
              className="text-foreground focus:outline-none rounded-md"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <nav className="hidden md:block">
            <ul className="flex items-center gap-1">
              {menuItems.map((item) => {
                const isActive = pathname === `/${lang}/${item.key}` || pathname.startsWith(`/${lang}/${item.key}/`)
                return (
                  <li key={item.key}>
                    <Link
                      href={`/${lang}/${item.key}`}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                        ? "text-primary dark:text-secondary font-semibold"
                        : "text-foreground/70 hover:text-primary dark:hover:text-secondary"
                        }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              }
              )}
            </ul>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <div className="h-4 w-px bg-border mx-1"></div>
            <LanguageSelector currentLang={lang} />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[57px] z-40 transition-all duration-200 ease-in-out bg-white dark:bg-gray-900 border-t border-border shadow-lg">
          <nav className="container mx-auto px-4 py-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === `/${lang}/${item.key}` || pathname.startsWith(`/${lang}/${item.key}/`)
                return (
                  <li key={item.key} className="border-b border-border/40 last:border-0">
                    <Link
                      href={`/${lang}/${item.key}`}
                      className={`block py-3 transition-colors ${isActive
                        ? "text-primary dark:text-secondary font-semibold"
                        : "text-foreground/70 hover:text-primary dark:hover:text-secondary"
                        }`}
                      onClick={toggleMenu}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              }
              )}
            </ul>
          </nav>
        </div>
      )}
    </header>
  )
}

