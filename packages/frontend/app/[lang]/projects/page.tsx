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
    <div className="container mx-auto px-4 py-16">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
          {dictionary.projects.title}
        </h1>
        <p className="text-foreground/70 max-w-3xl mx-auto">
          {lang === "en"
            ? "Explore our ongoing research projects and their latest findings."
            : "Изучите наши текущие исследовательские проекты и их последние результаты."}
        </p>
      </div>

      {/* Stats Summary */}
      <div className="max-w-5xl mx-auto mb-10 bg-card dark:bg-card border border-border/50 rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{projects.length}</div>
            <div className="text-sm text-foreground/70">{lang === "en" ? "Active Projects" : "Активные проекты"}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{projects.reduce((acc, project) => acc + (project.publications?.length || 0), 0)}</div>
            <div className="text-sm text-foreground/70">{lang === "en" ? "Related Publications" : "Связанные публикации"}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{projects.filter(project => project.githubLink).length}</div>
            <div className="text-sm text-foreground/70">{lang === "en" ? "Open Source" : "Открытый исходный код"}</div>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="max-w-md mx-auto bg-card dark:bg-card border border-border/50 rounded-lg p-8 shadow-sm text-center">
          <p className="text-xl text-foreground/70">
            {dictionary.projects.noProjectsFound}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {projects.map((project) => (
            <ProjectCard lang={lang} key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
