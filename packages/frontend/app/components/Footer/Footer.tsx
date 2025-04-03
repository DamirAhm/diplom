import Link from "next/link"
import type { Locale } from "../../types"
import { getDictionary } from "@/app/dictionaries"

interface FooterProps {
  lang: Locale
}

export default function Footer({ lang }: FooterProps) {
  const dictionary = getDictionary(lang)

  return (
    <footer className="bg-gray-100 dark:bg-primary py-4">
      <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
        <p>{dictionary.footer.copyright}</p>
        <nav className="mt-2">
          <Link href={`/${lang}`} className="text-blue-600 dark:text-blue-400 hover:underline">
            {dictionary.navigation.home}
          </Link>
          {" | "}
          <Link href={`/${lang}/projects`} className="text-blue-600 dark:text-blue-400 hover:underline">
            {dictionary.navigation.projects}
          </Link>
          {" | "}
          <Link href={`/${lang}/publications`} className="text-blue-600 dark:text-blue-400 hover:underline">
            {dictionary.navigation.publications}
          </Link>
          {" | "}
          <Link href={`/${lang}/researchers`} className="text-blue-600 dark:text-blue-400 hover:underline">
            {dictionary.navigation.researchers}
          </Link>
          {" | "}
          <Link href={`/${lang}/sandbox`} className="text-blue-600 dark:text-blue-400 hover:underline">
            {dictionary.navigation.sandbox}
          </Link>
          {" | "}
          <Link href={`/${lang}/partners`} className="text-blue-600 dark:text-blue-400 hover:underline">
            {dictionary.navigation.partners}
          </Link>
          {" | "}
          <Link href={`/${lang}/training`} className="text-blue-600 dark:text-blue-400 hover:underline">
            {dictionary.navigation.training}
          </Link>
        </nav>
      </div>
    </footer>
  )
}

