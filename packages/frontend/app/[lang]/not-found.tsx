import Link from "next/link"
import { getDictionary } from "../dictionaries"
import type { Locale } from "../types"

interface NotFoundProps {
  params: {
    lang: Locale
  }
}

export default async function NotFound({ params }: NotFoundProps) {
  const { lang } = await params || {}
  const dictionary = getDictionary(lang)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-700 mb-4">{dictionary.notFound.title}</h2>
        <p className="text-xl text-gray-600 mb-8">{dictionary.notFound.description}</p>
        <Link
          href={`/${lang}`}
          className="bg-primary text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          {dictionary.notFound.goHome}
        </Link>
      </div>
    </div>
  )
}

