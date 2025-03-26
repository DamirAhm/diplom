import * as z from "zod";

export const localizedStringSchema = z.object({
    en: z.string().min(1, { message: "English translation is required" }),
    ru: z.string().min(1, { message: "Russian translation is required" }),
});

// Schema for author
export const authorSchema = z.object({
    name: localizedStringSchema,
    id: z.number().optional(),
});

// Schema for publications with authors as Author objects
export const publicationSchema = z.object({
    id: z.number().optional(), // Optional for new publications
    title: localizedStringSchema,
    authors: z.array(authorSchema),
    publishedAt: z.string(), // ISO date string
    journal: z.string(),
    link: z.string().url({ message: "Must be a valid URL" }),
});

// Schema for publication form data (with authors as IDs and externalAuthors as strings)
export const publicationFormSchema = z.object({
    title: localizedStringSchema,
    authors: z.array(z.number()), // Array of researcher IDs for form submission
    externalAuthors: z.array(localizedStringSchema), // Array of external author names
    publishedAt: z.string(), // ISO date string
    journal: z.string(),
    link: z.string().url({ message: "Must be a valid URL" }),
});

// Types derived from schemas
export type PublicationData = z.infer<typeof publicationSchema>;
export type PublicationFormData = z.infer<typeof publicationFormSchema>;

// Empty publication form data for initialization
export const emptyPublication: PublicationFormData = {
    title: { en: "", ru: "" },
    authors: [],
    externalAuthors: [],
    publishedAt: new Date().toISOString().split("T")[0],
    journal: "",
    link: "",
}; 