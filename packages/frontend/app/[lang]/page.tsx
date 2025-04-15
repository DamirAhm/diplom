import Link from "next/link";
import Image from "next/image";
import { getDictionary } from "../dictionaries";
import type { Locale } from "../types";

interface HomePageProps {
  params: {
    lang: Locale;
  };
}

export default async function HomePage(args: HomePageProps) {
  const { lang } = await args.params || {};
  const dictionary = getDictionary(lang);

  const gridItems = [
    {
      key: "researchers",
      icon: "users",
      title: dictionary.navigation.researchers,
      description: dictionary.home.researchersDescription,
    },
    {
      key: "sandbox",
      icon: "flask",
      title: dictionary.navigation.sandbox,
      description: dictionary.home.sandboxDescription,
    },
    {
      key: "partners",
      icon: "handshake",
      title: dictionary.navigation.partners,
      description: dictionary.home.partnersDescription,
    },
    {
      key: "training",
      icon: "book-open",
      title: dictionary.navigation.training,
      description: dictionary.home.trainingDescription,
    },
  ];

  const description = dictionary.home.description || "";
  const labsMarker = lang === "ru" ? "Лаборатории:" : "Laboratories:";
  const workshopsMarker = lang === "ru" ? "Мастерские:" : "Workshops:";
  const researchFieldsMarker = lang === "ru" ? "Ключевые направления исследований:" : "Key research fields:";

  const [intro, rest] = description.split(labsMarker).map(s => s?.trim()) || ["", ""];
  const [labsPart, rest2] = (rest || "").split(workshopsMarker).map(s => s?.trim()) || ["", ""];
  const [workshopsPart, researchPart] = (rest2 || "").split(researchFieldsMarker).map(s => s?.trim()) || ["", ""];

  const laboratories = labsPart
    ? labsPart
      .split("-")
      .map(lab => lab.trim())
      .filter(Boolean)
    : [];

  const workshops = workshopsPart
    ? workshopsPart
      .split("-")
      .map(workshop => workshop.trim())
      .filter(Boolean)
    : [];

  const researchFields = researchPart
    ? researchPart
      .split(",")
      .map(field => field.trim())
      .filter(Boolean)
    : [];

  return (
    <div className="relative">
      {/* Hero Section with 3D Effect and Animated Gradient */}
      <section className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

        <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl -top-20 -left-20 opacity-40 animate-pulse"></div>
        <div className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-r from-secondary/20 to-accent/20 blur-2xl bottom-0 right-0 opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="container relative mx-auto px-4 py-28 md:py-36">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block animate-shimmer bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 bg-[length:200%_100%] p-0.5 rounded-md mb-2">
              <span className="inline-block px-3 py-1 bg-background text-sm font-medium text-primary rounded-[3px]">
                {lang === "en" ? "Scientific Innovations" : "Научные инновации"}
              </span>
            </div>

            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="text-foreground">{dictionary.home.title.split(' ').slice(0, -1).join(' ')} </span>
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {dictionary.home.title.split(' ').slice(-1)[0]}
              </span>
            </h1>

            <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
              {intro}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <Link
                href={`/${lang}/projects`}
                className="btn-primary px-6 py-3 h-auto"
              >
                {dictionary.navigation.projects}
              </Link>
              <Link
                href={`/${lang}/publications`}
                className="btn-outline"
              >
                {dictionary.navigation.publications}
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="hidden lg:block absolute bottom-10 left-10">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute inset-2 rounded-full border-2 border-secondary/50"></div>
          </div>
        </div>
        <div className="hidden lg:block absolute top-20 right-20">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/10 to-secondary/10 backdrop-blur-sm border border-accent/20"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30 dark:bg-gray-800/20 border-y border-border/40">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8">
            <div className="text-center">
              <p className="text-4xl font-heading font-bold text-primary">{laboratories.length}</p>
              <p className="text-foreground/70 text-sm mt-1">{lang === "en" ? "Laboratories" : "Лаборатории"}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-heading font-bold text-secondary">{workshops.length}</p>
              <p className="text-foreground/70 text-sm mt-1">{lang === "en" ? "Workshops" : "Мастерские"}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-heading font-bold text-accent">{researchFields.length}</p>
              <p className="text-foreground/70 text-sm mt-1">{lang === "en" ? "Research Fields" : "Направления исследований"}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-heading font-bold text-primary">50+</p>
              <p className="text-foreground/70 text-sm mt-1">{lang === "en" ? "Publications" : "Публикации"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Research Fields Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              {lang === "en" ? "Research Fields" : "Направления исследований"}
            </h2>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              {lang === "en"
                ? "Our laboratory focuses on cutting-edge research across multiple disciplines"
                : "Наша лаборатория фокусируется на передовых исследованиях в различных дисциплинах"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {researchFields.map((field, index) => (
              <div key={index} className="group relative overflow-hidden rounded-xl bg-card card-hover p-6 transition-all">
                <div className="absolute top-0 left-0 h-1 w-0 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300"></div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground">{field}</h3>
                    <p className="mt-2 text-sm text-foreground/70">
                      {lang === "en"
                        ? "Cutting-edge research in this exciting field with international recognition."
                        : "Передовые исследования в этой захватывающей области с международным признанием."}
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
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              {lang === "en" ? "Our Infrastructure" : "Наша инфраструктура"}
            </h2>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              {lang === "en"
                ? "State-of-the-art laboratories and workshops for groundbreaking research"
                : "Современные лаборатории и мастерские для революционных исследований"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50">
              <div className="h-3 bg-gradient-to-r from-primary to-secondary"></div>
              <div className="p-8">
                <h3 className="text-2xl font-heading font-semibold mb-6 text-primary">
                  {lang === "en" ? "Laboratories" : "Лаборатории"}
                </h3>
                <ul className="space-y-4">
                  {laboratories.map((lab, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
                <h3 className="text-2xl font-heading font-semibold mb-6 text-secondary">
                  {lang === "en" ? "Workshops" : "Мастерские"}
                </h3>
                <ul className="space-y-4">
                  {workshops.map((workshop, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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

      {/* Navigation Grid Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              {lang === "en" ? "Explore Our Resources" : "Изучите наши ресурсы"}
            </h2>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              {lang === "en"
                ? "Discover our researchers, sandbox environment, partners, and training materials"
                : "Узнайте о наших исследователях, песочнице, партнерах и учебных материалах"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {gridItems.map((item) => (
              <Link key={item.key} href={`/${lang}/${item.key}`} className="group">
                <div className="h-full bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 hover:border-primary/30 transition-all p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg mb-5 bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(item.icon)} />
                    </svg>
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

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 dark:from-primary/5 dark:via-secondary/5 dark:to-accent/5 border-y border-border/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
            {lang === "en" ? "Interested in collaborating?" : "Заинтересованы в сотрудничестве?"}
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto mb-8">
            {lang === "en"
              ? "We're always open to new partnerships and research collaborations."
              : "Мы всегда открыты для новых партнерств и научных коллабораций."}
          </p>
          <Link
            href={`/${lang}/partners`}
            className="btn-primary px-6 py-3 h-auto"
          >
            {lang === "en" ? "Contact Us" : "Связаться с нами"}
          </Link>
        </div>
      </section>
    </div>
  );
}

function getIconPath(icon: string) {
  switch (icon) {
    case "users":
      return "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z";
    case "flask":
      return "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z";
    case "handshake":
      return "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z";
    case "book-open":
      return "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253";
    default:
      return "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z";
  }
}
