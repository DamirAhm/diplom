"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/app/dictionaries";
import type { Locale, Project, Publication, Video } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { api } from "../../../../../lib/api";

const emptyProject: Omit<Project, "id"> = {
  title: { en: "", ru: "" },
  description: { en: "", ru: "" },
  githubLink: "",
  publications: [],
  videos: [],
};

export default function ProjectFormPage({
  params: { lang, id },
}: {
  params: { lang: Locale; id: string };
}) {
  const dictionary = getDictionary(lang);
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Omit<Project, "id">>(emptyProject);
  const [isLoading, setIsLoading] = useState(id !== "new");
  const [isSaving, setIsSaving] = useState(false);
  const [availablePublications, setAvailablePublications] = useState<
    Publication[]
  >([]);

  useEffect(() => {
    if (id !== "new") {
      fetchProject();
    }
    fetchPublications();
  }, [id]);

  const fetchProject = async () => {
    try {
      const data = await api.projects.getOne(id);
      setProject(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: dictionary.common.error,
        description: dictionary.admin.fetchError,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPublications = async () => {
    try {
      const data = await api.publications.getAll();
      setAvailablePublications(data);
    } catch (error) {
      console.error("Failed to fetch publications:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (id !== "new") {
        await api.projects.update(id, project);
      } else {
        await api.projects.create(project);
      }

      toast({
        title: dictionary.admin.success,
        description: dictionary.admin.saveSuccess,
      });
      router.push(`/${lang}/admin/projects`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: dictionary.common.error,
        description: dictionary.admin.saveError,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddVideo = () => {
    const title = prompt(dictionary.admin.videoTitle);
    if (!title) return;

    const url = prompt(dictionary.admin.videoUrl);
    if (!url) return;

    const newVideo: Video = {
      id: Date.now(),
      title: { en: title, ru: title },
      url,
    };

    setProject((prev) => ({
      ...prev,
      videos: [...prev.videos, newVideo],
    }));
  };

  const handleRemoveVideo = (videoId: number) => {
    setProject((prev) => ({
      ...prev,
      videos: prev.videos.filter((v) => v.id !== videoId),
    }));
  };

  const handleAddPublication = (publicationId: number) => {
    const publication = availablePublications.find(
      (p) => p.id === publicationId
    );
    if (
      !publication ||
      project.publications.some((p) => p.id === publicationId)
    )
      return;

    setProject((prev) => ({
      ...prev,
      publications: [...prev.publications, publication],
    }));
  };

  const handleRemovePublication = (publicationId: number) => {
    setProject((prev) => ({
      ...prev,
      publications: prev.publications.filter((p) => p.id !== publicationId),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/${lang}/admin/projects`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {dictionary.common.back}
        </Button>
      </div>

      <h1 className="mb-8 text-3xl font-bold">
        {id === "new"
          ? dictionary.admin.addProject
          : dictionary.admin.editProject}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div>
            <Label>{dictionary.admin.title}</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="titleEn" className="text-xs">
                  English
                </Label>
                <Input
                  id="titleEn"
                  value={project.title.en}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      title: { ...prev.title, en: e.target.value },
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="titleRu" className="text-xs">
                  Russian
                </Label>
                <Input
                  id="titleRu"
                  value={project.title.ru}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      title: { ...prev.title, ru: e.target.value },
                    }))
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <Label>{dictionary.admin.description}</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="descriptionEn" className="text-xs">
                  English
                </Label>
                <Textarea
                  id="descriptionEn"
                  value={project.description.en}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      description: { ...prev.description, en: e.target.value },
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="descriptionRu" className="text-xs">
                  Russian
                </Label>
                <Textarea
                  id="descriptionRu"
                  value={project.description.ru}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      description: { ...prev.description, ru: e.target.value },
                    }))
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="githubLink">{dictionary.admin.githubLink}</Label>
            <Input
              id="githubLink"
              type="url"
              value={project.githubLink}
              onChange={(e) =>
                setProject((prev) => ({ ...prev, githubLink: e.target.value }))
              }
            />
          </div>

          <div>
            <div className="mb-4">
              <Label>{dictionary.admin.publications}</Label>
              <div className="mt-2 space-y-2">
                {project.publications.map((pub) => (
                  <div
                    key={pub.id}
                    className="flex items-center justify-between border p-2 rounded"
                  >
                    <span>{pub.title[lang]}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemovePublication(pub.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <select
                className="mt-2 w-full p-2 border rounded"
                onChange={(e) => handleAddPublication(Number(e.target.value))}
                value=""
              >
                <option value="">{dictionary.admin.addPublication}</option>
                {availablePublications
                  .filter(
                    (p) =>
                      !project.publications.some((proj) => proj.id === p.id)
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title[lang]}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>{dictionary.admin.videos}</Label>
              <Button type="button" variant="outline" onClick={handleAddVideo}>
                <Plus className="mr-2 h-4 w-4" />
                {dictionary.admin.addVideo}
              </Button>
            </div>
            <div className="space-y-2">
              {project.videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between border p-2 rounded"
                >
                  <div>
                    <div className="font-medium">{video.title[lang]}</div>
                    <div className="text-sm text-muted-foreground">
                      {video.url}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveVideo(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? dictionary.common.saving : dictionary.common.save}
        </Button>
      </form>
    </div>
  );
}
