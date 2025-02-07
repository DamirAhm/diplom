import ResearcherCard from '../../components/ResearcherCard'
import { researchersData } from '../../mock/researchersData'
import { Locale } from '../../types'
import { getDictionary } from '../../dictionaries'

const fetchResearchers = async () => {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(researchersData)
    }, 500)
  })

  return researchersData
}

const ResearchersPage = async ({ params: { lang } }: { params: { lang: Locale } }) => {
  const researchers = await fetchResearchers()
  const dictionary = getDictionary(lang)

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6 text-center mt-8">
        {dictionary.researchers.title}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {researchers.map((researcher) => (
          <ResearcherCard key={researcher.id} researcher={researcher} lang={lang} />
        ))}
      </div>
    </div>
  )
}

export default ResearchersPage

