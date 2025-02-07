import Image from "next/image"
import PublicationList from "../../../components/PublicationList"
import { researchersData } from "../../../mock/researchersData"
import type { Locale } from "@/app/types"
import { getDictionary } from "@/app/dictionaries"
import { ExternalLink } from "lucide-react"

interface Researcher {
  id: number
  name: string
  title: { en: string; ru: string }
  photo: string
  bio: { en: string; ru: string }
  profiles: {
    researchgate?: string
    googleScholar?: string
    scopus?: string
    publons?: string
    orcid?: string
  }
  publications: Publication[]
}

interface Publication {
  id: number
  title: { en: string; ru: string }
  link: string
}

const fetchResearcher = async (id: number) => {
  await new Promise((resolve) => {
    setTimeout(() => resolve(null), 500) // Simulate API call
  })

  return researchersData.find((r) => r.id === id)
}

const ResearcherPage = async ({ params: { id, lang } }: { params: { id: string; lang: Locale } }) => {
  const researcher = await fetchResearcher(Number.parseInt(id))
  const dictionary = getDictionary(lang)

  if (!researcher) {
    return <div className="text-center mt-8 text-xl">{dictionary.researchers.notFound}</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {researcher.photo ? (
              <Image
                src={researcher.photo || "/placeholder.svg"}
                alt={researcher.name}
                width={250}
                height={250}
                className="rounded-full mb-4 md:mb-0"
              />
            ) : (
              <div className="w-64 h-64 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4 md:mb-0">
                <svg className="h-32 w-32 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">{researcher.name}</h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">{researcher.title[lang]}</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {Object.entries(researcher.profiles).map(
                  ([key, value]) =>
                    value && (
                      <a
                        key={key}
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        {key}
                        <ExternalLink size={14} className="ml-1" />
                      </a>
                    ),
                )}
              </div>
              <div
                className="prose max-w-none dark:prose-invert text-gray-800 dark:text-gray-200"
                dangerouslySetInnerHTML={{ __html: researcher.bio[lang] }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {dictionary.researchers.significantPublications}
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <PublicationList lang={lang} publications={researcher.publications} />
        </div>
      </div>
    </div>
  )
}

export default ResearcherPage

