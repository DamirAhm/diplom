import Image from "next/image";
import PublicationList from "../../../components/PublicationList";
import VideoEmbed from "../../../components/VideoEmbed";
import type { Locale, Project } from "@/app/types";
import { getDictionary } from "@/app/dictionaries";
import { Github, Home } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ImageWithFallback } from "../../../components/ImageWithFallback";
import { api } from "@/lib/api";
import Link from "next/link";

const fetchProject = async (id: string): Promise<Project | null> => {
  try {
    return await api.projects.getOne(id);
  } catch (error) {
    if ((error as any)?.status === 404) {
      return null;
    }
    throw error;
  }
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
      <div className="mb-8">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link
                href={`/${lang}`}
                className="flex items-center text-sm font-medium text-foreground/70 hover:text-primary"
              >
                <Home size={16} className="mr-1 mb-0.5" />
                {lang === "en" ? "Home" : "Главная"}
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="w-3 h-3 text-foreground/70 mx-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 6 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 9 4-4-4-4"
                  />
                </svg>
                <Link
                  href={`/${lang}/researchers`}
                  className="ml-1 text-sm font-medium text-foreground/70 hover:text-primary md:ml-2"
                >
                  {dictionary.projects.title}
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg
                  className="w-3 h-3 text-foreground/70 mx-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 6 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 9 4-4-4-4"
                  />
                </svg>
                <span className="ml-1 text-sm font-medium text-primary md:ml-2">
                  {project.title[lang]}
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>


      <div className="bg-card dark:bg-card rounded-lg shadow-lg">
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
          {project.images && project.images.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                {dictionary.admin.images}
              </h2>
              <Carousel className="w-full" opts={{ loop: true }}>
                <CarouselContent>
                  {project.images.map((image) => (
                    <CarouselItem key={image.id}>
                      <div className="relative aspect-video">
                        <ImageWithFallback
                          src={image.url}
                          alt={project.title[lang]}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}
          {project.videos.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                {dictionary.projects.projectVideos}
              </h2>
              <Carousel className="w-full" opts={{ loop: true }}>
                <CarouselContent>
                  {project.videos.map((video) => (
                    <CarouselItem key={video.id}>
                      <div
                        key={video.id}
                        className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4"
                      >
                        <VideoEmbed lang={lang} video={video} />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {project.videos.length > 1 && (
                  <>
                    <CarouselPrevious />
                    <CarouselNext />
                  </>
                )}
              </Carousel>
            </div>
          )}
          {project.publications.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
