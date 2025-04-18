import { getDictionary } from "@/app/dictionaries"
import type { Locale } from "@/app/types"
import { ImageWithFallback } from "@/app/components/ImageWithFallback"

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
    <div className="flex flex-col h-full overflow-hidden rounded-lg">
      <div className="relative h-48 overflow-hidden">
        <ImageWithFallback
          src={material.image ? material.image : ""}
          alt={material.title[lang]}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          width={360}
          height={192}
          fallbackType="initials"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <div className="p-6 flex-grow flex flex-col bg-card dark:bg-card">
        <h3 className="text-xl font-semibold mb-3 group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors duration-300">
          {material.title[lang]}
        </h3>

        <p className="text-foreground/70 mb-5 flex-grow">
          {material.description[lang]}
        </p>

        <a
          href={material.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
        >
          <span className="mr-2">{dictionary.common.learnMore}</span>
          <svg
            className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  )
}

export default TrainingMaterialCard

