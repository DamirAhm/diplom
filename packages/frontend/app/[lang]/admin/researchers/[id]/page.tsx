"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { ResearcherFormData, researcherSchema } from "../schema";
import { api } from "@/lib/api";
import { Form, FormMessage } from "@/components/ui/form";
import { LocalizedTextField } from "@/components/ui/form-fields";
import { ProfileDialog } from "@/app/components/ui/profile-dialog";
import { FormField, FormItem } from "@/components/ui/form";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { createResearcher, updateResearcher } from "../../actions";

type ProfileKey =
  | "researchgate"
  | "googleScholar"
  | "scopus"
  | "publons"
  | "orcid";

const emptyForm: ResearcherFormData = {
  name: { en: "", ru: "" },
  lastName: { en: "", ru: "" },
  position: { en: "", ru: "" },
  bio: { en: "", ru: "" },
  photo: "",
  profiles: {},
};

export default function ResearcherFormPage({
  params: { lang, id },
}: {
  params: { lang: Locale; id: string };
}) {
  const dictionary = getDictionary(lang);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(id !== "new");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const form = useForm<ResearcherFormData>({
    resolver: zodResolver(researcherSchema),
    defaultValues: emptyForm,
    mode: "onBlur",
  });

  const { setValue, watch } = form;
  const profiles = watch("profiles");
  const photoUrl = watch("photo");

  useEffect(() => {
    if (id !== "new") {
      fetchResearcher();
    }
  }, [id]);

  const fetchResearcher = async () => {
    try {
      const data = await api.researchers.getOne(id);
      form.reset(data);
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

  const onSubmit = form.handleSubmit(async (data: ResearcherFormData) => {
    try {
      if (id === "new") {
        await createResearcher(data, lang);
      } else {
        await updateResearcher(id, data, lang);
      }

      toast({
        title: dictionary.admin.success,
        description: dictionary.admin.saveSuccess,
      });
      router.push(`/${lang}/admin/researchers`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: dictionary.common.error,
        description: dictionary.admin.saveError,
      });
    }
  });

  const handlePhotoChange = (url: string) => {
    setValue("photo", url);
  };

  const handleAddProfile = () => {
    setProfileDialogOpen(true);
  };

  const handleProfileSubmit = (type: string, url: string) => {
    const currentProfiles = profiles || {};
    setValue("profiles", { ...currentProfiles, [type]: url });
  };

  const handleRemoveProfile = (key: string) => {
    const currentProfiles = { ...profiles };
    delete currentProfiles[key as ProfileKey];
    setValue("profiles", currentProfiles);
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
          onClick={() => router.push(`/${lang}/admin/researchers`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {dictionary.common.back}
        </Button>
      </div>

      <h1 className="mb-8 text-3xl font-bold">
        {id === "new"
          ? dictionary.admin.addResearcher
          : dictionary.admin.editResearcher}
      </h1>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-8">
          {form.formState.errors.root && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {form.formState.errors.root.message}
            </div>
          )}

          <div className="space-y-4">
            <LocalizedTextField
              name="name"
              label={dictionary.admin.name}
              required
              lang={lang}
            />

            <LocalizedTextField
              name="lastName"
              label={dictionary.admin.lastName}
              required
              lang={lang}
            />

            <LocalizedTextField
              name="position"
              label={(dictionary.admin as any).position || "Position"}
              required
              lang={lang}
            />

            <LocalizedTextField
              name="bio"
              label={dictionary.admin.bio}
              multiline
              required
              lang={lang}
            />

            <div className="space-y-2">
              <div className="text-sm font-medium">
                {dictionary.admin.photo}
              </div>
              <PhotoUpload
                photoUrl={photoUrl}
                onPhotoChange={handlePhotoChange}
                buttonLabel={dictionary.admin.uploadPhoto || "Upload photo"}
                errorMessage={dictionary.admin.uploadError}
                multiple={false}
              />
              <FormField
                control={form.control}
                name="photo"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {dictionary.admin.profiles}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddProfile}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {dictionary.admin.addProfile}
                </Button>
              </div>
              <div className="space-y-2">
                {profiles &&
                  Object.entries(profiles).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div>
                        <div className="font-medium">{key}</div>
                        <div className="text-sm text-muted-foreground">
                          {value}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveProfile(key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
              <FormField
                control={form.control}
                name="profiles"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? dictionary.common.saving
              : dictionary.common.save}
          </Button>
        </form>
      </Form>

      <ProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        onSubmit={handleProfileSubmit}
        availableTypes={[
          { key: "researchgate", label: "ResearchGate" },
          { key: "googleScholar", label: "Google Scholar" },
          { key: "scopus", label: "Scopus" },
          { key: "publons", label: "Publons" },
          { key: "orcid", label: "ORCID" },
        ]}
      />
    </div>
  );
}
