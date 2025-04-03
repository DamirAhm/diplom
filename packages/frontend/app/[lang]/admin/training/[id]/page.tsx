"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload } from "lucide-react";
import { api, uploadFile } from "../../../../../lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { TextField, LocalizedTextField } from "@/components/ui/form-fields";
import * as z from "zod";
import { ImageWithFallback } from "@/app/components/ImageWithFallback";

const trainingSchema = z.object({
  name: z.object({
    en: z.string().min(1, { message: "English name is required" }),
    ru: z.string().min(1, { message: "Russian name is required" }),
  }),
  description: z.object({
    en: z.string().min(1, { message: "English description is required" }),
    ru: z.string().min(1, { message: "Russian description is required" }),
  }),
  url: z.string().url({ message: "Must be a valid URL" }),
});

type TrainingFormData = z.infer<typeof trainingSchema>;

const emptyMaterial = {
  name: { en: "", ru: "" },
  description: { en: "", ru: "" },
  url: "",
  image: "",
};

export default function TrainingFormPage({
  params: { lang, id },
}: {
  params: { lang: Locale; id: string };
}) {
  const dictionary = getDictionary(lang);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(id !== "new");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const form = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    defaultValues: emptyMaterial,
  });

  useEffect(() => {
    if (id !== "new") {
      fetchMaterial();
    }
  }, [id]);

  const fetchMaterial = async () => {
    try {
      const data = await api.training.getOne(id);
      form.reset({
        name: data.title,
        description: data.description,
        url: data.url,
      });
      setImagePreview(data.image);
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

  const onSubmit = async (formData: TrainingFormData) => {
    try {
      const materialData = {
        title: formData.name,
        description: formData.description,
        url: formData.url,
        image: imagePreview,
      };

      let materialId = id;
      if (id !== "new") {
        await api.training.update(id, materialData);
      } else {
        const newMaterial = await api.training.create(materialData);
        materialId = newMaterial.id.toString();
      }

      if (imageFile) {
        try {
          const { url } = await uploadFile(imageFile);
          await api.training.update(materialId, { image: url });
        } catch (error) {
          console.error("Failed to upload image:", error);
          toast({
            variant: "destructive",
            title: dictionary.common.error,
            description: dictionary.admin.uploadError,
          });
        }
      }

      toast({
        title: dictionary.admin.success,
        description: dictionary.admin.saveSuccess,
      });
      router.push(`/${lang}/admin/training`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: dictionary.common.error,
        description: dictionary.admin.saveError,
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async () => {
    if (!confirm(dictionary.admin.confirmDelete)) return;

    try {
      await api.training.delete(id);
      toast({
        title: dictionary.admin.success,
        description: dictionary.admin.deleteSuccess,
      });
      router.push(`/${lang}/admin/training`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: dictionary.common.error,
        description: dictionary.admin.deleteError,
      });
    }
  };

  const handleCancel = () => {
    router.push(`/${lang}/admin/training`);
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
          onClick={() => router.push(`/${lang}/admin/training`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {dictionary.common.back}
        </Button>
      </div>

      <h1 className="mb-8 text-3xl font-bold">
        {id === "new"
          ? dictionary.admin.addTraining
          : dictionary.admin.editTraining}
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            <LocalizedTextField
              name="name"
              label={dictionary.admin.name}
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
              name="url"
              label={dictionary.admin.url}
              type="url"
              required
            />

            <div className="space-y-2 mt-4">
              <div className="flex flex-col justify-center gap-4">
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("image-upload")?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {dictionary.admin.uploadPhoto}
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
                {imagePreview && (
                  <div className="relative h-24 w-24 overflow-hidden rounded border">
                    <ImageWithFallback
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? dictionary.common.saving : dictionary.common.save}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              {dictionary.common.cancel}
            </Button>
            {id !== "new" && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                {dictionary.common.delete}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}