import { publicationsData } from "../../../mock/publicationsData";
import { Locale } from "../../types";
import { getDictionary } from "../../dictionaries";
import { PublicationsTable } from "./PublicationsTable";

const fetchPublications = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 500);
  });

  return publicationsData;
};

const PublicationsPage = async ({
  params: { lang },
}: {
  params: { lang: Locale };
}) => {
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
