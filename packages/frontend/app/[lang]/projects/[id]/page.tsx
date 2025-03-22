import Image from "next/image";
import PublicationList from "../../../components/PublicationList";
import VideoEmbed from "../../../components/VideoEmbed";
import type { Locale, Project } from "@/app/types";
import { getDictionary } from "@/app/dictionaries";
import { Github } from "lucide-react";

const fetchProject = async (id: string): Promise<Project | null> => {
  const response = await fetch(`http://localhost:8080/api/projects/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch project');
  }
  return response.json();
};

const ProjectPage = async ({
  params: { id, lang },
}: {
  params: { id: string; lang: Locale };
}) => {
  const dictionary = getDictionary(lang);
  const project = await fetchProject(id);

  if (!project) {
    return (
      <div className="text-center mt-8 text-xl">
        {dictionary.projects.notFound}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-primary rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            {project.title[lang]}
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {project.description[lang]}
          </p>
          {project.githubLink && (
            <a
              href={project.githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors mb-8"
            >
              <Github className="mr-2" size={20} />
              {dictionary.projects.viewOnGitHub}
            </a>
          )}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              {dictionary.projects.significantPublications}
            </h2>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <PublicationList
                lang={lang}
                publications={project.publications}
              />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              {dictionary.projects.projectVideos}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4"
                >
                  <VideoEmbed lang={lang} video={video} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
