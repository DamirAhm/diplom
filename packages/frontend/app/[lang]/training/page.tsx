import TrainingMaterialCard from "../../components/TrainingMaterialCard/TrainingMaterialCard";
import styles from "./Training.module.css";
import { Locale, TrainingMaterial } from "../../types";
import { getDictionary } from "../../dictionaries";

const fetchTrainingMaterials = async (): Promise<TrainingMaterial[]> => {
  const response = await fetch('http://localhost:8080/api/training');
  if (!response.ok) {
    throw new Error('Failed to fetch training materials');
  }
  return response.json();
};

const TrainingMaterialsPage = async ({
  params: { lang },
}: {
  params: { lang: Locale };
}) => {
  const dictionary = getDictionary(lang);
  const materials = await fetchTrainingMaterials();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{dictionary.training.title}</h1>
      <div className={styles.grid}>
        {materials.map((material) => (
          <div key={material.id} className={styles.gridItem}>
            <TrainingMaterialCard lang={lang} material={material} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainingMaterialsPage;
