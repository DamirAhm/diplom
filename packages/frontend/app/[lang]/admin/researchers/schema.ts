import * as z from "zod";

export const localizedStringSchema = z.object({
  en: z.string().min(1, { message: "English translation is required" }),
  ru: z.string().min(1, { message: "Russian translation is required" }),
});

const publicationSchema = z.object({
  id: z.number(),
  title: localizedStringSchema,
  authors: z.string(),
  year: z.number(),
  journal: z.string(),
  doi: z.string(),
  url: z.string().url({ message: "Must be a valid URL" }),
});

export const researcherSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  title: localizedStringSchema,
  bio: localizedStringSchema,
  photo: z.string(),
  profiles: z
    .object({
      researchgate: z
        .string()
        .url({ message: "Must be a valid URL" })
        .optional(),
      googleScholar: z
        .string()
        .url({ message: "Must be a valid URL" })
        .optional(),
      scopus: z.string().url({ message: "Must be a valid URL" }).optional(),
      publons: z.string().url({ message: "Must be a valid URL" }).optional(),
      orcid: z.string().url({ message: "Must be a valid URL" }).optional(),
    })
    .default({}), // Set default empty object instead of making the whole field optional
  publications: z.array(publicationSchema).default([]),
});

export type ResearcherFormData = z.infer<typeof researcherSchema>;
