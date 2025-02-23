import type { Locale } from "@/app/types";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { AdminHeader } from "../../components/AdminHeader/AdminHeader";
import { cookies } from "next/headers";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: { lang: Locale };
}

export default function AdminLayout({
  children,
  params: { lang },
}: AdminLayoutProps) {
  const c = cookies();

  const isAuthorized = c.get("admin_session") !== undefined;

  return (
    <div className="min-h-screen">
      <AdminHeader lang={lang} isAuthorized={isAuthorized} />
      <div className="container mx-auto p-6">
        <ErrorBoundary lang={lang}>{children}</ErrorBoundary>
      </div>
      <Toaster />
    </div>
  );
}
