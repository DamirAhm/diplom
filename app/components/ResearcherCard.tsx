import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { getDictionary } from "../dictionaries"
import type { Locale } from "../types"

interface Researcher {
  id: number
  name: string
  title: { en: string; ru: string }
  photo: string
  profiles: {
    researchgate?: string
    googleScholar?: string
    scopus?: string
    publons?: string
    orcid?: string
  }
}

interface ResearcherCardProps {
  researcher: Researcher
  lang: Locale
}

const ResearcherCard: React.FC<ResearcherCardProps> = ({ researcher, lang }) => {
  const dictionary = getDictionary(lang)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center">
      {researcher.photo ? (
        <Image
          src={researcher.photo || "/placeholder.svg"}
          alt={researcher.name}
          width={200}
          height={200}
          className="rounded-full mb-4"
        />
      ) : (
        <svg className="h-48 w-48 text-gray-400 mb-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
      <h2 className="text-xl font-semibold mb-2 text-center text-gray-900 dark:text-white">{researcher.name}</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">{researcher.title[lang]}</p>
      <div className="flex justify-center space-x-2 mb-4">
        {Object.entries(researcher.profiles).map(
          ([key, value]) =>
            value && (
              <a
                key={key}
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {key}
              </a>
            ),
        )}
      </div>
      <Link href={`/${lang}/researchers/${researcher.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
        {dictionary.researchers.viewProfile}
      </Link>
    </div>
  )
}

export default ResearcherCard

