"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getCookie, setCookie } from "cookies-next"

type Theme = "light" | "dark"

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children, storedTheme }: React.PropsWithChildren<{ storedTheme: Theme }>) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (storedTheme) {
      return storedTheme
    } else if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      return prefersDark ? "dark" : "light"
    }

    return 'dark'
  })

  useEffect(() => {
    setCookie("theme", theme, { maxAge: 60 * 60 * 24 * 365 }) // Set cookie for 1 year
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

