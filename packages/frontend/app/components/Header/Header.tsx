"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Locale } from "../../types";
import LanguageSelector from "./LanguageSelector";
import { getDictionary } from "@/app/dictionaries";
import { ThemeToggle } from "../ThemeToggle";
import { Menu, X } from "lucide-react";
import { EtuLogo } from "./EtuLogo";

interface HeaderProps {
  lang: Locale;
}

export default function Header({ lang }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dictionary = getDictionary(lang);
  const pathname = usePathname();

  const menuItems = [
    { key: "projects", label: dictionary.navigation.projects },
    { key: "publications", label: dictionary.navigation.publications },
    { key: "researchers", label: dictionary.navigation.researchers },
    { key: "sandbox", label: dictionary.navigation.sandbox },
    { key: "partners", label: dictionary.navigation.partners },
    { key: "training", label: dictionary.navigation.training },
  ];

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header
      className={`sticky bg-white dark:bg-card bg-opacity-50 top-0 z-40 w-full transition-all duration-200 ${
        scrolled
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 sm:gap-4 items-center">
            <a
              href="https://etu.ru"
              className="fill-primary dark:fill-[#818cf8] scale-75 sm:scale-100"
            >
              <EtuLogo />
            </a>
            <Link
              href={`/${lang}`}
              className="flex font-heading text-lg sm:text-2xl font-bold text-primary dark:text-indigo-400 transition-colors hover:text-primary/80 dark:hover:text-indigo-300"
            >
              <span>
                {dictionary.common.laboratoryName
                  .split(" ")
                  .slice(0, -1)
                  .join(" ")}
                &nbsp;
              </span>
              <span className="hidden sm:block">
                {dictionary.common.laboratoryName.split(" ").slice(-1).at(-1)}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4 lg:hidden">
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

          <nav className="hidden lg:block">
            <ul className="flex items-between">
              {menuItems.map((item) => {
                const isActive =
                  pathname === `/${lang}/${item.key}` ||
                  pathname.startsWith(`/${lang}/${item.key}/`);
                return (
                  <li key={item.key}>
                    <Link
                      href={`/${lang}/${item.key}`}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "text-primary dark:text-indigo-400 font-semibold"
                          : "text-foreground/70 hover:text-primary dark:hover:text-indigo-400"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <div className="h-4 w-px bg-border mx-1"></div>
            <LanguageSelector currentLang={lang} />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[59px] z-40 transition-all duration-200 ease-in-out bg-white dark:bg-gray-900 border-t border-border dark:border-indigo-900/30 shadow-lg">
          <nav className="container mx-auto px-4 py-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive =
                  pathname === `/${lang}/${item.key}` ||
                  pathname.startsWith(`/${lang}/${item.key}/`);
                return (
                  <li
                    key={item.key}
                    className="border-b border-border/40 dark:border-indigo-900/20 last:border-0"
                  >
                    <Link
                      href={`/${lang}/${item.key}`}
                      className={`block py-3 transition-colors ${
                        isActive
                          ? "text-primary dark:text-indigo-400 font-semibold"
                          : "text-foreground/70 hover:text-primary dark:hover:text-indigo-400"
                      }`}
                      onClick={toggleMenu}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
