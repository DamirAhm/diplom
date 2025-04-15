import { getDictionary } from "@/app/dictionaries";
import type { Locale, Publication } from "@/app/types";
import Link from "next/link";
import { BookOpen, Calendar, Award, ExternalLink } from "lucide-react";

interface PublicationItemProps {
  publication: Publication;
  lang: Locale;
}

const PublicationItem: React.FC<PublicationItemProps> = ({ publication, lang }) => {
  const dictionary = getDictionary(lang);

  const formattedDate = new Date(publication.publishedAt).toLocaleDateString(
    lang === 'en' ? 'en-US' : 'ru-RU',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  const AuthorsList = () => (
    <div className="flex flex-wrap gap-1">
      {publication.authors.map((author, index) => (
        <span key={index}>
          {author.id ? (
            <Link
              href={`/${lang}/researchers/${author.id}`}
              className="text-primary hover:underline font-medium"
            >
              {author.name[lang]}
            </Link>
          ) : (
            <span className="text-foreground/80">{author.name[lang]}</span>
          )}
          {index < publication.authors.length - 1 && ", "}
        </span>
      ))}
    </div>
  );

  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 hover:border-primary/20 transition-all p-5">
      <h3 className="text-xl font-medium mb-3 text-foreground leading-tight">
        {typeof publication.title === 'object' ? publication.title[lang] : publication.title}
      </h3>

      <div className="space-y-3">
        {publication.authors && publication.authors.length > 0 && (
          <div className="text-foreground/80 text-sm">
            <AuthorsList />
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {publication.journal && (
            <div className="flex items-center gap-1.5 text-foreground/70">
              <BookOpen size={16} className="text-primary flex-shrink-0" />
              <span className="line-clamp-1">{publication.journal}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-foreground/70">
            <Calendar size={16} className="text-primary flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-1.5 text-foreground/70">
            <Award size={16} className="text-primary flex-shrink-0" />
            <span>{publication.citationsCount} {dictionary.publications.citations}</span>
          </div>
        </div>

        <div className="pt-2">
          <a
            href={publication.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
          >
            {dictionary.publications.viewPublication}
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default PublicationItem;

