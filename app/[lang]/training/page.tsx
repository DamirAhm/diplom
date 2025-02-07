import { trainingMaterialsData } from '../../mock/trainingMaterialsData'
import TrainingMaterialCard from '../../components/TrainingMaterialCard/TrainingMaterialCard'
import styles from './TrainingMaterials.module.css'
import { Locale } from '../../types'
import { getDictionary } from '../../dictionaries'

const TrainingMaterialsPage = ({ params: { lang } }: { params: { lang: Locale } }) => {
  const dictionary = getDictionary(lang)

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {dictionary.training.title}
      </h1>
      <div className={styles.grid}>
        {trainingMaterialsData.map((material) => (
          <div key={material.id} className={styles.gridItem}>
            <TrainingMaterialCard lang={lang} material={material} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default TrainingMaterialsPage

