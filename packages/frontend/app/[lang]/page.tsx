import Link from "next/link";
import { getDictionary } from "../dictionaries";
import type { Locale } from "../types";
import PhaseSpaceBackground from "@/components/PhaseSpaceBackground";
import { Users, LibraryBig, Wrench, TestTubeDiagonal } from "lucide-react";
import { api } from "@/lib/api";

interface HomePageProps {
  params: {
    lang: Locale;
  };
}

export default async function HomePage(args: HomePageProps) {
  const { lang } = (await args.params) || {};
  const dictionary = getDictionary(lang);

  const researchers = await api.researchers.getAll();
  const publicationsData = await api.publications.getPublic();

  const gridItems = [
    {
      key: "researchers",
      icon: <Users />,
      title: dictionary.navigation.researchers,
      description: dictionary.home.researchersDescription,
    },
    {
      key: "publications",
      icon: <LibraryBig />,
      title: dictionary.navigation.publications,
      description: dictionary.home.publicationsDescription,
    },
    {
      key: "projects",
      icon: <Wrench />,
      title: dictionary.navigation.projects,
      description: dictionary.home.projectsDescription,
    },
    {
      key: "sandbox",
      icon: <TestTubeDiagonal />,
      title: dictionary.navigation.sandbox,
      description: dictionary.home.sandboxDescription,
    },
  ];

  const laboratories = dictionary.home.laboratories || [];
  const workshops = dictionary.home.workshops || [];
  const researchFields = dictionary.home.researchFields || [];

  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <PhaseSpaceBackground
          colorScheme="primary"
          complexity="high"
          opacity={0.15}
        />

        <div className="container flex-col justify-around relative mx-auto py-32 md:py-36 lg:py-36  min-h-[850px] flex items-center">
          <div className="max-w-4xl mx-auto text-center mb-0 md:mb-12">
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="text-foreground">{dictionary.home.title}</span>
            </h1>
          </div>
          <section className="w-full pt-20 px-6">
            <div className="container mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 xl:gap-x-16 gap-y-4 mx-auto">
                {gridItems.map((item) => (
                  <Link
                    key={item.key}
                    href={`/${lang}/${item.key}`}
                    className="group f-wull"
                  >
                    <div className="h-full w-full bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 hover:border-primary/30 transition-all p-6 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-lg mb-5 bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <h3 className="text-xl font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-foreground/70 text-sm">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="w-full relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 dark:from-primary/10 dark:via-secondary/10 dark:to-accent/10"></div>
        <div className="container relative mx-auto px-4">
          <div className="mx-auto">
            <div className="grid md:grid-cols-2 gap-y-12 gap-x-24 items-start">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 17.25h.008v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {dictionary.home.whoWeAre}
                  </h3>
                </div>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  {dictionary.home.whoWeAreDescription}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {dictionary.home.ourGoal}
                  </h3>
                </div>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  {dictionary.home.goalDescription}
                </p>
              </div>
            </div>

            <div className="mt-12 p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {dictionary.home.ourAspiration}
                </h3>
              </div>
              <p className="text-lg text-foreground/80 leading-relaxed">
                {dictionary.home.aspirationDescription}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-16 bg-muted/30 dark:bg-gray-800/20 border-y border-border/40">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8">
            <div className="text-center">
              <p className="text-4xl font-heading font-bold text-primary dark:text-indigo-400">
                {laboratories.length}
              </p>
              <p className="text-foreground/70 text-sm mt-1">
                {dictionary.home.laboratoriesTitle}
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-heading font-bold text-secondary dark:text-indigo-400">
                {workshops.length}
              </p>
              <p className="text-foreground/70 text-sm mt-1">
                {dictionary.home.workshopsTitle}
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-heading font-bold text-accent dark:text-indigo-400">
                {researchers.length}
              </p>
              <p className="text-foreground/70 text-sm mt-1">
                {dictionary.home.researchers}
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-heading font-bold text-primary dark:text-indigo-400">
                {publicationsData.length}
              </p>
              <p className="text-foreground/70 text-sm mt-1">
                {dictionary.home.publications}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Research Fields Section */}
      <section className="w-full py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 dark:text-indigo-400">
              {dictionary.home.researchFieldsTitle}
            </h2>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              {dictionary.home.researchFieldsDescription}
            </p>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {researchFields.map((field, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl bg-card card-hover p-6 transition-all"
              >
                <div className="absolute top-0 left-0 h-1 w-0 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300"></div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary dark:text-indigo-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground dark:text-indigo-400">
                      {field}
                    </h3>
                    <p className="mt-2 text-sm text-foreground/70">
                      {dictionary.home.researchFieldDescription}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Labs & Workshops Section */}
      <section className="py-20 bg-muted/30 dark:bg-gray-800/20 border-y border-border/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 dark:text-indigo-400">
              {dictionary.home.ourInfrastructure}
            </h2>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              {dictionary.home.infrastructureDescription}
            </p>
          </div>

          <div className="w-full grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50">
              <div className="h-3 bg-gradient-to-r from-primary to-secondary"></div>
              <div className="p-8">
                <h3 className="text-2xl font-heading font-semibold mb-6 text-primary dark:text-indigo-400">
                  {dictionary.home.laboratoriesTitle}
                </h3>
                <ul className="space-y-4">
                  {laboratories.map((lab, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-foreground ml-3">{lab}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50">
              <div className="h-3 bg-gradient-to-r from-secondary to-accent"></div>
              <div className="p-8">
                <h3 className="text-2xl font-heading font-semibold mb-6 text-secondary dark:text-indigo-400">
                  {dictionary.home.workshopsTitle}
                </h3>
                <ul className="space-y-4">
                  {workshops.map((workshop, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-foreground ml-3">{workshop}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 dark:from-primary/5 dark:via-secondary/5 dark:to-accent/5 border-y border-border/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
            {dictionary.home.interestedInCollaborating}
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto mb-8">
            {dictionary.home.collaborationDescription}
          </p>
          <Link
            href={`mailto:mnii@etu.ru`}
            className="btn-primary text-white px-6 py-3 h-auto"
          >
            {dictionary.home.contactUs}
          </Link>
        </div>
      </section>
    </div>
  );
}
