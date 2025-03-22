"use client";

import { useState, useEffect } from "react";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import { StatsCard } from "@/components/ui/stats-card";
import {
  Users,
  BookOpen,
  FileText,
  Building2,
  Book,
  Activity,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

interface DashboardStats {
  researchers: number;
  projects: number;
  publications: number;
  partners: number;
  trainingMaterials: number;
  recentActivity: Array<{
    id: number;
    type: string;
    title: string;
    action: string;
    timestamp: string;
  }>;
}

const adminSections = [
  {
    title: "admin.researchers",
    icon: Users,
    path: "researchers",
    color: "text-blue-500",
  },
  {
    title: "admin.projects",
    icon: BookOpen,
    path: "projects",
    color: "text-green-500",
  },
  {
    title: "admin.publications",
    icon: FileText,
    path: "publications",
    color: "text-purple-500",
  },
  {
    title: "admin.partners",
    icon: Building2,
    path: "partners",
    color: "text-orange-500",
  },
  {
    title: "admin.training",
    icon: Book,
    path: "training",
    color: "text-red-500",
  },
];

export default function AdminDashboard({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const dictionary = getDictionary(lang);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await api.get<DashboardStats>("/admin/stats");
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-muted-foreground">
        {dictionary.admin.statsError}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {dictionary.admin.dashboard}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {dictionary.admin.welcome}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title={dictionary.admin.researchers}
          value={stats.researchers}
          icon={<Users className="h-6 w-6 text-blue-500" />}
        />
        <StatsCard
          title={dictionary.admin.projects}
          value={stats.projects}
          icon={<BookOpen className="h-6 w-6 text-green-500" />}
        />
        <StatsCard
          title={dictionary.admin.publications}
          value={stats.publications}
          icon={<FileText className="h-6 w-6 text-purple-500" />}
        />
        <StatsCard
          title={dictionary.admin.partners}
          value={stats.partners}
          icon={<Building2 className="h-6 w-6 text-orange-500" />}
        />
        <StatsCard
          title={dictionary.admin.training}
          value={stats.trainingMaterials}
          icon={<Book className="h-6 w-6 text-red-500" />}
        />
      </div>

      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-gray-100">
            <Activity className="h-5 w-5 text-blue-500" />
            {dictionary.admin.recentActivity}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {stats.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {
                      dictionary.admin.activityTypes[
                      activity.type as keyof typeof dictionary.admin.activityTypes
                      ]
                    }{" "}
                    {
                      dictionary.admin.activityActions[
                      activity.action as keyof typeof dictionary.admin.activityActions
                      ]
                    }
                  </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(activity.timestamp).toLocaleDateString(
                    lang === "ru" ? "ru-RU" : "en-US",
                    {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
