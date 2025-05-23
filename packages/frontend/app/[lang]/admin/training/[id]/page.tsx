"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { api } from "../../../../../lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { TextField, LocalizedTextField } from "@/components/ui/form-fields";
import * as z from "zod";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { createTraining, updateTraining, deleteTraining } from "../../actions";

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
  image: z.string().optional(),
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

  const form = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    defaultValues: emptyMaterial,
  });

  const { setValue, watch } = form;
  const imageUrl = watch("image");

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
        image: data.image,
      });
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
        image: formData.image,
      };

      if (id !== "new") {
        await updateTraining(id, materialData, lang);
      } else {
        await createTraining(materialData, lang);
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

  const handlePhotoChange = (url: string) => {
    setValue("image", url);
  };

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
              <div className="text-sm font-medium">
                {dictionary.admin.photo}
              </div>
              <PhotoUpload
                photoUrl={imageUrl}
                onPhotoChange={handlePhotoChange}
                buttonLabel={dictionary.admin.uploadPhoto || "Upload photo"}
                errorMessage={dictionary.admin.uploadError}
                multiple={false}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? dictionary.common.saving
                : dictionary.common.save}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
