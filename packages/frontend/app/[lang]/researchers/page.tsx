import ResearcherCard from "../../components/ResearcherCard";
import { Locale, Researcher } from "../../types";
import { getDictionary } from "../../dictionaries";
import { api } from "@/lib/api";

const ResearchersPage = async ({
  params,
}: {
  params: { lang: Locale };
}) => {
  const { lang } = await params || {};
  const researchers = await api.researchers.getAll();
  const dictionary = getDictionary(lang);

  return (
    <div className="container mx-auto px-4 py-16">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
