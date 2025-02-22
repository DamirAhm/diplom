import Link from "next/link"
import type { Locale } from "@/app/types"
import { getDictionary } from "@/app/dictionaries"

interface Project {
  id: number
  title: { en: string; ru: string }
  description: { en: string; ru: string }
  githubLink?: string
}

interface ProjectCardProps {
  project: Project
  lang: Locale
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, lang }) => {
  const dictionary = getDictionary(lang)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{project.title[lang]}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{project.description[lang]}</p>
      </div>
      <div className="px-6 pb-4 flex justify-between">
        <Link
          href={`/${lang}/projects/${project.id}`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {dictionary.common.learnMore}
        </Link>
        {project.githubLink && (
          <a
            href={project.githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            GitHub
          </a>
        )}
      </div>
    </div>
  )
}

export default ProjectCard

