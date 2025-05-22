"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import type {
  Locale,
  Researcher,
  Project,
  Publication,
  Partner,
  TrainingMaterial,
  CreateDiscipline,
} from "@/app/types";
import { cookies } from "next/headers";

// Researchers
export const createResearcher = async (
  data: Omit<Researcher, "id" | "hIndex" | "publications" | "totalCitations">,
  lang: Locale
) => {
  await api.researchers.create(data);
  revalidatePath(`/${lang}/admin/researchers`);
  revalidatePath(`/${lang}/researchers`);
};

export const updateResearcher = async (
  id: string,
  data: Partial<Researcher>,
  lang: Locale
) => {
  const cookieStore = await cookies();

  console.log(cookieStore.get("admin_session")?.value);

  await api.researchers.update(id, data);
  revalidatePath(`/${lang}/admin/researchers`);
  revalidatePath(`/${lang}/researchers`);
  revalidatePath(`/${lang}/researchers/${id}`);
};

export const deleteResearcher = async (id: string, lang: Locale) => {
  await api.researchers.delete(id);
  revalidatePath(`/${lang}/admin/researchers`);
  revalidatePath(`/${lang}/researchers`);
};

// Projects
export const createProject = async (
  data: Omit<Project, "id">,
  lang: Locale
) => {
  await api.projects.create(data);
  revalidatePath(`/${lang}/admin/projects`);
  revalidatePath(`/${lang}/projects`);
};

export const updateProject = async (
  id: string,
  data: Partial<Project>,
  lang: Locale
) => {
  await api.projects.update(id, data);
  revalidatePath(`/${lang}/admin/projects`);
  revalidatePath(`/${lang}/projects`);
  revalidatePath(`/${lang}/projects/${id}`);
};

export const deleteProject = async (id: string, lang: Locale) => {
  await api.projects.delete(id);
  revalidatePath(`/${lang}/admin/projects`);
  revalidatePath(`/${lang}/projects`);
  revalidatePath(`/${lang}/projects/${id}`);
};

// Publications
export const createPublication = async (data: Publication, lang: Locale) => {
  await api.publications.create(data);
  revalidatePath(`/${lang}/admin/publications`);
  revalidatePath(`/${lang}/publications`);
};

export const updatePublication = async (
  id: string,
  data: Publication,
  lang: Locale
) => {
  await api.publications.update(Number(id), data);
  revalidatePath(`/${lang}/admin/publications`);
  revalidatePath(`/${lang}/publications`);
  revalidatePath(`/${lang}/publications/${id}`);
};

export const deletePublication = async (id: string, lang: Locale) => {
  await api.publications.delete(Number(id));
  revalidatePath(`/${lang}/admin/publications`);
  revalidatePath(`/${lang}/publications`);
};

// Partners
export const createPartner = async (
  data: Omit<Partner, "id">,
  lang: Locale
) => {
  await api.partners.create(data);
  revalidatePath(`/${lang}/admin/partners`);
  revalidatePath(`/${lang}/partners`);
};

export const updatePartner = async (
  id: string,
  data: Partial<Partner>,
  lang: Locale
) => {
  await api.partners.update(id, data);
  revalidatePath(`/${lang}/admin/partners`);
  revalidatePath(`/${lang}/partners`);
  revalidatePath(`/${lang}/partners/${id}`);
};

export const deletePartner = async (id: string, lang: Locale) => {
  await api.partners.delete(id);
  revalidatePath(`/${lang}/admin/partners`);
  revalidatePath(`/${lang}/partners`);
};

// Disciplines
export const createDiscipline = async (
  data: CreateDiscipline,
  lang: Locale
) => {
  await api.disciplines.create(data);
  revalidatePath(`/${lang}/admin/disciplines`);
  revalidatePath(`/${lang}/disciplines`);
};

export const updateDiscipline = async (
  id: string,
  data: CreateDiscipline,
  lang: Locale
) => {
  await api.disciplines.update(id, data);
  revalidatePath(`/${lang}/admin/disciplines`);
  revalidatePath(`/${lang}/disciplines`);
  revalidatePath(`/${lang}/disciplines/${id}`);
};

export const deleteDiscipline = async (id: string, lang: Locale) => {
  await api.disciplines.delete(id);
  revalidatePath(`/${lang}/admin/disciplines`);
  revalidatePath(`/${lang}/disciplines`);
};

// Training
export const createTraining = async (
  data: Omit<TrainingMaterial, "id">,
  lang: Locale
) => {
  await api.training.create(data);
  revalidatePath(`/${lang}/admin/training`);
  revalidatePath(`/${lang}/training`);
};

export const updateTraining = async (
  id: string,
  data: Partial<TrainingMaterial>,
  lang: Locale
) => {
  await api.training.update(id, data);
  revalidatePath(`/${lang}/admin/training`);
  revalidatePath(`/${lang}/training`);
  revalidatePath(`/${lang}/training/${id}`);
};

export const deleteTraining = async (id: string, lang: Locale) => {
  await api.training.delete(id);
  revalidatePath(`/${lang}/admin/training`);
  revalidatePath(`/${lang}/training`);
};
