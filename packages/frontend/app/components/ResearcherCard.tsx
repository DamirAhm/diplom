import type React from "react"
import Link from "next/link"
import { getDictionary } from "../dictionaries"
import type { Locale } from "../types"
import { ImageWithFallback } from "./ImageWithFallback"
import { ExternalLink, Award } from "lucide-react"

interface Researcher {
  id: number
  name: { en: string; ru: string }
  lastName: { en: string; ru: string }
  position: { en: string; ru: string }
  photo: string
  totalCitations: number
  publications?: any[]
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
  isCompact?: boolean
}

const ResearcherCard: React.FC<ResearcherCardProps> = ({
  researcher,
  lang,
  isCompact = false
}) => {
  const dictionary = getDictionary(lang)

  // Map profile names to more readable formats
  const profileLabels: Record<string, string> = {
    researchgate: "ResearchGate",
    googleScholar: "Google Scholar",
    scopus: "Scopus",
    publons: "Publons",
    orcid: "ORCID"
  }

  if (isCompact) {
    return (
      <div className="flex gap-4 p-4 bg-card dark:bg-card border border-border/30 rounded-lg hover:border-primary/30 transition-colors">
        <div className="w-20 h-20 flex-shrink-0">
          <ImageWithFallback
            src={researcher.photo}
            alt={`${researcher.name[lang]} ${researcher.lastName[lang]}`}
            width={80}
            height={80}
            className="w-full h-full object-cover rounded-md"
            fallbackType="initials"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-lg">
            <Link
              href={`/${lang}/researchers/${researcher.id}`}
              className="hover:text-primary transition-colors"
            >
              {researcher.name[lang]} {researcher.lastName[lang]}
            </Link>
          </h3>
          <p className="text-sm text-foreground/70 mb-1">{researcher.position[lang]}</p>
          <div className="text-xs text-foreground/60">
            <span className="mr-3">{dictionary.publications.citations}: {researcher.totalCitations}</span>
            <span>{lang === "en" ? "Publications" : "Публикации"}: {researcher.publications?.length || 0}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 hover:border-primary/20 transition-all duration-300 group flex flex-col h-full">
      <div className="relative overflow-hidden">
        <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center">
          <ImageWithFallback
            src={researcher.photo}
            alt={`${researcher.name[lang]} ${researcher.lastName[lang]}`}
            width={300}
            height={300}
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
            fallbackType="icon"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          {researcher.name[lang]} {researcher.lastName[lang]}
        </h2>

        <p className="text-foreground/70 text-sm mt-2">
          {researcher.position[lang]}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-foreground/60">
            <Award size={16} className="text-primary" />
            <span>{researcher.totalCitations}</span>
            <span className="text-foreground/60">{dictionary.publications.citations}</span>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(researcher.profiles).map(
              ([key, value]) =>
                value && (
                  <a
                    key={key}
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <ExternalLink size={12} />
                    {profileLabels[key] || key}
                  </a>
                ),
            )}
          </div>

          <Link
            href={`/${lang}/researchers/${researcher.id}`}
            className="inline-flex items-center text-sm text-primary font-medium hover:underline"
          >
            {dictionary.researchers.viewProfile}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResearcherCard

