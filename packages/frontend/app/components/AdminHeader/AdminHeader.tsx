"use client";

import { usePathname } from "next/navigation";
import { Locale } from "../../types";
import { getDictionary } from "../../dictionaries";
import Link from "next/link";
import {
  Users,
  BookOpen,
  FileText,
  Building2,
  LibraryBig,
  LogOut,
} from "lucide-react";
import { api } from "../../../lib/api";
import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";

const navigation = [
  {
    title: "projects",
    href: "/admin/projects",
    icon: BookOpen,
  },
  {
    title: "publications",
    href: "/admin/publications",
    icon: FileText,
  },
  {
    title: "researchers",
    href: "/admin/researchers",
    icon: Users,
  },
  {
    title: "partners",
    href: "/admin/partners",
    icon: Building2,
  },
  {
    title: "training",
    href: "/admin/training",
    icon: LibraryBig,
  },
] as const;

export const AdminHeader = ({
  lang,
  isAuthorized,
}: {
  lang: Locale;
  isAuthorized: boolean;
}) => {
  const pathname = usePathname();
  const dictionary = getDictionary(lang);

  const handleLogout = async () => {
    await api.auth.logout();
    window.location.href = `/${lang}/admin`;
  };

  return (
    <header className="bg-sidebar-background dark:bg-sidebar-background text-sidebar-foreground">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href={`/${lang}/admin/dashboard`} className="text-2xl font-bold">
            {dictionary.admin.adminPanel}
          </Link>
          <nav className="flex items-center space-x-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const href = `/${lang}${item.href}`;
              const isActive = pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 ease-in-out rounded-lg",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{dictionary.admin[item.title]}</span>
                </Link>
              );
            })}
          </nav>
          {isAuthorized ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {dictionary.admin.logout}
            </Button>
          ) : <div />}
        </div>
      </div>
    </header>
  );
};
