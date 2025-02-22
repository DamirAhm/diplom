"use client"

import { useState } from "react"
import type { Locale, Publication } from "@/app/types"
import { getDictionary } from "@/app/dictionaries"
import PublicationItem from "@/app/components/PublicationItem"

export type Props = {
  publications: Publication[]
  lang: Locale
}

export const PublicationsTable: React.FC<Props> = ({ publications, lang }) => {
  const dictionary = getDictionary(lang)

  const [sortBy, setSortBy] = useState<"year" | "title">("year")
  const [filterYear, setFilterYear] = useState<number | null>(null)

  const sortedPublications = [...publications].sort((a, b) => {
    if (sortBy === "year") {
      return b.year - a.year
    } else {
      return a.title[lang].localeCompare(b.title[lang])
    }
  })

  const filteredPublications = filterYear
    ? sortedPublications.filter((pub) => pub.year === filterYear)
    : sortedPublications

  const years = Array.from(new Set(publications.map((pub) => pub.year))).sort((a, b) => b - a)

  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <label htmlFor="sortBy" className="mr-2 text-gray-700 dark:text-gray-300">
            {dictionary.publications.sortBy}
          </label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "year" | "title")}
            className="border rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="year">{dictionary.publications.year}</option>
            <option value="title">{dictionary.publications.title}</option>
          </select>
        </div>
        <div>
          <label htmlFor="filterYear" className="mr-2 text-gray-700 dark:text-gray-300">
            {dictionary.publications.filterByYear}
          </label>
          <select
            id="filterYear"
            value={filterYear || ""}
            onChange={(e) => setFilterYear(e.target.value ? Number.parseInt(e.target.value) : null)}
            className="border rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">{dictionary.publications.allYears}</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-8">
        {filteredPublications.map((publication) => (
          <PublicationItem key={publication.id} lang={lang} publication={publication} />
        ))}
      </div>
    </>
  )
}

