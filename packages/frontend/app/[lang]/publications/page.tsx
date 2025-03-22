import { Locale, Publication } from "../../types";
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
  const publications = await api.publications.getAll();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        {dictionary.publications.title}
      </h1>
      <PublicationsTable publications={publications} lang={lang} />
    </div>
  );
};

export default PublicationsPage;
