import Link from "next/link"
import type { Locale } from "@/app/types"
import { getDictionary } from "@/app/dictionaries"
import { Github, ArrowRight, BookOpen } from "lucide-react"

interface Project {
  id: number
  title: { en: string; ru: string }
  description: { en: string; ru: string }
  githubLink?: string
  publications?: any[]
}

interface ProjectCardProps {
  project: Project
  lang: Locale
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, lang }) => {
  const dictionary = getDictionary(lang)

  return (
    <div className="bg-card dark:bg-card border border-border/50 dark:border-indigo-400/20 rounded-xl overflow-hidden shadow-sm hover:border-primary/20 dark:hover:border-indigo-400/40 hover:shadow-md transition-all duration-300 flex flex-col h-full group">
      {/* Card Header with Color Bar */}
      <div className="h-2 bg-gradient-to-r from-primary to-secondary dark:from-indigo-400 dark:to-indigo-600"></div>

      <div className="p-6 flex-grow">
        <h3 className="text-xl font-heading font-semibold mb-3 text-foreground group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors">
          {project.title[lang]}
        </h3>

        <p className="text-foreground/70 text-sm mb-4 line-clamp-3">
          {project.description[lang]}
        </p>

        {/* Project Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-foreground/60">
          {project.publications && project.publications.length > 0 && (
            <div className="flex items-center gap-1.5">
              <BookOpen size={16} className="text-primary dark:text-indigo-400" />
              <span>{project.publications.length}</span>
              <span>{lang === "en" ? "Publications" : "Публикации"}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 mt-auto pt-4 flex justify-between items-center border-t border-border/30 dark:border-indigo-400/20">
        <Link
          href={`/${lang}/projects/${project.id}`}
          className="inline-flex items-center text-sm text-primary dark:text-indigo-400 font-medium hover:underline"
        >
          {dictionary.common.learnMore}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>

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
  )
}

export default ProjectCard

