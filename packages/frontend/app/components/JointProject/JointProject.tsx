import type { Locale } from "@/app/types"

interface JointProjectProps {
  title: { en: string; ru: string }
  partners: string[]
  year: number
  lang: Locale
}

const JointProject: React.FC<JointProjectProps> = ({ title, partners, year, lang }) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4 transition-colors duration-200">
      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">{title[lang]}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{partners.join(", ")}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{year}</p>
    </div>
  )
}

export default JointProject

