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
    <div className="border-b">
      <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center px-4 gap-4">
        <div />
        <nav className="grid grid-flow-col gap-4 auto-cols-max">
          {navigation.map((item) => {
            const Icon = item.icon;
            const href = `/${lang}${item.href}`;
            const isActive = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium relative transition-colors duration-200 ease-in-out rounded-xl border-2 border-transparent",
                  isActive
                    ? "bg-slate-700 text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:border-slate-700 border-solid border-2"
                )}
              >
                <Icon size={4} className={"h-4 w-4"} />
                <span>{dictionary.admin[item.title]}</span>
              </Link>
            );
          })}
        </nav>
        {isAuthorized && (
          <div className="flex items-center space-x-4 flex-1 justify-end">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {dictionary.admin.logout}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
