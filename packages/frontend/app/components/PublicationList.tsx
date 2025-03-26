import type React from "react"
import type { Locale, Publication } from "../types"
import { ExternalLink } from "lucide-react"

interface PublicationListProps {
  publications: Publication[]
  lang: Locale
}

const PublicationList: React.FC<PublicationListProps> = ({ publications, lang }) => {
  return (
    <ul className="space-y-4">
      {publications.map((publication) => (
        <li key={publication.id} className="flex items-start">
          <div className="flex-shrink-0 w-4 h-4 mt-1 mr-3 bg-blue-500 rounded-full"></div>
          <a
            href={publication.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
          >
            {typeof publication.title === 'object' ? publication.title[lang] : publication.title}
            <ExternalLink size={14} className="ml-1 inline" />
          </a>
        </li>
      ))}
    </ul>
  )
}

export default PublicationList

