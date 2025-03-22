import type React from "react"
import Link from "next/link"
import { getDictionary } from "../dictionaries"
import type { Locale } from "../types"
import { ImageWithFallback } from "./ImageWithFallback"

interface Researcher {
  id: number
  name: { en: string; ru: string }
  lastName: { en: string; ru: string }
  position: { en: string; ru: string }
  photo: string
  totalCitations: number
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
    <div className="bg-white dark:bg-primary rounded-lg shadow-md p-6 flex flex-col items-center">
      <ImageWithFallback
        src={researcher.photo}
        alt={`${researcher.name[lang]} ${researcher.lastName[lang]}`}
        width={200}
        height={200}
        className="rounded-full mb-4"
      />
      <h2 className="text-xl font-semibold mb-2 text-center text-gray-900 dark:text-white">
        {researcher.name[lang]} {researcher.lastName[lang]}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">{researcher.position[lang]}</p>
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
      <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
        {dictionary.publications.citations}: {researcher.totalCitations}
      </p>
      <Link href={`/${lang}/researchers/${researcher.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
        {dictionary.researchers.viewProfile}
      </Link>
    </div>
  )
}

export default ResearcherCard

