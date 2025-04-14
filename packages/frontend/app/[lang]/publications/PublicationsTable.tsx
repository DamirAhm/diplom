"use client"

import { useState, useEffect } from "react"
import type { Locale, Publication, Author } from "@/app/types"
import { getDictionary } from "@/app/dictionaries"
import PublicationItem from "@/app/components/PublicationItem"
import { Search } from "lucide-react"

export type Props = {
  publications: Publication[]
  lang: Locale
}

export const PublicationsTable: React.FC<Props> = ({ publications, lang }) => {
  const dictionary = getDictionary(lang)
  const [sortBy, setSortBy] = useState<"year" | "title">("year")
  const [filterYear, setFilterYear] = useState<number | null>(null)
  const [filterAuthor, setFilterAuthor] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")

  const sortedPublications = [...publications].sort((a, b) => {
    if (sortBy === "year") {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    } else {
      return b.citationsCount - a.citationsCount
    }
  })

  const filteredPublications = sortedPublications
    .filter(pub => filterYear ? new Date(pub.publishedAt).getFullYear() === filterYear : true)
    .filter(pub => filterAuthor ? pub.authors.some(author => author.id === filterAuthor) : true)
    .filter(pub => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return pub.title[lang].toLowerCase().includes(query);
    })

  const years = Array.from(new Set(publications.map((pub) => new Date(pub.publishedAt).getFullYear()))).sort((a, b) => b - a)

  const authors = Array.from(
    new Map(
      publications
        .flatMap(pub => pub.authors)
        .filter(author => author.id !== undefined)
        .map(author => [author.id, author])
    ).values()
  ).sort((a, b) => a.name[lang].localeCompare(b.name[lang]))

  return (
    <>
      <div className="mb-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder={dictionary.publications.searchPlaceholder}
          />
        </div>
      </div>

      {/* Мобильный макет (XS экраны) */}
      <div className="mb-5 sm:hidden">
        <div className="flex items-center mb-2">
          <label htmlFor="sortBy-mobile" className="mr-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {dictionary.publications.sortBy}
          </label>
          <select
            id="sortBy-mobile"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "year" | "title")}
            className="flex-1 text-sm border rounded p-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="year">{dictionary.publications.year}</option>
            <option value="title">{dictionary.publications.title}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <label htmlFor="filterYear-mobile" className="mr-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {dictionary.publications.filterByYear}
            </label>
            <select
              id="filterYear-mobile"
              value={filterYear || ""}
              onChange={(e) => setFilterYear(e.target.value ? Number.parseInt(e.target.value) : null)}
              className="flex-1 text-sm border rounded p-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">{dictionary.publications.allYears}</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label htmlFor="filterAuthor-mobile" className="mr-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {dictionary.publications.filterByAuthor}
            </label>
            <select
              id="filterAuthor-mobile"
              value={filterAuthor || ""}
              onChange={(e) => setFilterAuthor(e.target.value ? Number.parseInt(e.target.value) : null)}
              className="flex-1 text-sm border rounded p-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">{dictionary.publications.allAuthors}</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name[lang]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Средний макет (SM-MD экраны) */}
      <div className="mb-5 hidden sm:block lg:hidden">
        <div className="flex flex-wrap items-center justify-start gap-4">
          <div className="flex items-center">
            <label htmlFor="sortBy-md" className="mr-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {dictionary.publications.sortBy}
            </label>
            <select
              id="sortBy-md"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "year" | "title")}
              className="text-sm border rounded p-1.5 w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="year">{dictionary.publications.year}</option>
              <option value="title">{dictionary.publications.title}</option>
            </select>
          </div>
          <div className="flex items-center">
            <label htmlFor="filterYear-md" className="mr-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {dictionary.publications.filterByYear}
            </label>
            <select
              id="filterYear-md"
              value={filterYear || ""}
              onChange={(e) => setFilterYear(e.target.value ? Number.parseInt(e.target.value) : null)}
              className="text-sm border rounded p-1.5 w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">{dictionary.publications.allYears}</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label htmlFor="filterAuthor-md" className="mr-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {dictionary.publications.filterByAuthor}
            </label>
            <select
              id="filterAuthor-md"
              value={filterAuthor || ""}
              onChange={(e) => setFilterAuthor(e.target.value ? Number.parseInt(e.target.value) : null)}
              className="text-sm border rounded p-1.5 w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">{dictionary.publications.allAuthors}</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name[lang]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Большой макет (LG+ экраны) */}
      <div className="mb-5 hidden lg:grid lg:grid-cols-3 lg:gap-2">
        <div className="flex items-center">
          <label htmlFor="sortBy-lg" className="mr-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {dictionary.publications.sortBy}
          </label>
          <select
            id="sortBy-lg"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "year" | "title")}
            className="flex-1 text-sm border rounded p-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="year">{dictionary.publications.year}</option>
            <option value="title">{dictionary.publications.title}</option>
          </select>
        </div>
        <div className="flex items-center">
          <label htmlFor="filterYear-lg" className="mr-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {dictionary.publications.filterByYear}
          </label>
          <select
            id="filterYear-lg"
            value={filterYear || ""}
            onChange={(e) => setFilterYear(e.target.value ? Number.parseInt(e.target.value) : null)}
            className="flex-1 text-sm border rounded p-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">{dictionary.publications.allYears}</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <label htmlFor="filterAuthor-lg" className="mr-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {dictionary.publications.filterByAuthor}
          </label>
          <select
            id="filterAuthor-lg"
            value={filterAuthor || ""}
            onChange={(e) => setFilterAuthor(e.target.value ? Number.parseInt(e.target.value) : null)}
            className="flex-1 text-sm border rounded p-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">{dictionary.publications.allAuthors}</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name[lang]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-8">
        {filteredPublications.length > 0 ? (
          filteredPublications.map((publication) => (
            <PublicationItem
              key={publication.id}
              lang={lang}
              publication={publication}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            {dictionary.common.noResults}
          </p>
        )}
      </div>
    </>
  )
}

