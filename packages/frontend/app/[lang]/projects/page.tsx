import ProjectCard from "../../components/ProjectCard/ProjectCard";
import { Locale, Project } from "../../types";
import { getDictionary } from "../../dictionaries";
import { api } from "../../../lib/api";

const ProjectsPage = async ({ params }: { params: { lang: Locale } }) => {
  const { lang } = (await params) || {};
  const dictionary = getDictionary(lang);
  const projects = await api.projects.getAll();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6 dark:text-white">
          {dictionary.projects.title}
        </h1>
        <p className="text-foreground/70 max-w-3xl mx-auto">
          {lang === "en"
            ? "Explore our ongoing research projects and their latest findings."
            : "Изучите наши текущие исследовательские проекты и их последние результаты."}
        </p>
      </div>
      {projects.length === 0 ? (
        <div className="max-w-md mx-auto bg-card dark:bg-card border border-border/50 dark:border-indigo-400/20 rounded-lg p-8 shadow-sm text-center">
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
