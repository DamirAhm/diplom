export const API_URL =
  typeof window === "undefined"
    ? process.env.API_URL
    : process.env.NEXT_PUBLIC_API_URL;

export const STATIC_URL = process.env.NEXT_PUBLIC_API_URL;
