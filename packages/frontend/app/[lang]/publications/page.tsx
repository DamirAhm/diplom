import { Locale, Publication } from "../../types";
import { getDictionary } from "../../dictionaries";
import { PublicationsTable } from "./PublicationsTable";

const fetchPublications = async (): Promise<Publication[]> => {
  const response = await fetch('http://localhost:8080/api/publications');
  if (!response.ok) {
    throw new Error('Failed to fetch publications');
  }
  return response.json();
};

const PublicationsPage = async ({
  params,
}: {
  params: { lang: Locale };
}) => {
  const { lang } = await params || {};
  const dictionary = getDictionary(lang);
  const publications = await fetchPublications();

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
