"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "../../types";

export default function SandboxRedirect({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${lang}/sandbox/superpixel`);
  }, [router, lang]);

  return null;
}
