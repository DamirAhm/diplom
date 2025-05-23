import type React from "react";
import Link from "next/link";
import { getDictionary } from "../dictionaries";
import type { Locale, Researcher, ResearcherWithCount } from "../types";
import { ImageWithFallback } from "./ImageWithFallback";
import { ExternalLink, Award, MessageSquareQuote, ScrollText } from "lucide-react";

interface ResearcherCardProps {
  researcher: ResearcherWithCount;
  lang: Locale;
  isCompact?: boolean;
}

const ResearcherCard: React.FC<ResearcherCardProps> = ({
  researcher,
  lang,
  isCompact = false,
}) => {
  const dictionary = getDictionary(lang);

  // Map profile names to more readable formats
  const profileLabels: Record<string, string> = {
    researchgate: "ResearchGate",
    googleScholar: "Google Scholar",
    scopus: "Scopus",
    publons: "Publons",
    orcid: "ORCID",
  };

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
          <p className="text-sm text-foreground/70 mb-1">
            {researcher.position[lang]}
          </p>
          <div className="text-xs text-foreground/60">
            <span className="mr-3">
              {dictionary.publications.citations}: {researcher.totalCitations}
            </span>
            <span>
              {lang === "en" ? "Publications" : "Публикации"}:{" "}
              {researcher.publications?.length || 0}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/${lang}/researchers/${researcher.id}`}>
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
          <h2 className="font-heading text-xl hover:text-primary font-semibold text-foreground">
            {researcher.name[lang]} {researcher.lastName[lang]}
          </h2>

          <p className="text-foreground/70 text-sm mt-2">
            {researcher.position[lang]}
          </p>

          <div className="mt-4 flex flex-col items-start gap-2">
            <div className="flex items-center gap-2 py-1">
              <MessageSquareQuote className="h-4 w-4 text-primary" />
              <span className="text-sm">
                <span className="font-medium">
                  {dictionary.publications.citations}:
                </span>{" "}
                {researcher.totalCitations}
              </span>
            </div>
            <div className="flex items-center gap-2 py-1">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm">
                <span className="font-medium">
                  {lang === "en" ? "h-index" : "h-индекс"}:
                </span>{" "}
                {researcher.hIndex}
              </span>
            </div>
            <div className="flex items-center gap-2 py-1">
              <ScrollText className="h-4 w-4 text-primary" />
              <span className="text-sm">
                <span className="font-medium">
                  {lang === "en" ? "Publications" : "Публикации"}:
                </span>{" "}
                {researcher.publicationsCount}
              </span>
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
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 dark:bg-indigo-400/10 dark:text-indigo-400 dark:hover:bg-indigo-400/20 transition-colors"
                    >
                      <ExternalLink size={12} />
                      {profileLabels[key] || key}
                    </a>
                  )
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ResearcherCard;
