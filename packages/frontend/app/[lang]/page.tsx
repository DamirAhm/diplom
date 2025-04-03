import Link from "next/link";
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
      icon: "box",
      title: dictionary.navigation.sandbox,
      description: dictionary.home.sandboxDescription,
    },
    {
      key: "partners",
      icon: "users",
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparentdark:from-blue-400 text-indigo-600 dark:text-indigo-400">
              {dictionary.home.title}
            </h1>
            <p className="text-xl mb-8 text-gray-700 dark:text-gray-300">
              {intro}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href={`/${lang}/projects`}
                className="bg-blue-600 rounded text-white px-8 py-3 hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {dictionary.navigation.projects}
              </Link>
              <Link
                href={`/${lang}/publications`}
                className="bg-white rounded text-blue-600 px-8 py-3 border-2 border-blue-600 hover:bg-blue-50 transition-colors dark:bg-gray-800 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-gray-700"
              >
                {dictionary.navigation.publications}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Labs & Workshops Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center text-gray-900 dark:text-gray-100">
            {dictionary.home.sectionTitles.labsAndWorkshops}
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-2xl">
              <h3 className="text-2xl font-semibold mb-6 text-blue-600 dark:text-blue-400">{dictionary.home.sectionTitles.laboratories}</h3>
              <ul className="space-y-4">
                {laboratories.map((lab, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{lab}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-600 dark:to-gray-700 p-8 rounded-2xl">
              <h3 className="text-2xl font-semibold mb-6 text-indigo-600 dark:text-indigo-400">{dictionary.home.sectionTitles.workshops}</h3>
              <ul className="space-y-4">
                {workshops.map((workshop, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{workshop}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Research Fields Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center text-gray-900 dark:text-gray-100">
            {dictionary.home.sectionTitles.researchFields}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {researchFields.map((field, index) => (
              <div key={index} className="bg-white flex items-center dark:bg-gray-700 p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{field}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation Grid Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {gridItems.map((item) => (
              <Link key={item.key} href={`/${lang}/${item.key}`} className="group">
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 p-6 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300 flex flex-col items-center text-center h-full">
                  <svg
                    className="w-12 h-12 mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(item.icon)} />
                  </svg>
                  <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function getIconPath(icon: string) {
  switch (icon) {
    case "users":
      return "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z";
    case "box":
      return "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4";
    case "book-open":
      return "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253";
    default:
      return "";
  }
}
