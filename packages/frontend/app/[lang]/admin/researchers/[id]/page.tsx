"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { ResearcherFormData, researcherSchema } from "../schema";
import { api, uploadFile } from "@/lib/api";
import { LocalizedFormField } from "@/components/ui/localized-form-field";
import { useFormNavigation } from "@/hooks/use-form-navigation";
import { ProfileDialog } from "@/app/components/ui/profile-dialog";

const emptyForm: ResearcherFormData = {
  name: "",
  title: { en: "", ru: "" },
  bio: { en: "", ru: "" },
  photo: "",
  profiles: {}, // Initialize with empty object instead of undefined
  publications: [],
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

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ResearcherFormData>({
    resolver: zodResolver(researcherSchema),
    defaultValues: emptyForm,
  });

  const { formRef } = useFormNavigation({
    onSave: handleSubmit(onSubmit),
    onCancel: () => router.push(`/${lang}/admin/researchers`),
  });

  useEffect(() => {
    if (id !== "new") {
      fetchResearcher();
    }
  }, [id]);

  const fetchResearcher = async () => {
    try {
      const data = await api.researchers.getOne(id);
      Object.entries(data).forEach(([key, value]) => {
        setValue(key as keyof ResearcherFormData, value);
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

  async function onSubmit(data: ResearcherFormData) {
    try {
      if (id === "new") {
        await api.researchers.create(data);
      } else {
        await api.researchers.update(id, data);
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
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { url } = await uploadFile(file);
      setValue("photo", url);
    } catch (error) {
      toast({
        variant: "destructive",
        title: dictionary.common.error,
        description: dictionary.admin.uploadError,
      });
    }
  };

  const handleAddProfile = () => {
    const profiles = {
      researchgate: "ResearchGate",
      googleScholar: "Google Scholar",
      scopus: "Scopus",
      publons: "Publons",
      orcid: "ORCID",
    };

    const availableTypes = Object.entries(profiles)
      .filter(([key]) => !control._formValues.profiles?.[key])
      .map(([key, label]) => ({ key, label }));

    if (availableTypes.length === 0) {
      toast({
        variant: "destructive",
        title: dictionary.common.error,
        description: dictionary.admin.noMoreProfiles,
      });
      return;
    }

    setProfileDialogOpen(true);
  };

  const handleProfileSubmit = (type: string, url: string) => {
    const currentProfiles = control._formValues.profiles || {};
    setValue("profiles", { ...currentProfiles, [type]: url });
  };

  const handleRemoveProfile = (key: string) => {
    const currentProfiles = { ...control._formValues.profiles };
    delete currentProfiles[key];
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
          className="group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {dictionary.common.back}
          <kbd className="ml-2 hidden rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block">
            Esc
          </kbd>
        </Button>
      </div>

      <h1 className="mb-8 text-3xl font-bold">
        {id === "new"
          ? dictionary.admin.addResearcher
          : dictionary.admin.editResearcher}
      </h1>

      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{dictionary.admin.name}</Label>
            <Input
              id="name"
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <LocalizedFormField
            label={dictionary.admin.title}
            value={watch("title")}
            onChange={(value) => setValue("title", value)}
            required
          />

          <LocalizedFormField
            label={dictionary.admin.bio}
            value={watch("bio")}
            onChange={(value) => setValue("bio", value)}
            multiline
            required
          />

          <div>
            <Label htmlFor="photo">{dictionary.admin.photo}</Label>
            <div className="flex items-center gap-4">
              {control._formValues.photo && (
                <img
                  src={control._formValues.photo}
                  alt={control._formValues.name}
                  className="h-20 w-20 object-cover rounded"
                />
              )}
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>{dictionary.admin.profiles}</Label>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddProfile}
              >
                {dictionary.admin.addProfile}
              </Button>
            </div>
            <div className="space-y-2">
              {Object.entries(control._formValues.profiles || {}).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between border p-2 rounded"
                  >
                    <div>
                      <div className="font-medium">{key}</div>
                      <div className="text-sm text-muted-foreground">
                        {value as string}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveProfile(key)}
                    >
                      {dictionary.common.delete}
                    </Button>
                  </div>
                )
              )}
              {errors.profiles && (
                <p className="mt-1 text-sm text-destructive">
                  {dictionary.common.invalidInput}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <div className="space-x-2">
            <Button type="submit" disabled={isSubmitting} className="relative">
              {isSubmitting ? dictionary.common.saving : dictionary.common.save}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${lang}/admin/researchers`)}
              className="relative"
            >
              {dictionary.common.cancel}
              <kbd className="ml-2 hidden rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block">
                Esc
              </kbd>
            </Button>
          </div>
        </div>
      </form>

      <ProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        onSubmit={handleProfileSubmit}
        availableTypes={Object.entries({
          researchgate: "ResearchGate",
          googleScholar: "Google Scholar",
          scopus: "Scopus",
          publons: "Publons",
          orcid: "ORCID",
        })
          .filter(([key]) => !control._formValues.profiles?.[key])
          .map(([key, label]) => ({ key, label }))}
        dictionary={{
          admin: {
            addProfile: dictionary.admin.addProfile,
            enterProfileType: dictionary.admin.enterProfileType,
            enterProfileUrl: dictionary.admin.enterProfileUrl,
          },
          common: {
            add: dictionary.common.add,
            cancel: dictionary.common.cancel,
          },
        }}
      />
    </div>
  );
}
