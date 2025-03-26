import { getDictionary } from "@/app/dictionaries";
import type { Locale, Publication } from "@/app/types";
import Link from "next/link";

interface PublicationItemProps {
  publication: Publication;
  lang: Locale;
}

const PublicationItem: React.FC<PublicationItemProps> = ({ publication, lang }) => {
  const dictionary = getDictionary(lang);

  const AuthorsList = () => (
    <div className="flex flex-wrap gap-1">
      {publication.authors.map((author, index) => (
        <span key={index}>
          {author.id ? (
            <Link href={`/${lang}/researchers/${author.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
              {author.name[lang]}
            </Link>
          ) : (
            <span>{author.name[lang]}</span>
          )}
          {index < publication.authors.length - 1 && ", "}
        </span>
      ))}
    </div>
  );

  return (
    <div className="bg-white dark:bg-primary rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        {typeof publication.title === 'object' ? publication.title[lang] : publication.title}
      </h2>
      <div className="flex flex-col space-y-2">
        {publication.authors && publication.authors.length > 0 && (
          <div className="text-gray-600 dark:text-gray-400">
            <AuthorsList />
          </div>
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

