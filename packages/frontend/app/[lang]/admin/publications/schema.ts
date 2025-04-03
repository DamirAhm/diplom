import * as z from "zod";

export const localizedStringSchema = z.object({
    en: z.string().min(1, { message: "English translation is required" }),
    ru: z.string().min(1, { message: "Russian translation is required" }),
});

export const authorSchema = z.object({
    name: localizedStringSchema,
    id: z.number().optional(),
});

export const publicationSchema = z.object({
    id: z.number().optional(),
    title: localizedStringSchema,
    authors: z.array(authorSchema),
    publishedAt: z.string(),
    journal: z.string(),
    link: z.string().url({ message: "Must be a valid URL" }),
});

export const publicationFormSchema = z.object({
    title: localizedStringSchema,
    authors: z.array(z.number()),
    externalAuthors: z.array(localizedStringSchema),
    publishedAt: z.string(),
    journal: z.string(),
    link: z.string().url({ message: "Must be a valid URL" }),
});

export type PublicationData = z.infer<typeof publicationSchema>;
export type PublicationFormData = z.infer<typeof publicationFormSchema>;

export const emptyPublication: PublicationFormData = {
    title: { en: "", ru: "" },
    authors: [],
    externalAuthors: [],
    publishedAt: new Date().toISOString().split("T")[0],
    journal: "",
    link: "",
}; 