import { getDictionary } from "@/app/dictionaries";
import type { Locale, Publication } from "@/app/types";

interface PublicationItemProps {
  publication: Publication;
  lang: Locale;
}

const PublicationItem: React.FC<PublicationItemProps> = ({ publication, lang }) => {
  const dictionary = getDictionary(lang);

  // Format author names from the publication's authors
  const authorNames = publication.authors
    ? publication.authors
      .map(author => `${author.name[lang]} ${author.lastName[lang]}`)
      .join(', ')
    : '';

  return (
    <div className="bg-white dark:bg-primary rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        {publication.title[lang]}
      </h2>
      <div className="flex flex-col space-y-2">
        {authorNames && (
          <p className="text-gray-600 dark:text-gray-400">{authorNames}</p>
        )}
        <p className="text-gray-600 dark:text-gray-400">
          {publication.journal && <span>{publication.journal}, </span>}
          <span>{dictionary.publications.publishedAt}: </span>
          {new Date(publication.publishedAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          {dictionary.publications.citations}: {publication.citationsCount}
        </p>
        <a
          href={publication.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
        >
          {dictionary.publications.viewPublication}
        </a>
      </div>
    </div>
  );
};

export default PublicationItem;

