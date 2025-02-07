import type React from "react"
import { getDictionary } from "../dictionaries"
import type { Locale } from "../types"

interface Publication {
  id: number
  title: { en: string; ru: string }
  description?: { en: string; ru: string }
  authors: string
  journal: string
  year: number
  link: string
}

interface PublicationItemProps {
  publication: Publication
  lang: Locale
}

const PublicationItem: React.FC<PublicationItemProps> = ({ publication, lang }) => {
  const dictionary = getDictionary(lang)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{publication.title[lang]}</h2>
      {publication.description && (
        <p className="text-gray-700 dark:text-gray-300 mb-3">{publication.description[lang]}</p>
      )}
      <p className="text-gray-600 dark:text-gray-400 mb-2">{publication.authors}</p>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {publication.journal}, {publication.year}
      </p>
      <a
        href={publication.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        {dictionary.publications.viewPublication}
      </a>
    </div>
  )
}

export default PublicationItem

