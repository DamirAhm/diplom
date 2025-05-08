"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { DisciplineFormData, disciplineSchema } from "../schema";
import { api, uploadFile } from "@/lib/api";
import { Form, FormMessage } from "@/components/ui/form";
import { LocalizedTextField } from "@/components/ui/form-fields";
import { ImageWithFallback } from "@/app/components/ImageWithFallback";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Researcher } from "@/app/types";

// Interface for the simplified researcher representation used in disciplines
interface DisciplineResearcher {
    id: number;
    name: {
        en: string;
        ru: string;
    };
}

const emptyForm: DisciplineFormData = {
    title: { en: "", ru: "" },
    description: { en: "", ru: "" },
    researchers: [],
    image: "",
};

export default function DisciplineFormPage({
    params: { lang, id },
}: {
    params: { lang: Locale; id: string };
}) {
    const dictionary = getDictionary(lang);
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(id !== "new");
    const [photoPreview, setPhotoPreview] = useState<string>("");
    const [researchers, setResearchers] = useState<Researcher[]>([]);
    const [selectedResearchers, setSelectedResearchers] = useState<Set<number>>(new Set());
    const [showResearcherSelector, setShowResearcherSelector] = useState(false);

    const form = useForm<DisciplineFormData>({
        resolver: zodResolver(disciplineSchema),
        defaultValues: emptyForm,
        mode: "onBlur",
    });

    const { setValue, watch, reset, formState } = form;
    const formResearchers = watch("researchers");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all researchers for the selection
                const allResearchers = await api.researchers.getAll();
                setResearchers(allResearchers);

                if (id !== "new") {
                    const discipline = await api.disciplines.getOne(id);
                    reset(discipline);
                    setPhotoPreview(discipline.image);

                    // Track selected researchers
                    const selectedIds = new Set(discipline.researchers.map(r => r.id));
                    setSelectedResearchers(selectedIds);
                }
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

        fetchData();
    }, [id, reset, toast, dictionary]);

    const onSubmit = form.handleSubmit(async (data: DisciplineFormData) => {
        try {
            if (id === "new") {
                await api.disciplines.create(data);
            } else {
                await api.disciplines.update(id, data);
            }

            toast({
                title: dictionary.admin.success,
                description: dictionary.admin.saveSuccess,
            });
            router.push(`/${lang}/admin/disciplines`);
        } catch (error) {
            toast({
                variant: "destructive",
                title: dictionary.common.error,
                description: dictionary.admin.saveError,
            });
        }
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const { url } = await uploadFile(file);
                setValue("image", url);
                setPhotoPreview(url);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: dictionary.common.error,
                    description: dictionary.admin.uploadError,
                });
            }
        }
    };

    const toggleResearcher = (researcher: Researcher) => {
        const newSelectedResearchers = new Set(selectedResearchers);
        const researcherExists = formResearchers.some(r => r.id === researcher.id);

        if (researcherExists) {
            // Remove researcher
            newSelectedResearchers.delete(researcher.id);
            setValue("researchers", formResearchers.filter(r => r.id !== researcher.id));
        } else {
            // Add researcher
            newSelectedResearchers.add(researcher.id);

            // Create a simplified researcher representation for the discipline
            const disciplineResearcher: DisciplineResearcher = {
                id: researcher.id,
                name: {
                    en: `${researcher.name.en} ${researcher.lastName.en}`,
                    ru: `${researcher.name.ru} ${researcher.lastName.ru}`
                }
            };

            setValue("researchers", [
                ...formResearchers,
                disciplineResearcher
            ]);
        }

        setSelectedResearchers(newSelectedResearchers);
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
                    onClick={() => router.push(`/${lang}/admin/disciplines`)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {dictionary.common.back}
                </Button>
            </div>

            <h1 className="mb-8 text-3xl font-bold">
                {id === "new"
                    ? dictionary.admin.addDiscipline || "Add Discipline"
                    : dictionary.admin.editDiscipline || "Edit Discipline"}
            </h1>

            <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-8">
                    {formState.errors.root && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                            {formState.errors.root.message}
                        </div>
                    )}

                    <div className="space-y-4">
                        <LocalizedTextField
                            name="title"
                            label={dictionary.admin.title || "Title"}
                            required
                            lang={lang}
                        />

                        <LocalizedTextField
                            name="description"
                            label={dictionary.admin.description || "Description"}
                            multiline
                            required
                            lang={lang}
                        />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">{dictionary.admin.image || "Image"}</div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById("image-upload")?.click()}
                                >
                                    {dictionary.admin.uploadImage || "Upload Image"}
                                </Button>
                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </div>
                            {photoPreview && (
                                <div className="mt-2">
                                    <ImageWithFallback
                                        src={photoPreview}
                                        alt="Discipline image"
                                        width={200}
                                        height={150}
                                        className="rounded-md object-cover"
                                    />
                                </div>
                            )}
                            <FormField
                                control={form.control}
                                name="image"
                                render={() => (
                                    <FormItem>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <FormLabel>
                                    {dictionary.admin.researchers || "Researchers"}
                                    <span className="text-destructive ml-1">*</span>
                                </FormLabel>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowResearcherSelector(!showResearcherSelector)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {dictionary.admin.addResearcher || "Add Researcher"}
                                </Button>
                            </div>

                            {/* Selected researchers list */}
                            {formResearchers.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {formResearchers.map((researcher) => (
                                        <Badge
                                            key={researcher.id}
                                            variant="default"
                                            className="flex items-center gap-1 px-3 py-1"
                                        >
                                            {researcher.name[lang]}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 p-0 ml-1"
                                                onClick={() => {
                                                    // Find the full researcher to toggle
                                                    const fullResearcher = researchers.find(r => r.id === researcher.id);
                                                    if (fullResearcher) {
                                                        toggleResearcher(fullResearcher);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Researcher selector */}
                            {showResearcherSelector && (
                                <Card className="mt-2">
                                    <CardContent className="p-4">
                                        <ScrollArea className="h-60">
                                            <div className="space-y-2">
                                                {researchers.map((researcher) => (
                                                    <div
                                                        key={researcher.id}
                                                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${selectedResearchers.has(researcher.id)
                                                            ? 'bg-primary/10 border border-primary/30'
                                                            : 'hover:bg-primary/5'
                                                            }`}
                                                        onClick={() => toggleResearcher(researcher)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {researcher.photo && (
                                                                <ImageWithFallback
                                                                    src={researcher.photo}
                                                                    alt={`${researcher.name[lang]} ${researcher.lastName[lang]}`}
                                                                    width={30}
                                                                    height={30}
                                                                    className="rounded-full object-cover"
                                                                />
                                                            )}
                                                            <span>{researcher.name[lang]} {researcher.lastName[lang]}</span>
                                                        </div>
                                                        {selectedResearchers.has(researcher.id) && (
                                                            <Check className="h-4 w-4 text-primary" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            )}

                            <FormField
                                control={form.control}
                                name="researchers"
                                render={() => (
                                    <FormItem>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push(`/${lang}/admin/disciplines`)}
                        >
                            {dictionary.common.cancel}
                        </Button>
                        <Button type="submit">
                            {dictionary.common.save}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
} 