"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";

export default function NotFound() {
  const params = useParams();
  const lang = (params?.lang as Locale) || "en";
  const dictionary = getDictionary(lang);

  return (
    <div className="flex h-screen items-center justify-center p-6">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">
          {dictionary.common.notFound}
        </h2>
        <p className="mb-4 text-muted-foreground">
          {dictionary.common.resourceNotFound}
        </p>
        <Link href={`/${lang}/admin/dashboard`}>
          <Button>
            {dictionary.common.backToDashboard}
          </Button>
        </Link>
      </div>
    </div>
  );
}