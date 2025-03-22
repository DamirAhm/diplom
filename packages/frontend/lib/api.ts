const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("API_URL environment variable is not defined");
}

import {
  Researcher,
  Partner,
  Project,
  Publication,
  TrainingMaterial,
  LocalizedString,
} from "../app/types";
import { hashPassword } from "./password";

interface ApiError extends Error {
  status?: number;
}

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions extends RequestInit {
  method?: RequestMethod;
  data?: any;
}

interface LoginResponse {
  token: string;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { data, method = "GET", headers = {}, ...customConfig } = options;

  const config: RequestInit = {
    method,
    credentials: "include",
    headers: {
      ...(!options.body && { "Content-Type": "application/json" }),
      ...headers,
    },
    ...customConfig,
  };

  if (data && !options.body) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    if (!response.ok) {
      const error: ApiError = new Error("API request failed");
      error.status = response.status;
      throw error;
    }

    const result = await response.json();
    return result as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred");
  }
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  return request<{ url: string }>("/upload", {
    method: "POST",
    body: formData,
    headers: {}, // Override default JSON content-type since we're sending FormData
  });
}

export const api = {
  get: <T>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "data">
  ) => request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(
    endpoint: string,
    data: any,
    options?: Omit<RequestOptions, "method">
  ) => request<T>(endpoint, { ...options, method: "POST", data }),
  put: <T>(
    endpoint: string,
    data: any,
    options?: Omit<RequestOptions, "method">
  ) => request<T>(endpoint, { ...options, method: "PUT", data }),
  delete: <T>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "data">
  ) => request<T>(endpoint, { ...options, method: "DELETE" }),
  auth: {
    login: async (username: string, password: string) => {
      const hashedPassword = await hashPassword(password);
      return request<LoginResponse>("/auth/login", {
        method: "POST",
        data: { username, password: hashedPassword },
      });
    },
    logout: () => request<void>("/auth/logout", { method: "POST" }),
  },
  researchers: {
    getAll: () => request<Researcher[]>("/researchers"),
    getOne: (id: string) => request<Researcher>(`/researchers/${id}`),
    create: (data: Omit<Researcher, "id" | "publications" | "totalCitations">) =>
      request<Researcher>("/researchers", { method: "POST", data }),
    update: (id: string, data: Partial<Omit<Researcher, "publications">>) =>
      request<Researcher>(`/researchers/${id}`, { method: "PUT", data }),
    delete: (id: string) =>
      request<void>(`/researchers/${id}`, { method: "DELETE" }),
  },
  projects: {
    getAll: () => request<Project[]>("/projects"),
    getOne: (id: string) => request<Project>(`/projects/${id}`),
    create: (data: Omit<Project, "id">) =>
      request<Project>("/projects", { method: "POST", data }),
    update: (id: string, data: Partial<Project>) =>
      request<Project>(`/projects/${id}`, { method: "PUT", data }),
    delete: (id: string) =>
      request<void>(`/projects/${id}`, { method: "DELETE" }),
  },
  publications: {
    getAll: () => request<Publication[]>("/publications"),
    getOne: (id: string) => request<Publication>(`/publications/${id}`),
    create: (data: Omit<Publication, "id">) =>
      request<Publication>("/publications", { method: "POST", data }),
    update: (id: string, data: Partial<Publication>) =>
      request<Publication>(`/publications/${id}`, { method: "PUT", data }),
    delete: (id: string) =>
      request<void>(`/publications/${id}`, { method: "DELETE" }),
  },
  partners: {
    getAll: () =>
      request<{
        universities: Partner[];
        enterprises: Partner[];
        jointProjects: {
          id: number;
          title: LocalizedString;
          partners: string[];
          year: number;
        }[];
        jointPublications: {
          id: number;
          title: LocalizedString;
          authors: string;
          journal: string;
          year: number;
          link: string;
        }[];
      }>("/partners"),
    getOne: (id: string) => request<Partner>(`/partners/${id}`),
    create: (data: Omit<Partner, "id">) =>
      request<Partner>("/partners", { method: "POST", data }),
    update: (id: string, data: Partial<Partner>) =>
      request<Partner>(`/partners/${id}`, { method: "PUT", data }),
    delete: (id: string) =>
      request<void>(`/partners/${id}`, { method: "DELETE" }),
  },
  training: {
    getAll: () => request<TrainingMaterial[]>("/training"),
    getOne: (id: string) => request<TrainingMaterial>(`/training/${id}`),
    create: (data: Omit<TrainingMaterial, "id">) =>
      request<TrainingMaterial>("/training", { method: "POST", data }),
    update: (id: string, data: Partial<TrainingMaterial>) =>
      request<TrainingMaterial>(`/training/${id}`, { method: "PUT", data }),
    delete: (id: string) =>
      request<void>(`/training/${id}`, { method: "DELETE" }),
  },
};
