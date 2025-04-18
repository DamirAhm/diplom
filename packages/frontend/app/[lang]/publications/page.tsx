import { Locale } from "../../types";
import { getDictionary } from "../../dictionaries";
import { PublicationsTable } from "./PublicationsTable";
import { api } from "@/lib/api";

const PublicationsPage = async ({
  params,
}: {
  params: { lang: Locale };
}) => {
  const { lang } = await params || {};
  const dictionary = getDictionary(lang);
  const publications = await api.publications.getPublic();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6 dark:text-indigo-400">
          {dictionary.publications.title}
        </h1>
        <p className="text-foreground/70 max-w-3xl mx-auto">
          {lang === "en"
            ? "Explore our scientific publications and research papers from our laboratory."
            : "Ознакомьтесь с научными публикациями и исследовательскими работами нашей лаборатории."}
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <PublicationsTable publications={publications} lang={lang} />
      </div>
    </div>
  );
};

export default PublicationsPage;
