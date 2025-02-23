import ProjectCard from "../../components/ProjectCard/ProjectCard";
import { Locale, Project } from "../../types";
import { getDictionary } from "../../dictionaries";

async function fetchProjects(): Promise<Project[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  if (!API_URL) {
    throw new Error("API_URL environment variable is not defined");
  }

  const res = await fetch(`${API_URL}/projects`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch projects");
  }
  return res.json();
}

const ProjectsPage = async ({ params }: { params: { lang: Locale } }) => {
  const { lang } = (await params) || {};
  const dictionary = getDictionary(lang);
  const projects = await fetchProjects();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        {dictionary.projects.title}
      </h1>
      {projects.length === 0 ? (
        <p className="text-center text-xl">
          {dictionary.projects.noProjectsFound}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <ProjectCard lang={lang} key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
