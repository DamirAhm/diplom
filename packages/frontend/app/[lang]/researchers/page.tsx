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
    <div className="container mx-auto px-4">
      <h1 className="text-3xl dark:text-indigo-400 text-indigo-700 font-bold mb-6 text-center mt-8">
        {dictionary.researchers.title}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
