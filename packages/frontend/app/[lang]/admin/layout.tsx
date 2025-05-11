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
    <div className="bg-background admin-layout">
      <AdminHeader lang={lang} isAuthorized={isAuthorized} />
      <main className="container mx-auto px-4 py-8">
        <div className="admin-content-panel bg-card border border-border/50 rounded-lg shadow-lg p-6">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
