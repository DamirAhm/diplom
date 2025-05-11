"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/app/dictionaries";
import type {
  Locale,
  Project,
  Publication,
  Video,
  ProjectImage,
  ProjectVideo,
  ProjectPublication,
} from "@/app/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { api } from "../../../../../lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { TextField, LocalizedTextField } from "@/components/ui/form-fields";
import * as z from "zod";
import { AutoComplete } from "@/components/ui/autocomplete";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PhotoUpload, PhotoItem } from "@/components/ui/photo-upload";

const projectSchema = z.object({
  title: z.object({
    en: z.string().min(1, { message: "English title is required" }),
    ru: z.string().min(1, { message: "Russian title is required" }),
  }),
  description: z.object({
    en: z.string().min(1, { message: "English description is required" }),
    ru: z.string().min(1, { message: "Russian description is required" }),
  }),
  githubLink: z.string().url().optional().or(z.literal("")),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const emptyProject: ProjectFormData = {
  title: { en: "", ru: "" },
  description: { en: "", ru: "" },
  githubLink: "",
};

export default function ProjectFormPage({
  params: { lang, id },
}: {
  params: { lang: Locale; id: string };
}) {
  const dictionary = getDictionary(lang);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(id !== "new");
  const [publications, setPublications] = useState<Publication[]>([]);
  const [projectPublications, setProjectPublications] = useState<
    ProjectPublication[]
  >([]);
  const [videos, setVideos] = useState<ProjectVideo[]>([]);
  const [images, setImages] = useState<PhotoItem[]>([]);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: emptyProject,
  });

  useEffect(() => {
    if (id !== "new") {
      fetchProject();
    }
    fetchPublications();
  }, [id]);

  const fetchProject = async () => {
    try {
      const data = await api.projects.getOne(id);
      form.reset(data);
      setVideos(data.videos);
      setProjectPublications(data.publications);
      // Преобразование ProjectImage[] в PhotoItem[]
      setImages(data.images?.map(img => ({
        id: img.id,
        url: img.url,
        order: img.order
      })) || []);
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
      setPublications(data);
    } catch (error) {
      console.error("Failed to fetch publications:", error);
    }
  };

  const handlePhotosChange = (newPhotos: PhotoItem[]) => {
    setImages(newPhotos);
  };

  const onSubmit = async (formData: ProjectFormData) => {
    try {
      const projectData: Omit<Project, "id"> = {
        title: formData.title,
        description: formData.description,
        githubLink: formData.githubLink || "",
        videos: videos,
        publications: projectPublications,
        images: images,
      };

      if (id !== "new") {
        await api.projects.update(id, projectData);
      } else {
        await api.projects.create(projectData);
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
    }
  };

  const handleAddVideo = () => {
    if (!newVideoTitle || !newVideoUrl) return;

    const newVideo: ProjectVideo = {
      id: Date.now(),
      title: { en: newVideoTitle, ru: newVideoTitle },
      embedUrl: newVideoUrl,
    };

    setVideos((prev) => [...prev, newVideo]);
    setNewVideoTitle("");
    setNewVideoUrl("");
    setVideoDialogOpen(false);
  };

  const handleRemoveVideo = (videoId: number) => {
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
  };

  const handleAddPublication = (publicationId: number) => {
    const publication = publications.find((p) => p.id === publicationId);
    if (!publication || projectPublications.some((p) => p.id === publicationId))
      return;

    setProjectPublications((prev) => [...prev, publication]);
  };

  const handleRemovePublication = (publicationId: number) => {
    setProjectPublications((prev) =>
      prev.filter((p) => p.id !== publicationId)
    );
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            <LocalizedTextField
              name="title"
              label={dictionary.admin.title}
              required
              lang={lang}
            />

            <LocalizedTextField
              name="description"
              label={dictionary.admin.description}
              multiline
              required
              lang={lang}
            />

            <TextField
              name="githubLink"
              label={dictionary.admin.githubLink}
              type="url"
            />

            <div className="mb-4">
              <Label>{dictionary.admin.images}</Label>
              <div className="mt-2">
                <PhotoUpload
                  photos={images}
                  onPhotosChange={handlePhotosChange}
                  buttonLabel={dictionary.admin.uploadImages || "Upload Images"}
                  errorMessage={dictionary.admin.uploadError}
                  multiple={true}
                />
              </div>
            </div>

            <div>
              <div className="mb-4">
                <Label>{dictionary.admin.publications}</Label>
                <div className="mt-2">
                  <AutoComplete
                    options={publications
                      .filter(
                        (p) =>
                          !projectPublications.some((proj) => proj.id === p.id)
                      )
                      .map((p) => ({
                        value: p.id.toString(),
                        label: p.title[lang],
                      }))}
                    placeholder={dictionary.admin.searchPublications}
                    emptyMessage={dictionary.admin.noPublicationsFound}
                    onValueChange={(option) => {
                      handleAddPublication(parseInt(option.value));
                    }}
                  />
                </div>
                <div className="mt-2 space-y-2">
                  {projectPublications.map((pub) => (
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
                        className="hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>{dictionary.admin.videos}</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVideoDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {dictionary.admin.addVideo}
                </Button>
              </div>
              <div className="space-y-2">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center justify-between border p-2 rounded"
                  >
                    <div>
                      <div className="font-medium">{video.title[lang]}</div>
                      <div className="text-sm text-muted-foreground">
                        {video.embedUrl}
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

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? dictionary.common.saving
              : dictionary.common.save}
          </Button>
        </form>
      </Form>

      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dictionary.admin.addVideo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="video-title">{dictionary.admin.videoTitle}</Label>
              <Input
                id="video-title"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                placeholder={dictionary.admin.videoTitle}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-url">{dictionary.admin.videoUrl}</Label>
              <Input
                id="video-url"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder={dictionary.admin.videoUrl}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>
              {dictionary.common.cancel}
            </Button>
            <Button onClick={handleAddVideo}>
              {dictionary.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
