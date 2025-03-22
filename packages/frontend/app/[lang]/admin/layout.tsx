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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminHeader lang={lang} isAuthorized={isAuthorized} />
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-primary rounded-lg shadow-lg p-6">
          <ErrorBoundary lang={lang}>{children}</ErrorBoundary>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
