import ProjectCard from "../../components/ProjectCard/ProjectCard"
import { projectsData } from "../../mock/projectsData"
import { Locale } from "../../types"
import { getDictionary } from "../../dictionaries"

const fetchProjects = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500))

  return projectsData
}

const ProjectsPage = async ({ params: { lang } }: { params: { lang: Locale } }) => {
  const dictionary = getDictionary(lang)
  const projects = await fetchProjects()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">{dictionary.projects.title}</h1>
      {projects.length === 0 ? (
        <p className="text-center text-xl">{dictionary.projects.noProjectsFound}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <ProjectCard lang={lang} key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectsPage

