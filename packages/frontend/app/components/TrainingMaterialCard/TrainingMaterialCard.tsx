import { getDictionary } from "@/app/dictionaries"
import type { Locale } from "@/app/types"
import { ImagePreview } from "@/app/components/ImagePreview"

interface TrainingMaterial {
  id: number
  title: { en: string; ru: string }
  description: { en: string; ru: string }
  url: string
  image?: string
}

interface TrainingMaterialCardProps {
  material: TrainingMaterial
  lang: Locale
}

const TrainingMaterialCard: React.FC<TrainingMaterialCardProps> = ({ material, lang }) => {
  const dictionary = getDictionary(lang)

  return (
    <div
      className={`bg-white w-full rounded-lg shadow-md overflow-hidden flex flex-col transition-transform duration-300 hover:-translate-y-2 ${material.image ? "" : "bg-gradient-to-br from-gray-100 to-gray-200"}`}
    >
      {material.image ? (
        <ImagePreview
          src={new URL(material.image, process.env.NEXT_PUBLIC_API_URL).toString()}
          alt={material.title[lang]}
          className="w-full h-full"
          width={360}
          height={192}
        />
      ) : (
        <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-gray-500 dark:text-gray-400">No Image</span>
        </div>
      )}
      <div className="p-6 flex-grow flex flex-col dark:bg-primary">
        <h3 className="text-xl font-semibold mb-2">{material.title[lang]}</h3>
        <p className="text-gray-600 mb-4 flex-grow dark:text-gray-400">{material.description[lang]}</p>
        <a
          href={material.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors self-start"
        >
          {dictionary.common.learnMore}
        </a>
      </div>
    </div>
  )
}

export default TrainingMaterialCard

