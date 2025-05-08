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
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";
import { api, uploadFile } from "../../../../../lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { TextField, LocalizedTextField } from "@/components/ui/form-fields";
import * as z from "zod";
import { AutoComplete } from "@/components/ui/autocomplete";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { ImageWithFallback } from "../../../../components/ImageWithFallback";

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
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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
      form.reset({
        title: data.title,
        description: data.description,
        githubLink: data.githubLink || "",
      });
      setVideos(data.videos);
      setProjectPublications(data.publications);
      setImages(data.images || []);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    setIsUploading(true);
    try {
      const filesRes = await Promise.allSettled(
        Array.from(e.target.files).map(async (file, index) => {
          const response = await uploadFile(file);

          return {
            id: Date.now() + index,
            url: response.url,
            order: images.length + index,
          };
        })
      ).then((res) => res.filter((r) => r.status === "fulfilled"));

      const files = filesRes.map((res) => res.value);

      setImages((prev) => [...prev, ...files]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: dictionary.common.error,
        description: dictionary.admin.uploadError,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (imageId: number) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
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
    const title = prompt(dictionary.admin.videoTitle);
    if (!title) return;

    const url = prompt(dictionary.admin.videoUrl);
    if (!url) return;

    const newVideo: ProjectVideo = {
      id: Date.now(),
      title: { en: title, ru: title },
      embedUrl: url,
    };

    setVideos((prev) => [...prev, newVideo]);
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

            <div>
              <div className="mb-4">
                <Label>{dictionary.admin.images}</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("image-upload")?.click()
                    }
                    disabled={isUploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading
                      ? dictionary.common.saving
                      : dictionary.admin.uploadImages}
                  </Button>
                </div>
                {images.length > 0 && (
                  <div className="mt-4 w-[300px]">
                    <Carousel opts={{ loop: true }}>
                      <CarouselContent>
                        {images.map((image) => (
                          <CarouselItem key={image.id}>
                            <div className="relative">
                              <ImageWithFallback
                                width={300}
                                height={300}
                                src={image.url}
                                alt="Project image"
                                className="object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => handleRemoveImage(image.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious type="button" />
                      <CarouselNext type="button" />
                    </Carousel>
                  </div>
                )}
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
                  onClick={handleAddVideo}
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
    </div>
  );
}
