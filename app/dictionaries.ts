import type { Locale } from "./types";
import EnLocale from "../locales/en.json";
import RuLocale from "../locales/ru.json";

const dictionaries = {
  en: EnLocale,
  ru: RuLocale,
};

export const getDictionary = (locale: Locale = "ru") => {
  return dictionaries[locale];
};
