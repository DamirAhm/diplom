import { getDictionary } from "@/app/dictionaries";
import { Locale } from "@/app/types";
import { useParams } from "next/navigation";

export const useDictionary = () => {
  const { lang } = useParams<{ lang: Locale }>();

  const dictionary = getDictionary(lang);

  return dictionary;
};
