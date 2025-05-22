"use client";

import { useState } from "react";
import type { Locale, Publication, Author } from "@/app/types";
import { getDictionary } from "@/app/dictionaries";
import PublicationItem from "@/app/components/PublicationItem";
import { Search, SlidersHorizontal, ChevronDown, X } from "lucide-react";

export type Props = {
  publications: Publication[];
  lang: Locale;
};

export const PublicationsTable: React.FC<Props> = ({ publications, lang }) => {
  const dictionary = getDictionary(lang);
  const [sortBy, setSortBy] = useState<"year" | "citations">("year");
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterAuthor, setFilterAuthor] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Get unique years and sort them
  const years = Array.from(
    new Set(publications.map((pub) => new Date(pub.publishedAt).getFullYear()))
  ).sort((a, b) => b - a);

  // Get unique authors
  const authors = Array.from(
    new Map(
      publications
        .flatMap((pub) => pub.authors)
        .filter((author) => author.id !== undefined)
        .map((author) => [author.id, author])
    ).values()
  ).sort((a, b) => a.name[lang].localeCompare(b.name[lang]));

  // Sort publications
  const sortedPublications = [...publications].sort((a, b) => {
    if (sortBy === "year") {
      return (
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    } else {
      return b.citationsCount - a.citationsCount;
    }
  });

  // Apply filters
  const filteredPublications = sortedPublications
    .filter((pub) =>
      filterYear ? new Date(pub.publishedAt).getFullYear() === filterYear : true
    )
    .filter((pub) =>
      filterAuthor
        ? pub.authors.some((author) => author.id === filterAuthor)
        : true
    )
    .filter((pub) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return pub.title[lang].toLowerCase().includes(query);
    });

  // Reset all filters
  const resetFilters = () => {
    setSortBy("year");
    setFilterYear(null);
    setFilterAuthor(null);
    setSearchQuery("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border/50 dark:border-indigo-400/20 overflow-hidden">
        {/* Search and filters header */}
        <div className="p-4 border-b border-border/50 dark:border-indigo-400/20">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            {/* Search input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-foreground/50" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-muted/50 border border-border/50 dark:border-indigo-400/30 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-indigo-400"
                placeholder={dictionary.publications.searchPlaceholder}
              />
            </div>

            {/* Desktop filters */}
            <div className="hidden md:flex md:items-center md:space-x-3">
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="sortBy"
                  className="text-sm text-foreground/70 whitespace-nowrap"
                >
                  {dictionary.publications.sortBy}:
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "year" | "citations")
                  }
                  className="text-sm rounded-md bg-muted/50 border border-border/50 dark:border-indigo-400/30 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-indigo-400"
                >
                  <option value="year">{dictionary.publications.year}</option>
                  <option value="citations">
                    {dictionary.publications.citations}
                  </option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label
                  htmlFor="filterYear"
                  className="text-sm text-foreground/70 whitespace-nowrap"
                >
                  {dictionary.publications.year}:
                </label>
                <select
                  id="filterYear"
                  value={filterYear || ""}
                  onChange={(e) =>
                    setFilterYear(
                      e.target.value ? Number.parseInt(e.target.value) : null
                    )
                  }
                  className="text-sm rounded-md bg-muted/50 border border-border/50 dark:border-indigo-400/30 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-indigo-400"
                >
                  <option value="">{dictionary.publications.allYears}</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label
                  htmlFor="filterAuthor"
                  className="text-sm text-foreground/70 whitespace-nowrap"
                >
                  {dictionary.publications.filterByAuthor}:
                </label>
                <select
                  id="filterAuthor"
                  value={filterAuthor || ""}
                  onChange={(e) =>
                    setFilterAuthor(
                      e.target.value ? Number.parseInt(e.target.value) : null
                    )
                  }
                  className="text-sm rounded-md bg-muted/50 border border-border/50 dark:border-indigo-400/30 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-indigo-400"
                >
                  <option value="">{dictionary.publications.allAuthors}</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name[lang]}
                    </option>
                  ))}
                </select>
              </div>

              {(filterYear !== null ||
                filterAuthor !== null ||
                sortBy !== "year" ||
                searchQuery) && (
                <button
                  onClick={resetFilters}
                  className="flex items-center text-sm text-primary hover:text-primary/80 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <X size={16} className="mr-1" />
                  {lang === "en" ? "Reset Filters" : "Сбросить фильтры"}
                </button>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              className="flex items-center justify-center md:hidden px-4 py-2 text-sm rounded-md border border-border/50 dark:border-indigo-400/30 bg-muted/50 hover:bg-muted"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={16} className="mr-2" />
              {lang === "en" ? "Filters" : "Фильтры"}
            </button>
          </div>

          {/* Mobile filters */}
          {filtersOpen && (
            <div className="mt-4 space-y-3 md:hidden">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="sortBy-mobile"
                    className="block text-sm text-foreground/70 mb-1"
                  >
                    {dictionary.publications.sortBy}
                  </label>
                  <select
                    id="sortBy-mobile"
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "year" | "citations")
                    }
                    className="w-full text-sm rounded-md bg-muted/50 border border-border/50 py-2 px-3"
                  >
                    <option value="year">{dictionary.publications.year}</option>
                    <option value="citations">
                      {dictionary.publications.citations}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="filterYear-mobile"
                    className="block text-sm text-foreground/70 mb-1"
                  >
                    {dictionary.publications.year}
                  </label>
                  <select
                    id="filterYear-mobile"
                    value={filterYear || ""}
                    onChange={(e) =>
                      setFilterYear(
                        e.target.value ? Number.parseInt(e.target.value) : null
                      )
                    }
                    className="w-full text-sm rounded-md bg-muted/50 border border-border/50 py-2 px-3"
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

              <div>
                <label
                  htmlFor="filterAuthor-mobile"
                  className="block text-sm text-foreground/70 mb-1"
                >
                  {dictionary.publications.filterByAuthor}
                </label>
                <select
                  id="filterAuthor-mobile"
                  value={filterAuthor || ""}
                  onChange={(e) =>
                    setFilterAuthor(
                      e.target.value ? Number.parseInt(e.target.value) : null
                    )
                  }
                  className="w-full text-sm rounded-md bg-muted/50 border border-border/50 py-2 px-3"
                >
                  <option value="">{dictionary.publications.allAuthors}</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name[lang]}
                    </option>
                  ))}
                </select>
              </div>

              {(filterYear !== null ||
                filterAuthor !== null ||
                sortBy !== "year" ||
                searchQuery) && (
                <button
                  onClick={resetFilters}
                  className="flex items-center text-sm text-primary py-1"
                >
                  <X size={16} className="mr-1" />
                  {lang === "en" ? "Reset Filters" : "Сбросить фильтры"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="p-4 border-b border-border/50 bg-muted/30">
          <div className="flex justify-between items-center">
            <p className="text-sm text-foreground/70">
              {lang === "en"
                ? `Showing ${filteredPublications.length} results`
                : `Показано результатов: ${filteredPublications.length}`}
            </p>
          </div>
        </div>
      </div>

      {/* Publications list */}
      {filteredPublications.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredPublications.map((publication) => (
            <PublicationItem
              key={publication.id}
              publication={publication}
              lang={lang}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-lg border border-border/50">
          <p className="text-foreground/70">
            {lang === "en" ? "No publications found" : "Публикации не найдены"}
          </p>
        </div>
      )}
    </div>
  );
};
