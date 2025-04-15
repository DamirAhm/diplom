import ResearcherCard from "../../components/ResearcherCard";
import { Locale, Researcher } from "../../types";
import { getDictionary } from "../../dictionaries";
import { api } from "@/lib/api";
import { Search } from "lucide-react";

const ResearchersPage = async ({
  params,
}: {
  params: { lang: Locale };
}) => {
  const { lang } = await params || {};
  const researchers = await api.researchers.getAll();
  const dictionary = getDictionary(lang);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
          {dictionary.researchers.title}
        </h1>
        <p className="text-foreground/70 max-w-3xl mx-auto">
          {lang === "en"
            ? "Meet our team of expert researchers driving innovation and discovery in our laboratory."
            : "Познакомьтесь с нашей командой экспертов-исследователей, способствующих инновациям и открытиям в нашей лаборатории."}
        </p>
      </div>

      {/* Stats Summary */}
      <div className="max-w-5xl mx-auto mb-10 bg-card dark:bg-card border border-border/50 rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{researchers.length}</div>
            <div className="text-sm text-foreground/70">{lang === "en" ? "Researchers" : "Исследователи"}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{Math.round(researchers.reduce((acc, r) => acc + r.totalCitations, 0) / researchers.length)}</div>
            <div className="text-sm text-foreground/70">{lang === "en" ? "Avg. Citations" : "Средн. цитируемость"}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{researchers.reduce((acc, r) => acc + (r.publications?.length || 0), 0)}</div>
            <div className="text-sm text-foreground/70">{lang === "en" ? "Publications" : "Публикации"}</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="relative dark:bg-card p-4 rounded-lg shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-foreground/50" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-border/50 rounded-md bg-background dark:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/30"
            placeholder={lang === "en" ? "Search researchers..." : "Поиск исследователей..."}
            disabled
          />
          <div className="absolute right-7 top-1/2 transform -translate-y-1/2 text-xs text-foreground/50">
            {lang === "en" ? "Coming soon" : "Скоро"}
          </div>
        </div>
      </div>

      {/* Researchers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {researchers.map((researcher) => (
          <ResearcherCard
            key={researcher.id}
            researcher={researcher}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
};

export default ResearchersPage;
