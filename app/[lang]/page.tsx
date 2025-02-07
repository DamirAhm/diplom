import Link from "next/link";
import { getDictionary } from "../dictionaries";
import type { Locale } from "../types";

interface HomePageProps {
  params: {
    lang: Locale;
  };
}

export default function HomePage(args: HomePageProps) {
  const { lang } = args.params || {};

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-white dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mb-8 mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            {dictionary.home.title}
          </h1>
          <p className="text-xl mb-8 text-gray-700 dark:text-gray-300">
            {dictionary.home.description}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href={`/${lang}/projects`}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {dictionary.navigation.projects}
            </Link>
            <Link
              href={`/${lang}/publications`}
              className="bg-white text-blue-600 px-6 py-2 rounded border border-blue-600 hover:bg-blue-50 transition-colors dark:bg-gray-800 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-gray-700"
            >
              {dictionary.navigation.publications}
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {gridItems.map((item) => (
            <Link
              key={item.key}
              href={`/${lang}/${item.key}`}
              className="block h-full"
            >
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center text-center h-full">
                <svg
                  className="w-12 h-12 mb-4 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={getIconPath(item.icon)}
                  />
                </svg>
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {item.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 flex-grow">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
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
