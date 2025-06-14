"use client";

import { usePathname, useRouter } from "next/navigation";
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
  Bookmark,
  Menu,
  X,
} from "lucide-react";
import { api } from "../../../lib/api";
import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";
import { useState } from "react";

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
    title: "disciplines",
    href: "/admin/disciplines",
    icon: Bookmark,
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
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await api.auth.logout();
    document.location.replace(`/${lang}/admin`);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="bg-sidebar-background dark:bg-sidebar-background text-sidebar-foreground">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href={`/${lang}/admin/dashboard`} className="text-2xl font-bold">
            {dictionary.admin.adminPanel}
          </Link>

          <div className="flex items-center gap-4 lg:hidden">
            {isAuthorized && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {dictionary.admin.logout}
              </Button>
            )}
            <button
              onClick={toggleMenu}
              className="text-sidebar-foreground focus:outline-none rounded-md"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <nav className="hidden lg:flex items-center space-x-4">
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
            <div className="hidden lg:block">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {dictionary.admin.logout}
              </Button>
            </div>
          ) : <div />}
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[125px] z-30 transition-all duration-200 ease-in-out bg-card dark:bg-sidebar-background border-t border-border dark:border-indigo-900/30 shadow-lg">
          <nav className="container mx-auto px-4 py-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const href = `/${lang}${item.href}`;
                const isActive = pathname.startsWith(href);

                return (
                  <li
                    key={href}
                    className="border-b border-border/40 dark:border-indigo-900/20 last:border-0"
                  >
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-2 py-3 transition-colors",
                        isActive
                          ? "text-sidebar-accent-foreground font-semibold"
                          : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                      )}
                      onClick={toggleMenu}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{dictionary.admin[item.title]}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};
