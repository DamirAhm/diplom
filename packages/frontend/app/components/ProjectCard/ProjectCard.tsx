import Link from "next/link";
import type { Locale } from "@/app/types";
import { getDictionary } from "@/app/dictionaries";
import { Github, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { ImageWithFallback } from "../ImageWithFallback";

interface Project {
  id: number;
  title: { en: string; ru: string };
  description: { en: string; ru: string };
  githubLink?: string;
  images?: { id: number; url: string }[];
  publications?: any[];
}

interface ProjectCardProps {
  project: Project;
  lang: Locale;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, lang }) => {
  return (
    <div className="bg-card dark:bg-card border border-border/50 dark:border-indigo-400/20 rounded-xl overflow-hidden shadow-sm hover:border-primary/20 dark:hover:border-indigo-400/40 hover:shadow-md transition-all duration-300 flex flex-col h-full group">
      <Link href={`/${lang}/projects/${project.id}`}>
        <div className="h-2 bg-gradient-to-r from-primary to-secondary dark:from-indigo-400 dark:to-indigo-600"></div>
        {project.images && project.images.length > 0 && (
          <div className="relative aspect-video">
            <ImageWithFallback
              src={project.images[0].url}
              alt={project.title[lang]}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-6 flex-grow">
          <h3 className="text-xl font-heading font-semibold mb-3 text-foreground group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors">
            {project.title[lang]}
          </h3>

          <p className="text-foreground/70 text-sm mb-4 line-clamp-6">
            {project.description[lang]}
          </p>

          <div className="mt-4 flex items-center gap-4 text-sm text-foreground/60">
            {project.publications && project.publications.length > 0 && (
              <div className="flex items-center gap-1.5">
                <BookOpen
                  size={16}
                  className="text-primary dark:text-indigo-400"
                />
                <span>{project.publications.length}</span>
                <span>{lang === "en" ? "Publications" : "Публикации"}</span>
              </div>
            )}
          </div>
        </div>
      </Link>

      <div className="px-6 pb-6 mt-auto pt-4 flex justify-between items-center border-t border-border/30 dark:border-indigo-400/20">
        {project.githubLink && (
          <a
            href={project.githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary dark:bg-indigo-400/10 dark:text-indigo-400 hover:bg-primary/20 dark:hover:bg-indigo-400/20 transition-colors"
          >
            <Github size={14} />
            GitHub
          </a>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
