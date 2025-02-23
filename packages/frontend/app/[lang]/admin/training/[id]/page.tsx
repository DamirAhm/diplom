"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/app/dictionaries";
import type { Locale, TrainingMaterial } from "@/app/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { LocalizedFormField } from "@/components/ui/localized-form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api";

const emptyMaterial: Omit<TrainingMaterial, "id"> = {
  title: { en: "", ru: "" },
  description: { en: "", ru: "" },
  type: "tutorial",
  content: { en: "", ru: "" },
  url: "",
};

export default function TrainingFormPage({
  params: { lang, id },
}: {
  params: { lang: Locale; id: string };
}) {
  const dictionary = getDictionary(lang);
  const router = useRouter();
  const { toast } = useToast();
  const [material, setMaterial] = useState<Omit<TrainingMaterial, "id">>(emptyMaterial);
  const [isLoading, setIsLoading] = useState(id !== "new");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (id !== "new") {
      fetchMaterial();
    }
  }, [id]);

  const fetchMaterial = async () => {
    try {
      const data = await api.training.getOne(id);
      setMaterial(data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (id !== "new") {
        await api.training.update(id, material);
      } else {
        await api.training.create(material);
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
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
          onClick={handleCancel}
          className="group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {dictionary.common.back}
        </Button>
      </div>

      <h1 className="mb-8 text-3xl font-bold">
        {id === "new"
          ? dictionary.admin.addTraining
          : dictionary.admin.editTraining}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <LocalizedFormField
          label={dictionary.admin.title}
          value={material.title}
          onChange={(value) =>
            setMaterial((prev) => ({ ...prev, title: value }))
          }
          required
        />

        <LocalizedFormField
          label={dictionary.admin.description}
          value={material.description}
          onChange={(value) =>
            setMaterial((prev) => ({ ...prev, description: value }))
          }
          multiline
          required
        />

        <div className="relative">
          <Label>{dictionary.admin.type}</Label>
          <Select
            value={material.type}
            onValueChange={(value: "tutorial" | "documentation" | "video") =>
              setMaterial((prev) => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutorial">Tutorial</SelectItem>
              <SelectItem value="documentation">Documentation</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <LocalizedFormField
          label={dictionary.admin.content}
          value={material.content}
          onChange={(value) =>
            setMaterial((prev) => ({ ...prev, content: value }))
          }
          multiline
          required
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? dictionary.common.saving : dictionary.common.save}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              {dictionary.common.cancel}
            </Button>
          </div>
          {id !== "new" && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              {dictionary.common.delete}
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        lang={lang}
      />
    </div>
  );
}